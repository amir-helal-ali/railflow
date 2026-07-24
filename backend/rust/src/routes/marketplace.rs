// Marketplace templates & multi-region/edge routes.

use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::{
    error::AppError,
    middleware::auth::AuthUser,
    services::state::SharedState,
};
use crate::services::db_json::rows_to_json;

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/templates", get(list_templates).post(deploy_template))
        .route("/api/templates/:id", get(get_template))
        .route("/api/regions", get(list_regions))
        .route("/api/regions/:id", get(get_region))
        .route("/api/projects/:id/edge", get(get_edge_config).put(update_edge_config))
        .route("/api/logs/aggregate", get(aggregate_logs))
        .route("/api/logs/streams", get(list_streams).post(create_stream))
}

async fn list_templates(
    State(_state): State<SharedState>,
    _user: AuthUser,
    Query(q): Query<TemplateQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    // In production: SELECT * FROM templates WHERE category = $1
    Ok(json!({ "templates": [], "filter": q.category }).into())
}

#[derive(Deserialize)]
struct TemplateQuery {
    category: Option<String>,
}

async fn get_template(
    State(_state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    Ok(json!({ "id": id }).into())
}

#[derive(Deserialize)]
struct DeployTemplateRequest {
    template_id: String,
    project_name: String,
    region: Option<String>,
    env_vars: Option<std::collections::HashMap<String, String>>,
}

async fn deploy_template(
    State(state): State<SharedState>,
    user: AuthUser,
    Json(req): Json<DeployTemplateRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user_uuid = Uuid::parse_str(&user.user_id)
        .map_err(|_| AppError::Unauthorized("Invalid user id".into()))?;

    // Create project from template
    let project_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO projects (id, name, slug, repo, repo_url, branch, runtime, framework, owner_id, status, health)
         VALUES ($1, $2, $3, $4, $5, 'main', 'node', 'template', $6, 'queued', 'unknown')"
    )
    .bind(project_id)
    .bind(&req.project_name)
    .bind(req.project_name.to_lowercase().replace(' ', "-"))
    .bind(format!("railflow/{}", req.template_id))
    .bind(format!("https://github.com/railflow/{}", req.template_id))
    .bind(user_uuid)
    .execute(&state.db)
    .await?;

    // Insert env vars if provided
    if let Some(vars) = req.env_vars {
        for (key, value) in vars {
            sqlx::query(
                "INSERT INTO env_variables (id, project_id, key, value) VALUES ($1, $2, $3, $4)"
            )
            .bind(Uuid::new_v4())
            .bind(project_id)
            .bind(&key)
            .bind(&value)
            .execute(&state.db)
            .await?;
        }
    }

    // Trigger deployment
    let deployment_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO deployments (id, project_id, status, stage, commit_sha, commit_message, branch, author, environment, triggered_by, stages, started_at)
         VALUES ($1, $2, 'queued', 'queued', 'template', 'Deploy from template', 'main', $3, 'production', 'manual', '[]', NOW())"
    )
    .bind(deployment_id)
    .bind(project_id)
    .bind(&user.user_id)
    .execute(&state.db)
    .await?;

    // Spawn the deployment pipeline
    let state_clone = state.clone();
    tokio::spawn(async move {
        if let Err(e) = crate::services::deploy::run_pipeline(state_clone, project_id, deployment_id).await {
            tracing::error!("Template deploy {deployment_id} failed: {e}");
        }
    });

    Ok(json!({
        "project_id": project_id,
        "deployment_id": deployment_id,
        "status": "queued",
        "message": "Template deployment started"
    }).into())
}

async fn list_regions(
    State(_state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    // In production: query from a regions table or config
    Ok(json!({
        "regions": [
            { "id": "fra1", "name": "Frankfurt", "country": "Germany", "latency_ms": 12, "status": "active" },
            { "id": "ams3", "name": "Amsterdam", "country": "Netherlands", "latency_ms": 18, "status": "active" },
            { "id": "lhr1", "name": "London", "country": "UK", "latency_ms": 22, "status": "active" },
            { "id": "ny1", "name": "New York", "country": "USA", "latency_ms": 87, "status": "active" },
            { "id": "sin1", "name": "Singapore", "country": "Singapore", "latency_ms": 167, "status": "active" },
        ]
    }).into())
}

async fn get_region(
    State(_state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    Ok(json!({ "id": id }).into())
}

async fn get_edge_config(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let config = sqlx::query("SELECT * FROM edge_configs WHERE project_id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?;
    let config_json = config.as_ref().map(|c| crate::services::db_json::row_to_json(c));
    Ok(Json(json!({ "config": config_json })))
}

#[derive(Deserialize)]
struct UpdateEdgeConfigRequest {
    primary_region: String,
    replica_regions: Vec<String>,
    edge_cache: bool,
    cdn_enabled: bool,
    custom_rules: Vec<serde_json::Value>,
}

async fn update_edge_config(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateEdgeConfigRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        "INSERT INTO edge_configs (project_id, primary_region, replica_regions, edge_cache, cdn_enabled, custom_rules)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (project_id) DO UPDATE SET
            primary_region = $2, replica_regions = $3, edge_cache = $4, cdn_enabled = $5, custom_rules = $6"
    )
    .bind(id)
    .bind(&req.primary_region)
    .bind(&req.replica_regions)
    .bind(req.edge_cache)
    .bind(req.cdn_enabled)
    .bind(serde_json::to_value(&req.custom_rules).unwrap_or_default())
    .execute(&state.db)
    .await?;
    Ok(json!({ "updated": true, "project_id": id }).into())
}

#[derive(Deserialize)]
struct AggregateLogsQuery {
    containers: Option<String>, // comma-separated
    level: Option<String>,
    filter: Option<String>,
    limit: Option<i64>,
}

async fn aggregate_logs(
    State(state): State<SharedState>,
    _user: AuthUser,
    Query(q): Query<AggregateLogsQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit = q.limit.unwrap_or(100).min(1000);

    // In production: query from Elasticsearch / Loki / ClickHouse
    // For now, return empty — frontend uses generateAggregatedLogs()
    Ok(json!({
        "logs": [],
        "filter": {
            "containers": q.containers,
            "level": q.level,
            "query": q.filter,
        },
        "limit": limit
    }).into())
}

async fn list_streams(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let streams = sqlx::query("SELECT * FROM log_streams ORDER BY created_at DESC")
        .fetch_all(&state.db)
        .await?;
    Ok(json!({ "streams": rows_to_json(&streams) }).into())
}

#[derive(Deserialize)]
struct CreateStreamRequest {
    name: String,
    containers: Vec<String>,
    filter: String,
    level: String,
}

async fn create_stream(
    State(state): State<SharedState>,
    _user: AuthUser,
    Json(req): Json<CreateStreamRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO log_streams (id, name, containers, filter, level, enabled)
         VALUES ($1, $2, $3, $4, $5, TRUE)"
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.containers)
    .bind(&req.filter)
    .bind(&req.level)
    .execute(&state.db)
    .await?;
    Ok(json!({ "id": id, "name": req.name }).into())
}
