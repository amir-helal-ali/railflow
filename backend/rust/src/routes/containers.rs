// Container management routes: /api/containers/*
// Direct Docker management via bollard.

use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::json;

use crate::{
    error::AppError,
    middleware::auth::AuthUser,
    services::{docker::ContainerInfo, state::SharedState},
};

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/containers", get(list_containers))
        .route("/api/containers/:id", get(get_container))
        .route("/api/containers/:id/start", post(start_container))
        .route("/api/containers/:id/stop", post(stop_container))
        .route("/api/containers/:id/restart", post(restart_container))
        .route("/api/containers/:id/remove", post(remove_container))
        .route("/api/containers/:id/stats", get(get_container_stats))
        .route("/api/containers/events", get(stream_events))
}

#[derive(Deserialize)]
struct ListQuery {
    all: Option<bool>,
}

async fn list_containers(
    State(state): State<SharedState>,
    _user: AuthUser,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<ContainerInfo>>, AppError> {
    let containers = state.docker.list_containers(q.all.unwrap_or(true)).await?;
    Ok(Json(containers))
}

async fn get_container(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<ContainerInfo>, AppError> {
    let container = state.docker.inspect_container(&id).await?;
    Ok(Json(container))
}

async fn start_container(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.docker.start_container(&id).await?;
    Ok(Json(json!({ "started": true, "id": id })))
}

async fn stop_container(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.docker.stop_container(&id, 30).await?;
    Ok(Json(json!({ "stopped": true, "id": id })))
}

async fn restart_container(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.docker.restart_container(&id, 30).await?;
    Ok(Json(json!({ "restarted": true, "id": id })))
}

async fn remove_container(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.docker.remove_container(&id, true).await?;
    Ok(Json(json!({ "removed": true, "id": id })))
}

async fn get_container_stats(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    // For one-shot stats, we accept the small cost of connecting fresh.
    // In production, use the streaming endpoint /api/ws/stats/:id
    let mut rx = state.docker.stats_stream(id);
    let stats = rx.recv().await.ok_or_else(|| AppError::Internal("Stats stream closed".into()))??;
    Ok(Json(json!(stats)))
}

async fn stream_events(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    // WebSocket endpoint at /api/ws/events
    Ok(Json(json!({ "endpoint": "/api/ws/events" })))
}
