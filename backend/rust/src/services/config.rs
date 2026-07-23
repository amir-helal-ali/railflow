// Application configuration loaded from environment variables.

use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub environment: String,
    pub log_level: String,
    pub database_url: String,
    pub database_max_connections: u32,
    pub jwt_secret: String,
    pub jwt_expiration_hours: i64,
    pub refresh_token_expiration_days: i64,
    pub docker_socket: String,
    pub docker_registry: String,
    pub github_client_id: String,
    pub github_client_secret: String,
    pub github_webhook_secret: String,
    pub totp_issuer: String,
    pub totp_digits: u32,
    pub totp_step: u64,
    pub cors_origins: Vec<String>,
    pub rate_limit_per_minute: u32,
    pub build_timeout_seconds: u64,
    pub max_concurrent_builds: usize,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".into()),
            port: env::var("PORT").unwrap_or_else(|_| "8080".into()).parse()?,
            environment: env::var("ENVIRONMENT").unwrap_or_else(|_| "development".into()),
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".into()),
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://railflow:changeme@localhost:5432/railflow".into()),
            database_max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                .unwrap_or_else(|_| "20".into()).parse()?,
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "dev-only-change-me-in-production".into()),
            jwt_expiration_hours: env::var("JWT_EXPIRATION_HOURS")
                .unwrap_or_else(|_| "24".into()).parse()?,
            refresh_token_expiration_days: env::var("REFRESH_TOKEN_EXPIRATION_DAYS")
                .unwrap_or_else(|_| "30".into()).parse()?,
            docker_socket: env::var("DOCKER_SOCKET")
                .unwrap_or_else(|_| "/var/run/docker.sock".into()),
            docker_registry: env::var("DOCKER_REGISTRY")
                .unwrap_or_else(|_| "ghcr.io".into()),
            github_client_id: env::var("GITHUB_CLIENT_ID").unwrap_or_default(),
            github_client_secret: env::var("GITHUB_CLIENT_SECRET").unwrap_or_default(),
            github_webhook_secret: env::var("GITHUB_WEBHOOK_SECRET").unwrap_or_default(),
            totp_issuer: env::var("TOTP_ISSUER").unwrap_or_else(|_| "Railflow".into()),
            totp_digits: env::var("TOTP_DIGITS").unwrap_or_else(|_| "6".into()).parse()?,
            totp_step: env::var("TOTP_STEP").unwrap_or_else(|_| "30".into()).parse()?,
            cors_origins: env::var("CORS_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000".into())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            rate_limit_per_minute: env::var("RATE_LIMIT_PER_MINUTE")
                .unwrap_or_else(|_| "100".into()).parse()?,
            build_timeout_seconds: env::var("BUILD_TIMEOUT_SECONDS")
                .unwrap_or_else(|_| "900".into()).parse()?,
            max_concurrent_builds: env::var("MAX_CONCURRENT_BUILDS")
                .unwrap_or_else(|_| "4".into()).parse()?,
        })
    }

    pub fn is_production(&self) -> bool {
        self.environment == "production"
    }
}
