// Server monitoring routes: /api/server/*
// Live host metrics via sysinfo.

use axum::{
    extract::State,
    routing::get,
    Json, Router,
};
use serde::Deserialize;

use crate::{
    error::AppError,
    middleware::auth::AuthUser,
    services::{server::ProcessInfo, state::SharedState},
};

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/server/info", get(server_info))
        .route("/api/server/processes", get(top_processes))
}

async fn server_info(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<crate::services::server::ServerInfo>, AppError> {
    let info = state.server.collect();
    Ok(Json(info))
}

#[derive(Deserialize)]
struct ProcessQuery {
    limit: Option<usize>,
}

async fn top_processes(
    State(state): State<SharedState>,
    _user: AuthUser,
    axum::extract::Query(q): axum::extract::Query<ProcessQuery>,
) -> Result<Json<Vec<ProcessInfo>>, AppError> {
    let procs = state.server.top_processes(q.limit.unwrap_or(20));
    Ok(Json(procs))
}
