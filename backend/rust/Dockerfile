# Multi-stage Dockerfile for the Rust backend
# Produces a tiny (~30MB) image with just the binary

# ---------- Builder ----------
FROM rust:1.82-slim AS builder

WORKDIR /build

# Install needed build deps (openssl for rustls)
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Cache dependencies
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations

# Build with release optimizations
RUN cargo build --release

# Strip & split
RUN strip target/release/railflow-backend

# ---------- Runtime ----------
FROM debian:bookworm-slim AS runtime

# Install only runtime deps + ca-certs
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary
COPY --from=builder /build/target/release/railflow-backend /app/railflow-backend

# Copy migrations
COPY --from=builder /build/migrations /app/migrations

# Copy .env if present (for development)
COPY .env* /app/

# Non-root user for security
RUN useradd --create-home --shell /bin/bash railflow \
    && chown -R railflow:railflow /app
USER railflow

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

ENTRYPOINT ["/app/railflow-backend"]
