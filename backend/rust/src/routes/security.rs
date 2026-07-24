// Security center routes: /api/security/*
// Vulnerability scanning, firewall rules, security findings.

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
        .route("/api/security/findings", get(list_findings))
        .route("/api/security/findings/:id", get(get_finding).put(update_finding))
        .route("/api/security/findings/:id/acknowledge", post(acknowledge_finding))
        .route("/api/security/findings/:id/resolve", post(resolve_finding))
        .route("/api/security/scans", get(list_scans).post(run_scan))
        .route("/api/security/scans/:id", get(get_scan))
        .route("/api/security/firewall", get(list_firewall_rules).post(create_firewall_rule))
        .route("/api/security/firewall/:id", put(update_firewall_rule))
        .route("/api/security/score", get(get_security_score))
}

#[derive(Deserialize)]
struct FindingsQuery {
    severity: Option<String>,
    status: Option<String>,
    category: Option<String>,
}

async fn list_findings(
    State(state): State<SharedState>,
    _user: AuthUser,
    Query(q): Query<FindingsQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let findings = sqlx::query(
        "SELECT * FROM security_findings WHERE 1=1
         AND ($1::text IS NULL OR severity = $1)
         AND ($2::text IS NULL OR status = $2)
         AND ($3::text IS NULL OR category = $3)
         ORDER BY
            CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
            detected_at DESC"
    )
    .bind(q.severity)
    .bind(q.status)
    .bind(q.category)
    .fetch_all(&state.db)
    .await?;
    Ok(json!({ "findings": rows_to_json(&findings) }).into())
}

async fn get_finding(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let finding = sqlx::query("SELECT * FROM security_findings WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Finding not found".into()))?;
    Ok(Json(crate::services::db_json::row_to_json(&finding)))
}

async fn update_finding(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE security_findings SET status = $1, updated_at = NOW() WHERE id = $2")
        .bind(req.get("status").and_then(|v| v.as_str()))
        .bind(id)
        .execute(&state.db)
        .await?;
    Ok(json!({ "updated": true, "id": id }).into())
}

async fn acknowledge_finding(
    State(state): State<SharedState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE security_findings SET status = 'acknowledged', acknowledged_by = $2, acknowledged_at = NOW() WHERE id = $1")
        .bind(id)
        .bind(&user.user_id)
        .execute(&state.db)
        .await?;
    Ok(json!({ "acknowledged": true, "id": id }).into())
}

async fn resolve_finding(
    State(state): State<SharedState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE security_findings SET status = 'resolved', resolved_by = $2, resolved_at = NOW() WHERE id = $1")
        .bind(id)
        .bind(&user.user_id)
        .execute(&state.db)
        .await?;
    Ok(json!({ "resolved": true, "id": id }).into())
}

async fn list_scans(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let scans = sqlx::query("SELECT * FROM security_scans ORDER BY started_at DESC LIMIT 50")
        .fetch_all(&state.db)
        .await?;
    Ok(json!({ "scans": rows_to_json(&scans) }).into())
}

#[derive(Deserialize)]
struct RunScanRequest {
    scan_type: String, // container | dependency | code | network
    target: Option<String>,
}

async fn run_scan(
    State(state): State<SharedState>,
    _user: AuthUser,
    Json(req): Json<RunScanRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let scan_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO security_scans (id, scan_type, target, status, started_at)
         VALUES ($1, $2, $3, 'running', NOW())"
    )
    .bind(scan_id)
    .bind(&req.scan_type)
    .bind(&req.target)
    .execute(&state.db)
    .await?;

    // Spawn the scan (async)
    let state_clone = state.clone();
    let scan_type = req.scan_type;
    tokio::spawn(async move {
        if let Err(e) = run_security_scan(&state_clone, scan_id, &scan_type).await {
            tracing::error!("Security scan {scan_id} failed: {e}");
        }
    });

    Ok(json!({ "scan_id": scan_id, "status": "running" }).into())
}

async fn get_scan(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let scan = sqlx::query("SELECT * FROM security_scans WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Scan not found".into()))?;
    Ok(Json(crate::services::db_json::row_to_json(&scan)))
}

async fn list_firewall_rules(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let rules = sqlx::query("SELECT * FROM firewall_rules ORDER BY priority ASC, created_at DESC")
        .fetch_all(&state.db)
        .await?;
    Ok(json!({ "rules": rows_to_json(&rules) }).into())
}

#[derive(Deserialize)]
struct CreateFirewallRuleRequest {
    action: String,
    protocol: String,
    source: String,
    destination: String,
    port: String,
    description: String,
    priority: i32,
    enabled: Option<bool>,
}

async fn create_firewall_rule(
    State(state): State<SharedState>,
    _user: AuthUser,
    Json(req): Json<CreateFirewallRuleRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO firewall_rules (id, action, protocol, source, destination, port, description, priority, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)"
    )
    .bind(id)
    .bind(&req.action)
    .bind(&req.protocol)
    .bind(&req.source)
    .bind(&req.destination)
    .bind(&req.port)
    .bind(&req.description)
    .bind(req.priority)
    .bind(req.enabled.unwrap_or(true))
    .execute(&state.db)
    .await?;
    Ok(json!({ "id": id }).into())
}

async fn update_firewall_rule(
    State(state): State<SharedState>,
    _user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        "UPDATE firewall_rules SET
            action = COALESCE($1, action),
            enabled = COALESCE($2, enabled),
            priority = COALESCE($3, priority),
            updated_at = NOW()
         WHERE id = $4"
    )
    .bind(req.get("action").and_then(|v| v.as_str()))
    .bind(req.get("enabled").and_then(|v| v.as_bool()))
    .bind(req.get("priority").and_then(|v| v.as_i64()))
    .bind(id)
    .execute(&state.db)
    .await?;
    Ok(json!({ "updated": true, "id": id }).into())
}

async fn get_security_score(
    State(state): State<SharedState>,
    _user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let critical: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM security_findings WHERE severity = 'critical' AND status = 'open'")
        .fetch_one(&state.db).await?;
    let high: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM security_findings WHERE severity = 'high' AND status = 'open'")
        .fetch_one(&state.db).await?;
    let medium: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM security_findings WHERE severity = 'medium' AND status = 'open'")
        .fetch_one(&state.db).await?;
    let low: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM security_findings WHERE severity = 'low' AND status = 'open'")
        .fetch_one(&state.db).await?;

    let score = std::cmp::max(0, 100 - (critical * 20) as i64 - (high * 10) as i64 - (medium * 5) as i64 - (low * 1) as i64);

    Ok(json!({
        "score": score,
        "open_findings": { "critical": critical, "high": high, "medium": medium, "low": low },
        "grade": if score >= 90 { "A" } else if score >= 80 { "B" } else if score >= 70 { "C" } else if score >= 60 { "D" } else { "F" }
    }).into())
}

async fn run_security_scan(state: &SharedState, scan_id: Uuid, scan_type: &str) -> Result<(), AppError> {
    tracing::info!("Starting security scan {scan_id} (type: {scan_type})");

    // Simulate scan execution
    tokio::time::sleep(std::time::Duration::from_secs(5)).await;

    // In production: run Trivy/grype/snyk for containers, npm audit/cargo audit for deps,
    // Semgrep for code, nmap for network. Insert findings as they're discovered.

    sqlx::query("UPDATE security_scans SET status = 'completed', finished_at = NOW() WHERE id = $1")
        .bind(scan_id)
        .execute(&state.db)
        .await?;

    tracing::info!("Security scan {scan_id} completed");
    Ok(())
}
