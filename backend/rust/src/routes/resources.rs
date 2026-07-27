// Docker volumes & networks routes: /api/volumes/*, /api/networks/*

use axum::{
    extract::{Path, State},
    routing::{delete, get, post},
    Json, Router,
};
use serde_json::json;

use crate::{
    error::AppError,
    middleware::auth::AuthUser,
    services::state::SharedState,
};

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/volumes", get(list_volumes).post(create_volume))
        .route("/api/volumes/:name", delete(delete_volume))
        .route("/api/volumes/prune", post(prune_volumes))
        .route("/api/networks", get(list_networks).post(create_network))
        .route("/api/networks/:id", get(get_network).delete(delete_network))
}

async fn list_volumes(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    // Use bollard to list volumes
    let options = bollard::volume::ListVolumesOptions::<String> { ..Default::default() };
    let volumes = state.docker.client().list_volumes(Some(options)).await
        .map_err(|e| AppError::Docker(e.to_string()))?;

    let result: Vec<_> = volumes.volumes.unwrap_or_default().into_iter().map(|v| json!({
        "name": v.name,
        "driver": v.driver,
        "mountpoint": v.mountpoint,
        "scope": v.scope.map(|s| s.to_string()),
        "labels": v.labels,
        "created_at": v.created_at.map(|d| d.to_string()),
        "size": v.usage_data.map(|u| u.size),
    })).collect();

    Ok(json!({ "volumes": result }).into())
}

async fn create_volume(
    State(state): State<SharedState>,
    _user: AuthUser,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let name = req.get("name").and_then(|n| n.as_str())
        .ok_or_else(|| AppError::BadRequest("Missing name".into()))?;

    let options = bollard::volume::CreateVolumeOptions {
        name: name.to_string(),
        ..Default::default()
    };
    let volume = state.docker.client().create_volume(options).await
        .map_err(|e| AppError::Docker(e.to_string()))?;

    Ok(json!({ "name": volume.name, "driver": volume.driver }).into())
}

async fn delete_volume(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(name): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.docker.client().remove_volume(&name, None).await
        .map_err(|e| AppError::Docker(e.to_string()))?;
    Ok(json!({ "deleted": true, "name": name }).into())
}

async fn prune_volumes(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = state.docker.client().prune_volumes::<String>(None).await
        .map_err(|e| AppError::Docker(e.to_string()))?;
    Ok(json!({
        "deleted": result.volumes_deleted,
        "space_reclaimed_bytes": result.space_reclaimed,
    }).into())
}

async fn list_networks(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let networks = state.docker.client().list_networks::<String>(None).await
        .map_err(|e| AppError::Docker(e.to_string()))?;

    let result: Vec<_> = networks.into_iter().map(|n| json!({
        "id": n.id,
        "name": n.name,
        "driver": n.driver,
        "scope": n.scope,
        "internal": n.internal,
        "attachable": n.attachable,
        "ingress": n.ingress,
        "ipam": n.ipam,
        "labels": n.labels.unwrap_or_default(),
        "created": n.created,
    })).collect();

    Ok(json!({ "networks": result }).into())
}

async fn get_network(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let network = state.docker.client().inspect_network::<String>(&id, None).await
        .map_err(|e| AppError::Docker(e.to_string()))?;
    Ok(Json(json!(network)))
}

async fn create_network(
    State(state): State<SharedState>,
    _user: AuthUser,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let name = req.get("name").and_then(|n| n.as_str())
        .ok_or_else(|| AppError::BadRequest("Missing name".into()))?;
    let driver = req.get("driver").and_then(|n| n.as_str()).unwrap_or("bridge");

    let options = bollard::network::CreateNetworkOptions {
        name: name.to_string(),
        driver: driver.to_string(),
        ..Default::default()
    };
    let network = state.docker.client().create_network(options).await
        .map_err(|e| AppError::Docker(e.to_string()))?;

    Ok(json!({ "id": network.id, "name": name, "driver": driver }).into())
}

async fn delete_network(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.docker.client().remove_network(&id).await
        .map_err(|e| AppError::Docker(e.to_string()))?;
    Ok(json!({ "deleted": true, "id": id }).into())
}
