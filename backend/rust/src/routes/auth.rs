// Authentication routes: /api/auth/*
// - POST /login          — verify credentials, return session_token (pending 2FA) or access_token
// - POST /verify-2fa     — verify TOTP code, return access_token
// - POST /register       — create new user
// - POST /logout         — revoke session
// - GET  /me             — current user info
// - POST /2fa/setup      — generate TOTP secret + QR URL
// - POST /2fa/enable     — verify code and enable 2FA
// - POST /2fa/disable    — disable 2FA

use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    error::AppError,
    middleware::auth::AuthUser,
    models::*,
    services::{auth::AuthService, state::SharedState},
};

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/auth/login", post(login))
        .route("/api/auth/register", post(register))
        .route("/api/auth/verify-2fa", post(verify_2fa))
        .route("/api/auth/logout", post(logout))
        .route("/api/auth/me", get(me))
        .route("/api/auth/2fa/setup", post(setup_2fa))
        .route("/api/auth/2fa/enable", post(enable_2fa))
        .route("/api/auth/2fa/disable", post(disable_2fa))
        .route("/api/auth/github", get(github_oauth))
        .route("/api/auth/github/callback", get(github_callback))
}

async fn login(
    State(state): State<SharedState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(&req.email)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid email or password".into()))?;

    let auth = AuthService::new(
        state.config.jwt_secret.clone(),
        state.config.jwt_expiration_hours,
        state.config.refresh_token_expiration_days,
        state.config.totp_issuer.clone(),
    );

    // Verify password
    if let Some(hash) = &user.password_hash {
        if !auth.verify_password(&req.password, hash)? {
            return Err(AppError::Unauthorized("Invalid email or password".into()));
        }
    }

    // If 2FA is enabled, return session_token pending 2FA
    if user.totp_enabled {
        let session_token = Uuid::new_v4().to_string();
        // Store temporarily (in production: Redis with 5-minute TTL)
        sqlx::query("INSERT INTO pending_2fa (token, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')")
            .bind(&session_token)
            .bind(user.id)
            .execute(&state.db)
            .await?;

        return Ok(Json(LoginResponse {
            requires_2fa: true,
            session_token: Some(session_token),
            access_token: None,
            user: None,
        }));
    }

    // No 2FA — issue access token
    let session_id = Uuid::new_v4().to_string();
    let token = auth.issue_token(&user.id.to_string(), &user.email, &user.role, &session_id)?;

    // Create session record
    sqlx::query("INSERT INTO sessions (id, user_id, device, browser, os, ip, expires_at) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 days')")
        .bind(Uuid::parse_str(&session_id).unwrap_or_else(|_| Uuid::new_v4()))
        .bind(user.id)
        .bind("Unknown")
        .bind("Unknown")
        .bind("Unknown")
        .bind("0.0.0.0")
        .execute(&state.db)
        .await?;

    Ok(Json(LoginResponse {
        requires_2fa: false,
        session_token: None,
        access_token: Some(token),
        user: Some(user.into()),
    }))
}

async fn verify_2fa(
    State(state): State<SharedState>,
    Json(req): Json<Verify2faRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let pending: Option<(Uuid,)> = sqlx::query_as("SELECT user_id FROM pending_2fa WHERE token = $1 AND expires_at > NOW()")
        .bind(&req.session_token)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid or expired session".into()))
        .and_then(|o| Ok(Some(o)));

    let pending = match pending {
        Ok(Some(p)) => p,
        _ => return Err(AppError::Unauthorized("Invalid or expired session".into())),
    };

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(pending.0)
        .fetch_one(&state.db)
        .await?;

    let auth = AuthService::new(
        state.config.jwt_secret.clone(),
        state.config.jwt_expiration_hours,
        state.config.refresh_token_expiration_days,
        state.config.totp_issuer.clone(),
    );

    let secret = user.totp_secret.ok_or_else(|| AppError::Internal("2FA not configured".into()))?;
    if !auth.verify_totp(&secret, &user.email, &req.code)? {
        return Err(AppError::Unauthorized("Invalid verification code".into()));
    }

    // Delete pending 2FA
    sqlx::query("DELETE FROM pending_2fa WHERE token = $1")
        .bind(&req.session_token)
        .execute(&state.db)
        .await?;

    // Issue access token
    let session_id = Uuid::new_v4().to_string();
    let token = auth.issue_token(&user.id.to_string(), &user.email, &user.role, &session_id)?;

    Ok(Json(LoginResponse {
        requires_2fa: false,
        session_token: None,
        access_token: Some(token),
        user: Some(user.into()),
    }))
}

async fn register(
    State(state): State<SharedState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let auth = AuthService::new(
        state.config.jwt_secret.clone(),
        state.config.jwt_expiration_hours,
        state.config.refresh_token_expiration_days,
        state.config.totp_issuer.clone(),
    );

    let password_hash = auth.hash_password(&req.password)?;
    let user_id = Uuid::new_v4();
    let name = req.email.split('@').next().unwrap_or("User").to_string();

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, 'owner') RETURNING *"
    )
    .bind(user_id)
    .bind(&req.email)
    .bind(&name)
    .bind(&password_hash)
    .fetch_one(&state.db)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref de) if de.is_unique_violation() => {
            AppError::Conflict("Email already registered".into())
        }
        _ => AppError::Database(e),
    })?;

    let session_id = Uuid::new_v4().to_string();
    let token = auth.issue_token(&user.id.to_string(), &user.email, &user.role, &session_id)?;

    Ok(Json(LoginResponse {
        requires_2fa: false,
        session_token: None,
        access_token: Some(token),
        user: Some(user.into()),
    }))
}

async fn logout(
    State(state): State<SharedState>,
    user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    if let Ok(session_uuid) = Uuid::parse_str(&user.session_id) {
        sqlx::query("DELETE FROM sessions WHERE id = $1")
            .bind(session_uuid)
            .execute(&state.db)
            .await?;
    }
    Ok(Json(json!({ "success": true })))
}

async fn me(
    State(state): State<SharedState>,
    user: AuthUser,
) -> Result<Json<UserResponse>, AppError> {
    let user_uuid = Uuid::parse_str(&user.user_id)
        .map_err(|_| AppError::Unauthorized("Invalid user id".into()))?;

    let db_user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_uuid)
        .fetch_one(&state.db)
        .await?;

    Ok(Json(db_user.into()))
}

async fn setup_2fa(
    State(state): State<SharedState>,
    user: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let auth = AuthService::new(
        state.config.jwt_secret.clone(),
        state.config.jwt_expiration_hours,
        state.config.refresh_token_expiration_days,
        state.config.totp_issuer.clone(),
    );

    let secret = auth.generate_totp_secret();
    let user_uuid = Uuid::parse_str(&user.user_id)
        .map_err(|_| AppError::Unauthorized("Invalid user id".into()))?;

    let qr_url = auth.totp_qr_url(&secret, &user.email)?;

    // Store secret temporarily (not enabled until verified)
    sqlx::query("UPDATE users SET totp_secret = $1 WHERE id = $2")
        .bind(&secret)
        .bind(user_uuid)
        .execute(&state.db)
        .await?;

    let backup_codes = auth.generate_backup_codes();

    Ok(Json(json!({
        "secret": secret,
        "qr_url": qr_url,
        "backup_codes": backup_codes,
    })))
}

async fn enable_2fa(
    State(state): State<SharedState>,
    user: AuthUser,
    Json(req): Json<Verify2faRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let auth = AuthService::new(
        state.config.jwt_secret.clone(),
        state.config.jwt_expiration_hours,
        state.config.refresh_token_expiration_days,
        state.config.totp_issuer.clone(),
    );

    let user_uuid = Uuid::parse_str(&user.user_id)
        .map_err(|_| AppError::Unauthorized("Invalid user id".into()))?;

    let db_user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_uuid)
        .fetch_one(&state.db)
        .await?;

    let secret = db_user.totp_secret.ok_or_else(|| AppError::BadRequest("2FA setup not initiated".into()))?;

    if !auth.verify_totp(&secret, &db_user.email, &req.code)? {
        return Err(AppError::Unauthorized("Invalid verification code".into()));
    }

    let backup_codes = auth.generate_backup_codes();

    sqlx::query("UPDATE users SET totp_enabled = TRUE, backup_codes = $1 WHERE id = $2")
        .bind(&backup_codes)
        .bind(user_uuid)
        .execute(&state.db)
        .await?;

    Ok(Json(json!({ "enabled": true, "backup_codes": backup_codes })))
}

async fn disable_2fa(
    State(state): State<SharedState>,
    user: AuthUser,
    Json(req): Json<Verify2faRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let auth = AuthService::new(
        state.config.jwt_secret.clone(),
        state.config.jwt_expiration_hours,
        state.config.refresh_token_expiration_days,
        state.config.totp_issuer.clone(),
    );

    let user_uuid = Uuid::parse_str(&user.user_id)
        .map_err(|_| AppError::Unauthorized("Invalid user id".into()))?;

    let db_user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_uuid)
        .fetch_one(&state.db)
        .await?;

    let secret = db_user.totp_secret.ok_or_else(|| AppError::BadRequest("2FA not configured".into()))?;

    if !auth.verify_totp(&secret, &db_user.email, &req.code)? {
        return Err(AppError::Unauthorized("Invalid verification code".into()));
    }

    sqlx::query("UPDATE users SET totp_enabled = FALSE, totp_secret = NULL, backup_codes = NULL WHERE id = $1")
        .bind(user_uuid)
        .execute(&state.db)
        .await?;

    Ok(Json(json!({ "disabled": true })))
}

async fn github_oauth() -> Result<Json<serde_json::Value>, AppError> {
    // Redirect to GitHub OAuth — handled by the frontend
    Ok(Json(json!({ "message": "Use the GitHub OAuth URL" })))
}

async fn github_callback(
    State(state): State<SharedState>,
    axum::extract::Query(params): axum::extract::Query<serde_json::Value>,
) -> Result<Json<LoginResponse>, AppError> {
    let code = params.get("code").and_then(|v| v.as_str())
        .ok_or_else(|| AppError::BadRequest("Missing code".into()))?;

    let token = state.github.exchange_code(code).await?;
    let gh_user = state.github.get_user(&token).await?;

    // Find or create user
    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (id, email, name, avatar_url, role, github_id, github_token)
         VALUES ($1, $2, $3, $4, 'owner', $5, $6)
         ON CONFLICT (github_id) DO UPDATE SET github_token = $6 RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(gh_user.email.clone().unwrap_or_default())
    .bind(gh_user.name.unwrap_or_else(|| gh_user.login.clone()))
    .bind(gh_user.avatar_url)
    .bind(gh_user.id)
    .bind(&token)
    .fetch_one(&state.db)
    .await?;

    let auth = AuthService::new(
        state.config.jwt_secret.clone(),
        state.config.jwt_expiration_hours,
        state.config.refresh_token_expiration_days,
        state.config.totp_issuer.clone(),
    );

    let session_id = Uuid::new_v4().to_string();
    let access_token = auth.issue_token(&user.id.to_string(), &user.email, &user.role, &session_id)?;

    Ok(Json(LoginResponse {
        requires_2fa: false,
        session_token: None,
        access_token: Some(access_token),
        user: Some(user.into()),
    }))
}
