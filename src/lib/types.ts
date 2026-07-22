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
