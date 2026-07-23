-- Add tables for managed databases, backups, certificates, and team invitations

-- Managed databases
CREATE TABLE IF NOT EXISTS databases (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    engine          TEXT NOT NULL CHECK (engine IN ('postgresql', 'mysql', 'redis', 'mongodb', 'mariadb')),
    version         TEXT NOT NULL,
    plan            TEXT NOT NULL DEFAULT 'small' CHECK (plan IN ('small', 'medium', 'large', 'xlarge')),
    region          TEXT NOT NULL DEFAULT 'fra1',
    status          TEXT NOT NULL DEFAULT 'creating',
    health          TEXT NOT NULL DEFAULT 'unknown',
    container_id    TEXT,
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_host TEXT,
    connection_port INTEGER,
    connection_db   TEXT,
    connection_user TEXT,
    connection_password_encrypted BYTEA,
    storage_total_gb FLOAT NOT NULL DEFAULT 10,
    storage_used_gb FLOAT NOT NULL DEFAULT 0,
    backups_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    backups_retention_days INTEGER NOT NULL DEFAULT 30,
    backups_last_at TIMESTAMPTZ,
    backups_next_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_databases_owner_id ON databases(owner_id);
CREATE INDEX IF NOT EXISTS idx_databases_project_id ON databases(project_id);
CREATE INDEX IF NOT EXISTS idx_databases_engine ON databases(engine);

-- Backups
CREATE TABLE IF NOT EXISTS backups (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    database_id     UUID REFERENCES databases(id) ON DELETE CASCADE,
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('automatic', 'manual', 'pre-deploy')),
    status          TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'restoring')),
    size_bytes      BIGINT NOT NULL DEFAULT 0,
    storage_location TEXT NOT NULL,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    duration_ms     BIGINT,
    error_message   TEXT,
    retention_expires_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backups_database_id ON backups(database_id);
CREATE INDEX IF NOT EXISTS idx_backups_project_id ON backups(project_id);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_started_at ON backups(started_at DESC);

-- SSL Certificates
CREATE TABLE IF NOT EXISTS certificates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain          TEXT NOT NULL UNIQUE,
    type            TEXT NOT NULL CHECK (type IN ('lets-encrypt', 'custom', 'wildcard')),
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired', 'renewing')),
    issuer          TEXT,
    issued_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ NOT NULL,
    auto_renew      BOOLEAN NOT NULL DEFAULT TRUE,
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    fingerprint     TEXT,
    private_key_encrypted BYTEA,
    certificate_pem TEXT,
    chain_pem       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_domain ON certificates(domain);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_expires_at ON certificates(expires_at);

-- Team invitations
CREATE TABLE IF NOT EXISTS team_invitations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
    invited_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at      TIMESTAMPTZ NOT NULL,
    accepted_at     TIMESTAMPTZ,
    accepted_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- Add role constraint to users (already exists, just enforce)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'admin', 'developer', 'viewer'));

-- Trigger for new tables
CREATE TRIGGER update_databases_updated_at BEFORE UPDATE ON databases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
