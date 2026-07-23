// Webhook deliverer — sends outgoing HTTP POST requests with HMAC-SHA256 signatures,
// retries on failure with exponential backoff.

use hmac::{Hmac, Mac};
use reqwest::Client;
use sha2::Sha256;
use uuid::Uuid;

use crate::{error::AppError, services::state::SharedState};

pub async fn deliver(
    state: &SharedState,
    webhook_id: Uuid,
    url: &str,
    secret: &str,
    event: &str,
    payload: &serde_json::Value,
) -> Result<(), AppError> {
    let body = serde_json::to_string(payload).unwrap_or_default();
    let delivery_id = Uuid::new_v4();
    let max_attempts = 3;

    // Compute HMAC-SHA256 signature
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes())
        .map_err(|e| AppError::Internal(format!("HMAC error: {e}")))?;
    mac.update(body.as_bytes());
    let signature = format!("sha256={}", hex::encode(mac.finalize().into_bytes()));

    let client = Client::new();

    // Record delivery start
    sqlx::query(
        "INSERT INTO webhook_deliveries (id, webhook_id, event, status, attempt, max_attempts, request_body, delivered_at)
         VALUES ($1, $2, $3, 'pending', 0, $4, $5, NOW())"
    )
    .bind(delivery_id)
    .bind(webhook_id)
    .bind(event)
    .bind(max_attempts)
    .bind(&body)
    .execute(&state.db)
    .await?;

    for attempt in 1..=max_attempts {
        // Update attempt count
        sqlx::query("UPDATE webhook_deliveries SET attempt = $1 WHERE id = $2")
            .bind(attempt)
            .bind(delivery_id)
            .execute(&state.db)
            .await?;

        let start = std::time::Instant::now();
        let result = client
            .post(url)
            .header("Content-Type", "application/json")
            .header("X-Railflow-Event", event)
            .header("X-Railflow-Signature", &signature)
            .header("X-Railflow-Delivery", delivery_id.to_string())
            .body(body.clone())
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await;

        let duration_ms = start.elapsed().as_millis() as i64;

        match result {
            Ok(resp) if resp.status().is_success() => {
                let status_code = resp.status().as_u16() as i32;
                let response_body = resp.text().await.unwrap_or_default();
                sqlx::query(
                    "UPDATE webhook_deliveries SET status = 'delivered', status_code = $1, response_body = $2, duration_ms = $3 WHERE id = $4"
                )
                .bind(status_code)
                .bind(&response_body)
                .bind(duration_ms)
                .bind(delivery_id)
                .execute(&state.db)
                .await?;
                tracing::info!("Webhook {webhook_id} delivered (attempt {attempt}, {status_code}, {duration_ms}ms)");
                return Ok(());
            }
            Ok(resp) => {
                let status_code = resp.status().as_u16() as i32;
                let response_body = resp.text().await.unwrap_or_default();
                sqlx::query(
                    "UPDATE webhook_deliveries SET status = 'retrying', status_code = $1, response_body = $2, duration_ms = $3 WHERE id = $4"
                )
                .bind(status_code)
                .bind(&response_body)
                .bind(duration_ms)
                .bind(delivery_id)
                .execute(&state.db)
                .await?;
                tracing::warn!("Webhook {webhook_id} attempt {attempt} failed (status {status_code})");
            }
            Err(e) => {
                sqlx::query(
                    "UPDATE webhook_deliveries SET status = 'retrying', response_body = $1, duration_ms = $2 WHERE id = $3"
                )
                .bind(format!("Error: {e}"))
                .bind(duration_ms)
                .bind(delivery_id)
                .execute(&state.db)
                .await?;
                tracing::warn!("Webhook {webhook_id} attempt {attempt} error: {e}");
            }
        }

        if attempt < max_attempts {
            // Exponential backoff: 1s, 4s, 16s
            let backoff_secs = 4_u64.pow(attempt as u32 - 1);
            tokio::time::sleep(std::time::Duration::from_secs(backoff_secs)).await;
        }
    }

    // All attempts failed
    sqlx::query("UPDATE webhook_deliveries SET status = 'failed' WHERE id = $1")
        .bind(delivery_id)
        .execute(&state.db)
        .await?;
    tracing::error!("Webhook {webhook_id} delivery failed after {max_attempts} attempts");
    Ok(())
}
