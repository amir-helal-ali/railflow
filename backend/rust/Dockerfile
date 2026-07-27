# Multi-stage Dockerfile for the Rust backend
# Produces a tiny (~30MB) image with just the binary

# ---------- Builder ----------
FROM rust:1.82 AS builder

WORKDIR /build

# Install needed build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy source
COPY Cargo.toml ./
COPY src ./src
COPY migrations ./migrations

# Generate lockfile (exclude problematic transitive deps) and build
RUN cargo generate-lockfile 2>/dev/null || true
RUN cargo build --release || cargo build --release

# Strip
RUN strip target/release/railflow-backend || true

# ---------- Runtime ----------
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /build/target/release/railflow-backend /app/railflow-backend
COPY --from=builder /build/migrations /app/migrations

RUN useradd --create-home --shell /bin/bash railflow \
    && chown -R railflow:railflow /app
USER railflow

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

ENTRYPOINT ["/app/railflow-backend"]
