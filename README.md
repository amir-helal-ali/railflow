# 🚀 Railflow — Professional Deployment Platform

> **Deploy. Scale. Control.** — A self-hostable PaaS that combines the power of Railway, Vercel, Datadog, and Sentry in one platform. Built with Rust + Next.js + Docker.

[![CI](https://github.com/railflow/railflow/actions/workflows/ci.yml/badge.svg)](https://github.com/railflow/railflow/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Rust](https://img.shields.io/badge/Rust-1.82-orange.svg)](https://rust-lang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Development](#development)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [License](#license)

---

## 📖 Overview

Railflow is a comprehensive, self-hostable Platform-as-a-Service that lets you deploy GitHub repositories to production via Docker in seconds. It features a real-time monitoring dashboard, JWT + 2FA authentication, deep Docker integration, multi-region edge deployment, CI/CD pipelines, and a Rust-powered backend designed for speed and minimal resource consumption.

The platform ships with **31 pages** covering deployment, monitoring, security, performance, CI/CD, cost analytics, team management, and integrations — all wrapped in a bilingual (Arabic/English) Dark Premium UI with full RTL support.

---

## ✨ Features

### Core Platform
- **GitHub Integration** — OAuth login, one-click repo import, auto-deploy on push, preview deployments for PRs
- **Docker-Native** — Real `/var/run/docker.sock` integration via `bollard`; build, run, stop, restart, remove containers
- **Multi-Stage Pipeline** — `queued → cloning → building → pushing → starting → health → done` with live status
- **Environment Variables** — Per-project, with secret & sensitive flags, bulk import support
- **Custom Domains** — Multiple domains per project, automatic TLS via Caddy
- **Managed Databases** — PostgreSQL, MySQL, Redis, MongoDB, MariaDB with automated backups
- **Docker Volumes & Networks** — Full management with pruning, isolation, and topology visualization
- **Team & RBAC** — Owner/Admin/Developer/Viewer roles with email invitations
- **Activity Audit Log** — Every action tracked with actor, resource, IP, and metadata
- **Backup System** — Automatic, manual, and pre-deploy backups with S3 storage and retention
- **SSL Certificates** — Let's Encrypt auto-issue, wildcard, custom imports, with auto-renewal

### Advanced Features
- **CI/CD Pipeline Builder** — Visual pipeline editor with stages, conditions, retries, and failure handling
- **Marketplace** — 12 production-ready templates (Next.js, Rust, Astro, Go, Python, ML, etc.) with one-click deploy
- **Multi-Region & Edge** — Deploy across 7 regions with CDN, edge cache, and custom routing rules
- **Log Aggregation** — Real-time streaming logs from all containers with filters and saved streams
- **Security Center** — Vulnerability scanning, firewall rules, CVSS scoring, and security posture scoring
- **Performance Analytics** — Lighthouse scores, Core Web Vitals, 30-day trends
- **Metrics Explorer** — Prometheus-style metric browser with 18+ metrics and saved dashboards
- **API Health Monitoring** — Uptime checks across regions with p95/p99 latency tracking
- **Cost & Billing** — Usage breakdown, invoices, budget alerts, and payment management
- **Webhooks** — Outgoing webhooks with HMAC-SHA256 signatures, retries, and delivery history
- **Integrations** — 15 integrations (GitHub, Slack, Grafana, Sentry, Datadog, Stripe, Auth0, etc.)
- **Terminal/Exec** — Interactive shell access inside running containers
- **API Playground** — Interactive REST API tester with cURL export
- **Audit Search** — Advanced filtering with saved queries and CSV/JSON export
- **Help & Docs** — Built-in documentation with 8 articles and markdown rendering

### Security (Military-Grade)
- **JWT Authentication** — HS256 signed tokens, configurable expiration, session revocation
- **2FA / TOTP** — RFC 6238 compliant, supports Google Authenticator / Authy / 1Password
- **Argon2id Password Hashing** — Industry-standard memory-hard KDF
- **GitHub Webhook Verification** — HMAC-SHA256 signature verification
- **Security Headers** — CSP, HSTS, X-Frame-Options DENY via Caddy edge proxy
- **Rate Limiting** — Per-IP sliding window

### UI/UX
- **Dark Premium Design** — Deep void background with neon violet/cyan accents, glassmorphism
- **Bilingual** — Full Arabic (RTL) + English (LTR) with instant language switcher
- **Responsive** — Mobile-first with collapsible sidebar and mobile drawer
- **Live Updates** — Real-time charts, sparklines, animated gauges, pulsing indicators

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                       Browser (User)                            │
│  Next.js 16 App (Dark Premium UI, RTL/LTR, 31 pages)           │
└──────────────┬──────────────────────────────────┬──────────────┘
               │ HTTPS                            │ WSS
               ▼                                  ▼
┌────────────────────────────────────────────────────────────────┐
│                  Caddy Edge Proxy (:80, :443)                   │
│   Auto-TLS · Security Headers · Reverse Proxy · Compression     │
└──────────────┬──────────────────────────────────┬──────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   Next.js Frontend (:3000)    │  │   Rust Backend (axum :8080)   │
│   React 19 · Tailwind 4       │  │   axum · bollard · sqlx       │
│   shadcn/ui · Recharts        │  │   JWT · TOTP · Argon2         │
│   Zustand · TanStack Query    │  │   sysinfo · WebSocket         │
└──────────────────────────────┘  └──────┬───────────────────────┘
                                          │
                       ┌──────────────────┼──────────────────┐
                       ▼                  ▼                  ▼
              ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
              │  PostgreSQL 17  │  │  Redis 7.4      │  │  Docker Engine │
              │  (27 tables)    │  │  (cache + RL)   │  │  (containers)  │
              └────────────────┘  └────────────────┘  └────────────────┘
```

### Tech Stack

| Layer            | Technology                                                              |
|------------------|-------------------------------------------------------------------------|
| Frontend         | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Recharts |
| Backend          | Rust, axum 0.7, tokio, sqlx, bollard (Docker SDK), sysinfo              |
| Auth             | JWT (jsonwebtoken), Argon2id (argon2), TOTP (totp-rs)                   |
| Database         | PostgreSQL 17 (27 tables, 7 migrations)                                 |
| Cache            | Redis 7.4                                                               |
| Edge Proxy       | Caddy 2.8 (auto-TLS, security headers)                                  |
| Containerization | Docker, docker-compose                                                  |

---

## 🚀 Quick Start

### Option 1: Full Docker Deployment (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/railflow/railflow.git
cd railflow

# 2. Configure environment
cp .env.example .env
# Edit .env with your secrets (JWT_SECRET, GITHUB_CLIENT_ID, etc.)

# 3. Build & start all services
./scripts/deploy.sh build
./scripts/deploy.sh up

# 4. Verify
curl http://localhost:8080/api/health
open http://localhost
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Edge (Caddy)**: http://localhost (production entry point)

### Option 2: Development Mode

```bash
# Terminal 1: Database + Redis
docker compose up -d postgres redis

# Terminal 2: Rust backend
cd backend/rust
cargo run

# Terminal 3: Next.js frontend
bun install
bun run dev
```

### Option 3: Frontend Demo (no backend needed)

The frontend ships with mock data and works standalone:

```bash
bun install
bun run dev
# Open http://localhost:3000
```

---

## 🐳 Docker Deployment

### Prerequisites
- Docker 24+ with Docker Compose v2
- 2GB+ RAM available
- Domain name (for production TLS)

### Production Deployment

1. **Clone & configure:**
   ```bash
   git clone https://github.com/railflow/railflow.git
   cd railflow
   cp .env.example .env
   ```

2. **Edit `.env` with production secrets:**
   ```bash
   # Generate a secure JWT secret
   openssl rand -hex 32

   # Set your domain
   CORS_ORIGINS=https://your-domain.com

   # Set up GitHub OAuth
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

3. **Update `Caddyfile`** with your domain (uncomment the production block).

4. **Build and deploy:**
   ```bash
   ./scripts/deploy.sh build
   ./scripts/deploy.sh up
   ```

5. **Check status:**
   ```bash
   ./scripts/deploy.sh ps
   ./scripts/deploy.sh logs
   ```

### Deploy Script Commands

```bash
./scripts/deploy.sh build     # Build all Docker images
./scripts/deploy.sh up        # Start all services
./scripts/deploy.sh down      # Stop all services
./scripts/deploy.sh restart   # Restart all services
./scripts/deploy.sh logs [svc] # Tail logs (optionally one service)
./scripts/deploy.sh ps        # Show service status
./scripts/deploy.sh clean     # Remove ALL containers + volumes (destructive!)
```

---

## 💻 Development

### Frontend Development

```bash
bun install         # Install deps
bun run dev         # Dev server with hot reload
bun run lint        # ESLint
npx tsc --noEmit    # TypeScript check
bun run build       # Production build
```

### Backend Development

```bash
cd backend/rust
cargo build         # Compile
cargo run           # Run dev server
cargo test          # Run tests
cargo fmt           # Format code
cargo clippy        # Lint
```

### Database Migrations

Migrations run automatically on backend startup. To run manually:

```bash
cd backend/rust
sqlx migrate run --database-url "postgres://railflow:secret@localhost:5432/railflow"
```

---

## ⚙️ Configuration

All configuration is via environment variables. See [`.env.example`](.env.example) for the full list.

### Critical Secrets (CHANGE IN PRODUCTION)

| Variable                  | Description                                      |
|---------------------------|--------------------------------------------------|
| `JWT_SECRET`              | 256-bit hex string for JWT signing               |
| `POSTGRES_PASSWORD`       | Database password                                |
| `GITHUB_CLIENT_ID`        | GitHub OAuth app client ID                       |
| `GITHUB_CLIENT_SECRET`    | GitHub OAuth app client secret                   |
| `GITHUB_WEBHOOK_SECRET`   | Random secret for webhook signature verification |

### GitHub OAuth Setup

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Set Homepage URL: `https://your-domain.com`
3. Set Authorization callback URL: `https://your-domain.com/api/auth/github/callback`
4. Copy Client ID & Secret to `.env`

---

## 🔌 API Reference

### Authentication

```http
POST /api/auth/login          # Login (returns JWT or 2FA challenge)
POST /api/auth/verify-2fa     # Verify TOTP code
POST /api/auth/register       # Create account
GET  /api/auth/me             # Current user
POST /api/auth/2fa/setup      # Generate TOTP secret
POST /api/auth/2fa/enable     # Enable 2FA
```

### Projects

```http
GET    /api/projects          # List projects
POST   /api/projects          # Create project
GET    /api/projects/:id      # Get project
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
POST   /api/projects/:id/deploy  # Trigger deployment
```

### Containers (Docker)

```http
GET    /api/containers        # List containers
POST   /api/containers/:id/start   # Start
POST   /api/containers/:id/stop    # Stop
POST   /api/containers/:id/restart # Restart
POST   /api/containers/:id/exec    # Execute command
```

### Pipelines (CI/CD)

```http
GET    /api/pipelines         # List pipelines
POST   /api/pipelines         # Create pipeline
POST   /api/pipelines/:id/run # Run pipeline
POST   /api/pipelines/:id/stages  # Add stage
```

### Security

```http
GET    /api/security/findings     # List findings
POST   /api/security/findings/:id/acknowledge
POST   /api/security/findings/:id/resolve
GET    /api/security/firewall     # List firewall rules
POST   /api/security/scans        # Run security scan
GET    /api/security/score        # Security score
```

### WebSocket Endpoints (Real-time)

```
WS /api/ws/stats/:container_id   # Container stats (1Hz)
WS /api/ws/events                # Docker events stream
WS /api/ws/logs/:container_id    # Live log tail
WS /api/ws/server                # Host metrics
WS /api/ws/exec/:container_id    # Interactive terminal
```

**Full API**: 16 routers, 80+ endpoints across auth, projects, deployments, containers, databases, environments, pipelines, webhooks, alerts, security, marketplace, and more.

---

## 📁 Project Structure

```
railflow/
├── src/                          # Next.js frontend (33 views, ~14,500 lines)
│   ├── app/                      # App Router (layout, page, globals.css)
│   ├── components/
│   │   ├── dashboard/            # AppShell, Sidebar, Topbar, shared
│   │   ├── charts/               # Recharts wrappers
│   │   ├── views/                # 33 page-level views
│   │   └── ui/                   # shadcn/ui components
│   └── lib/                      # i18n, types, mock-data, router, format
│
├── backend/rust/                 # Rust backend (~5,000 lines)
│   ├── src/
│   │   ├── main.rs              # Server bootstrap
│   │   ├── routes/              # 16 route modules
│   │   ├── services/            # auth, docker, deploy, github, etc.
│   │   ├── models/              # DB models + DTOs
│   │   └── middleware/          # JWT auth + rate limit
│   ├── migrations/              # 7 SQL migrations (27 tables)
│   ├── Cargo.toml
│   └── Dockerfile
│
├── scripts/
│   ├── deploy.sh                # Docker build/deploy script
│   └── audit-pages.sh           # Page audit script
│
├── .github/workflows/ci.yml     # CI: lint + typecheck + build + docker
├── docker-compose.yml           # Full stack (postgres + redis + backend + frontend + caddy)
├── Dockerfile.frontend          # Next.js multi-stage build
├── Caddyfile                    # Edge proxy config
├── .env.example                 # Environment template
├── .gitignore
├── .dockerignore
├── LICENSE
└── README.md
```

---

## 📊 Statistics

| Metric                    | Value          |
|---------------------------|----------------|
| Frontend views            | 33 pages       |
| Frontend code             | ~14,500 lines  |
| Sidebar navigation items  | 31             |
| Translation keys          | ~870 per language |
| Rust source files         | 30             |
| Rust code                 | ~5,000 lines   |
| API routers               | 16             |
| API endpoints             | 80+            |
| Database tables           | 27             |
| SQL migrations            | 7              |
| WebSocket endpoints       | 5              |

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

## 🙏 Acknowledgments

- Built with [Rust](https://rust-lang.org), [axum](https://github.com/tokio-rs/axum), [bollard](https://github.com/fussybeaver/bollard)
- Frontend powered by [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com)
- Inspired by [Railway](https://railway.app), [Fly.io](https://fly.io), [Vercel](https://vercel.com), [Datadog](https://datadoghq.com), [Sentry](https://sentry.io)

---

<p align="center">Built with ❤️ for developers who want control, speed, and security.</p>
