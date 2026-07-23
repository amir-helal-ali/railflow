// Managed databases routes: /api/databases/*
// CRUD for PostgreSQL/MySQL/Redis/MongoDB/MariaDB instances.

use axum::{
    extract::{Path, State},
    routing::{delete, get, post},
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
        .route("/api/databases", get(list_databases).post(create_database))
        .route("/api/databases/:id", get(get_database).delete(delete_database))
        .route("/api/databases/:id/start", post(start_database))
        .route("/api/databases/:id/stop", post(stop_database))
        .route("/api/databases/:id/restart", post(restart_database))
        .route("/api/databases/:id/backup", post(create_backup))
        .route("/api/databases/:id/connection", get(get_connection_string))
}

#[derive(Deserialize)]
struct CreateDatabaseRequest {
    name: String,
    engine: String, // postgresql | mysql | redis | mongodb | mariadb
    plan: String,   // small | medium | large | xlarge
    region: String,
    project_id: Option<Uuid>,
}

async fn list_databases(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    // In production: SELECT * FROM databases
    // For now, list containers tagged as databases
    let containers = state.docker.list_containers(true).await?;
    let dbs: Vec<_> = containers
        .into_iter()
        .filter(|c| c.labels.get("railflow.type").map(|s| s.as_str()) == Some("database"))
        .collect();
    Ok(Json(json!({ "databases": dbs })))
}

async fn create_database(
    State(state): State<SharedState>,
    _user: AuthUser,
    Json(req): Json<CreateDatabaseRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let image = match req.engine.as_str() {
        "postgresql" => "postgres:17-alpine",
        "mysql" => "mysql:8.4",
        "redis" => "redis:7.4-alpine",
        "mongodb" => "mongo:7.0",
        "mariadb" => "mariadb:11.4",
        other => return Err(AppError::BadRequest(format!("Unknown engine: {other}"))),
    };

    let port: u16 = match req.engine.as_str() {
        "postgresql" => 5432,
        "mysql" | "mariadb" => 3306,
        "redis" => 6379,
        "mongodb" => 27017,
        _ => 5432,
    };

    let env = match req.engine.as_str() {
        "postgresql" => vec![
            "POSTGRES_USER=railflow".into(),
            "POSTGRES_PASSWORD=changeme".into(),
            "POSTGRES_DB=railflow".into(),
        ],
        "mysql" | "mariadb" => vec![
            "MYSQL_ROOT_PASSWORD=changeme".into(),
            "MYSQL_DATABASE=railflow".into(),
            "MYSQL_USER=railflow".into(),
            "MYSQL_PASSWORD=changeme".into(),
        ],
        "redis" => vec![],
        "mongodb" => vec!["MONGO_INITDB_ROOT_USERNAME=railflow".into(), "MONGO_INITDB_ROOT_PASSWORD=changeme".into()],
        _ => vec![],
    };

    let mut labels = std::collections::HashMap::new();
    labels.insert("railflow.managed".into(), "true".into());
    labels.insert("railflow.type".into(), "database".into());
    labels.insert("railflow.engine".into(), req.engine.clone());
    labels.insert("railflow.plan".into(), req.plan.clone());
    if let Some(pid) = req.project_id {
        labels.insert("railflow.project".into(), pid.to_string());
    }

    let mut ports = std::collections::HashMap::new();
    ports.insert(port, port);

    let container_id = state.docker.create_container(&req.name, image, env, ports, labels).await?;

    Ok(json!({
        "id": Uuid::new_v4(),
        "name": req.name,
        "engine": req.engine,
        "container_id": container_id,
        "status": "running",
    }).into())
}

async fn get_database(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let container = state.docker.inspect_container(&id).await?;
    Ok(Json(json!(container)))
}

async fn delete_database(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.docker.stop_container(&id, 30).await?;
    state.docker.remove_container(&id, true).await?;
    Ok(json!({ "deleted": true }).into())
}

async fn start_database(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.docker.start_container(&id).await?;
    Ok(json!({ "started": true }).into())
}

async fn stop_database(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.docker.stop_container(&id, 30).await?;
    Ok(json!({ "stopped": true }).into())
}

async fn restart_database(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.docker.restart_container(&id, 30).await?;
    Ok(json!({ "restarted": true }).into())
}

async fn create_backup(
    State(_state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    // TODO: spawn pg_dump / mysqldump / mongodump task
    Ok(json!({
        "backup_id": Uuid::new_v4(),
        "database_id": id,
        "status": "in_progress",
        "message": "Backup started. Use /api/backups/:id to check status."
    }).into())
}

async fn get_connection_string(
    State(_state): State<SharedState>,
    _user: AuthUser,
    Path(_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    // In production: fetch from DB and decrypt
    Err(AppError::NotFound("Connection info requires database record".into()))
}
