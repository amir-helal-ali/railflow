// Deployment pipeline — orchestrates the full deploy lifecycle:
// queued → cloning → building → pushing → starting → health → done
//
// Each stage is logged to the database and broadcast to subscribers via WebSocket.

use chrono::Utc;
use serde_json::json;
use uuid::Uuid;

use crate::{
    error::AppError,
    services::state::SharedState,
};

pub async fn run_pipeline(
    state: SharedState,
    project_id: Uuid,
    deployment_id: Uuid,
) -> Result<(), AppError> {
    tracing::info!("Starting deployment {deployment_id} for project {project_id}");

    // Load project
    let project = sqlx::query_as::<_, crate::models::Project>("SELECT * FROM projects WHERE id = $1")
        .bind(project_id)
        .fetch_one(&state.db)
        .await?;

    // Update project status
    sqlx::query("UPDATE projects SET status = 'building', updated_at = NOW() WHERE id = $1")
        .bind(project_id)
        .execute(&state.db)
        .await?;

    // Run stages
    let stages = ["cloning", "building", "pushing", "starting", "health", "done"];
    for stage in stages {
        // Mark stage as running
        update_stage(&state, deployment_id, stage, "running").await?;

        // Execute stage
        let result = match stage {
            "cloning" => stage_clone(&state, &project).await,
            "building" => stage_build(&state, &project).await,
            "pushing" => stage_push(&state, &project).await,
            "starting" => stage_start(&state, &project).await,
            "health" => stage_health(&state, &project).await,
            "done" => Ok(()),
            _ => Ok(()),
        };

        match result {
            Ok(()) => {
                update_stage(&state, deployment_id, stage, "success").await?;
                tracing::info!("Deployment {deployment_id} stage {stage}: success");
            }
            Err(e) => {
                update_stage(&state, deployment_id, stage, "failed").await?;
                sqlx::query(
                    "UPDATE deployments SET status = 'failed', error_message = $1, finished_at = NOW() WHERE id = $2"
                )
                .bind(e.to_string())
                .bind(deployment_id)
                .execute(&state.db)
                .await?;

                sqlx::query("UPDATE projects SET status = 'failed', updated_at = NOW() WHERE id = $1")
                    .bind(project_id)
                    .execute(&state.db)
                    .await?;

                tracing::error!("Deployment {deployment_id} failed at stage {stage}: {e}");
                return Err(e);
            }
        }
    }

    // Mark deployment as done
    let duration_ms = Utc::now().timestamp_millis()
        - sqlx::query_scalar::<_, chrono::DateTime<Utc>>("SELECT started_at FROM deployments WHERE id = $1")
            .bind(deployment_id)
            .fetch_one(&state.db)
            .await?
            .timestamp_millis();

    sqlx::query(
        "UPDATE deployments SET status = 'done', stage = 'done', finished_at = NOW(), duration_ms = $1 WHERE id = $2"
    )
    .bind(duration_ms)
    .bind(deployment_id)
    .execute(&state.db)
    .await?;

    sqlx::query("UPDATE projects SET status = 'done', health = 'healthy', updated_at = NOW() WHERE id = $1")
        .bind(project_id)
        .execute(&state.db)
        .await?;

    tracing::info!("Deployment {deployment_id} completed successfully in {duration_ms}ms");
    Ok(())
}

async fn update_stage(
    state: &SharedState,
    deployment_id: Uuid,
    stage: &str,
    status: &str,
) -> Result<(), AppError> {
    // Update the deployment's stage field
    sqlx::query("UPDATE deployments SET stage = $1 WHERE id = $2")
        .bind(stage)
        .bind(deployment_id)
        .execute(&state.db)
        .await?;

    // Update stages JSON (append status update)
    sqlx::query(
        "UPDATE deployments
         SET stages = (
             SELECT jsonb_agg(
                 CASE WHEN elem->>'id' = $1
                      THEN jsonb_set(elem, '{status}', to_jsonb($2::text))
                      ELSE elem END
             )
             FROM jsonb_array_elements(stages) AS elem
         )
         WHERE id = $3"
    )
    .bind(stage)
    .bind(status)
    .bind(deployment_id)
    .execute(&state.db)
    .await?;

    Ok(())
}

async fn stage_clone(_state: &SharedState, project: &crate::models::Project) -> Result<(), AppError> {
    tracing::info!("Cloning {} (branch: {})", project.repo, project.branch);
    // In production: git clone via subprocess
    // For now, simulate with a short sleep
    tokio::time::sleep(Duration::from_secs(2)).await;
    Ok(())
}

async fn stage_build(_state: &SharedState, project: &crate::models::Project) -> Result<(), AppError> {
    tracing::info!("Building project with: {:?}", project.build_command);
    // In production: run build command, capture logs, build Docker image
    tokio::time::sleep(Duration::from_secs(15)).await;
    Ok(())
}

async fn stage_push(_state: &SharedState, project: &crate::models::Project) -> Result<(), AppError> {
    tracing::info!("Pushing image to registry");
    // In production: docker push ghcr.io/{repo}:{branch}
    tokio::time::sleep(Duration::from_secs(5)).await;
    Ok(())
}

async fn stage_start(state: &SharedState, project: &crate::models::Project) -> Result<(), AppError> {
    tracing::info!("Starting container for project {}", project.id);

    // Pull env variables
    let env_vars: Vec<(String, String)> = sqlx::query_as(
        "SELECT key, value FROM env_variables WHERE project_id = $1"
    )
    .bind(project.id)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .collect();

    let env: Vec<String> = env_vars.iter().map(|(k, v)| format!("{k}={v}")).collect();

    // Build image URL
    let image = format!("ghcr.io/{}:{}", project.repo, project.branch);

    // Create container (in production: pull first if not present)
    let mut labels = std::collections::HashMap::new();
    labels.insert("railflow.project".into(), project.id.to_string());
    labels.insert("railflow.env".into(), "production".into());

    let mut ports = std::collections::HashMap::new();
    ports.insert(3000, 3000); // default

    match state.docker.create_container(&project.slug, &image, env, ports, labels).await {
        Ok(container_id) => {
            sqlx::query("UPDATE projects SET container_id = $1, image_url = $2 WHERE id = $3")
                .bind(&container_id)
                .bind(&image)
                .bind(project.id)
                .execute(&state.db)
                .await?;
        }
        Err(e) => {
            return Err(AppError::Internal(format!("Container start failed: {e}")));
        }
    }

    Ok(())
}

async fn stage_health(_state: &SharedState, _project: &crate::models::Project) -> Result<(), AppError> {
    tracing::info!("Running health check");
    // In production: poll container's health endpoint
    tokio::time::sleep(Duration::from_secs(3)).await;
    Ok(())
}

use std::time::Duration;
