-- Tables for marketplace templates, regions, edge config, and log streams

-- Templates (marketplace)
CREATE TABLE IF NOT EXISTS templates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    description         TEXT NOT NULL DEFAULT '',
    category            TEXT NOT NULL CHECK (category IN ('framework', 'api', 'static', 'database', 'ml', 'worker', 'fullstack')),
    runtime             TEXT NOT NULL,
    framework           TEXT NOT NULL,
    icon                TEXT,
    author              TEXT NOT NULL DEFAULT 'community',
    stars               INTEGER NOT NULL DEFAULT 0,
    deployments         INTEGER NOT NULL DEFAULT 0,
    tags                TEXT[] NOT NULL DEFAULT '{}',
    features            TEXT[] NOT NULL DEFAULT '{}',
    repo_url            TEXT NOT NULL,
    demo_url            TEXT,
    build_command       TEXT,
    start_command       TEXT,
    install_command     TEXT,
    env_vars            JSONB NOT NULL DEFAULT '[]',
    estimated_deploy_sec INTEGER NOT NULL DEFAULT 60,
    is_official         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_stars ON templates(stars DESC);

-- Regions
CREATE TABLE IF NOT EXISTS regions (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    code            TEXT UNIQUE NOT NULL,
    country         TEXT NOT NULL,
    flag            TEXT,
    latitude        FLOAT,
    longitude       FLOAT,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'planned')),
    cpu_available   INTEGER NOT NULL DEFAULT 0,
    memory_available_gb INTEGER NOT NULL DEFAULT 0,
    storage_available_gb INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Edge configs per project
CREATE TABLE IF NOT EXISTS edge_configs (
    project_id      UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    primary_region  TEXT NOT NULL REFERENCES regions(id),
    replica_regions TEXT[] NOT NULL DEFAULT '{}',
    edge_cache      BOOLEAN NOT NULL DEFAULT TRUE,
    cdn_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    custom_rules    JSONB NOT NULL DEFAULT '[]',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log streams (saved aggregated log queries)
CREATE TABLE IF NOT EXISTS log_streams (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    containers      TEXT[] NOT NULL DEFAULT '{}',
    filter          TEXT NOT NULL DEFAULT '',
    level           TEXT NOT NULL DEFAULT 'all',
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    owner_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_streams_owner_id ON log_streams(owner_id);
CREATE INDEX IF NOT EXISTS idx_log_streams_enabled ON log_streams(enabled);

-- Aggregated logs (for search/history — in production use Elasticsearch/Loki)
CREATE TABLE IF NOT EXISTS aggregated_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id    TEXT NOT NULL,
    container_name  TEXT NOT NULL,
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    level           TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug', 'success')),
    source          TEXT NOT NULL CHECK (source IN ('stdout', 'stderr')),
    message         TEXT NOT NULL,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aggregated_logs_container_id ON aggregated_logs(container_id);
CREATE INDEX IF NOT EXISTS idx_aggregated_logs_project_id ON aggregated_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_aggregated_logs_level ON aggregated_logs(level);
CREATE INDEX IF NOT EXISTS idx_aggregated_logs_timestamp ON aggregated_logs(timestamp DESC);

-- Trigger
CREATE TRIGGER update_edge_configs_updated_at BEFORE UPDATE ON edge_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
