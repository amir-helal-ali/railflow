/**
 * Shared types for Railflow control plane
 * Mirrors the Rust backend DTOs (see backend/rust/src/models/)
 */

export type Locale = "ar" | "en";

export type DeploymentStatus =
  | "queued"
  | "cloning"
  | "building"
  | "pushing"
  | "starting"
  | "health"
  | "done"
  | "failed"
  | "stopped";

export type ContainerStatus =
  | "running"
  | "stopped"
  | "paused"
  | "restarting"
  | "unhealthy";

export type Health = "healthy" | "unhealthy" | "degraded" | "unknown";

export type Runtime =
  | "node"
  | "bun"
  | "deno"
  | "python"
  | "go"
  | "rust"
  | "java"
  | "docker"
  | "static";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "owner" | "admin" | "developer" | "viewer";
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  repo: string;            // owner/name
  repoUrl: string;
  branch: string;
  runtime: Runtime;
  framework: string;
  domain?: string;
  customDomains: string[];
  status: DeploymentStatus;
  health: Health;
  lastDeployAt?: string;
  lastDeployCommit?: string;
  lastDeployMessage?: string;
  autoDeploy: boolean;
  previewDeploy: boolean;
  buildCommand?: string;
  installCommand?: string;
  startCommand?: string;
  rootDir: string;
  envCount: number;
  secretCount: number;
  stats: {
    totalDeploys: number;
    successRate: number;     // 0..100
    avgDeploySeconds: number;
    last24hDeploys: number;
  };
  resources: {
    cpuCores: number;        // allocated
    memoryMb: number;        // allocated
    diskMb: number;
  };
  containerId?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Deployment {
  id: string;
  projectId: string;
  projectName: string;
  status: DeploymentStatus;
  stage: DeploymentStatus;
  commitSha: string;
  commitMessage: string;
  branch: string;
  author: string;
  authorAvatar: string;
  environment: "production" | "preview" | "staging";
  triggeredBy: "webhook" | "manual" | "rollback" | "schedule";
  stages: Array<{
    id: DeploymentStatus;
    status: "pending" | "running" | "success" | "failed" | "skipped";
    startedAt?: string;
    finishedAt?: string;
    durationMs?: number;
    logs?: string;
  }>;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  url?: string;
}

export interface Container {
  id: string;
  name: string;
  image: string;
  status: ContainerStatus;
  health: Health;
  projectId?: string;
  projectName?: string;
  command: string;
  created: string;
  uptime: number;          // seconds
  ports: Array<{ host: number; container: number; protocol: "tcp" | "udp" }>;
  networks: string[];
  stats: {
    cpuPercent: number;
    memoryUsedMb: number;
    memoryLimitMb: number;
    netInMb: number;
    netOutMb: number;
    blockReadMb: number;
    blockWriteMb: number;
    pids: number;
  };
  labels: Record<string, string>;
}

export interface ServerInfo {
  hostname: string;
  os: string;
  kernel: string;
  uptime: number;            // seconds
  bootTime: string;
  cpu: {
    model: string;
    cores: number;
    physicalCores: number;
    frequencyMhz: number;
    loadAvg1: number;
    loadAvg5: number;
    loadAvg15: number;
    perCoreUsage: number[];  // 0..100
    overallUsage: number;    // 0..100
  };
  memory: {
    totalGb: number;
    usedGb: number;
    availableGb: number;
    cachedGb: number;
    swapTotalGb: number;
    swapUsedGb: number;
  };
  disk: {
    totalGb: number;
    usedGb: number;
    availableGb: number;
    partitions: Array<{
      device: string;
      mount: string;
      fsType: string;
      totalGb: number;
      usedGb: number;
      usedPercent: number;
    }>;
  };
  network: {
    interfaces: Array<{
      name: string;
      ip: string;
      mac: string;
      inboundMbps: number;
      outboundMbps: number;
      totalInGb: number;
      totalOutGb: number;
      isUp: boolean;
    }>;
  };
  docker: {
    version: string;
    containersTotal: number;
    containersRunning: number;
    containersStopped: number;
    images: number;
    storageDriver: string;
  };
}

export interface ProcessInfo {
  pid: number;
  name: string;
  user: string;
  cpuPercent: number;
  memoryMb: number;
  memoryPercent: number;
  status: string;
  startTime: string;
  command: string;
}

export interface DockerEvent {
  id: string;
  type: "container" | "image" | "network" | "volume" | "daemon";
  action: string;
  actor: {
    id: string;
    attributes: Record<string, string>;
  };
  scope: "local" | "global";
  time: string;
  message: string;
}

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  isSensitive: boolean;
  service?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;        // first 12 chars visible
  scopes: string[];
  lastUsedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  current: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug" | "success";
  source: string;
  message: string;
}

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface TimeSeries {
  name: string;
  points: MetricPoint[];
  unit: string;
  color?: string;
}

// ----- Managed Databases -----
export type DatabaseEngine = "postgresql" | "mysql" | "redis" | "mongodb" | "mariadb";

export interface ManagedDatabase {
  id: string;
  name: string;
  engine: DatabaseEngine;
  version: string;
  status: "running" | "stopped" | "creating" | "failed";
  health: Health;
  region: string;
  plan: "small" | "medium" | "large" | "xlarge";
  connectionInfo: {
    host: string;
    port: number;
    database: string;
    username: string;
    passwordMasked: string;
    internalUrl: string;
    externalUrl?: string;
  };
  storage: {
    usedGb: number;
    totalGb: number;
  };
  stats: {
    connections: number;
    maxConnections: number;
    queriesPerSecond: number;
    cpuPercent: number;
    memoryMb: number;
  };
  backups: {
    enabled: boolean;
    lastBackupAt?: string;
    nextBackupAt?: string;
    retention: number; // days
  };
  projectId?: string;
  createdAt: string;
  containerId: string;
}

// ----- Docker Volumes -----
export interface DockerVolume {
  id: string;
  name: string;
  driver: string;
  mountpoint: string;
  sizeMb: number;
  inUse: boolean;
  containers: string[]; // container names using this volume
  labels: Record<string, string>;
  scope: "local" | "global";
  createdAt: string;
}

// ----- Docker Networks -----
export interface DockerNetwork {
  id: string;
  name: string;
  driver: "bridge" | "host" | "overlay" | "macvlan" | "none";
  scope: "local" | "global" | "swarm";
  subnet: string;
  gateway: string;
  ipAddress?: string;
  containers: Array<{
    id: string;
    name: string;
    ipv4: string;
    ipv6?: string;
  }>;
  labels: Record<string, string>;
  createdAt: string;
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
}

// ----- Activity / Audit Log -----
export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: {
    name: string;
    avatarUrl: string;
    type: "user" | "system" | "webhook" | "api";
  };
  action: string;
  category: "auth" | "project" | "deployment" | "container" | "database" | "settings" | "billing";
  resource: {
    type: string;
    id: string;
    name: string;
  };
  metadata?: Record<string, string>;
  ip?: string;
  userAgent?: string;
}

// ----- Team & RBAC -----
export type Role = "owner" | "admin" | "developer" | "viewer";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: Role;
  status: "active" | "invited" | "suspended";
  lastActiveAt?: string;
  joinedAt: string;
  twoFactorEnabled: boolean;
  projectsCount: number;
  permissions: string[];
}

export interface TeamInvite {
  id: string;
  email: string;
  role: Role;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired";
}

// ----- Backups -----
export interface Backup {
  id: string;
  projectId?: string;
  projectName?: string;
  databaseId?: string;
  databaseName?: string;
  type: "automatic" | "manual" | "pre-deploy";
  status: "in_progress" | "completed" | "failed" | "restoring";
  sizeMb: number;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  storageLocation: string;
  retentionExpiresAt?: string;
}

// ----- SSL Certificates -----
export interface Certificate {
  id: string;
  domain: string;
  type: "lets-encrypt" | "custom" | "wildcard";
  status: "active" | "pending" | "expired" | "renewing";
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  projectId?: string;
  fingerprint: string;
}

// ----- Deploy Strategies -----
export type DeployStrategy = "rolling" | "blue-green" | "canary";

export interface DeployStrategyConfig {
  projectId: string;
  strategy: DeployStrategy;
  healthCheckPath: string;
  healthCheckTimeout: number; // seconds
  healthCheckInterval: number; // seconds
  // Blue/green
  switchAfterHealthySeconds?: number;
  // Canary
  canaryPercent?: number;
  canaryObserveMinutes?: number;
  rollbackOnError: boolean;
  rollbackThreshold: number; // error rate %
}

// ----- Environments -----
export type EnvironmentTier = "production" | "staging" | "preview";

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  tier: EnvironmentTier;
  status: "active" | "sleeping" | "building" | "failed";
  url?: string;
  domain?: string;
  branch: string;
  commitSha: string;
  commitMessage: string;
  lastDeployAt: string;
  autoScale: boolean;
  replicas: number;
  resources: {
    cpuCores: number;
    memoryMb: number;
  };
  variables: number;
}

// ----- API Playground -----
export interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth: "bearer" | "apikey" | "none";
  category: "auth" | "projects" | "deployments" | "containers" | "databases" | "server" | "webhooks";
  sampleRequest: string;
  sampleResponse: string;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  requestSize?: number;
  responseSize?: number;
}

// ----- Notifications / Alerts -----
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertCategory = "deployment" | "container" | "database" | "server" | "certificate" | "billing" | "security";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  resourceType?: string;
  resourceId?: string;
  ip?: string;
  actions?: Array<{ label: string; type: "primary" | "secondary" | "danger" }>;
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  events: string[];
  channels: Array<"email" | "slack" | "discord" | "webhook" | "sms">;
  target: string;
  createdAt: string;
}

// ----- Help / Docs Topics -----
export interface HelpTopic {
  id: string;
  title: string;
  category: "getting-started" | "deployment" | "databases" | "security" | "billing" | "api";
  icon: string;
  description: string;
  readTimeMin: number;
  lastUpdated: string;
  content: string;
}

// ----- CI/CD Pipeline Builder -----
export type PipelineStageType =
  | "trigger"
  | "build"
  | "test"
  | "lint"
  | "security-scan"
  | "deploy"
  | "notify"
  | "custom";

export interface PipelineStage {
  id: string;
  type: PipelineStageType;
  name: string;
  enabled: boolean;
  command?: string;
  image?: string;
  env?: Record<string, string>;
  condition?: string; // e.g. "branch == 'main'"
  timeoutSec?: number;
  onFailure: "stop" | "continue" | "retry";
  retryCount?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  enabled: boolean;
  trigger: {
    events: Array<"push" | "pull_request" | "tag" | "schedule" | "manual">;
    branches: string[];
    schedule?: string; // cron
  };
  stages: PipelineStage[];
  lastRun?: {
    id: string;
    status: "success" | "failed" | "running" | "cancelled";
    startedAt: string;
    durationMs: number;
    triggeredBy: string;
  };
  stats: {
    totalRuns: number;
    successRate: number;
    avgDurationMs: number;
    last24h: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ----- Webhooks -----
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  status: "delivered" | "failed" | "pending" | "retrying";
  statusCode: number;
  attempt: number;
  maxAttempts: number;
  requestHeaders: Record<string, string>;
  requestBody: string;
  responseBody: string;
  durationMs: number;
  deliveredAt: string;
  nextRetryAt?: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  enabled: boolean;
  sslVerification: boolean;
  deliveries: {
    total: number;
    success: number;
    failed: number;
    last24h: number;
  };
  createdAt: string;
  lastDeliveryAt?: string;
}

// ----- Cost / Billing -----
export interface CostBreakdown {
  category: "compute" | "database" | "storage" | "bandwidth" | "backup" | "ssl" | "support";
  label: string;
  cost: number;
  unit: string;
  usage: number;
  limit?: number;
  trend: number; // % change
}

export interface Invoice {
  id: string;
  number: string;
  period: { start: string; end: string };
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded";
  method: string;
  pdfUrl?: string;
  issuedAt: string;
}

export interface CostAlert {
  id: string;
  threshold: number; // USD
  current: number;
  period: "daily" | "monthly";
  enabled: boolean;
  lastTriggered?: string;
}

// ----- API Health Monitoring -----
export interface ApiHealthCheck {
  id: string;
  name: string;
  url: string;
  method: "GET" | "HEAD" | "POST";
  expectedStatus: number;
  intervalSec: number;
  timeoutSec: number;
  regions: string[];
  enabled: boolean;
  status: "up" | "down" | "degraded";
  uptime30d: number; // percentage
  responseTimeMs: number;
  lastCheck: string;
  lastIncident?: string;
  history: Array<{ timestamp: string; status: "up" | "down"; responseTimeMs: number }>;
}

export interface ApiMetricPoint {
  timestamp: string;
  requests: number;
  errors: number;
  avgResponseMs: number;
  p95ResponseMs: number;
  p99ResponseMs: number;
}

// ----- Audit Search -----
export interface AuditQuery {
  id: string;
  name: string;
  filters: {
    actors?: string[];
    categories?: string[];
    actions?: string[];
    resources?: string[];
    dateFrom?: string;
    dateTo?: string;
    ipAddresses?: string[];
  };
  savedAt: string;
}

// ----- Marketplace Templates -----
export interface Template {
  id: string;
  name: string;
  description: string;
  category: "framework" | "api" | "static" | "database" | "ml" | "worker" | "fullstack";
  runtime: string;
  framework: string;
  icon: string;
  author: string;
  stars: number;
  deployments: number;
  tags: string[];
  features: string[];
  repoUrl: string;
  demoUrl?: string;
  buildCommand: string;
  startCommand: string;
  installCommand: string;
  envVars: Array<{ key: string; description: string; required: boolean }>;
  estimatedDeployTime: number; // seconds
  lastUpdated: string;
}

// ----- Multi-region / Edge -----
export interface Region {
  id: string;
  name: string;
  code: string;
  country: string;
  flag: string;
  latencyMs: number;
  status: "active" | "maintenance" | "planned";
  resources: {
    cpuAvailable: number;
    memoryAvailableGb: number;
    storageAvailableGb: number;
  };
  projects: number;
  isDefault: boolean;
}

export interface EdgeRule {
  id: string;
  pattern: string;
  action: "cache" | "redirect" | "rewrite" | "block";
  value: string;
  ttl?: number;
}

export interface EdgeConfig {
  projectId: string;
  primaryRegion: string;
  replicaRegions: string[];
  edgeCache: boolean;
  cdnEnabled: boolean;
  customRules: EdgeRule[];
}

// ----- Aggregated Logs -----
export interface AggregatedLog {
  id: string;
  timestamp: string;
  containerName: string;
  containerId: string;
  level: "info" | "warn" | "error" | "debug" | "success";
  source: "stdout" | "stderr";
  message: string;
  projectId?: string;
}

export interface LogStream {
  id: string;
  name: string;
  containers: string[];
  filter: string;
  level: "all" | "info" | "warn" | "error" | "debug" | "success";
  enabled: boolean;
  lastMessageAt?: string;
}

// ----- Security Center -----
export interface SecurityFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "vulnerability" | "misconfiguration" | "exposed-secret" | "outdated-dependency" | "weak-auth" | "open-port";
  title: string;
  description: string;
  resource: { type: string; id: string; name: string };
  detectedAt: string;
  status: "open" | "acknowledged" | "resolved" | "ignored";
  recommendation: string;
  cve?: string;
  cvssScore?: number;
}

export interface SecurityScan {
  id: string;
  type: "container" | "dependency" | "code" | "network";
  target: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "completed" | "failed";
  findingsCount: { critical: number; high: number; medium: number; low: number };
}

export interface FirewallRule {
  id: string;
  action: "allow" | "deny";
  protocol: "tcp" | "udp" | "icmp" | "all";
  source: string;
  destination: string;
  port: string;
  description: string;
  enabled: boolean;
  priority: number;
}

// ----- Performance Analytics -----
export interface PerformanceMetric {
  timestamp: string;
  loadTimeMs: number;
  fcpMs: number;     // First Contentful Paint
  lcpMs: number;     // Largest Contentful Paint
  cls: number;       // Cumulative Layout Shift
  fidMs: number;     // First Input Delay
  ttfbMs: number;    // Time to First Byte
  inpMs: number;     // Interaction to Next Paint
}

export interface ProjectPerformance {
  projectId: string;
  projectName: string;
  url: string;
  scores: { performance: number; accessibility: number; bestPractices: number; seo: number };
  coreWebVitals: { lcp: number; fid: number; cls: number; inp: number };
  trends: { lcp: number; fid: number; cls: number };
  history: PerformanceMetric[];
}

// ----- Metrics Explorer (Prometheus-style) -----
export interface MetricDefinition {
  id: string;
  name: string;
  type: "counter" | "gauge" | "histogram" | "summary";
  unit: string;
  description: string;
  labels: string[];
  source: "container" | "host" | "application" | "database" | "network";
}

export interface SavedDashboard {
  id: string;
  name: string;
  description: string;
  panels: Array<{
    id: string;
    metric: string;
    title: string;
    type: "line" | "area" | "bar" | "gauge" | "stat";
    timeRange: string;
    refresh: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ----- Integrations -----
export interface Integration {
  id: string;
  name: string;
  category: "monitoring" | "ci-cd" | "communication" | "security" | "analytics" | "storage" | "auth" | "payments";
  icon: string;
  description: string;
  installed: boolean;
  configRequired: boolean;
  authType: "oauth" | "api-key" | "webhook" | "none";
  connectedAt?: string;
  features: string[];
  popularity: number;
  documentation?: string;
}
