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

    // Connect to database (graceful: start server even without DB for demo mode)
    tracing::info!("Connecting to database: {}", config.database_url);
    let pool = PgPoolOptions::new()
        .max_connections(config.database_max_connections)
        .acquire_timeout(std::time::Duration::from_secs(3))
        .connect(&config.database_url)
        .await
        .unwrap_or_else(|_e| {
            tracing::warn!("Starting in DEMO mode — API endpoints requiring DB will return errors.");
            // connect_lazy_with returns Pool directly (not Result)
            use sqlx::postgres::PgConnectOptions;
            let opts: PgConnectOptions = config.database_url.parse().unwrap_or_else(|_| {
                PgConnectOptions::new().host("localhost").port(5432).database("railflow")
            });
            PgPoolOptions::new()
                .max_connections(1)
                .connect_lazy_with(opts)
        });

    // Run migrations (skip in demo mode to avoid hanging on dead pool)
    if false {
        match sqlx::migrate!("./migrations").run(&pool).await {
            Ok(()) => tracing::info!("Database migrations applied"),
            Err(e) => tracing::warn!("Migration skipped: {e}"),
        }
    } else {
        tracing::warn!("Skipping migrations (demo mode)");
    }

    // Initialize Docker client (graceful: continue without Docker if unavailable)
    tracing::info!("Connecting to Docker at: {}", config.docker_socket);
    let docker = match DockerService::new(&config.docker_socket).await {
        Ok(d) => {
            tracing::info!("Docker client connected");
            d
        }
        Err(e) => {
            tracing::warn!("Docker connection failed: {e}. Docker features disabled.");
            DockerService::new_mock()
        }
    };
    tracing::info!("Server services initialized");

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
        .merge(routes::marketplace::router())
        .merge(routes::security::router())
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
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::CONTENT_TYPE,
            axum::http::header::ACCEPT,
        ])
        .allow_credentials(true)
        .max_age(std::time::Duration::from_secs(3600))
}
