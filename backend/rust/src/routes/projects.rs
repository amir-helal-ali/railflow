// Project management routes: /api/projects/*
// CRUD + env variables + deployment triggering.

use axum::{
    extract::{Path, State},
    routing::{delete, get, post, put},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    error::AppError,
    middleware::auth::AuthUser,
    models::*,
    services::state::SharedState,
};

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/projects", get(list_projects).post(create_project))
        .route("/api/projects/:id", get(get_project).put(update_project).delete(delete_project))
        .route("/api/projects/:id/env", get(list_env_vars).post(create_env_var))
        .route("/api/projects/:id/env/:var_id", delete(delete_env_var))
        .route("/api/projects/:id/deploy", post(trigger_deploy))
        .route("/api/projects/:id/logs", get(stream_logs))
        .route("/api/projects/:id/redeploy", post(redeploy))
}

async fn list_projects(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<Vec<ProjectResponse>>, AppError> {
    let projects = sqlx::query_as::<_, Project>("SELECT * FROM projects ORDER BY updated_at DESC")
        .fetch_all(&state.db)
        .await?;

    Ok(Json(projects.into_iter().map(Into::into).collect()))
}

async fn get_project(
    State(_state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ProjectResponse>, AppError> {
    let project = sqlx::query_as::<_, Project>("SELECT * FROM projects WHERE id = $1")
        .bind(id)
        .fetch_one(&_state.db)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => AppError::NotFound("Project not found".into()),
            _ => AppError::Database(e),
        })?;

    Ok(Json(project.into()))
}

async fn create_project(
    State(state): State<SharedState>,
    user: AuthUser,
    Json(req): Json<CreateProjectRequest>,
) -> Result<Json<ProjectResponse>, AppError> {
    let user_uuid = Uuid::parse_str(&user.user_id)
        .map_err(|_| AppError::Unauthorized("Invalid user id".into()))?;

    let slug = req.name.to_lowercase().replace(' ', "-");
    let root_dir = req.root_dir.unwrap_or_else(|| "./".into());

    let project = sqlx::query_as::<_, Project>(
        "INSERT INTO projects (id, name, slug, description, repo, repo_url, branch, runtime, framework,
            build_command, install_command, start_command, root_dir, auto_deploy, preview_deploy,
            owner_id, status, health, tags, custom_domains)
         VALUES ($1, $2, $3, '', $4, $5, $6, $7, $8, $9, NULL, $10, $11, $12, $13, $14, 'queued', 'unknown', '{}', '{}')
         RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(&req.name)
    .bind(&slug)
    .bind(&req.repo)
    .bind(format!("https://github.com/{}", req.repo))
    .bind(&req.branch)
    .bind(&req.runtime)
    .bind(&req.framework)
    .bind(&req.build_command)
    .bind(&req.start_command)
    .bind(&root_dir)
    .bind(req.auto_deploy.unwrap_or(true))
    .bind(req.preview_deploy.unwrap_or(false))
    .bind(user_uuid)
    .fetch_one(&state.db)
    .await?;

    // Register GitHub webhook if we have a token
    if let Some(token) = &user.role.as_str() {
        // TODO: store user.github_token from auth flow
        let _ = token;
    }

    Ok(Json(project.into()))
}

async fn update_project(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateProjectRequest>,
) -> Result<Json<ProjectResponse>, AppError> {
    let project = sqlx::query_as::<_, Project>(
        "UPDATE projects SET
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            branch = COALESCE($3, branch),
            build_command = COALESCE($4, build_command),
            start_command = COALESCE($5, start_command),
            auto_deploy = COALESCE($6, auto_deploy),
            preview_deploy = COALESCE($7, preview_deploy),
            updated_at = NOW()
         WHERE id = $8 RETURNING *"
    )
    .bind(&req.name)
    .bind(&req.description)
    .bind(&req.branch)
    .bind(&req.build_command)
    .bind(&req.start_command)
    .bind(req.auto_deploy)
    .bind(req.preview_deploy)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => AppError::NotFound("Project not found".into()),
        _ => AppError::Database(e),
    })?;

    Ok(Json(project.into()))
}

async fn delete_project(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Stop & remove the container first
    let project = sqlx::query_as::<_, Project>("SELECT * FROM projects WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await?;

    if let Some(container_id) = &project.container_id {
        let _ = state.docker.remove_container(container_id, true).await;
    }

    sqlx::query("DELETE FROM projects WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    Ok(serde_json::json!({ "deleted": true }).into())
}

async fn list_env_vars(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<EnvVariable>>, AppError> {
    let vars = sqlx::query_as::<_, EnvVariable>("SELECT * FROM env_variables WHERE project_id = $1 ORDER BY key")
        .bind(id)
        .fetch_all(&state.db)
        .await?;

    Ok(Json(vars))
}

async fn create_env_var(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<CreateEnvVarRequest>,
) -> Result<Json<EnvVariable>, AppError> {
    let var = sqlx::query_as::<_, EnvVariable>(
        "INSERT INTO env_variables (id, project_id, key, value, is_secret, is_sensitive, service)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(id)
    .bind(&req.key)
    .bind(&req.value)
    .bind(req.is_secret.unwrap_or(false))
    .bind(req.is_sensitive.unwrap_or(false))
    .bind(&req.service)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(var))
}

async fn delete_env_var(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path((id, var_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM env_variables WHERE id = $1 AND project_id = $2")
        .bind(var_id)
        .bind(id)
        .execute(&state.db)
        .await?;

    Ok(serde_json::json!({ "deleted": true }).into())
}

async fn trigger_deploy(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<TriggerDeploymentRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let project = sqlx::query_as::<_, Project>("SELECT * FROM projects WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await?;

    // Create deployment record
    let deployment_id = Uuid::new_v4();
    let stages = serde_json::json!([
        { "id": "queued", "status": "running" },
        { "id": "cloning", "status": "pending" },
        { "id": "building", "status": "pending" },
        { "id": "pushing", "status": "pending" },
        { "id": "starting", "status": "pending" },
        { "id": "health", "status": "pending" },
        { "id": "done", "status": "pending" }
    ]);

    sqlx::query(
        "INSERT INTO deployments (id, project_id, status, stage, commit_sha, commit_message, branch,
            author, environment, triggered_by, stages, started_at)
         VALUES ($1, $2, 'queued', 'queued', 'manual', 'Manual deploy', $3, 'user', $4, 'manual', $5, NOW())"
    )
    .bind(deployment_id)
    .bind(id)
    .bind(&project.branch)
    .bind(req.environment.unwrap_or_else(|| "production".into()))
    .bind(&stages)
    .execute(&state.db)
    .await?;

    // Spawn the deployment pipeline (async)
    let state_clone = state.clone();
    let project_id = id;
    let deploy_id = deployment_id;
    tokio::spawn(async move {
        if let Err(e) = crate::services::deploy::run_pipeline(state_clone, project_id, deploy_id).await {
            tracing::error!("Deployment {deploy_id} failed: {e}");
        }
    });

    Ok(serde_json::json!({ "deployment_id": deployment_id }).into())
}

async fn redeploy(
    State(state): State<SharedState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Re-trigger the latest deployment
    trigger_deploy(
        State(state),
        user,
        Path(id),
        Json(TriggerDeploymentRequest { project_id: id, environment: None }),
    ).await
}

async fn stream_logs(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let project = sqlx::query_as::<_, Project>("SELECT * FROM projects WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await?;

    let container_id = project.container_id.ok_or_else(|| AppError::NotFound("No container running".into()))?;
    // The actual streaming happens via WebSocket route /api/ws/logs/:container_id
    Ok(serde_json::json!({ "container_id": container_id, "endpoint": format!("/api/ws/logs/{container_id}") }).into())
}
