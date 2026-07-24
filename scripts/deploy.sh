#!/bin/bash
# ============================================================
# Railflow — Build & Deploy Script
# Usage:
#   ./deploy.sh build     — Build all Docker images
#   ./deploy.sh up        — Start all services
#   ./deploy.sh down      — Stop all services
#   ./deploy.sh logs      — Tail logs
#   ./deploy.sh restart   — Restart all services
#   ./deploy.sh migrate   — Run database migrations
#   ./deploy.sh clean     — Remove all containers + volumes
# ============================================================

set -e

COMPOSE="docker compose"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[railflow]${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; }

# Check .env
check_env() {
    if [ ! -f .env ]; then
        warn ".env not found. Copying from .env.example…"
        cp .env.example .env
        warn "Edit .env with your secrets, then re-run."
        exit 1
    fi
}

case "${1:-help}" in
    build)
        log "Building Docker images…"
        $COMPOSE build
        ok "Build complete."
        ;;

    up)
        check_env
        log "Starting Railflow…"
        $COMPOSE up -d
        ok "All services started."
        echo ""
        log "Services:"
        $COMPOSE ps
        echo ""
        ok "Frontend: http://localhost:3000"
        ok "Backend:  http://localhost:8080"
        ok "Edge:     http://localhost"
        ;;

    down)
        log "Stopping Railflow…"
        $COMPOSE down
        ok "Stopped."
        ;;

    logs)
        SVC="${2:-}"
        if [ -n "$SVC" ]; then
            $COMPOSE logs -f "$SVC"
        else
            $COMPOSE logs -f
        fi
        ;;

    restart)
        log "Restarting…"
        $COMPOSE restart
        ok "Restarted."
        ;;

    migrate)
        log "Running database migrations…"
        $COMPOSE exec backend /app/railflow-backend &
        warn "Migrations run automatically on backend startup."
        ;;

    ps)
        $COMPOSE ps
        ;;

    clean)
        warn "This will remove ALL containers, volumes, and data. Continue? (y/N)"
        read -r reply
        if [ "$reply" = "y" ] || [ "$reply" = "Y" ]; then
            $COMPOSE down -v --remove-orphans
            docker system prune -f --filter "label=com.docker.compose.project=railflow"
            ok "Cleaned."
        else
            log "Cancelled."
        fi
        ;;

    dev)
        log "Starting in development mode (frontend only, hot reload)…"
        bun run dev
        ;;

    help|*)
        cat <<EOF
${CYAN}Railflow Deployment Script${NC}

${GREEN}Usage:${NC} ./scripts/deploy.sh <command>

${GREEN}Commands:${NC}
  ${CYAN}build${NC}     Build all Docker images
  ${CYAN}up${NC}        Start all services (postgres, redis, backend, frontend, caddy)
  ${CYAN}down${NC}      Stop all services
  ${CYAN}restart${NC}   Restart all services
  ${CYAN}logs${NC}      Tail logs (optionally: logs backend)
  ${CYAN}migrate${NC}   Run database migrations
  ${CYAN}ps${NC}        Show service status
  ${CYAN}clean${NC}     Remove ALL containers + volumes (destructive!)
  ${CYAN}dev${NC}       Run frontend in dev mode (hot reload)

${GREEN}Quick start:${NC}
  cp .env.example .env
  # edit .env with your secrets
  ./scripts/deploy.sh build
  ./scripts/deploy.sh up
EOF
        ;;
esac
