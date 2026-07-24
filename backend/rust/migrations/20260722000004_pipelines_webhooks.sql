-- Tables for CI/CD pipelines and outgoing webhooks

-- Pipelines
CREATE TABLE IF NOT EXISTS pipelines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    enabled             BOOLEAN NOT NULL DEFAULT TRUE,
    trigger_events      TEXT[] NOT NULL DEFAULT '{push}',
    trigger_branches    TEXT[] NOT NULL DEFAULT '{main}',
    trigger_schedule    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipelines_project_id ON pipelines(project_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_enabled ON pipelines(enabled);

-- Pipeline stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    stage_type      TEXT NOT NULL CHECK (stage_type IN ('trigger', 'build', 'test', 'lint', 'security-scan', 'deploy', 'notify', 'custom')),
    name            TEXT NOT NULL,
    command         TEXT,
    image           TEXT,
    env             JSONB,
    timeout_sec     INTEGER NOT NULL DEFAULT 60,
    condition       TEXT,
    on_failure      TEXT NOT NULL DEFAULT 'stop' CHECK (on_failure IN ('stop', 'continue', 'retry')),
    retry_count     INTEGER NOT NULL DEFAULT 0,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    position        INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_position ON pipeline_stages(position);

-- Pipeline runs (one per execution)
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
    triggered_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    duration_ms     BIGINT,
    error_message   TEXT,
    commit_sha      TEXT,
    branch          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_pipeline_id ON pipeline_runs(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started_at ON pipeline_runs(started_at DESC);

-- Pipeline stage runs (one per stage per run)
CREATE TABLE IF NOT EXISTS pipeline_stage_runs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id          UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
    stage_id        UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'skipped')),
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    duration_ms     BIGINT,
    exit_code       INTEGER,
    stdout          TEXT,
    stderr          TEXT,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stage_runs_run_id ON pipeline_stage_runs(run_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_runs_stage_id ON pipeline_stage_runs(stage_id);

-- Outgoing webhooks (user-configured)
CREATE TABLE IF NOT EXISTS webhooks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    url                 TEXT NOT NULL,
    events              TEXT[] NOT NULL DEFAULT '{}',
    secret              TEXT NOT NULL,
    ssl_verification    BOOLEAN NOT NULL DEFAULT TRUE,
    enabled             BOOLEAN NOT NULL DEFAULT TRUE,
    owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_owner_id ON webhooks(owner_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks(enabled);

-- Webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id      UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event           TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('delivered', 'failed', 'pending', 'retrying')),
    status_code     INTEGER,
    attempt         INTEGER NOT NULL DEFAULT 0,
    max_attempts    INTEGER NOT NULL DEFAULT 3,
    request_headers JSONB,
    request_body    TEXT,
    response_body   TEXT,
    duration_ms     BIGINT,
    delivered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_retry_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_delivered_at ON webhook_deliveries(delivered_at DESC);

-- Triggers
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
