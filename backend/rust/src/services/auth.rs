// Authentication service: JWT issuance + verification, password hashing,
// TOTP (RFC 6238) generation & verification.

use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, PasswordHasher as _, SaltString};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use totp_rs::{Algorithm, Secret, TOTP};

use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,         // user id
    pub email: String,
    pub role: String,
    pub exp: i64,
    pub iat: i64,
    pub session_id: String,
}

pub struct AuthService {
    jwt_secret: String,
    jwt_expiration_hours: i64,
    refresh_expiration_days: i64,
    totp_issuer: String,
}

impl AuthService {
    pub fn new(jwt_secret: String, jwt_expiration_hours: i64, refresh_expiration_days: i64, totp_issuer: String) -> Self {
        Self { jwt_secret, jwt_expiration_hours, refresh_expiration_days, totp_issuer }
    }

    /// Hash a password using Argon2id.
    pub fn hash_password(&self, password: &str) -> Result<String, AppError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon = Argon2::default();
        let hash = argon.hash_password(password.as_bytes(), &salt)
            .map_err(|e| AppError::Internal(format!("Hash error: {e}")))?;
        Ok(hash.to_string())
    }

    /// Verify a password against its hash.
    pub fn verify_password(&self, password: &str, hash: &str) -> Result<bool, AppError> {
        let parsed = PasswordHash::new(hash)
            .map_err(|e| AppError::Internal(format!("Hash parse error: {e}")))?;
        Ok(Argon2::default().verify_password(password.as_bytes(), &parsed).is_ok())
    }

    /// Issue a JWT for an authenticated user.
    pub fn issue_token(&self, user_id: &str, email: &str, role: &str, session_id: &str) -> Result<String, AppError> {
        let now = Utc::now();
        let exp = now + Duration::hours(self.jwt_expiration_hours);

        let claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            role: role.to_string(),
            exp: exp.timestamp(),
            iat: now.timestamp(),
            session_id: session_id.to_string(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|e| AppError::Internal(format!("JWT issue error: {e}")))
    }

    /// Verify a JWT and return claims.
    pub fn verify_token(&self, token: &str) -> Result<Claims, AppError> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_bytes()),
            &Validation::default(),
        )
        .map(|d| d.claims)
        .map_err(|e| AppError::Unauthorized(format!("Invalid token: {e}")))
    }

    /// Generate a new TOTP secret for a user (base32-encoded).
    pub fn generate_totp_secret(&self) -> String {
        Secret::generate_secret().to_string()
    }

    /// Build a TOTP instance from a secret.
    pub fn build_totp(&self, secret: &str, account_name: &str) -> Result<TOTP, AppError> {
        let secret_bytes = Secret::Encoded(secret.to_string())
            .to_bytes()
            .map_err(|e| AppError::Internal(format!("TOTP secret decode error: {e}")))?;

        TOTP::new(
            Algorithm::SHA1,
            6,
            1,
            30,
            secret_bytes,
            self.totp_issuer.clone(),
            account_name.to_string(),
        )
        .map_err(|e| AppError::Internal(format!("TOTP build error: {e}")))
    }

    /// Generate a QR code URL for the user to scan.
    pub fn totp_qr_url(&self, secret: &str, account_name: &str) -> Result<String, AppError> {
        let totp = self.build_totp(secret, account_name)?;
        Ok(totp.get_url())
    }

    /// Verify a TOTP code (allows ±1 step skew).
    pub fn verify_totp(&self, secret: &str, account_name: &str, code: &str) -> Result<bool, AppError> {
        let totp = self.build_totp(secret, account_name)?;
        Ok(totp.check_current(code).unwrap_or(false))
    }

    /// Generate 8 one-time backup codes.
    pub fn generate_backup_codes(&self) -> Vec<String> {
        (0..8)
            .map(|_| {
                let bytes: [u8; 4] = rand::random();
                format!("{:04}-{:04}", u16::from_be_bytes([bytes[0], bytes[1]]), u16::from_be_bytes([bytes[2], bytes[3]]))
            })
            .collect()
    }
}
