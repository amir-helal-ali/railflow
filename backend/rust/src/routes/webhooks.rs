// GitHub webhook receiver: /api/webhooks/github
// Verifies signature, parses events, triggers deployments.

use axum::{
    body::Bytes,
    extract::State,
    http::HeaderMap,
    routing::post,
    Json, Router,
};
use serde_json::Value;
use uuid::Uuid;

use crate::{
    error::AppError,
    services::state::SharedState,
};

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/webhooks/github", post(github_webhook))
}

async fn github_webhook(
    State(state): State<SharedState>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Json<Value>, AppError> {
    // Verify signature
    let signature = headers
        .get("x-hub-signature-256")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing signature".into()))?;

    let secret = &state.config.github_webhook_secret;
    if secret.is_empty() {
        return Err(AppError::Unauthorized("Webhook secret not configured".into()));
    }

    if !state.github.verify_webhook_signature(&body, signature, secret) {
        return Err(AppError::Unauthorized("Invalid signature".into()));
    }

    let event_type = headers
        .get("x-github-event")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown");

    let payload: Value = serde_json::from_slice(&body)
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {e}")))?;

    tracing::info!("GitHub webhook received: {event_type}");

    match event_type {
        "push" => handle_push(&state, &payload).await?,
        "pull_request" => handle_pull_request(&state, &payload).await?,
        _ => {
            tracing::info!("Unhandled webhook event: {event_type}");
        }
    }

    Ok(Json(serde_json::json!({ "received": true })))
}

async fn handle_push(state: &SharedState, payload: &Value) -> Result<(), AppError> {
    let repo = payload.get("repository").and_then(|r| r.get("full_name")).and_then(|n| n.as_str())
        .ok_or_else(|| AppError::BadRequest("Missing repository".into()))?;

    let branch = payload.get("ref").and_then(|r| r.as_str())
        .and_then(|r| r.strip_prefix("refs/heads/"))
        .unwrap_or("");

    let commit_sha = payload.get("after").and_then(|s| s.as_str()).unwrap_or("");
    let commit_message = payload.get("head_commit")
        .and_then(|c| c.get("message"))
        .and_then(|m| m.as_str())
        .unwrap_or("");
    let author = payload.get("head_commit")
        .and_then(|c| c.get("author"))
        .and_then(|a| a.get("name"))
        .and_then(|n| n.as_str())
        .unwrap_or("");

    // Find projects linked to this repo with auto-deploy enabled
    let projects = sqlx::query_as::<_, crate::models::Project>(
        "SELECT * FROM projects WHERE repo = $1 AND branch = $2 AND auto_deploy = TRUE"
    )
    .bind(repo)
    .bind(branch)
    .fetch_all(&state.db)
    .await?;

    for project in projects {
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
             VALUES ($1, $2, 'queued', 'queued', $3, $4, $5, $6, 'production', 'webhook', $7, NOW())"
        )
        .bind(deployment_id)
        .bind(project.id)
        .bind(commit_sha)
        .bind(commit_message)
        .bind(branch)
        .bind(author)
        .bind(&stages)
        .execute(&state.db)
        .await?;

        // Trigger pipeline
        let state_clone = state.clone();
        let pid = project.id;
        tokio::spawn(async move {
            if let Err(e) = crate::services::deploy::run_pipeline(state_clone, pid, deployment_id).await {
                tracing::error!("Deployment {deployment_id} failed: {e}");
            }
        });

        tracing::info!("Triggered deployment {deployment_id} for project {}", project.id);
    }

    Ok(())
}

async fn handle_pull_request(state: &SharedState, payload: &Value) -> Result<(), AppError> {
    let action = payload.get("action").and_then(|a| a.as_str()).unwrap_or("");
    if action != "opened" && action != "synchronize" {
        return Ok(());
    }

    let repo = payload.get("repository").and_then(|r| r.get("full_name")).and_then(|n| n.as_str())
        .ok_or_else(|| AppError::BadRequest("Missing repository".into()))?;

    let pr_branch = payload.get("pull_request").and_then(|pr| pr.get("head")).and_then(|h| h.get("ref")).and_then(|r| r.as_str())
        .unwrap_or("");

    // Find projects with preview_deploy enabled
    let projects = sqlx::query_as::<_, crate::models::Project>(
        "SELECT * FROM projects WHERE repo = $1 AND preview_deploy = TRUE"
    )
    .bind(repo)
    .fetch_all(&state.db)
    .await?;

    for project in projects {
        let deployment_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO deployments (id, project_id, status, stage, commit_sha, commit_message, branch,
                author, environment, triggered_by, stages, started_at)
             VALUES ($1, $2, 'queued', 'queued', '', $3, $4, 'github', 'preview', 'webhook', '[]', NOW())"
        )
        .bind(deployment_id)
        .bind(project.id)
        .bind(format!("PR #{pr_branch}"))
        .bind(pr_branch)
        .execute(&state.db)
        .await?;

        let state_clone = state.clone();
        let pid = project.id;
        tokio::spawn(async move {
            if let Err(e) = crate::services::deploy::run_pipeline(state_clone, pid, deployment_id).await {
                tracing::error!("Preview deployment {deployment_id} failed: {e}");
            }
        });
    }

    Ok(())
}
