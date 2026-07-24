-- Security center tables

-- Security findings
CREATE TABLE IF NOT EXISTS security_findings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    severity        TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    category        TEXT NOT NULL CHECK (category IN ('vulnerability', 'misconfiguration', 'exposed-secret', 'outdated-dependency', 'weak-auth', 'open-port')),
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    resource_type   TEXT NOT NULL,
    resource_id     TEXT NOT NULL,
    resource_name   TEXT NOT NULL,
    recommendation  TEXT,
    cve             TEXT,
    cvss_score      FLOAT,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored')),
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    resolved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_findings_severity ON security_findings(severity);
CREATE INDEX IF NOT EXISTS idx_security_findings_status ON security_findings(status);
CREATE INDEX IF NOT EXISTS idx_security_findings_category ON security_findings(category);
CREATE INDEX IF NOT EXISTS idx_security_findings_detected_at ON security_findings(detected_at DESC);

-- Security scans
CREATE TABLE IF NOT EXISTS security_scans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_type           TEXT NOT NULL CHECK (scan_type IN ('container', 'dependency', 'code', 'network')),
    target              TEXT,
    status              TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at         TIMESTAMPTZ,
    findings_critical   INTEGER NOT NULL DEFAULT 0,
    findings_high       INTEGER NOT NULL DEFAULT 0,
    findings_medium     INTEGER NOT NULL DEFAULT 0,
    findings_low        INTEGER NOT NULL DEFAULT 0,
    triggered_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_scans_status ON security_scans(status);
CREATE INDEX IF NOT EXISTS idx_security_scans_started_at ON security_scans(started_at DESC);

-- Firewall rules
CREATE TABLE IF NOT EXISTS firewall_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action          TEXT NOT NULL CHECK (action IN ('allow', 'deny')),
    protocol        TEXT NOT NULL DEFAULT 'tcp' CHECK (protocol IN ('tcp', 'udp', 'icmp', 'all')),
    source          TEXT NOT NULL DEFAULT '0.0.0.0/0',
    destination     TEXT NOT NULL DEFAULT '*',
    port            TEXT NOT NULL DEFAULT '*',
    description     TEXT NOT NULL DEFAULT '',
    priority        INTEGER NOT NULL DEFAULT 100,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firewall_rules_priority ON firewall_rules(priority);
CREATE INDEX IF NOT EXISTS idx_firewall_rules_enabled ON firewall_rules(enabled);

-- Triggers
CREATE TRIGGER update_security_findings_updated_at BEFORE UPDATE ON security_findings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_firewall_rules_updated_at BEFORE UPDATE ON firewall_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
