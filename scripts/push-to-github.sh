#!/bin/bash
# ============================================================
# Railflow — GitHub Repository Setup & Push Script
#
# This script prepares the repo and pushes to GitHub.
# You need either:
#   1. GitHub CLI (gh) installed and authenticated, OR
#   2. A GitHub Personal Access Token (PAT) with repo scope
#
# Usage:
#   ./scripts/push-to-github.sh                    # Interactive
#   ./scripts/push-to-github.sh <github-url>       # With existing repo URL
#   ./scripts/push-to-github.sh <user> <repo>      # Create new repo
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[railflow]${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; }

# ---- Method 1: GitHub CLI ----
use_gh_cli() {
    if ! command -v gh &>/dev/null; then
        return 1
    fi
    if ! gh auth status &>/dev/null; then
        warn "GitHub CLI not authenticated. Run: gh auth login"
        return 1
    fi

    log "Creating GitHub repository with gh CLI…"
    read -p "Repository name (default: railflow): " REPO_NAME
    REPO_NAME="${REPO_NAME:-railflow}"

    read -p "Description (default: Professional Deployment Platform): " DESC
    DESC="${DESC:-Professional Deployment Platform — Rust + Next.js + Docker}"

    read -p "Private repo? (y/N): " PRIVATE
    VISIBILITY="--public"
    if [[ "$PRIVATE" =~ ^[Yy]$ ]]; then
        VISIBILITY="--private"
    fi

    gh repo create "$REPO_NAME" $VISIBILITY --description "$DESC" --source=. --remote=origin --push
    ok "Repository created and code pushed!"
    ok "URL: https://github.com/$(gh api user --jq .login)/$REPO_NAME"
}

# ---- Method 2: Personal Access Token ----
use_token() {
    log "Using Personal Access Token method…"
    echo ""
    echo "Create a PAT at: https://github.com/settings/tokens/new?scopes=repo"
    echo ""
    read -p "GitHub username: " GH_USER
    read -s -p "GitHub Personal Access Token: " GH_TOKEN
    echo ""
    read -p "Repository name (default: railflow): " REPO_NAME
    REPO_NAME="${REPO_NAME:-railflow}"

    log "Creating repository '$REPO_NAME'…"
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: token $GH_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"$REPO_NAME\",\"description\":\"Professional Deployment Platform — Rust + Next.js + Docker\",\"private\":false}")

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    if [ "$HTTP_CODE" != "201" ]; then
        err "Failed to create repository (HTTP $HTTP_CODE)"
        echo "$RESPONSE" | head -n -1
        exit 1
    fi

    CLONE_URL="https://$GH_USER:$GH_TOKEN@github.com/$GH_USER/$REPO_NAME.git"

    log "Adding remote…"
    git remote remove origin 2>/dev/null || true
    git remote add origin "$CLONE_URL"

    log "Pushing to GitHub…"
    git push -u origin main

    # Remove token from remote URL for security
    git remote set-url origin "https://github.com/$GH_USER/$REPO_NAME.git"

    ok "Repository created and code pushed!"
    ok "URL: https://github.com/$GH_USER/$REPO_NAME"
}

# ---- Method 3: Existing repo URL ----
use_existing_url() {
    local url="$1"
    log "Adding remote: $url"
    git remote remove origin 2>/dev/null || true
    git remote add origin "$url"

    log "Pushing to GitHub…"
    git push -u origin main
    ok "Code pushed successfully!"
}

# ---- Main ----
case "$#" in
    0)
        echo -e "${CYAN}Railflow → GitHub Push${NC}"
        echo ""
        echo "Choose a method:"
        echo "  1) GitHub CLI (gh) — easiest if installed"
        echo "  2) Personal Access Token"
        echo "  3) I already have a repo URL"
        echo ""
        read -p "Method (1/2/3): " METHOD

        case "$METHOD" in
            1) use_gh_cli ;;
            2) use_token ;;
            3)
                read -p "GitHub repo URL (https://github.com/user/repo.git): " URL
                use_existing_url "$URL"
                ;;
            *) err "Invalid choice"; exit 1 ;;
        esac
        ;;
    1)
        if [[ "$1" == *"github.com"* ]]; then
            use_existing_url "$1"
        else
            err "URL must contain 'github.com'"
            exit 1
        fi
        ;;
    2)
        # user + repo name → create via API
        GH_USER="$1"
        REPO_NAME="$2"
        read -s -p "GitHub Personal Access Token: " GH_TOKEN
        echo ""
        use_token_with_user "$GH_USER" "$REPO_NAME" "$GH_TOKEN"
        ;;
    *)
        echo "Usage: $0 [github-url | user repo]"
        exit 1
        ;;
esac
