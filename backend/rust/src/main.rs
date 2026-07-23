// Railflow backend entry point
// Powering the control plane with Rust's speed and safety.

mod error;
mod middleware;
mod models;
mod routes;
mod services;

use std::sync::Arc;

use axum::Router;
use sqlx::postgres::PgPoolOptions;
use tower_http::{compression::CompressionLayer, cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use crate::services::{docker::DockerService, server::ServerService, state::AppState};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env
    dotenvy::dotenv().ok();

    // Init tracing
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| EnvFilter::new("info,tower_http=debug,sqlx=warn")))
        .with(tracing_subscriber::fmt::layer().with_target(true))
        .init();

    tracing::info!("Railflow backend starting up…");

    // Load configuration
    let config = services::config::Config::from_env()?;
    tracing::info!("Configuration loaded for environment: {}", config.environment);

    // Connect to database
    let pool = PgPoolOptions::new()
        .max_connections(config.database_max_connections)
        .connect(&config.database_url)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;
    tracing::info!("Database migrations applied");

    // Initialize Docker client
    let docker = DockerService::new(&config.docker_socket).await?;
    tracing::info!("Docker client connected at {}", config.docker_socket);

    // Initialize services
    let server_service = ServerService::new();
    let github_service = services::github::GitHubService::new(config.github_client_id.clone(), config.github_client_secret.clone());

    // Build app state
    let state = Arc::new(AppState {
        config: config.clone(),
        db: pool.clone(),
        docker,
        server: server_service,
        github: github_service,
    });

    // Build router
    let app = Router::new()
        .merge(routes::auth::router())
        .merge(routes::projects::router())
        .merge(routes::deployments::router())
        .merge(routes::containers::router())
        .merge(routes::exec::router())
        .merge(routes::databases::router())
        .merge(routes::environments::router())
        .merge(routes::pipelines::router())
        .merge(routes::resources::router())
        .merge(routes::alerts::router())
        .merge(routes::webhooks_out::router())
        .merge(routes::server::router())
        .merge(routes::webhooks::router())
        .merge(routes::ws::router())
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(cors_layer(&config))
        .layer(tower_http::limit::RequestBodyLimitLayer::new(16 * 1024 * 1024)) // 16MB
        .with_state(state);

    // Start server
    let addr = format!("{}:{}", config.host, config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Server listening on http://{}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}

fn cors_layer(config: &services::config::Config) -> CorsLayer {
    let origins: Vec<_> = config
        .cors_origins
        .iter()
        .filter_map(|o| o.parse().ok())
        .collect();
    CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::PUT,
            axum::http::Method::PATCH,
            axum::http::Method::DELETE,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers(tower_http::cors::Any)
        .allow_credentials(true)
        .max_age(std::time::Duration::from_secs(3600))
}
