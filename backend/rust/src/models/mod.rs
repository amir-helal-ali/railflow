// Data models — mirror the database schema.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub password_hash: Option<String>,
    pub avatar_url: Option<String>,
    pub role: String,
    pub github_id: Option<i64>,
    pub github_token: Option<String>,
    pub totp_secret: Option<String>,
    pub totp_enabled: bool,
    pub backup_codes: Option<Vec<String>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: String,
    pub repo: String,
    pub repo_url: String,
    pub branch: String,
    pub runtime: String,
    pub framework: Option<String>,
    pub build_command: Option<String>,
    pub install_command: Option<String>,
    pub start_command: Option<String>,
    pub root_dir: String,
    pub auto_deploy: bool,
    pub preview_deploy: bool,
    pub primary_domain: Option<String>,
    pub custom_domains: Vec<String>,
    pub owner_id: Uuid,
    pub status: String,
    pub health: String,
    pub container_id: Option<String>,
    pub image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Deployment {
    pub id: Uuid,
    pub project_id: Uuid,
    pub status: String,
    pub stage: String,
    pub commit_sha: String,
    pub commit_message: String,
    pub branch: String,
    pub author: String,
    pub author_avatar: Option<String>,
    pub environment: String,
    pub triggered_by: String,
    pub stages: serde_json::Value,
    pub started_at: DateTime<Utc>,
    pub finished_at: Option<DateTime<Utc>>,
    pub duration_ms: Option<i64>,
    pub error_message: Option<String>,
    pub url: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct EnvVariable {
    pub id: Uuid,
    pub project_id: Uuid,
    pub key: String,
    pub value: String,
    pub is_secret: bool,
    pub is_sensitive: bool,
    pub service: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ApiKey {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub key_prefix: String,
    pub key_hash: String,
    pub scopes: Vec<String>,
    pub last_used_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Session {
    pub id: Uuid,
    pub user_id: Uuid,
    pub token_hash: String,
    pub device: String,
    pub browser: String,
    pub os: String,
    pub ip: String,
    pub location: Option<String>,
    pub last_active_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

// ----- Request DTOs -----

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    pub remember: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct Verify2faRequest {
    pub session_token: String,
    pub code: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub repo: String,
    pub branch: String,
    pub runtime: String,
    pub framework: Option<String>,
    pub build_command: Option<String>,
    pub start_command: Option<String>,
    pub root_dir: Option<String>,
    pub auto_deploy: Option<bool>,
    pub preview_deploy: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub branch: Option<String>,
    pub build_command: Option<String>,
    pub start_command: Option<String>,
    pub auto_deploy: Option<bool>,
    pub preview_deploy: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateEnvVarRequest {
    pub key: String,
    pub value: String,
    pub is_secret: Option<bool>,
    pub is_sensitive: Option<bool>,
    pub service: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateApiKeyRequest {
    pub name: String,
    pub scopes: Vec<String>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct TriggerDeploymentRequest {
    pub project_id: Uuid,
    pub environment: Option<String>,
}

// ----- Response DTOs -----

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub requires_2fa: bool,
    pub session_token: Option<String>,
    pub access_token: Option<String>,
    pub user: Option<UserResponse>,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub role: String,
    pub two_factor_enabled: bool,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            email: u.email,
            name: u.name,
            avatar_url: u.avatar_url,
            role: u.role,
            two_factor_enabled: u.totp_enabled,
            created_at: u.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ProjectResponse {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: String,
    pub repo: String,
    pub repo_url: String,
    pub branch: String,
    pub runtime: String,
    pub framework: Option<String>,
    pub status: String,
    pub health: String,
    pub primary_domain: Option<String>,
    pub custom_domains: Vec<String>,
    pub auto_deploy: bool,
    pub preview_deploy: bool,
    pub build_command: Option<String>,
    pub install_command: Option<String>,
    pub start_command: Option<String>,
    pub root_dir: String,
    pub container_id: Option<String>,
    pub image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tags: Vec<String>,
}

impl From<Project> for ProjectResponse {
    fn from(p: Project) -> Self {
        Self {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            repo: p.repo,
            repo_url: p.repo_url,
            branch: p.branch,
            runtime: p.runtime,
            framework: p.framework,
            status: p.status,
            health: p.health,
            primary_domain: p.primary_domain,
            custom_domains: p.custom_domains,
            auto_deploy: p.auto_deploy,
            preview_deploy: p.preview_deploy,
            build_command: p.build_command,
            install_command: p.install_command,
            start_command: p.start_command,
            root_dir: p.root_dir,
            container_id: p.container_id,
            image_url: p.image_url,
            created_at: p.created_at,
            updated_at: p.updated_at,
            tags: p.tags,
        }
    }
}
