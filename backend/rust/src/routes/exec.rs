// Container exec / terminal routes: /api/containers/:id/exec
// Spawns an interactive shell inside a container via bollard exec API.
// For real-time bidirectional streaming, use the WebSocket endpoint /api/ws/exec/:id.

use axum::{
    extract::{Path, State},
    routing::post,
    Json, Router,
};
use serde::Deserialize;
use serde_json::json;

use crate::{
    error::AppError,
    middleware::auth::AuthUser,
    services::state::SharedState,
};

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/containers/:id/exec", post(exec_command))
        .route("/api/containers/:id/exec/attach", post(attach_exec))
}

#[derive(Deserialize)]
struct ExecRequest {
    cmd: Vec<String>,
    #[serde(default)]
    tty: bool,
    #[serde(default)]
    stdin: bool,
    #[serde(default)]
    stdout: bool,
    #[serde(default)]
    stderr: bool,
    #[serde(default)]
    user: Option<String>,
    #[serde(default)]
    working_dir: Option<String>,
    #[serde(default)]
    env: Option<Vec<String>>,
}

/// Execute a one-shot command inside a container and return the output.
/// For interactive sessions, use the WebSocket endpoint instead.
async fn exec_command(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
    Json(req): Json<ExecRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    use bollard::exec::{CreateExecOptions, StartExecResults};

    let config = CreateExecOptions {
        cmd: Some(req.cmd),
        attach_stdout: Some(req.stdout || true),
        attach_stderr: Some(req.stderr || true),
        attach_stdin: Some(req.stdin),
        tty: Some(req.tty),
        user: req.user,
        working_dir: req.working_dir,
        env: req.env,
        ..Default::default()
    };

    let exec = state.docker.client().create_exec(&id, config).await
        .map_err(|e| AppError::Docker(format!("Failed to create exec: {e}")))?;

    let mut output = String::new();
    let mut exit_code = 0i64;

    match state.docker.client().start_exec(&exec.id, None).await
        .map_err(|e| AppError::Docker(format!("Failed to start exec: {e}")))?
    {
        StartExecResults::Attached { mut output: mut stream, .. } => {
            use futures_util::StreamExt;
            while let Some(Ok(msg)) = stream.next().await {
                use bollard::exec::LogOutput;
                match msg {
                    LogOutput::StdOut { message } => {
                        output.push_str(&String::from_utf8_lossy(&message));
                    }
                    LogOutput::StdErr { message } => {
                        output.push_str(&String::from_utf8_lossy(&message));
                    }
                    _ => {}
                }
            }
        }
        StartExecResults::Detached => {
            output.push_str("(detached — no output captured)");
        }
    }

    let inspect = state.docker.client().inspect_exec(&exec.id).await
        .map_err(|e| AppError::Docker(format!("Failed to inspect exec: {e}")))?;
    if let Some(code) = inspect.exit_code {
        exit_code = code;
    }

    Ok(json!({
        "exec_id": exec.id,
        "exit_code": exit_code,
        "output": output,
    }).into())
}

/// Attach to an existing exec instance for interactive I/O.
/// Returns the WebSocket URL for bidirectional streaming.
async fn attach_exec(
    State(_state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    Ok(json!({
        "container_id": id,
        "ws_endpoint": format!("/api/ws/exec/{id}"),
        "message": "Connect via WebSocket for interactive session"
    }).into())
}
