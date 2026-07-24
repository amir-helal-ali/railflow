// Deployment routes: /api/deployments/*
// List, get, cancel deployments.

use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    error::AppError,
    middleware::auth::AuthUser,
    models::Deployment,
    services::state::SharedState,
};

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/deployments", get(list_deployments))
        .route("/api/deployments/:id", get(get_deployment))
        .route("/api/deployments/:id/cancel", post(cancel_deployment))
        .route("/api/deployments/:id/logs", get(get_deployment_logs))
}

#[derive(Deserialize)]
struct ListQuery {
    project_id: Option<Uuid>,
    status: Option<String>,
    limit: Option<i64>,
}

async fn list_deployments(
    State(state): State<SharedState>,
    _user: AuthUser,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<Deployment>>, AppError> {
    let limit = q.limit.unwrap_or(50).min(200);

    let deployments = if let Some(project_id) = q.project_id {
        sqlx::query_as::<_, Deployment>(
            "SELECT * FROM deployments WHERE project_id = $1 ORDER BY started_at DESC LIMIT $2"
        )
        .bind(project_id)
        .bind(limit)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Deployment>(
            "SELECT * FROM deployments ORDER BY started_at DESC LIMIT $1"
        )
        .bind(limit)
        .fetch_all(&state.db)
        .await?
    };

    Ok(Json(deployments))
}

async fn get_deployment(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Deployment>, AppError> {
    let deployment = sqlx::query_as::<_, Deployment>("SELECT * FROM deployments WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => AppError::NotFound("Deployment not found".into()),
            _ => AppError::Database(e),
        })?;

    Ok(Json(deployment))
}

async fn cancel_deployment(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE deployments SET status = 'failed', error_message = 'Cancelled by user', finished_at = NOW() WHERE id = $1 AND status IN ('queued', 'building')")
        .bind(id)
        .execute(&state.db)
        .await?;

    Ok(serde_json::json!({ "cancelled": true }).into())
}

async fn get_deployment_logs(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    // In production: fetch from log storage (S3 / local file)
    // For now, return empty — frontend uses WebSocket /api/ws/logs/:id
    Ok(Json(Vec::new()))
}
