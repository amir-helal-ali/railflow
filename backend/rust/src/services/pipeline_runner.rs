// Pipeline runner — executes stages sequentially, with conditions & failure handling.

use uuid::Uuid;
use sqlx::Row;
use crate::{error::AppError, services::state::SharedState};

pub async fn run(state: SharedState, pipeline_id: Uuid, run_id: Uuid) -> Result<(), AppError> {
    tracing::info!("Starting pipeline run {run_id} for pipeline {pipeline_id}");

    // Load pipeline + stages
    let stages = sqlx::query(
        "SELECT id, stage_type, name, command, image, timeout_sec, condition, on_failure, enabled, position
         FROM pipeline_stages WHERE pipeline_id = $1 AND enabled = TRUE ORDER BY position"
    )
    .bind(pipeline_id)
    .fetch_all(&state.db)
    .await?;

    let mut overall_success = true;

    for row in stages {
        let stage_id: Uuid = row.try_get("id").unwrap_or_default();
        let stage_type: String = row.try_get("stage_type").unwrap_or_default();
        let name: String = row.try_get("name").unwrap_or_default();
        let command: Option<String> = row.try_get("command").unwrap_or(None);
        let image: Option<String> = row.try_get("image").unwrap_or(None);
        let timeout_sec: i32 = row.try_get("timeout_sec").unwrap_or(60);
        let condition: Option<String> = row.try_get("condition").unwrap_or(None);
        let on_failure: String = row.try_get("on_failure").unwrap_or_else(|_| "stop".into());

        tracing::info!("Running stage '{name}' (type={stage_type})");

        // Mark stage as running
        sqlx::query("INSERT INTO pipeline_stage_runs (id, run_id, stage_id, status, started_at) VALUES ($1, $2, $3, 'running', NOW())")
            .bind(Uuid::new_v4())
            .bind(run_id)
            .bind(stage_id)
            .execute(&state.db)
            .await?;

        // Execute the stage
        let result = execute_stage(&state, &stage_type, &name, &command, &image, timeout_sec).await;

        let (status, error_msg) = match &result {
            Ok(()) => ("success".to_string(), None),
            Err(e) => ("failed".to_string(), Some(e.to_string())),
        };

        // Update stage run
        sqlx::query("UPDATE pipeline_stage_runs SET status = $1, finished_at = NOW(), error_message = $2 WHERE run_id = $3 AND stage_id = $4")
            .bind(&status)
            .bind(&error_msg)
            .bind(run_id)
            .bind(stage_id)
            .execute(&state.db)
            .await?;

        if result.is_err() {
            overall_success = false;
            match on_failure.as_str() {
                "stop" => {
                    tracing::warn!("Stage '{name}' failed with on_failure=stop. Aborting pipeline.");
                    break;
                }
                "continue" => {
                    tracing::info!("Stage '{name}' failed with on_failure=continue. Proceeding.");
                }
                "retry" => {
                    tracing::info!("Stage '{name}' failed with on_failure=retry. Retrying...");
                    let retry_result = execute_stage(&state, &stage_type, &name, &command, &image, timeout_sec).await;
                    if retry_result.is_err() {
                        tracing::warn!("Stage '{name}' retry failed. Aborting.");
                        break;
                    }
                }
                _ => break,
            }
        }
    }

    // Mark pipeline run as done
    sqlx::query("UPDATE pipeline_runs SET status = $1, finished_at = NOW() WHERE id = $2")
        .bind(if overall_success { "success" } else { "failed" })
        .bind(run_id)
        .execute(&state.db)
        .await?;

    tracing::info!("Pipeline run {run_id} completed: {}", if overall_success { "success" } else { "failed" });
    Ok(())
}

async fn execute_stage(
    _state: &SharedState,
    stage_type: &str,
    name: &str,
    command: &Option<String>,
    _image: &Option<String>,
    _timeout_sec: i32,
) -> Result<(), AppError> {
    tracing::info!("Executing stage '{name}' (type={stage_type}, command={command:?})");
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    Ok(())
}
