// GitHub integration: OAuth, repo listing, webhooks verification.

use hmac::{Hmac, Mac};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::Sha256;

use crate::error::AppError;

#[derive(Clone)]
pub struct GitHubService {
    client: Client,
    client_id: String,
    client_secret: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubRepo {
    pub id: i64,
    pub name: String,
    pub full_name: String,
    pub description: Option<String>,
    pub private: bool,
    pub html_url: String,
    pub default_branch: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubUser {
    pub id: i64,
    pub login: String,
    pub name: Option<String>,
    pub avatar_url: String,
    pub html_url: String,
    pub email: Option<String>,
}

impl GitHubService {
    pub fn new(client_id: String, client_secret: String) -> Self {
        Self {
            client: Client::new(),
            client_id,
            client_secret,
        }
    }

    /// Exchange OAuth code for access token.
    pub async fn exchange_code(&self, code: &str) -> Result<String, AppError> {
        let resp = self
            .client
            .post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .json(&serde_json::json!({
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
            }))
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("GitHub OAuth error: {e}")))?;

        let body: serde_json::Value = resp.json().await
            .map_err(|e| AppError::Internal(format!("GitHub OAuth parse error: {e}")))?;

        body.get("access_token")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .ok_or_else(|| AppError::BadRequest("No access token in GitHub response".into()))
    }

    /// Get authenticated user info.
    pub async fn get_user(&self, token: &str) -> Result<GitHubUser, AppError> {
        let resp = self
            .client
            .get("https://api.github.com/user")
            .header("Authorization", format!("Bearer {token}"))
            .header("User-Agent", "Railflow/0.1")
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("GitHub API error: {e}")))?;

        resp.json().await
            .map_err(|e| AppError::Internal(format!("GitHub user parse error: {e}")))
    }

    /// List user's repositories.
    pub async fn list_repos(&self, token: &str) -> Result<Vec<GitHubRepo>, AppError> {
        let resp = self
            .client
            .get("https://api.github.com/user/repos?per_page=100&sort=updated")
            .header("Authorization", format!("Bearer {token}"))
            .header("User-Agent", "Railflow/0.1")
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("GitHub API error: {e}")))?;

        resp.json().await
            .map_err(|e| AppError::Internal(format!("GitHub repos parse error: {e}")))
    }

    /// Verify GitHub webhook signature.
    pub fn verify_webhook_signature(&self, payload: &[u8], signature: &str, secret: &str) -> bool {
        let parts: Vec<&str> = signature.splitn(2, '=').collect();
        if parts.len() != 2 {
            return false;
        }

        let mut mac = match Hmac::<Sha256>::new_from_slice(secret.as_bytes()) {
            Ok(m) => m,
            Err(_) => return false,
        };
        mac.update(payload);
        let expected = hex::encode(mac.finalize().into_bytes());
        let provided = parts[1];

        // constant-time comparison
        if expected.len() != provided.len() {
            return false;
        }
        expected.bytes().zip(provided.bytes()).fold(true, |acc, (a, b)| acc & (a == b))
    }

    /// Register a webhook on a repo to receive push events.
    pub async fn register_webhook(
        &self,
        token: &str,
        repo_full_name: &str,
        webhook_url: &str,
        secret: &str,
    ) -> Result<i64, AppError> {
        let resp = self
            .client
            .post(format!("https://api.github.com/repos/{repo_full_name}/hooks"))
            .header("Authorization", format!("Bearer {token}"))
            .header("User-Agent", "Railflow/0.1")
            .json(&serde_json::json!({
                "name": "web",
                "active": true,
                "events": ["push", "pull_request"],
                "config": {
                    "url": webhook_url,
                    "content_type": "json",
                    "secret": secret,
                    "insecure_ssl": "0"
                }
            }))
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("GitHub webhook error: {e}")))?;

        let body: serde_json::Value = resp.json().await
            .map_err(|e| AppError::Internal(format!("GitHub webhook parse error: {e}")))?;

        body.get("id").and_then(|v| v.as_i64()).ok_or_else(|| AppError::Internal("No webhook id returned".into()))
    }
}
