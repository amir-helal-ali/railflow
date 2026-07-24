-- Tables for environments, alerts, notification rules, and deploy strategies

-- Environments (production / staging / preview per project)
CREATE TABLE IF NOT EXISTS environments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    tier            TEXT NOT NULL CHECK (tier IN ('production', 'staging', 'preview')),
    status          TEXT NOT NULL DEFAULT 'building' CHECK (status IN ('active', 'sleeping', 'building', 'failed')),
    branch          TEXT NOT NULL DEFAULT 'main',
    commit_sha      TEXT,
    commit_message  TEXT,
    url             TEXT,
    domain          TEXT,
    container_id    TEXT,
    auto_scale      BOOLEAN NOT NULL DEFAULT FALSE,
    replicas        INTEGER NOT NULL DEFAULT 1,
    cpu_cores       FLOAT NOT NULL DEFAULT 1,
    memory_mb       INTEGER NOT NULL DEFAULT 512,
    last_deploy_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_environments_project_id ON environments(project_id);
CREATE INDEX IF NOT EXISTS idx_environments_tier ON environments(tier);
CREATE INDEX IF NOT EXISTS idx_environments_status ON environments(status);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    severity        TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    category        TEXT NOT NULL CHECK (category IN ('deployment', 'container', 'database', 'server', 'certificate', 'billing', 'security')),
    title           TEXT NOT NULL,
    message         TEXT NOT NULL,
    resource_type   TEXT,
    resource_id     TEXT,
    metadata        JSONB,
    acknowledged    BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_category ON alerts(category);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- Notification rules
CREATE TABLE IF NOT EXISTS notification_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    events          TEXT[] NOT NULL DEFAULT '{}',
    channels        TEXT[] NOT NULL DEFAULT '{}',
    target          TEXT NOT NULL,
    owner_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_rules_owner_id ON notification_rules(owner_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_enabled ON notification_rules(enabled);

-- Deploy strategies per project
CREATE TABLE IF NOT EXISTS deploy_strategies (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id                  UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    strategy                    TEXT NOT NULL DEFAULT 'rolling' CHECK (strategy IN ('rolling', 'blue-green', 'canary')),
    health_check_path           TEXT NOT NULL DEFAULT '/health',
    health_check_timeout        INTEGER NOT NULL DEFAULT 30,
    health_check_interval       INTEGER NOT NULL DEFAULT 10,
    switch_after_healthy_secs   INTEGER,
    canary_percent              INTEGER,
    canary_observe_minutes      INTEGER,
    rollback_on_error           BOOLEAN NOT NULL DEFAULT TRUE,
    rollback_threshold          FLOAT NOT NULL DEFAULT 5.0,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deploy_strategies_project_id ON deploy_strategies(project_id);

-- Triggers for new tables
CREATE TRIGGER update_environments_updated_at BEFORE UPDATE ON environments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_rules_updated_at BEFORE UPDATE ON notification_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deploy_strategies_updated_at BEFORE UPDATE ON deploy_strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
