// Shared application state passed to all route handlers.

use std::sync::Arc;

use sqlx::PgPool;

use super::{config::Config, docker::DockerService, github::GitHubService, server::ServerService};

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub db: PgPool,
    pub docker: DockerService,
    pub server: ServerService,
    pub github: GitHubService,
}

pub type SharedState = Arc<AppState>;
