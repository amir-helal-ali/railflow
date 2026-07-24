// CI/CD Pipelines routes: /api/pipelines/*
// Visual pipeline builder for continuous integration & delivery.

use axum::{
    extract::{Path, Query, State},
    routing::{delete, get, post, put},
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

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/pipelines", get(list_pipelines).post(create_pipeline))
        .route("/api/pipelines/:id", get(get_pipeline).put(update_pipeline).delete(delete_pipeline))
        .route("/api/pipelines/:id/run", post(run_pipeline))
        .route("/api/pipelines/:id/runs", get(list_runs))
        .route("/api/pipelines/:id/stages", post(add_stage))
        .route("/api/pipelines/:id/stages/:stage_id", put(update_stage).delete(delete_stage))
}

#[derive(Deserialize)]
struct ListQuery {
    project_id: Option<Uuid>,
}

async fn list_pipelines(
    State(state): State<SharedState>,
    _user: AuthUser,
    Query(q): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let pipes = if let Some(pid) = q.project_id {
        sqlx::query("SELECT * FROM pipelines WHERE project_id = $1 ORDER BY updated_at DESC")
            .bind(pid)
            .fetch_all(&state.db)
            .await?
    } else {
        sqlx::query("SELECT * FROM pipelines ORDER BY updated_at DESC")
            .fetch_all(&state.db)
            .await?
    };
    Ok(json!({ "pipelines": pipes }).into())
}

async fn get_pipeline(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let pipe = sqlx::query("SELECT * FROM pipelines WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Pipeline not found".into()))?;
    let stages = sqlx::query("SELECT * FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY position")
        .bind(id)
        .fetch_all(&state.db)
        .await?;
    Ok(json!({ "pipeline": pipe, "stages": stages }).into())
}

#[derive(Deserialize)]
struct CreatePipelineRequest {
    name: String,
    project_id: Uuid,
    trigger_events: Vec<String>,
    trigger_branches: Vec<String>,
    trigger_schedule: Option<String>,
    enabled: Option<bool>,
}

async fn create_pipeline(
    State(state): State<SharedState>,
    _user: AuthUser,
    Json(req): Json<CreatePipelineRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO pipelines (id, name, project_id, trigger_events, trigger_branches, trigger_schedule, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7)"
    )
    .bind(id)
    .bind(&req.name)
    .bind(req.project_id)
    .bind(&req.trigger_events)
    .bind(&req.trigger_branches)
    .bind(&req.trigger_schedule)
    .bind(req.enabled.unwrap_or(true))
    .execute(&state.db)
    .await?;
    Ok(json!({ "id": id, "name": req.name }).into())
}

async fn update_pipeline(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        "UPDATE pipelines SET
            name = COALESCE($1, name),
            enabled = COALESCE($2, enabled),
            trigger_events = COALESCE($3, trigger_events),
            trigger_branches = COALESCE($4, trigger_branches),
            trigger_schedule = COALESCE($5, trigger_schedule),
            updated_at = NOW()
         WHERE id = $6"
    )
    .bind(req.get("name").and_then(|v| v.as_str()))
    .bind(req.get("enabled").and_then(|v| v.as_bool()))
    .bind(req.get("trigger_events"))
    .bind(req.get("trigger_branches"))
    .bind(req.get("trigger_schedule").and_then(|v| v.as_str()))
    .bind(id)
    .execute(&state.db)
    .await?;
    Ok(json!({ "updated": true, "id": id }).into())
}

async fn delete_pipeline(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM pipelines WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;
    Ok(json!({ "deleted": true, "id": id }).into())
}

async fn run_pipeline(
    State(state): State<SharedState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let run_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO pipeline_runs (id, pipeline_id, status, triggered_by, started_at)
         VALUES ($1, $2, 'running', $3, NOW())"
    )
    .bind(run_id)
    .bind(id)
    .bind(&user.user_id)
    .execute(&state.db)
    .await?;

    // Spawn the pipeline execution (async)
    let state_clone = state.clone();
    tokio::spawn(async move {
        if let Err(e) = crate::services::pipeline_runner::run(state_clone, id, run_id).await {
            tracing::error!("Pipeline run {run_id} failed: {e}");
        }
    });

    Ok(json!({ "run_id": run_id, "status": "running" }).into())
}

async fn list_runs(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let runs = sqlx::query("SELECT * FROM pipeline_runs WHERE pipeline_id = $1 ORDER BY started_at DESC LIMIT 50")
        .bind(id)
        .fetch_all(&state.db)
        .await?;
    Ok(json!({ "runs": runs }).into())
}

#[derive(Deserialize)]
struct AddStageRequest {
    stage_type: String,
    name: String,
    command: Option<String>,
    image: Option<String>,
    timeout_sec: Option<i32>,
    condition: Option<String>,
    on_failure: Option<String>,
    enabled: Option<bool>,
    position: i32,
}

async fn add_stage(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<AddStageRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let stage_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO pipeline_stages (id, pipeline_id, stage_type, name, command, image, timeout_sec, condition, on_failure, enabled, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)"
    )
    .bind(stage_id)
    .bind(id)
    .bind(&req.stage_type)
    .bind(&req.name)
    .bind(&req.command)
    .bind(&req.image)
    .bind(req.timeout_sec.unwrap_or(60))
    .bind(&req.condition)
    .bind(req.on_failure.unwrap_or_else(|| "stop".into()))
    .bind(req.enabled.unwrap_or(true))
    .bind(req.position)
    .execute(&state.db)
    .await?;
    Ok(json!({ "id": stage_id, "pipeline_id": id }).into())
}

async fn update_stage(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path((id, stage_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        "UPDATE pipeline_stages SET
            name = COALESCE($1, name),
            command = COALESCE($2, command),
            image = COALESCE($3, image),
            timeout_sec = COALESCE($4, timeout_sec),
            condition = COALESCE($5, condition),
            on_failure = COALESCE($6, on_failure),
            enabled = COALESCE($7, enabled)
         WHERE id = $8 AND pipeline_id = $9"
    )
    .bind(req.get("name").and_then(|v| v.as_str()))
    .bind(req.get("command").and_then(|v| v.as_str()))
    .bind(req.get("image").and_then(|v| v.as_str()))
    .bind(req.get("timeout_sec").and_then(|v| v.as_i64()))
    .bind(req.get("condition").and_then(|v| v.as_str()))
    .bind(req.get("on_failure").and_then(|v| v.as_str()))
    .bind(req.get("enabled").and_then(|v| v.as_bool()))
    .bind(stage_id)
    .bind(id)
    .execute(&state.db)
    .await?;
    Ok(json!({ "updated": true, "id": stage_id }).into())
}

async fn delete_stage(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path((id, stage_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM pipeline_stages WHERE id = $1 AND pipeline_id = $2")
        .bind(stage_id)
        .bind(id)
        .execute(&state.db)
        .await?;
    Ok(json!({ "deleted": true, "id": stage_id }).into())
}
