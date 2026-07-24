// Alerts & notification routes: /api/alerts/*
// Real-time alert management and notification rule configuration.

use axum::{
    extract::{Path, Query, State},
    routing::{get, post, put},
    Json, Router,
};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::{
    error::AppError,
    middleware::auth::AuthUser,
    services::state::SharedState,
};
use crate::services::db_json::rows_to_json;

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/alerts", get(list_alerts))
        .route("/api/alerts/:id", get(get_alert))
        .route("/api/alerts/:id/acknowledge", post(acknowledge_alert))
        .route("/api/alerts/:id/resolve", post(resolve_alert))
        .route("/api/alerts/acknowledge-all", post(acknowledge_all))
        .route("/api/alerts/rules", get(list_rules).post(create_rule))
        .route("/api/alerts/rules/:id", put(update_rule))
}

#[derive(Deserialize)]
struct ListQuery {
    severity: Option<String>,
    category: Option<String>,
    resolved: Option<bool>,
    acknowledged: Option<bool>,
}

async fn list_alerts(
    State(state): State<SharedState>,
    _user: AuthUser,
    Query(q): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Build dynamic query based on filters
    let alerts = sqlx::query(
        "SELECT * FROM alerts WHERE 1=1
         AND ($1::text IS NULL OR severity = $1)
         AND ($2::text IS NULL OR category = $2)
         AND ($3::bool IS NULL OR resolved = $3)
         AND ($4::bool IS NULL OR acknowledged = $4)
         ORDER BY created_at DESC LIMIT 100"
    )
    .bind(q.severity)
    .bind(q.category)
    .bind(q.resolved)
    .bind(q.acknowledged)
    .fetch_all(&state.db)
    .await?;

    Ok(json!({ "alerts": rows_to_json(&alerts) }).into())
}

async fn get_alert(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let alert = sqlx::query("SELECT * FROM alerts WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Alert not found".into()))?;
    Ok(Json(crate::services::db_json::row_to_json(&alert)))
}

async fn acknowledge_alert(
    State(state): State<SharedState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE alerts SET acknowledged = TRUE, acknowledged_by = $2, acknowledged_at = NOW() WHERE id = $1")
        .bind(id)
        .bind(&user.user_id)
        .execute(&state.db)
        .await?;
    Ok(json!({ "acknowledged": true, "id": id }).into())
}

async fn resolve_alert(
    State(state): State<SharedState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE alerts SET resolved = TRUE, acknowledged = TRUE, resolved_by = $2, resolved_at = NOW() WHERE id = $1")
        .bind(id)
        .bind(&user.user_id)
        .execute(&state.db)
        .await?;
    Ok(json!({ "resolved": true, "id": id }).into())
}

async fn acknowledge_all(
    State(state): State<SharedState>,
    user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("UPDATE alerts SET acknowledged = TRUE, acknowledged_by = $1, acknowledged_at = NOW() WHERE acknowledged = FALSE AND resolved = FALSE")
        .bind(&user.user_id)
        .execute(&state.db)
        .await?;
    Ok(json!({ "acknowledged_count": result.rows_affected() }).into())
}

async fn list_rules(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let rules = sqlx::query("SELECT * FROM notification_rules ORDER BY created_at DESC")
        .fetch_all(&state.db)
        .await?;
    Ok(json!({ "rules": rows_to_json(&rules) }).into())
}

#[derive(Deserialize)]
struct CreateRuleRequest {
    name: String,
    events: Vec<String>,
    channels: Vec<String>,
    target: String,
    enabled: Option<bool>,
}

async fn create_rule(
    State(state): State<SharedState>,
    _user: AuthUser,
    Json(req): Json<CreateRuleRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let rule_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO notification_rules (id, name, events, channels, target, enabled)
         VALUES ($1, $2, $3, $4, $5, $6)"
    )
    .bind(rule_id)
    .bind(&req.name)
    .bind(&req.events)
    .bind(&req.channels)
    .bind(&req.target)
    .bind(req.enabled.unwrap_or(true))
    .execute(&state.db)
    .await?;
    Ok(json!({ "id": rule_id, "name": req.name }).into())
}

#[derive(Deserialize)]
struct UpdateRuleRequest {
    name: Option<String>,
    enabled: Option<bool>,
    events: Option<Vec<String>>,
    channels: Option<Vec<String>>,
    target: Option<String>,
}

async fn update_rule(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateRuleRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        "UPDATE notification_rules SET
            name = COALESCE($1, name),
            enabled = COALESCE($2, enabled),
            events = COALESCE($3, events),
            channels = COALESCE($4, channels),
            target = COALESCE($5, target),
            updated_at = NOW()
         WHERE id = $6"
    )
    .bind(&req.name)
    .bind(req.enabled)
    .bind(&req.events)
    .bind(&req.channels)
    .bind(&req.target)
    .bind(id)
    .execute(&state.db)
    .await?;
    Ok(json!({ "updated": true, "id": id }).into())
}
