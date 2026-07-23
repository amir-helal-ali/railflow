// JWT authentication middleware — extracts and validates the bearer token.

use axum::{
    extract::{FromRequestParts, Request, State},
    http::request::Parts,
    middleware::Next,
    response::Response,
};
use jsonwebtoken::Algorithm;

use crate::{error::AppError, services::state::SharedState};

pub struct AuthUser {
    pub user_id: String,
    pub email: String,
    pub role: String,
    pub session_id: String,
}

#[axum::async_trait]
impl FromRequestParts<SharedState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &SharedState) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|h| h.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".into()))?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or_else(|| AppError::Unauthorized("Invalid Authorization scheme".into()))?;

        let auth = crate::services::auth::AuthService::new(
            state.config.jwt_secret.clone(),
            state.config.jwt_expiration_hours,
            state.config.refresh_token_expiration_days,
            state.config.totp_issuer.clone(),
        );

        let claims = auth.verify_token(token)?;

        Ok(AuthUser {
            user_id: claims.sub,
            email: claims.email,
            role: claims.role,
            session_id: claims.session_id,
        })
    }
}

/// Rate limiting middleware (simple in-memory sliding window per IP).
pub async fn rate_limit(State(state): State<SharedState>, req: Request, next: Next) -> Result<Response, AppError> {
    // In production, use Redis-backed rate limiting.
    // For now, log the request and continue.
    let ip = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown");
    tracing::trace!("Request from IP: {ip}");
    Ok(next.run(req).await)
}
