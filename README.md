# Railflow — Professional Deployment Platform

> **Deploy. Scale. Control.** — A Railway-inspired control plane powered by Rust + Docker + Next.js, with bilingual (Arabic/English) RTL support and a Dark Premium UI.

Railflow is a self-hostable PaaS that lets you deploy GitHub repositories to production via Docker in seconds. It ships with a real-time monitoring dashboard, JWT + 2FA authentication, deep Docker integration, and a Rust-powered backend designed for speed and minimal resource consumption.

---

## ✨ Features

### Core Platform
- **GitHub Integration** — OAuth login, one-click repo import, auto-deploy on push, preview deployments for PRs
- **Docker-Native** — Real `/var/run/docker.sock` integration via `bollard`; build, run, stop, restart, remove containers
- **Multi-Stage Pipeline** — `queued → cloning → building → pushing → starting → health → done` with live status
- **Environment Variables** — Per-project, with secret & sensitive flags, bulk import support
- **Custom Domains** — Multiple domains per project, automatic TLS via Caddy

### Security (military-grade)
- **JWT Authentication** — HS256 signed tokens, configurable expiration, session revocation
- **2FA / TOTP** — RFC 6238 compliant, supports Google Authenticator / Authy / 1Password, backup codes
- **Argon2id Password Hashing** — Industry-standard memory-hard KDF
- **GitHub Webhook Verification** — HMAC-SHA256 signature verification
- **Security Headers** — CSP, HSTS, X-Frame-Options DENY, nosniff via Caddy edge proxy
- **Rate Limiting** — Per-IP sliding window (Redis-backed in production)

### Monitoring (real-time)
- **Server Metrics** — CPU per-core, memory (used/cached/swap), disk partitions, network interfaces
- **Process Inspection** — Top processes by CPU/memory with full command lines
- **Container Stats** — Live CPU%, memory, network I/O, block I/O, PIDs per container
- **Docker Events** — Real-time stream of container lifecycle events
- **Live Logs** — Tail container logs via WebSocket, with filtering & auto-scroll
- **Health Scores** — Composite uptime & incident tracking (30-day window)

### UI/UX
- **Dark Premium Design** — Deep void background with neon violet/cyan accents, glassmorphism cards, gradient borders
- **Bilingual** — Full Arabic (RTL) + English (LTR) with instant language switcher
- **Responsive** — Mobile-first design with collapsible sidebar, mobile drawer
- **Live Updates** — Sparklines, animated gauges, pulsing status indicators, real-time charts

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                       Browser (User)                            │
│  Next.js 16 App (Dark Premium UI, RTL/LTR, WebSocket client)   │
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
              │  (data store)   │  │  (cache + RL)   │  │  (/var/run/    │
              │                  │  │                  │  │   docker.sock) │
              └────────────────┘  └────────────────┘  └────────────────┘
```

### Tech Stack

| Layer            | Technology                                                              |
|------------------|-------------------------------------------------------------------------|
| Frontend         | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Recharts |
| Backend          | Rust, axum 0.7, tokio, sqlx, bollard (Docker SDK), sysinfo              |
| Auth             | JWT (jsonwebtoken), Argon2id (argon2), TOTP (totp-rs)                   |
| Database         | PostgreSQL 17                                                           |
| Cache            | Redis 7.4                                                               |
| Edge Proxy       | Caddy 2.8 (auto-TLS, security headers)                                  |
| Containerization | Docker, docker-compose                                                  |

---

## 📁 Project Structure

```
.
├── src/                              # Next.js frontend
│   ├── app/                          # App Router
│   │   ├── layout.tsx                # Root layout (RTL, i18n provider)
│   │   ├── page.tsx                  # Single visible route (sandbox rule)
│   │   └── globals.css               # Dark Premium design tokens
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AppShell.tsx          # Main layout shell
│   │   │   ├── Sidebar.tsx           # Collapsible nav with groups
│   │   │   ├── Topbar.tsx            # Search, notifications, user menu
│   │   │   └── shared.tsx            # StatusBadge, MetricCard, Sparkline
│   │   ├── charts/                   # Recharts wrappers (Area, Bar, Gauge)
│   │   ├── views/                    # Page-level views
│   │   │   ├── DashboardView.tsx
│   │   │   ├── ProjectsView.tsx
│   │   │   ├── ProjectDetailView.tsx
│   │   │   ├── ContainersView.tsx
│   │   │   ├── ServerView.tsx
│   │   │   ├── DeploymentsView.tsx
│   │   │   ├── SettingsView.tsx
│   │   │   └── LoginView.tsx
│   │   └── ui/                       # shadcn/ui components
│   └── lib/
│       ├── i18n.tsx                  # Bilingual dictionary + provider
│       ├── types.ts                  # Shared TypeScript types
│       ├── mock-data.ts              # Demo data (mirrors backend DTOs)
│       ├── router.tsx                # Client-side view router
│       └── format.ts                 # Formatters (uptime, bytes, time-ago)
│
├── backend/rust/                     # Rust backend
│   ├── src/
│   │   ├── main.rs                   # Entry point, axum server setup
│   │   ├── error/                    # AppError + IntoResponse
│   │   ├── middleware/auth.rs        # JWT extraction + rate limit
│   │   ├── models/                   # Database models + DTOs
│   │   ├── routes/
│   │   │   ├── auth.rs               # /api/auth/* (login, 2FA, OAuth)
│   │   │   ├── projects.rs           # /api/projects/*
│   │   │   ├── deployments.rs        # /api/deployments/*
│   │   │   ├── containers.rs         # /api/containers/*
│   │   │   ├── server.rs             # /api/server/*
│   │   │   ├── webhooks.rs           # /api/webhooks/github
│   │   │   └── ws.rs                 # /api/ws/* (WebSocket)
│   │   └── services/
│   │       ├── auth.rs               # JWT + Argon2 + TOTP
│   │       ├── config.rs             # Env-based configuration
│   │       ├── deploy.rs             # Pipeline orchestration
│   │       ├── docker.rs             # bollard wrapper
│   │       ├── github.rs             # OAuth + webhook signature
│   │       ├── server.rs             # sysinfo wrapper
│   │       └── state.rs              # SharedState
│   ├── migrations/                   # SQL migrations
│   ├── Cargo.toml
│   ├── Dockerfile                    # Multi-stage Rust build
│   └── .env.example
│
├── docker-compose.yml                # Full stack deployment
├── Dockerfile.frontend               # Multi-stage Next.js build
├── Caddyfile                         # Edge proxy config
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Option 1: Full Docker Deployment (Recommended)

```bash
# 1. Clone & configure
git clone <repo> railflow && cd railflow
cp backend/rust/.env.example backend/rust/.env
# Edit .env with your secrets (JWT_SECRET, GITHUB_CLIENT_ID, etc.)

# 2. Launch the full stack
docker compose up -d

# 3. Verify
curl http://localhost:8080/api/health
open http://localhost:3000
```

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

The frontend ships with mock data and works standalone for demo purposes:

```bash
bun install
bun run dev
# Open http://localhost:3000
```

---

## ⚙️ Configuration

All configuration is via environment variables. See `backend/rust/.env.example` for the full list.

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
POST /api/auth/login
  Body: { "email": "...", "password": "..." }
  Returns: { "requires_2fa": false, "access_token": "...", "user": {...} }
       OR { "requires_2fa": true, "session_token": "..." }

POST /api/auth/verify-2fa
  Body: { "session_token": "...", "code": "123456" }
  Returns: { "access_token": "...", "user": {...} }

GET  /api/auth/me
  Headers: Authorization: Bearer <token>
```

### Projects

```http
GET    /api/projects                       # List projects
POST   /api/projects                       # Create project
GET    /api/projects/:id                   # Get project
PUT    /api/projects/:id                   # Update project
DELETE /api/projects/:id                   # Delete project (stops container)
GET    /api/projects/:id/env               # List env vars
POST   /api/projects/:id/env               # Add env var
DELETE /api/projects/:id/env/:var_id       # Delete env var
POST   /api/projects/:id/deploy            # Trigger deployment
POST   /api/projects/:id/redeploy          # Redeploy last
GET    /api/projects/:id/logs              # Get log stream URL
```

### Containers (Docker)

```http
GET    /api/containers                     # List all containers
GET    /api/containers/:id                 # Inspect container
POST   /api/containers/:id/start           # Start container
POST   /api/containers/:id/stop            # Stop container (30s grace)
POST   /api/containers/:id/restart         # Restart container
POST   /api/containers/:id/remove          # Remove container (force)
GET    /api/containers/:id/stats           # One-shot stats
```

### Deployments

```http
GET    /api/deployments                    # List (filter: project_id, status)
GET    /api/deployments/:id                # Get deployment
POST   /api/deployments/:id/cancel         # Cancel running deployment
```

### Server Monitoring

```http
GET    /api/server/info                    # Full host metrics
GET    /api/server/processes?limit=20      # Top processes by CPU
```

### Webhooks

```http
POST   /api/webhooks/github                # Receives GitHub events (verified)
```

### WebSocket Endpoints (real-time)

```
WS /api/ws/stats/:container_id             # Container stats stream (1Hz)
WS /api/ws/events                          # Docker events stream
WS /api/ws/logs/:container_id              # Container logs (tail + follow)
WS /api/ws/server?interval_ms=2000         # Server metrics (2Hz)
```

---

## 🎨 Frontend Design System

The UI uses a **Dark Premium** design language:

- **Background**: `oklch(0.13 0.018 280)` — deep void with subtle violet tint
- **Cards**: Glassmorphism with `backdrop-blur(12px)` and 6% white border
- **Primary**: Neon violet `oklch(0.72 0.22 295)`
- **Accent**: Neon cyan `oklch(0.78 0.17 190)`
- **Status colors**: emerald (healthy), amber (degraded), rose (failed), sky (pending)
- **Effects**: Subtle gradient borders, pulsing status dots, animated sparklines, gradient text

### RTL Support
- Full RTL layout via `dir="rtl"` on `<html>`
- Logical CSS properties (`ps-`, `pe-`, `ms-`, `me-`) used throughout
- Arabic font stack with `font-arabic` token
- Switch language instantly from topbar (no reload)

---

## 🔁 Porting to elmoorx Framework

The frontend is architected to be portable to the [elmoorx](https://github.com/elmoorx0/elmoorx0) framework when it reaches stable v1.0. Here's the mapping:

| Concept                | Next.js (current)                  | elmoorx (target)                              |
|------------------------|------------------------------------|----------------------------------------------|
| Component              | React function component           | `island(() => ...)` for interactive parts    |
| State                  | `useState` / `useEffect`           | `$state` / `$effect` (signals)               |
| Global state           | Context + `useState`               | `$store(initial)` (deep reactive proxy)      |
| Routing                | File-based App Router              | File-based `src/*.elmoorx.tsx`               |
| Server rendering       | SSR by default                     | `renderToString` + `hydrateIslands`          |
| API calls              | `fetch` + TanStack Query           | `useFetch` / `useSWR` async hooks            |
| Security               | Manual CSP via Caddy               | Auto-CSP, sanitization, CSRF (built-in)      |
| Bundle size            | ~80KB (React + Next runtime)       | ~1.2KB (claimed — verify with benchmarks)    |

### Migration Steps (when elmoorx v1.0 ships)

1. **Convert pages to islands**: Wrap each `views/*.tsx` in `island()` — only interactive components ship JS
2. **Replace React hooks**: `useState` → `$state`, `useEffect` → `$effect`, `useMemo` → `$computed`
3. **Swap router**: Move `views/*.tsx` to `src/*.elmoorx.tsx` (file-based routing)
4. **Test security defaults**: Verify auto-CSP, auto-sanitization, CSRF tokens
5. **Measure bundle size**: Compare gzipped runtime vs. Next.js baseline

The TypeScript types in `src/lib/types.ts` and the mock data layer in `src/lib/mock-data.ts` are framework-agnostic — they'll port directly.

---

## 🛣️ Roadmap

- [ ] **v0.2**: Multi-tenant workspaces + RBAC (admin/developer/viewer roles)
- [ ] **v0.3**: Managed databases (Postgres/MySQL/Redis) with automated backups
- [ ] **v0.4**: Zero-downtime deploy (blue/green + canary)
- [ ] **v0.5**: Marketplace for templates (Next.js, Astro, Rust, Python…)
- [ ] **v0.6**: Visual CI/CD pipeline builder
- [ ] **v0.7**: elmoorx port (when stable v1.0 ships)
- [ ] **v1.0**: GA with SLA & official support

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

## 🙏 Acknowledgments

- Built with [Rust](https://rust-lang.org), [axum](https://github.com/tokio-rs/axum), [bollard](https://github.com/fussybeaver/bollard)
- Frontend powered by [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com)
- Inspired by [Railway](https://railway.app), [Fly.io](https://fly.io), and [Vercel](https://vercel.com)
