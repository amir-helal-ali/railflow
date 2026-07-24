// Outgoing Webhooks routes: /api/webhooks/*
// Endpoint management + delivery history with retry.

use axum::{
    extract::{Path, Query, State},
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::Deserialize;
use serde_json::json;
use sqlx::Row;
use uuid::Uuid;

use crate::{
    error::AppError,
    middleware::auth::AuthUser,
    services::state::SharedState,
};
use crate::services::db_json::rows_to_json;

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/webhooks", get(list_webhooks).post(create_webhook))
        .route("/api/webhooks/:id", get(get_webhook).put(update_webhook).delete(delete_webhook))
        .route("/api/webhooks/:id/test", post(test_webhook))
        .route("/api/webhooks/:id/deliveries", get(list_deliveries))
        .route("/api/webhooks/deliveries/:delivery_id", get(get_delivery))
        .route("/api/webhooks/deliveries/:delivery_id/redeliver", post(redeliver))
}

#[derive(Deserialize)]
struct ListQuery {
    enabled: Option<bool>,
}

async fn list_webhooks(
    State(state): State<SharedState>,
    _user: AuthUser,
    Query(q): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let webhooks = if let Some(enabled) = q.enabled {
        sqlx::query("SELECT * FROM webhooks WHERE enabled = $1 ORDER BY created_at DESC")
            .bind(enabled)
            .fetch_all(&state.db)
            .await?
    } else {
        sqlx::query("SELECT * FROM webhooks ORDER BY created_at DESC")
            .fetch_all(&state.db)
            .await?
    };
    Ok(json!({ "webhooks": rows_to_json(&webhooks) }).into())
}

async fn get_webhook(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let wh = sqlx::query("SELECT * FROM webhooks WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Webhook not found".into()))?;
    Ok(Json(crate::services::db_json::row_to_json(&wh)))
}

#[derive(Deserialize)]
struct CreateWebhookRequest {
    name: String,
    url: String,
    events: Vec<String>,
    secret: Option<String>,
    ssl_verification: Option<bool>,
    enabled: Option<bool>,
}

async fn create_webhook(
    State(state): State<SharedState>,
    _user: AuthUser,
    Json(req): Json<CreateWebhookRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let id = Uuid::new_v4();
    let secret = req.secret.unwrap_or_else(|| {
        hex::encode(rand::random::<[u8; 32]>())
    });

    sqlx::query(
        "INSERT INTO webhooks (id, name, url, events, secret, ssl_verification, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7)"
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.url)
    .bind(&req.events)
    .bind(&secret)
    .bind(req.ssl_verification.unwrap_or(true))
    .bind(req.enabled.unwrap_or(true))
    .execute(&state.db)
    .await?;

    Ok(json!({ "id": id, "name": req.name, "secret_prefix": format!("whsec_{}...", &secret[..8]) }).into())
}

async fn update_webhook(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        "UPDATE webhooks SET
            name = COALESCE($1, name),
            url = COALESCE($2, url),
            events = COALESCE($3, events),
            ssl_verification = COALESCE($4, ssl_verification),
            enabled = COALESCE($5, enabled),
            updated_at = NOW()
         WHERE id = $6"
    )
    .bind(req.get("name").and_then(|v| v.as_str()))
    .bind(req.get("url").and_then(|v| v.as_str()))
    .bind(req.get("events"))
    .bind(req.get("ssl_verification").and_then(|v| v.as_bool()))
    .bind(req.get("enabled").and_then(|v| v.as_bool()))
    .bind(id)
    .execute(&state.db)
    .await?;
    Ok(json!({ "updated": true, "id": id }).into())
}

async fn delete_webhook(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM webhooks WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;
    Ok(json!({ "deleted": true, "id": id }).into())
}

async fn test_webhook(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let wh = sqlx::query("SELECT name, url, secret FROM webhooks WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Webhook not found".into()))?;

    let name: String = wh.try_get("name").unwrap_or_default();
    let url: String = wh.try_get("url").unwrap_or_default();
    let secret: String = wh.try_get("secret").unwrap_or_default();

    // Spawn the delivery (async)
    let state_clone = state.clone();
    tokio::spawn(async move {
        let payload = serde_json::json!({
            "event": "webhook.test",
            "webhook": name,
            "timestamp": chrono::Utc::now(),
        });
        if let Err(e) = crate::services::webhook_deliverer::deliver(&state_clone, id, &url, &secret, "webhook.test", &payload).await {
            tracing::error!("Webhook test delivery failed: {e}");
        }
    });

    Ok(json!({ "sent": rows_to_json(&true) }).into())
}

async fn list_deliveries(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let deliveries = sqlx::query(
        "SELECT * FROM webhook_deliveries WHERE webhook_id = $1 ORDER BY delivered_at DESC LIMIT 100"
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?;
    Ok(json!({ "deliveries": rows_to_json(&deliveries) }).into())
}

async fn get_delivery(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(delivery_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let d = sqlx::query("SELECT * FROM webhook_deliveries WHERE id = $1")
        .bind(delivery_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Delivery not found".into()))?;
    Ok(Json(crate::services::db_json::row_to_json(&d)))
}

async fn redeliver(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(delivery_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let d = sqlx::query("SELECT webhook_id, request_body, event FROM webhook_deliveries WHERE id = $1")
        .bind(delivery_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Delivery not found".into()))?;

    let webhook_id: Uuid = d.try_get("webhook_id").unwrap_or_default();
    let body: String = d.try_get("request_body").unwrap_or_default();
    let event: String = d.try_get("event").unwrap_or_default();

    let state_clone = state.clone();
    tokio::spawn(async move {
        let secret: String = sqlx::query_scalar("SELECT secret FROM webhooks WHERE id = $1")
            .bind(webhook_id)
            .fetch_one(&state_clone.db)
            .await
            .unwrap_or_default();
        let payload: serde_json::Value = serde_json::from_str(&body).unwrap_or_default();
        if let Err(e) = crate::services::webhook_deliverer::deliver(&state_clone, webhook_id, &url, &secret, &event, &payload).await {
            tracing::error!("Webhook redeliver failed: {e}");
        }
    });

    Ok(json!({ "queued": true, "delivery_id": delivery_id }).into())
}
