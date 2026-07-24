// Environments routes: /api/environments/*
// Manage production/staging/preview environments per project.

use axum::{
    extract::{Path, Query, State},
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
        .route("/api/environments", get(list_environments).post(create_environment))
        .route("/api/environments/:id", get(get_environment).delete(delete_environment))
        .route("/api/environments/:id/sleep", post(sleep_environment))
        .route("/api/environments/:id/wake", post(wake_environment))
        .route("/api/environments/:id/promote", post(promote_environment))
}

#[derive(Deserialize)]
struct ListQuery {
    project_id: Option<Uuid>,
    tier: Option<String>,
}

#[derive(Deserialize)]
struct CreateEnvironmentRequest {
    project_id: Uuid,
    name: String,
    tier: String, // production | staging | preview
    branch: String,
    auto_scale: Option<bool>,
    replicas: Option<i32>,
}

async fn list_environments(
    State(state): State<SharedState>,
    _user: AuthUser,
    Query(q): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let envs = if let Some(pid) = q.project_id {
        sqlx::query("SELECT * FROM environments WHERE project_id = $1 ORDER BY tier, created_at")
            .bind(pid)
            .fetch_all(&state.db)
            .await?
    } else if let Some(tier) = q.tier {
        sqlx::query("SELECT * FROM environments WHERE tier = $1 ORDER BY project_id, created_at")
            .bind(tier)
            .fetch_all(&state.db)
            .await?
    } else {
        sqlx::query("SELECT * FROM environments ORDER BY project_id, tier, created_at")
            .fetch_all(&state.db)
            .await?
    };

    Ok(json!({ "environments": envs }).into())
}

async fn create_environment(
    State(state): State<SharedState>,
    _user: AuthUser,
    Json(req): Json<CreateEnvironmentRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let env_id = Uuid::new_v4();
    let domain = match req.tier.as_str() {
        "production" => sqlx::query_scalar::<_, Option<String>>(
            "SELECT primary_domain FROM projects WHERE id = $1"
        ).bind(req.project_id).fetch_optional(&state.db).await?.flatten(),
        "staging" => Some(format!("staging-{}.railflow.io",
            sqlx::query_scalar::<_, String>("SELECT slug FROM projects WHERE id = $1")
                .bind(req.project_id).fetch_one(&state.db).await?)),
        "preview" => Some(format!("preview-{}.railflow.app", Uuid::new_v4().to_string().split('-').next().unwrap_or("x"))),
        _ => None,
    };

    sqlx::query(
        "INSERT INTO environments (id, project_id, name, tier, branch, status, auto_scale, replicas, domain)
         VALUES ($1, $2, $3, $4, $5, 'building', $6, $7, $8)"
    )
    .bind(env_id)
    .bind(req.project_id)
    .bind(&req.name)
    .bind(&req.tier)
    .bind(&req.branch)
    .bind(req.auto_scale.unwrap_or(false))
    .bind(req.replicas.unwrap_or(1))
    .bind(&domain)
    .execute(&state.db)
    .await?;

    // Trigger a deployment for this environment
    // (handled by the deploy service)

    Ok(json!({
        "id": env_id,
        "project_id": req.project_id,
        "name": req.name,
        "tier": req.tier,
        "branch": req.branch,
        "status": "building",
        "domain": domain,
    }).into())
}

async fn get_environment(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let env = sqlx::query("SELECT * FROM environments WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Environment not found".into()))?;
    Ok(Json(json!(env)))
}

async fn delete_environment(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM environments WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;
    Ok(json!({ "deleted": true, "id": id }).into())
}

async fn sleep_environment(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE environments SET status = 'sleeping', updated_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;
    // TODO: stop the container via docker
    Ok(json!({ "sleeping": true, "id": id }).into())
}

async fn wake_environment(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE environments SET status = 'active', updated_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;
    // TODO: start the container via docker
    Ok(json!({ "awake": true, "id": id }).into())
}

async fn promote_environment(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Promote staging/preview to production: copy env vars and re-deploy
    let env = sqlx::query("SELECT * FROM environments WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await?;

    let project_id: Uuid = sqlx::query_scalar("SELECT project_id FROM environments WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await?;

    // Update the production environment's branch and trigger a deploy
    sqlx::query(
        "UPDATE environments SET branch = (SELECT branch FROM environments WHERE id = $1), status = 'building', updated_at = NOW()
         WHERE project_id = $2 AND tier = 'production'"
    )
    .bind(id)
    .bind(project_id)
    .execute(&state.db)
    .await?;

    Ok(json!({ "promoted": true, "from_environment": id, "project_id": project_id }).into())
}
