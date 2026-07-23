/**
 * Mock data layer that simulates the Rust backend.
 * In production, all these helpers would call /api/* routes that proxy to the Rust backend.
 */
import type {
  Project,
  Deployment,
  Container,
  ServerInfo,
  ProcessInfo,
  DockerEvent,
  EnvVariable,
  ApiKey,
  Session,
  LogEntry,
  TimeSeries,
  User,
  ManagedDatabase,
  DockerVolume,
  DockerNetwork,
  ActivityEntry,
  TeamMember,
  TeamInvite,
  Backup,
  Certificate,
  DeployStrategyConfig,
  Environment,
  ApiEndpoint,
  ApiLogEntry,
  Alert,
  NotificationRule,
  HelpTopic,
  Pipeline,
  WebhookEndpoint,
  WebhookDelivery,
  CostBreakdown,
  Invoice,
  CostAlert,
  ApiHealthCheck,
  ApiMetricPoint,
  AuditQuery,
  Template,
  Region,
  EdgeConfig,
  AggregatedLog,
  LogStream,
} from "./types";

export const mockUser: User = {
  id: "u_1",
  name: "Ahmed Hassan",
  email: "ahmed@railflow.io",
  avatarUrl: "https://i.pravatar.cc/150?img=12",
  role: "owner",
  twoFactorEnabled: true,
  createdAt: "2025-01-15T08:00:00Z",
};

const now = Date.now();
const minAgo = (m: number) => new Date(now - m * 60_000).toISOString();
const hourAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
const dayAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

// ---------- Projects ----------
export const mockProjects: Project[] = [
  {
    id: "p_web",
    name: "Web Platform",
    slug: "web-platform",
    description: "Main marketing site & dashboard — Next.js + Tailwind",
    repo: "railflow/web-platform",
    repoUrl: "https://github.com/railflow/web-platform",
    branch: "main",
    runtime: "node",
    framework: "Next.js 16",
    domain: "railflow.io",
    customDomains: ["railflow.io", "www.railflow.io", "admin.railflow.io"],
    status: "done",
    health: "healthy",
    lastDeployAt: minAgo(14),
    lastDeployCommit: "a3f5c2e",
    lastDeployMessage: "feat: ship onboarding v2 with RTL support",
    autoDeploy: true,
    previewDeploy: true,
    buildCommand: "next build",
    installCommand: "bun install",
    startCommand: "next start",
    rootDir: "./",
    envCount: 24,
    secretCount: 8,
    stats: { totalDeploys: 412, successRate: 98.3, avgDeploySeconds: 87, last24hDeploys: 6 },
    resources: { cpuCores: 2, memoryMb: 2048, diskMb: 1024 },
    containerId: "c_web_1",
    imageUrl: "ghcr.io/railflow/web-platform:main",
    createdAt: dayAgo(245),
    updatedAt: minAgo(14),
    tags: ["production", "frontend", "critical"],
  },
  {
    id: "p_api",
    name: "API Gateway",
    slug: "api-gateway",
    description: "Rust-powered API gateway with JWT & rate limiting",
    repo: "railflow/api-gateway",
    repoUrl: "https://github.com/railflow/api-gateway",
    branch: "main",
    runtime: "rust",
    framework: "axum",
    domain: "api.railflow.io",
    customDomains: ["api.railflow.io"],
    status: "done",
    health: "healthy",
    lastDeployAt: hourAgo(3),
    lastDeployCommit: "b7e9d1f",
    lastDeployMessage: "perf: reduce p99 latency by 22% via connection pooling",
    autoDeploy: true,
    previewDeploy: false,
    buildCommand: "cargo build --release",
    installCommand: "cargo fetch",
    startCommand: "./api-gateway",
    rootDir: "./",
    envCount: 18,
    secretCount: 12,
    stats: { totalDeploys: 287, successRate: 99.6, avgDeploySeconds: 145, last24hDeploys: 2 },
    resources: { cpuCores: 4, memoryMb: 4096, diskMb: 512 },
    containerId: "c_api_1",
    imageUrl: "ghcr.io/railflow/api-gateway:main",
    createdAt: dayAgo(312),
    updatedAt: hourAgo(3),
    tags: ["production", "backend", "critical"],
  },
  {
    id: "p_worker",
    name: "Background Workers",
    slug: "workers",
    description: "Async job processors (queues, scheduled tasks, webhooks)",
    repo: "railflow/workers",
    repoUrl: "https://github.com/railflow/workers",
    branch: "main",
    runtime: "go",
    framework: "Go + Redis",
    domain: undefined,
    customDomains: [],
    status: "done",
    health: "healthy",
    lastDeployAt: hourAgo(11),
    lastDeployCommit: "c2a8f3b",
    lastDeployMessage: "fix: properly handle dead-letter queue retries",
    autoDeploy: true,
    previewDeploy: false,
    buildCommand: "go build -o worker ./cmd/worker",
    installCommand: "go mod download",
    startCommand: "./worker",
    rootDir: "./",
    envCount: 14,
    secretCount: 6,
    stats: { totalDeploys: 198, successRate: 97.5, avgDeploySeconds: 64, last24hDeploys: 3 },
    resources: { cpuCores: 1, memoryMb: 1024, diskMb: 256 },
    containerId: "c_worker_1",
    imageUrl: "ghcr.io/railflow/workers:main",
    createdAt: dayAgo(188),
    updatedAt: hourAgo(11),
    tags: ["production", "backend"],
  },
  {
    id: "p_ml",
    name: "ML Inference",
    slug: "ml-inference",
    description: "Real-time ML inference service — Python + ONNX",
    repo: "railflow/ml-inference",
    repoUrl: "https://github.com/railflow/ml-inference",
    branch: "main",
    runtime: "python",
    framework: "FastAPI + ONNX",
    domain: "infer.railflow.io",
    customDomains: ["infer.railflow.io"],
    status: "building",
    health: "degraded",
    lastDeployAt: minAgo(3),
    lastDeployCommit: "d9c1e2a",
    lastDeployMessage: "chore: upgrade onnxruntime to 1.20",
    autoDeploy: false,
    previewDeploy: true,
    buildCommand: "pip install -r requirements.txt",
    installCommand: "pip install -r requirements.txt",
    startCommand: "uvicorn app:app --host 0.0.0.0 --port 8000",
    rootDir: "./",
    envCount: 9,
    secretCount: 4,
    stats: { totalDeploys: 87, successRate: 94.2, avgDeploySeconds: 312, last24hDeploys: 4 },
    resources: { cpuCores: 8, memoryMb: 8192, diskMb: 4096 },
    containerId: "c_ml_1",
    imageUrl: "ghcr.io/railflow/ml-inference:main",
    createdAt: dayAgo(64),
    updatedAt: minAgo(3),
    tags: ["production", "ml", "gpu"],
  },
  {
    id: "p_docs",
    name: "Documentation",
    slug: "docs",
    description: "Static documentation site built with Astro",
    repo: "railflow/docs",
    repoUrl: "https://github.com/railflow/docs",
    branch: "main",
    runtime: "static",
    framework: "Astro",
    domain: "docs.railflow.io",
    customDomains: ["docs.railflow.io"],
    status: "done",
    health: "healthy",
    lastDeployAt: dayAgo(2),
    lastDeployCommit: "e5b2c4d",
    lastDeployMessage: "docs: add Rust backend architecture page",
    autoDeploy: true,
    previewDeploy: true,
    buildCommand: "astro build",
    installCommand: "npm install",
    startCommand: "npx serve dist",
    rootDir: "./",
    envCount: 4,
    secretCount: 1,
    stats: { totalDeploys: 156, successRate: 100, avgDeploySeconds: 42, last24hDeploys: 1 },
    resources: { cpuCores: 0.5, memoryMb: 512, diskMb: 256 },
    containerId: "c_docs_1",
    imageUrl: "ghcr.io/railflow/docs:main",
    createdAt: dayAgo(145),
    updatedAt: dayAgo(2),
    tags: ["production", "static"],
  },
  {
    id: "p_mobile",
    name: "Mobile API",
    slug: "mobile-api",
    description: "Backend for mobile apps — Node.js + tRPC + Prisma",
    repo: "railflow/mobile-api",
    repoUrl: "https://github.com/railflow/mobile-api",
    branch: "develop",
    runtime: "node",
    framework: "Node.js + tRPC",
    domain: "m.railflow.io",
    customDomains: ["m.railflow.io"],
    status: "failed",
    health: "unhealthy",
    lastDeployAt: hourAgo(8),
    lastDeployCommit: "f8a3d9e",
    lastDeployMessage: "wip: experimental push notifications — known broken",
    autoDeploy: false,
    previewDeploy: true,
    buildCommand: "tsc && node dist/main.js",
    installCommand: "npm ci",
    startCommand: "node dist/main.js",
    rootDir: "./",
    envCount: 16,
    secretCount: 7,
    stats: { totalDeploys: 233, successRate: 92.1, avgDeploySeconds: 76, last24hDeploys: 2 },
    resources: { cpuCores: 2, memoryMb: 2048, diskMb: 512 },
    containerId: undefined,
    imageUrl: "ghcr.io/railflow/mobile-api:develop",
    createdAt: dayAgo(98),
    updatedAt: hourAgo(8),
    tags: ["staging", "backend", "wip"],
  },
];

// ---------- Containers ----------
export const mockContainers: Container[] = [
  {
    id: "c_web_1",
    name: "web-platform-prod",
    image: "ghcr.io/railflow/web-platform:main",
    status: "running",
    health: "healthy",
    projectId: "p_web",
    projectName: "Web Platform",
    command: "next start -p 3000",
    created: dayAgo(14),
    uptime: 14 * 86400 + 3 * 3600,
    ports: [{ host: 3000, container: 3000, protocol: "tcp" }],
    networks: ["railflow-net"],
    stats: {
      cpuPercent: 8.4,
      memoryUsedMb: 412,
      memoryLimitMb: 2048,
      netInMb: 156.3,
      netOutMb: 894.2,
      blockReadMb: 12.4,
      blockWriteMb: 6.1,
      pids: 87,
    },
    labels: { "railflow.project": "p_web", "railflow.env": "production" },
  },
  {
    id: "c_api_1",
    name: "api-gateway-prod",
    image: "ghcr.io/railflow/api-gateway:main",
    status: "running",
    health: "healthy",
    projectId: "p_api",
    projectName: "API Gateway",
    command: "./api-gateway --config /etc/railflow/config.toml",
    created: dayAgo(3),
    uptime: 3 * 86400 + 2 * 3600,
    ports: [{ host: 8080, container: 8080, protocol: "tcp" }],
    networks: ["railflow-net"],
    stats: {
      cpuPercent: 23.7,
      memoryUsedMb: 287,
      memoryLimitMb: 4096,
      netInMb: 542.1,
      netOutMb: 678.9,
      blockReadMb: 4.2,
      blockWriteMb: 1.8,
      pids: 32,
    },
    labels: { "railflow.project": "p_api", "railflow.env": "production" },
  },
  {
    id: "c_worker_1",
    name: "workers-prod",
    image: "ghcr.io/railflow/workers:main",
    status: "running",
    health: "healthy",
    projectId: "p_worker",
    projectName: "Background Workers",
    command: "./worker",
    created: dayAgo(11),
    uptime: 11 * 86400 + 5 * 3600,
    ports: [],
    networks: ["railflow-net"],
    stats: {
      cpuPercent: 4.1,
      memoryUsedMb: 156,
      memoryLimitMb: 1024,
      netInMb: 28.7,
      netOutMb: 14.2,
      blockReadMb: 2.1,
      blockWriteMb: 9.4,
      pids: 14,
    },
    labels: { "railflow.project": "p_worker", "railflow.env": "production" },
  },
  {
    id: "c_ml_1",
    name: "ml-inference-prod",
    image: "ghcr.io/railflow/ml-inference:main",
    status: "running",
    health: "degraded",
    projectId: "p_ml",
    projectName: "ML Inference",
    command: "uvicorn app:app --host 0.0.0.0 --port 8000",
    created: hourAgo(2),
    uptime: 2 * 3600 + 14 * 60,
    ports: [{ host: 8000, container: 8000, protocol: "tcp" }],
    networks: ["railflow-net"],
    stats: {
      cpuPercent: 67.2,
      memoryUsedMb: 5234,
      memoryLimitMb: 8192,
      netInMb: 89.4,
      netOutMb: 142.7,
      blockReadMb: 89.2,
      blockWriteMb: 12.8,
      pids: 124,
    },
    labels: { "railflow.project": "p_ml", "railflow.env": "production" },
  },
  {
    id: "c_docs_1",
    name: "docs-prod",
    image: "ghcr.io/railflow/docs:main",
    status: "running",
    health: "healthy",
    projectId: "p_docs",
    projectName: "Documentation",
    command: "npx serve dist -l 4000",
    created: dayAgo(2),
    uptime: 2 * 86400 + 7 * 3600,
    ports: [{ host: 4000, container: 4000, protocol: "tcp" }],
    networks: ["railflow-net"],
    stats: {
      cpuPercent: 0.8,
      memoryUsedMb: 48,
      memoryLimitMb: 512,
      netInMb: 8.4,
      netOutMb: 23.6,
      blockReadMb: 0.4,
      blockWriteMb: 0.1,
      pids: 8,
    },
    labels: { "railflow.project": "p_docs", "railflow.env": "production" },
  },
  {
    id: "c_redis",
    name: "redis-cache",
    image: "redis:7.4-alpine",
    status: "running",
    health: "healthy",
    command: "redis-server --appendonly yes",
    created: dayAgo(45),
    uptime: 45 * 86400,
    ports: [{ host: 6379, container: 6379, protocol: "tcp" }],
    networks: ["railflow-net"],
    stats: {
      cpuPercent: 1.2,
      memoryUsedMb: 89,
      memoryLimitMb: 256,
      netInMb: 4.7,
      netOutMb: 6.1,
      blockReadMb: 0.8,
      blockWriteMb: 12.4,
      pids: 5,
    },
    labels: { "railflow.managed": "true", "railflow.type": "database" },
  },
  {
    id: "c_pg",
    name: "postgres-prod",
    image: "postgres:17-alpine",
    status: "running",
    health: "healthy",
    command: "postgres -c shared_buffers=2GB",
    created: dayAgo(245),
    uptime: 245 * 86400,
    ports: [{ host: 5432, container: 5432, protocol: "tcp" }],
    networks: ["railflow-net"],
    stats: {
      cpuPercent: 12.8,
      memoryUsedMb: 2156,
      memoryLimitMb: 4096,
      netInMb: 234.1,
      netOutMb: 189.7,
      blockReadMb: 156.3,
      blockWriteMb: 89.2,
      pids: 47,
    },
    labels: { "railflow.managed": "true", "railflow.type": "database" },
  },
  {
    id: "c_nginx",
    name: "edge-proxy",
    image: "nginx:1.27-alpine",
    status: "running",
    health: "healthy",
    command: "nginx -g 'daemon off;'",
    created: dayAgo(120),
    uptime: 120 * 86400,
    ports: [
      { host: 80, container: 80, protocol: "tcp" },
      { host: 443, container: 443, protocol: "tcp" },
    ],
    networks: ["railflow-edge"],
    stats: {
      cpuPercent: 3.4,
      memoryUsedMb: 78,
      memoryLimitMb: 512,
      netInMb: 1247.6,
      netOutMb: 1562.3,
      blockReadMb: 1.2,
      blockWriteMb: 4.8,
      pids: 11,
    },
    labels: { "railflow.managed": "true", "railflow.type": "proxy" },
  },
  {
    id: "c_old_mobile",
    name: "mobile-api-staging",
    image: "ghcr.io/railflow/mobile-api:develop",
    status: "stopped",
    health: "unknown",
    projectId: "p_mobile",
    projectName: "Mobile API",
    command: "node dist/main.js",
    created: dayAgo(8),
    uptime: 0,
    ports: [{ host: 3010, container: 3000, protocol: "tcp" }],
    networks: ["railflow-net"],
    stats: {
      cpuPercent: 0,
      memoryUsedMb: 0,
      memoryLimitMb: 2048,
      netInMb: 0,
      netOutMb: 0,
      blockReadMb: 0,
      blockWriteMb: 0,
      pids: 0,
    },
    labels: { "railflow.project": "p_mobile", "railflow.env": "staging" },
  },
];

// ---------- Deployments ----------
function makeStages(status: Deployment["status"], stages: Deployment["stages"] = []) {
  const baseStages: Deployment["stages"][number]["id"][] = ["queued", "cloning", "building", "pushing", "starting", "health", "done"];
  return baseStages.map((id, i) => {
    const existing = stages.find(s => s.id === id);
    if (existing) return existing;
    let s: "pending" | "running" | "success" | "failed" | "skipped" = "pending";
    if (status === "failed") {
      const failedAt = 3;
      if (i < failedAt) s = "success";
      else if (i === failedAt) s = "failed";
      else s = "skipped";
    } else if (status === "done") {
      s = "success";
    } else {
      const idx = baseStages.indexOf(status);
      if (i < idx) s = "success";
      else if (i === idx) s = "running";
    }
    return { id, status: s };
  });
}

export const mockDeployments: Deployment[] = [
  {
    id: "d_1",
    projectId: "p_ml",
    projectName: "ML Inference",
    status: "building",
    stage: "building",
    commitSha: "d9c1e2a",
    commitMessage: "chore: upgrade onnxruntime to 1.20",
    branch: "main",
    author: "Ahmed Hassan",
    authorAvatar: "https://i.pravatar.cc/40?img=12",
    environment: "production",
    triggeredBy: "manual",
    stages: makeStages("building"),
    startedAt: minAgo(3),
    url: "https://infer.railflow.io",
  },
  {
    id: "d_2",
    projectId: "p_web",
    projectName: "Web Platform",
    status: "done",
    stage: "done",
    commitSha: "a3f5c2e",
    commitMessage: "feat: ship onboarding v2 with RTL support",
    branch: "main",
    author: "Sara Mohamed",
    authorAvatar: "https://i.pravatar.cc/40?img=5",
    environment: "production",
    triggeredBy: "webhook",
    stages: makeStages("done"),
    startedAt: minAgo(14),
    finishedAt: minAgo(11),
    durationMs: 187_000,
    url: "https://railflow.io",
  },
  {
    id: "d_3",
    projectId: "p_api",
    projectName: "API Gateway",
    status: "done",
    stage: "done",
    commitSha: "b7e9d1f",
    commitMessage: "perf: reduce p99 latency by 22% via connection pooling",
    branch: "main",
    author: "Omar Khaled",
    authorAvatar: "https://i.pravatar.cc/40?img=8",
    environment: "production",
    triggeredBy: "webhook",
    stages: makeStages("done"),
    startedAt: hourAgo(3),
    finishedAt: hourAgo(3),
    durationMs: 145_000,
    url: "https://api.railflow.io",
  },
  {
    id: "d_4",
    projectId: "p_mobile",
    projectName: "Mobile API",
    status: "failed",
    stage: "building",
    commitSha: "f8a3d9e",
    commitMessage: "wip: experimental push notifications — known broken",
    branch: "develop",
    author: "Layla Ibrahim",
    authorAvatar: "https://i.pravatar.cc/40?img=20",
    environment: "staging",
    triggeredBy: "manual",
    stages: makeStages("failed"),
    startedAt: hourAgo(8),
    finishedAt: hourAgo(8),
    durationMs: 92_000,
    errorMessage: "Build failed: Cannot find module '@notifee/react-native' in src/push.ts:14:23",
  },
  {
    id: "d_5",
    projectId: "p_worker",
    projectName: "Background Workers",
    status: "done",
    stage: "done",
    commitSha: "c2a8f3b",
    commitMessage: "fix: properly handle dead-letter queue retries",
    branch: "main",
    author: "Yusuf Ali",
    authorAvatar: "https://i.pravatar.cc/40?img=15",
    environment: "production",
    triggeredBy: "webhook",
    stages: makeStages("done"),
    startedAt: hourAgo(11),
    finishedAt: hourAgo(11),
    durationMs: 64_000,
  },
  {
    id: "d_6",
    projectId: "p_web",
    projectName: "Web Platform",
    status: "done",
    stage: "done",
    commitSha: "9f2b1c8",
    commitMessage: "fix: dark mode toggle persists across reloads",
    branch: "main",
    author: "Sara Mohamed",
    authorAvatar: "https://i.pravatar.cc/40?img=5",
    environment: "production",
    triggeredBy: "webhook",
    stages: makeStages("done"),
    startedAt: hourAgo(20),
    finishedAt: hourAgo(20),
    durationMs: 178_000,
    url: "https://railflow.io",
  },
  {
    id: "d_7",
    projectId: "p_docs",
    projectName: "Documentation",
    status: "done",
    stage: "done",
    commitSha: "e5b2c4d",
    commitMessage: "docs: add Rust backend architecture page",
    branch: "main",
    author: "Ahmed Hassan",
    authorAvatar: "https://i.pravatar.cc/40?img=12",
    environment: "production",
    triggeredBy: "webhook",
    stages: makeStages("done"),
    startedAt: dayAgo(2),
    finishedAt: dayAgo(2),
    durationMs: 42_000,
    url: "https://docs.railflow.io",
  },
  {
    id: "d_8",
    projectId: "p_web",
    projectName: "Web Platform",
    status: "done",
    stage: "done",
    commitSha: "1a2b3c4",
    commitMessage: "feat: add bilingual i18n (ar/en) with RTL",
    branch: "main",
    author: "Sara Mohamed",
    authorAvatar: "https://i.pravatar.cc/40?img=5",
    environment: "preview",
    triggeredBy: "webhook",
    stages: makeStages("done"),
    startedAt: dayAgo(1),
    finishedAt: dayAgo(1),
    durationMs: 89_000,
    url: "https://preview-railflow-web.railflow.app",
  },
];

// ---------- Server Info ----------
export const mockServerInfo: ServerInfo = {
  hostname: "railflow-prod-01",
  os: "Ubuntu 24.04.2 LTS",
  kernel: "6.8.0-45-generic",
  uptime: 45 * 86400 + 7 * 3600 + 23 * 60,
  bootTime: dayAgo(45),
  cpu: {
    model: "AMD EPYC 9554P 64-Core Processor",
    cores: 16,
    physicalCores: 8,
    frequencyMhz: 3100,
    loadAvg1: 4.21,
    loadAvg5: 3.87,
    loadAvg15: 3.42,
    perCoreUsage: [42, 38, 67, 51, 23, 89, 31, 47, 58, 35, 71, 44, 29, 62, 56, 41],
    overallUsage: 46.9,
  },
  memory: {
    totalGb: 64,
    usedGb: 28.4,
    availableGb: 32.6,
    cachedGb: 3.0,
    swapTotalGb: 8,
    swapUsedGb: 0.2,
  },
  disk: {
    totalGb: 960,
    usedGb: 412,
    availableGb: 548,
    partitions: [
      { device: "/dev/nvme0n1p2", mount: "/", fsType: "ext4", totalGb: 200, usedGb: 87, usedPercent: 43.5 },
      { device: "/dev/nvme0n1p3", mount: "/var/lib/docker", fsType: "ext4", totalGb: 500, usedGb: 234, usedPercent: 46.8 },
      { device: "/dev/nvme0n1p4", mount: "/data", fsType: "ext4", totalGb: 200, usedGb: 78, usedPercent: 39.0 },
      { device: "/dev/sda1", mount: "/backups", fsType: "ext4", totalGb: 60, usedGb: 13, usedPercent: 21.7 },
    ],
  },
  network: {
    interfaces: [
      { name: "eth0", ip: "10.0.5.24", mac: "aa:bb:cc:dd:ee:01", inboundMbps: 423.7, outboundMbps: 612.4, totalInGb: 8924.5, totalOutGb: 12453.2, isUp: true },
      { name: "eth1", ip: "10.0.5.25", mac: "aa:bb:cc:dd:ee:02", inboundMbps: 0, outboundMbps: 0, totalInGb: 234.1, totalOutGb: 12.4, isUp: false },
      { name: "lo", ip: "127.0.0.1", mac: "00:00:00:00:00:00", inboundMbps: 12.4, outboundMbps: 12.4, totalInGb: 89.2, totalOutGb: 89.2, isUp: true },
    ],
  },
  docker: {
    version: "27.3.1",
    containersTotal: 12,
    containersRunning: 8,
    containersStopped: 4,
    images: 47,
    storageDriver: "overlay2",
  },
};

// ---------- Processes ----------
export const mockProcesses: ProcessInfo[] = [
  { pid: 1, name: "systemd", user: "root", cpuPercent: 0.0, memoryMb: 12.4, memoryPercent: 0.02, status: "S", startTime: dayAgo(45), command: "/sbin/init" },
  { pid: 1247, name: "dockerd", user: "root", cpuPercent: 4.2, memoryMb: 412.8, memoryPercent: 0.63, status: "S", startTime: dayAgo(45), command: "/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock" },
  { pid: 1289, name: "containerd", user: "root", cpuPercent: 1.8, memoryMb: 187.3, memoryPercent: 0.29, status: "S", startTime: dayAgo(45), command: "/usr/bin/containerd" },
  { pid: 4521, name: "nginx", user: "www-data", cpuPercent: 3.4, memoryMb: 78.4, memoryPercent: 0.12, status: "S", startTime: dayAgo(120), command: "nginx: master process /usr/sbin/nginx -g 'daemon off;'" },
  { pid: 8932, name: "api-gateway", user: "railflow", cpuPercent: 23.7, memoryMb: 287.4, memoryPercent: 0.44, status: "S", startTime: dayAgo(3), command: "./api-gateway --config /etc/railflow/config.toml" },
  { pid: 9012, name: "next-server", user: "railflow", cpuPercent: 8.4, memoryMb: 412.1, memoryPercent: 0.63, status: "S", startTime: dayAgo(14), command: "next-server (v16.1.3)" },
  { pid: 9234, name: "uvicorn", user: "railflow", cpuPercent: 67.2, memoryMb: 5234.8, memoryPercent: 7.99, status: "R", startTime: hourAgo(2), command: "uvicorn app:app --host 0.0.0.0 --port 8000" },
  { pid: 9456, name: "postgres", user: "postgres", cpuPercent: 12.8, memoryMb: 2156.3, memoryPercent: 3.29, status: "S", startTime: dayAgo(245), command: "postgres: 17/main: /usr/lib/postgresql/17/bin/postgres -D /var/lib/postgresql/17/main -c shared_buffers=2GB" },
  { pid: 9678, name: "redis-server", user: "redis", cpuPercent: 1.2, memoryMb: 89.4, memoryPercent: 0.14, status: "S", startTime: dayAgo(45), command: "redis-server *:6379" },
  { pid: 9876, name: "worker", user: "railflow", cpuPercent: 4.1, memoryMb: 156.2, memoryPercent: 0.24, status: "S", startTime: dayAgo(11), command: "./worker" },
  { pid: 10023, name: "node", user: "railflow", cpuPercent: 0.8, memoryMb: 48.2, memoryPercent: 0.07, status: "S", startTime: dayAgo(2), command: "npx serve dist -l 4000" },
  { pid: 10567, name: "cadvisor", user: "root", cpuPercent: 2.1, memoryMb: 134.7, memoryPercent: 0.21, status: "S", startTime: dayAgo(45), command: "/usr/bin/cadvisor --port=8081" },
  { pid: 10789, name: "prometheus", user: "prometheus", cpuPercent: 1.7, memoryMb: 287.5, memoryPercent: 0.44, status: "S", startTime: dayAgo(45), command: "/usr/bin/prometheus --config.file=/etc/prometheus/prometheus.yml" },
  { pid: 10901, name: "grafana-server", user: "grafana", cpuPercent: 0.4, memoryMb: 198.3, memoryPercent: 0.30, status: "S", startTime: dayAgo(45), command: "/usr/sbin/grafana server --config=/etc/grafana/grafana.ini" },
  { pid: 11022, name: "sshd", user: "root", cpuPercent: 0.0, memoryMb: 8.4, memoryPercent: 0.01, status: "S", startTime: dayAgo(45), command: "/usr/sbin/sshd -D" },
];

// ---------- Docker Events ----------
export const mockDockerEvents: DockerEvent[] = [
  { id: "e_1", type: "container", action: "start", actor: { id: "c_ml_1", attributes: { name: "ml-inference-prod", image: "ghcr.io/railflow/ml-inference:main" } }, scope: "local", time: minAgo(2), message: "Container ml-inference-prod started" },
  { id: "e_2", type: "image", action: "pull", actor: { id: "sha256:d9c1e2a", attributes: { name: "ghcr.io/railflow/ml-inference:main" } }, scope: "local", time: minAgo(3), message: "Pulled image ghcr.io/railflow/ml-inference:main" },
  { id: "e_3", type: "container", action: "stop", actor: { id: "c_old_mobile", attributes: { name: "mobile-api-staging" } }, scope: "local", time: hourAgo(8), message: "Container mobile-api-staging stopped (exit code 1)" },
  { id: "e_4", type: "container", action: "health_status: unhealthy", actor: { id: "c_old_mobile", attributes: { name: "mobile-api-staging" } }, scope: "local", time: hourAgo(8), message: "Container mobile-api-staging became unhealthy" },
  { id: "e_5", type: "container", action: "start", actor: { id: "c_web_1", attributes: { name: "web-platform-prod" } }, scope: "local", time: minAgo(11), message: "Container web-platform-prod started" },
  { id: "e_6", type: "image", action: "pull", actor: { id: "sha256:a3f5c2e", attributes: { name: "ghcr.io/railflow/web-platform:main" } }, scope: "local", time: minAgo(13), message: "Pulled image ghcr.io/railflow/web-platform:main" },
  { id: "e_7", type: "container", action: "health_status: healthy", actor: { id: "c_web_1", attributes: { name: "web-platform-prod" } }, scope: "local", time: minAgo(10), message: "Container web-platform-prod became healthy" },
  { id: "e_8", type: "network", action: "connect", actor: { id: "railflow-net", attributes: { container: "c_ml_1" } }, scope: "local", time: minAgo(2), message: "Container c_ml_1 connected to network railflow-net" },
];

// ---------- Environment Variables (for Web Platform) ----------
export const mockEnvVariables: EnvVariable[] = [
  { id: "v_1", key: "NODE_ENV", value: "production", isSecret: false, isSensitive: false, createdAt: dayAgo(245), updatedAt: dayAgo(245) },
  { id: "v_2", key: "DATABASE_URL", value: "postgres://railflow:••••••••@postgres-prod:5432/railflow", isSecret: true, isSensitive: true, createdAt: dayAgo(245), updatedAt: dayAgo(45) },
  { id: "v_3", key: "REDIS_URL", value: "redis://redis-cache:6379/0", isSecret: false, isSensitive: false, createdAt: dayAgo(245), updatedAt: dayAgo(245) },
  { id: "v_4", key: "JWT_SECRET", value: "••••••••••••••••••••••••", isSecret: true, isSensitive: true, createdAt: dayAgo(245), updatedAt: dayAgo(30) },
  { id: "v_5", key: "GITHUB_CLIENT_ID", value: "Iv1.abc123def456", isSecret: false, isSensitive: false, createdAt: dayAgo(120), updatedAt: dayAgo(120) },
  { id: "v_6", key: "GITHUB_CLIENT_SECRET", value: "••••••••••••••••", isSecret: true, isSensitive: true, createdAt: dayAgo(120), updatedAt: dayAgo(120) },
  { id: "v_7", key: "STRIPE_SECRET_KEY", value: "sk_live_••••••••••••••••", isSecret: true, isSensitive: true, createdAt: dayAgo(89), updatedAt: dayAgo(89) },
  { id: "v_8", key: "SENTRY_DSN", value: "https://abc123@o789.ingest.sentry.io/123", isSecret: false, isSensitive: true, createdAt: dayAgo(60), updatedAt: dayAgo(60) },
  { id: "v_9", key: "LOG_LEVEL", value: "info", isSecret: false, isSensitive: false, createdAt: dayAgo(245), updatedAt: dayAgo(245) },
  { id: "v_10", key: "PORT", value: "3000", isSecret: false, isSensitive: false, createdAt: dayAgo(245), updatedAt: dayAgo(245) },
];

// ---------- API Keys ----------
export const mockApiKeys: ApiKey[] = [
  { id: "k_1", name: "CI/CD Pipeline", prefix: "rf_live_8K9p2X", scopes: ["deploy:create", "deploy:read", "project:read"], lastUsedAt: minAgo(14), createdAt: dayAgo(89) },
  { id: "k_2", name: "Monitoring (Grafana)", prefix: "rf_live_4M7n8Q", scopes: ["metrics:read", "logs:read"], lastUsedAt: minAgo(2), createdAt: dayAgo(120) },
  { id: "k_3", name: "Mobile App Backend", prefix: "rf_live_2R5t9L", scopes: ["project:read"], lastUsedAt: dayAgo(7), createdAt: dayAgo(45) },
  { id: "k_4", name: "Legacy Webhook (deprecated)", prefix: "rf_live_9B3k1Y", scopes: ["webhook:send"], lastUsedAt: dayAgo(124), createdAt: dayAgo(245), expiresAt: dayAgo(-30) },
];

// ---------- Sessions ----------
export const mockSessions: Session[] = [
  { id: "s_1", device: "MacBook Pro 16\"", browser: "Chrome 138", os: "macOS 15.2", ip: "156.21x.x.x", location: "Cairo, EG", current: true, lastActiveAt: minAgo(0), createdAt: hourAgo(2) },
  { id: "s_2", device: "iPhone 16 Pro", browser: "Safari Mobile", os: "iOS 18.2", ip: "156.21x.x.x", location: "Cairo, EG", current: false, lastActiveAt: hourAgo(6), createdAt: dayAgo(1) },
  { id: "s_3", device: "Linux Workstation", browser: "Firefox 132", os: "Ubuntu 24.04", ip: "10.0.x.x", location: "Cairo, EG", current: false, lastActiveAt: dayAgo(2), createdAt: dayAgo(7) },
  { id: "s_4", device: "iPad Air", browser: "Safari Mobile", os: "iPadOS 18.2", ip: "197.43.x.x", location: "Alexandria, EG", current: false, lastActiveAt: dayAgo(5), createdAt: dayAgo(14) },
];

// ---------- Logs ----------
const logMessages: Array<[LogEntry["level"], string]> = [
  ["info", "Server listening on port 3000"],
  ["info", "Worker connected to Redis at redis-cache:6379"],
  ["success", "Health check passed (status=200, ms=42)"],
  ["info", "POST /api/v1/deployments 201 87ms"],
  ["info", "GET /api/v1/projects 200 12ms"],
  ["warn", "Rate limit threshold reached for IP 197.43.x.x (1000 req/min)"],
  ["info", "WebSocket connection established (client=c_8x2a)"],
  ["success", "Build completed in 87s (size: 4.2MB)"],
  ["info", "Image pushed to ghcr.io/railflow/web-platform:main"],
  ["error", "Failed to connect to stripe API (timeout after 5000ms) — retrying in 3s"],
  ["info", "Stripe API retry succeeded (attempt 2)"],
  ["debug", "Cache hit for key user:42:profile"],
  ["success", "Deployment d_2 marked as live"],
  ["info", "Container c_web_1 health status: healthy"],
  ["warn", "Memory usage at 78% on container c_ml_1"],
  ["info", "GET /api/v1/containers 200 28ms"],
  ["error", "Build failed: Cannot find module '@notifee/react-native'"],
  ["info", "Pulling image ghcr.io/railflow/ml-inference:main (1.2GB)"],
  ["success", "Image pulled successfully"],
  ["info", "Starting container ml-inference-prod"],
];

export function generateLogs(count: number = 50): LogEntry[] {
  const out: LogEntry[] = [];
  for (let i = 0; i < count; i++) {
    const [level, msg] = logMessages[Math.floor(Math.random() * logMessages.length)];
    out.push({
      id: `log_${i}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(now - i * (5_000 + Math.random() * 15_000)).toISOString(),
      level,
      source: ["api", "worker", "web", "docker", "scheduler"][Math.floor(Math.random() * 5)],
      message: msg,
    });
  }
  return out;
}

// ---------- Time Series ----------
export function generateTimeSeries(
  points: number = 60,
  base: number = 50,
  variance: number = 20,
  intervalMs: number = 60_000,
  unit: string = "%"
): TimeSeries {
  const pts = Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(now - (points - i) * intervalMs).toISOString(),
    value: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance * 2 + Math.sin(i / 8) * 5)),
  }));
  return { name: "default", points: pts, unit };
}

export function generateMultiSeries(): {
  cpu: TimeSeries;
  memory: TimeSeries;
  network: TimeSeries;
  deployments: TimeSeries;
} {
  return {
    cpu: { ...generateTimeSeries(60, 46, 18), name: "CPU", color: "oklch(0.72 0.22 295)" },
    memory: { ...generateTimeSeries(60, 44, 12), name: "Memory", color: "oklch(0.78 0.17 190)" },
    network: { ...generateTimeSeries(60, 30, 25), name: "Network", color: "oklch(0.75 0.2 145)" },
    deployments: {
      name: "Deployments",
      unit: "count",
      color: "oklch(0.78 0.18 75)",
      points: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(now - (24 - i) * 3_600_000).toISOString(),
        value: Math.floor(Math.random() * 5) + 1,
      })),
    },
  };
}

// ---------- Managed Databases ----------
export const mockDatabases: ManagedDatabase[] = [
  {
    id: "db_pg",
    name: "postgres-prod",
    engine: "postgresql",
    version: "17.2",
    status: "running",
    health: "healthy",
    region: "fra1",
    plan: "large",
    connectionInfo: {
      host: "postgres-prod.railflow.internal",
      port: 5432,
      database: "railflow",
      username: "railflow",
      passwordMasked: "••••••••••••",
      internalUrl: "postgres://railflow:••••@postgres-prod:5432/railflow",
      externalUrl: "postgres://fra1.db.railflow.io:5432/railflow",
    },
    storage: { usedGb: 23.4, totalGb: 100 },
    stats: { connections: 47, maxConnections: 100, queriesPerSecond: 234.8, cpuPercent: 12.8, memoryMb: 2156 },
    backups: { enabled: true, lastBackupAt: hourAgo(6), nextBackupAt: hourAgo(-18), retention: 30 },
    projectId: "p_web",
    createdAt: dayAgo(245),
    containerId: "c_pg",
  },
  {
    id: "db_redis",
    name: "redis-cache",
    engine: "redis",
    version: "7.4",
    status: "running",
    health: "healthy",
    region: "fra1",
    plan: "small",
    connectionInfo: {
      host: "redis-cache.railflow.internal",
      port: 6379,
      database: "0",
      username: "default",
      passwordMasked: "••••••••",
      internalUrl: "redis://redis-cache:6379/0",
    },
    storage: { usedGb: 0.4, totalGb: 2 },
    stats: { connections: 18, maxConnections: 1000, queriesPerSecond: 1284.3, cpuPercent: 1.2, memoryMb: 89 },
    backups: { enabled: true, lastBackupAt: hourAgo(12), nextBackupAt: hourAgo(-12), retention: 7 },
    projectId: "p_api",
    createdAt: dayAgo(120),
    containerId: "c_redis",
  },
  {
    id: "db_pg_workers",
    name: "workers-db",
    engine: "postgresql",
    version: "17.2",
    status: "running",
    health: "healthy",
    region: "fra1",
    plan: "medium",
    connectionInfo: {
      host: "workers-db.railflow.internal",
      port: 5432,
      database: "workers",
      username: "railflow",
      passwordMasked: "••••••••",
      internalUrl: "postgres://railflow:••••@workers-db:5432/workers",
    },
    storage: { usedGb: 4.2, totalGb: 50 },
    stats: { connections: 12, maxConnections: 50, queriesPerSecond: 47.3, cpuPercent: 3.4, memoryMb: 412 },
    backups: { enabled: true, lastBackupAt: hourAgo(6), nextBackupAt: hourAgo(-18), retention: 14 },
    projectId: "p_worker",
    createdAt: dayAgo(188),
    containerId: "c_pg_workers",
  },
  {
    id: "db_mongo",
    name: "ml-storage",
    engine: "mongodb",
    version: "7.0",
    status: "running",
    health: "degraded",
    region: "fra1",
    plan: "xlarge",
    connectionInfo: {
      host: "ml-storage.railflow.internal",
      port: 27017,
      database: "ml_data",
      username: "railflow",
      passwordMasked: "••••••••••",
      internalUrl: "mongodb://railflow:••••@ml-storage:27017/ml_data",
    },
    storage: { usedGb: 412.8, totalGb: 500 },
    stats: { connections: 32, maxConnections: 200, queriesPerSecond: 87.4, cpuPercent: 34.2, memoryMb: 4128 },
    backups: { enabled: false, retention: 0 },
    projectId: "p_ml",
    createdAt: dayAgo(64),
    containerId: "c_mongo",
  },
  {
    id: "db_mysql",
    name: "legacy-mysql",
    engine: "mysql",
    version: "8.4",
    status: "stopped",
    health: "unknown",
    region: "fra1",
    plan: "small",
    connectionInfo: {
      host: "legacy-mysql.railflow.internal",
      port: 3306,
      database: "legacy",
      username: "root",
      passwordMasked: "••••••••",
      internalUrl: "mysql://root:••••@legacy-mysql:3306/legacy",
    },
    storage: { usedGb: 1.8, totalGb: 10 },
    stats: { connections: 0, maxConnections: 100, queriesPerSecond: 0, cpuPercent: 0, memoryMb: 0 },
    backups: { enabled: true, lastBackupAt: dayAgo(3), retention: 30 },
    createdAt: dayAgo(312),
    containerId: "c_mysql",
  },
];

// ---------- Docker Volumes ----------
export const mockVolumes: DockerVolume[] = [
  { id: "v_pg_data", name: "postgres-data", driver: "local", mountpoint: "/var/lib/docker/volumes/postgres-data/_data", sizeMb: 23400, inUse: true, containers: ["postgres-prod"], labels: { "railflow.managed": "true" }, scope: "local", createdAt: dayAgo(245) },
  { id: "v_redis_data", name: "redis-data", driver: "local", mountpoint: "/var/lib/docker/volumes/redis-data/_data", sizeMb: 412, inUse: true, containers: ["redis-cache"], labels: { "railflow.managed": "true" }, scope: "local", createdAt: dayAgo(120) },
  { id: "v_ml_models", name: "ml-models", driver: "local", mountpoint: "/var/lib/docker/volumes/ml-models/_data", sizeMb: 89400, inUse: true, containers: ["ml-inference-prod"], labels: { "railflow.project": "p_ml" }, scope: "local", createdAt: dayAgo(64) },
  { id: "v_workers_db", name: "workers-db-data", driver: "local", mountpoint: "/var/lib/docker/volumes/workers-db-data/_data", sizeMb: 4200, inUse: true, containers: ["workers-db"], labels: { "railflow.managed": "true" }, scope: "local", createdAt: dayAgo(188) },
  { id: "v_nginx_logs", name: "nginx-logs", driver: "local", mountpoint: "/var/lib/docker/volumes/nginx-logs/_data", sizeMb: 124, inUse: true, containers: ["edge-proxy"], labels: {}, scope: "local", createdAt: dayAgo(120) },
  { id: "v_mongo_data", name: "mongo-data", driver: "local", mountpoint: "/var/lib/docker/volumes/mongo-data/_data", sizeMb: 412800, inUse: true, containers: ["ml-storage"], labels: { "railflow.managed": "true" }, scope: "local", createdAt: dayAgo(64) },
  { id: "v_old_backup", name: "old-backup-2024", driver: "local", mountpoint: "/var/lib/docker/volumes/old-backup-2024/_data", sizeMb: 8920, inUse: false, containers: [], labels: {}, scope: "local", createdAt: dayAgo(356) },
  { id: "v_grafana", name: "grafana-data", driver: "local", mountpoint: "/var/lib/docker/volumes/grafana-data/_data", sizeMb: 312, inUse: true, containers: ["grafana-server"], labels: {}, scope: "local", createdAt: dayAgo(45) },
];

// ---------- Docker Networks ----------
export const mockNetworks: DockerNetwork[] = [
  {
    id: "n_railflow",
    name: "railflow-net",
    driver: "bridge",
    scope: "local",
    subnet: "172.20.0.0/16",
    gateway: "172.20.0.1",
    containers: [
      { id: "c_web_1", name: "web-platform-prod", ipv4: "172.20.0.2" },
      { id: "c_api_1", name: "api-gateway-prod", ipv4: "172.20.0.3" },
      { id: "c_worker_1", name: "workers-prod", ipv4: "172.20.0.4" },
      { id: "c_ml_1", name: "ml-inference-prod", ipv4: "172.20.0.5" },
      { id: "c_docs_1", name: "docs-prod", ipv4: "172.20.0.6" },
      { id: "c_pg", name: "postgres-prod", ipv4: "172.20.0.10" },
      { id: "c_redis", name: "redis-cache", ipv4: "172.20.0.11" },
    ],
    labels: { "railflow.managed": "true" },
    createdAt: dayAgo(245),
    internal: false,
    attachable: true,
    ingress: false,
  },
  {
    id: "n_edge",
    name: "railflow-edge",
    driver: "bridge",
    scope: "local",
    subnet: "172.21.0.0/16",
    gateway: "172.21.0.1",
    containers: [
      { id: "c_nginx", name: "edge-proxy", ipv4: "172.21.0.2" },
    ],
    labels: {},
    createdAt: dayAgo(120),
    internal: false,
    attachable: false,
    ingress: true,
  },
  {
    id: "n_ml",
    name: "ml-internal",
    driver: "bridge",
    scope: "local",
    subnet: "172.22.0.0/16",
    gateway: "172.22.0.1",
    containers: [
      { id: "c_ml_1", name: "ml-inference-prod", ipv4: "172.22.0.2" },
      { id: "c_mongo", name: "ml-storage", ipv4: "172.22.0.3" },
    ],
    labels: { "railflow.project": "p_ml" },
    createdAt: dayAgo(64),
    internal: true,
    attachable: true,
    ingress: false,
  },
  {
    id: "n_host",
    name: "host",
    driver: "host",
    scope: "local",
    subnet: "—",
    gateway: "—",
    containers: [],
    labels: {},
    createdAt: dayAgo(456),
    internal: false,
    attachable: false,
    ingress: false,
  },
  {
    id: "n_none",
    name: "none",
    driver: "none",
    scope: "local",
    subnet: "—",
    gateway: "—",
    containers: [],
    labels: {},
    createdAt: dayAgo(456),
    internal: true,
    attachable: false,
    ingress: false,
  },
];

// ---------- Activity Log ----------
export const mockActivity: ActivityEntry[] = [
  { id: "a_1", timestamp: minAgo(2), actor: { name: "Ahmed Hassan", avatarUrl: "https://i.pravatar.cc/40?img=12", type: "user" }, action: "triggered deployment", category: "deployment", resource: { type: "project", id: "p_ml", name: "ML Inference" }, metadata: { commit: "d9c1e2a", branch: "main" }, ip: "156.21x.x.x" },
  { id: "a_2", timestamp: minAgo(14), actor: { name: "GitHub Webhook", avatarUrl: "", type: "webhook" }, action: "auto-deployed", category: "deployment", resource: { type: "project", id: "p_web", name: "Web Platform" }, metadata: { commit: "a3f5c2e", branch: "main", author: "Sara Mohamed" } },
  { id: "a_3", timestamp: minAgo(47), actor: { name: "Sara Mohamed", avatarUrl: "https://i.pravatar.cc/40?img=5", type: "user" }, action: "added environment variable", category: "project", resource: { type: "project", id: "p_web", name: "Web Platform" }, metadata: { key: "SENTRY_DSN", secret: "true" }, ip: "156.21x.x.x" },
  { id: "a_4", timestamp: hourAgo(2), actor: { name: "Ahmed Hassan", avatarUrl: "https://i.pravatar.cc/40?img=12", type: "user" }, action: "stopped container", category: "container", resource: { type: "container", id: "c_old_mobile", name: "mobile-api-staging" }, ip: "156.21x.x.x" },
  { id: "a_5", timestamp: hourAgo(3), actor: { name: "GitHub Webhook", avatarUrl: "", type: "webhook" }, action: "auto-deployed", category: "deployment", resource: { type: "project", id: "p_api", name: "API Gateway" }, metadata: { commit: "b7e9d1f", branch: "main", author: "Omar Khaled" } },
  { id: "a_6", timestamp: hourAgo(5), actor: { name: "Omar Khaled", avatarUrl: "https://i.pravatar.cc/40?img=8", type: "user" }, action: "updated build settings", category: "project", resource: { type: "project", id: "p_api", name: "API Gateway" }, metadata: { field: "build_command" }, ip: "10.0.x.x" },
  { id: "a_7", timestamp: hourAgo(6), actor: { name: "System", avatarUrl: "", type: "system" }, action: "completed backup", category: "database", resource: { type: "database", id: "db_pg", name: "postgres-prod" }, metadata: { size_mb: "23400", duration_ms: "47200" } },
  { id: "a_8", timestamp: hourAgo(8), actor: { name: "Layla Ibrahim", avatarUrl: "https://i.pravatar.cc/40?img=20", type: "user" }, action: "deployment failed", category: "deployment", resource: { type: "project", id: "p_mobile", name: "Mobile API" }, metadata: { error: "Build failed", commit: "f8a3d9e" }, ip: "197.43.x.x" },
  { id: "a_9", timestamp: hourAgo(11), actor: { name: "GitHub Webhook", avatarUrl: "", type: "webhook" }, action: "auto-deployed", category: "deployment", resource: { type: "project", id: "p_worker", name: "Background Workers" }, metadata: { commit: "c2a8f3b", branch: "main", author: "Yusuf Ali" } },
  { id: "a_10", timestamp: hourAgo(20), actor: { name: "Sara Mohamed", avatarUrl: "https://i.pravatar.cc/40?img=5", type: "user" }, action: "created API key", category: "settings", resource: { type: "api_key", id: "k_1", name: "CI/CD Pipeline" }, ip: "156.21x.x.x" },
  { id: "a_11", timestamp: dayAgo(1), actor: { name: "Yusuf Ali", avatarUrl: "https://i.pravatar.cc/40?img=15", type: "user" }, action: "joined team", category: "settings", resource: { type: "team", id: "u_yusuf", name: "Yusuf Ali" }, ip: "156.21x.x.x" },
  { id: "a_12", timestamp: dayAgo(2), actor: { name: "GitHub Webhook", avatarUrl: "", type: "webhook" }, action: "auto-deployed", category: "deployment", resource: { type: "project", id: "p_docs", name: "Documentation" }, metadata: { commit: "e5b2c4d", branch: "main" } },
  { id: "a_13", timestamp: dayAgo(3), actor: { name: "Ahmed Hassan", avatarUrl: "https://i.pravatar.cc/40?img=12", type: "user" }, action: "enabled 2FA", category: "auth", resource: { type: "user", id: "u_1", name: "Ahmed Hassan" }, ip: "156.21x.x.x" },
  { id: "a_14", timestamp: dayAgo(5), actor: { name: "System", avatarUrl: "", type: "system" }, action: "SSL certificate renewed", category: "settings", resource: { type: "certificate", id: "cert_1", name: "railflow.io" }, metadata: { issuer: "Let's Encrypt" } },
  { id: "a_15", timestamp: dayAgo(7), actor: { name: "Omar Khaled", avatarUrl: "https://i.pravatar.cc/40?img=8", type: "user" }, action: "deleted project", category: "project", resource: { type: "project", id: "p_old_legacy", name: "Legacy Backend" }, ip: "10.0.x.x" },
];

// ---------- Team Members ----------
export const mockTeam: TeamMember[] = [
  { id: "u_1", name: "Ahmed Hassan", email: "ahmed@railflow.io", avatarUrl: "https://i.pravatar.cc/100?img=12", role: "owner", status: "active", lastActiveAt: minAgo(0), joinedAt: dayAgo(245), twoFactorEnabled: true, projectsCount: 6, permissions: ["*"] },
  { id: "u_2", name: "Sara Mohamed", email: "sara@railflow.io", avatarUrl: "https://i.pravatar.cc/100?img=5", role: "admin", status: "active", lastActiveAt: minAgo(14), joinedAt: dayAgo(180), twoFactorEnabled: true, projectsCount: 3, permissions: ["project:*", "deploy:*", "container:*"] },
  { id: "u_3", name: "Omar Khaled", email: "omar@railflow.io", avatarUrl: "https://i.pravatar.cc/100?img=8", role: "developer", status: "active", lastActiveAt: hourAgo(3), joinedAt: dayAgo(89), twoFactorEnabled: true, projectsCount: 2, permissions: ["project:read", "project:write", "deploy:create"] },
  { id: "u_4", name: "Layla Ibrahim", email: "layla@railflow.io", avatarUrl: "https://i.pravatar.cc/100?img=20", role: "developer", status: "active", lastActiveAt: hourAgo(8), joinedAt: dayAgo(45), twoFactorEnabled: false, projectsCount: 1, permissions: ["project:read", "project:write", "deploy:create"] },
  { id: "u_5", name: "Yusuf Ali", email: "yusuf@railflow.io", avatarUrl: "https://i.pravatar.cc/100?img=15", role: "developer", status: "active", lastActiveAt: hourAgo(11), joinedAt: dayAgo(1), twoFactorEnabled: true, projectsCount: 1, permissions: ["project:read", "project:write", "deploy:create"] },
  { id: "u_6", name: "Mariam Saleh", email: "mariam@railflow.io", avatarUrl: "https://i.pravatar.cc/100?img=32", role: "viewer", status: "active", lastActiveAt: dayAgo(2), joinedAt: dayAgo(60), twoFactorEnabled: false, projectsCount: 0, permissions: ["project:read", "metrics:read"] },
  { id: "u_7", name: "Khalid Nasser", email: "khalid@external.com", avatarUrl: "https://i.pravatar.cc/100?img=24", role: "viewer", status: "invited", joinedAt: dayAgo(1), twoFactorEnabled: false, projectsCount: 0, permissions: ["project:read"] },
];

export const mockInvites: TeamInvite[] = [
  { id: "inv_1", email: "khalid@external.com", role: "viewer", invitedBy: "Ahmed Hassan", invitedAt: dayAgo(1), expiresAt: dayAgo(-6), status: "pending" },
  { id: "inv_2", email: "intern@railflow.io", role: "viewer", invitedBy: "Sara Mohamed", invitedAt: dayAgo(2), expiresAt: dayAgo(-5), status: "pending" },
];

// ---------- Backups ----------
export const mockBackups: Backup[] = [
  { id: "b_1", databaseId: "db_pg", databaseName: "postgres-prod", type: "automatic", status: "completed", sizeMb: 23400, startedAt: hourAgo(6), finishedAt: hourAgo(6), durationMs: 47200, storageLocation: "s3://railflow-backups/postgres-prod/2026-07-22/", retentionExpiresAt: dayAgo(-24) },
  { id: "b_2", databaseId: "db_redis", databaseName: "redis-cache", type: "automatic", status: "completed", sizeMb: 412, startedAt: hourAgo(12), finishedAt: hourAgo(12), durationMs: 12400, storageLocation: "s3://railflow-backups/redis-cache/2026-07-22/", retentionExpiresAt: dayAgo(-5) },
  { id: "b_3", databaseId: "db_pg_workers", databaseName: "workers-db", type: "automatic", status: "completed", sizeMb: 4200, startedAt: hourAgo(6), finishedAt: hourAgo(6), durationMs: 8900, storageLocation: "s3://railflow-backups/workers-db/2026-07-22/", retentionExpiresAt: dayAgo(-8) },
  { id: "b_4", projectId: "p_web", projectName: "Web Platform", type: "pre-deploy", status: "completed", sizeMb: 89, startedAt: minAgo(14), finishedAt: minAgo(13), durationMs: 47800, storageLocation: "local:/backups/web-platform/", retentionExpiresAt: dayAgo(-3) },
  { id: "b_5", databaseId: "db_pg", databaseName: "postgres-prod", type: "automatic", status: "in_progress", sizeMb: 0, startedAt: minAgo(2), storageLocation: "s3://railflow-backups/postgres-prod/2026-07-22-2/" },
  { id: "b_6", databaseId: "db_pg", databaseName: "postgres-prod", type: "manual", status: "completed", sizeMb: 22800, startedAt: dayAgo(1), finishedAt: dayAgo(1), durationMs: 45200, storageLocation: "s3://railflow-backups/postgres-prod/2026-07-21/", retentionExpiresAt: dayAgo(-29) },
  { id: "b_7", projectId: "p_mobile", projectName: "Mobile API", type: "pre-deploy", status: "failed", sizeMb: 0, startedAt: hourAgo(8), finishedAt: hourAgo(8), durationMs: 2100, storageLocation: "—" },
];

// ---------- SSL Certificates ----------
export const mockCertificates: Certificate[] = [
  { id: "cert_1", domain: "railflow.io", type: "lets-encrypt", status: "active", issuer: "Let's Encrypt R3", issuedAt: dayAgo(45), expiresAt: dayAgo(-45), autoRenew: true, projectId: "p_web", fingerprint: "a3f5c2e8b9d1e4f7" },
  { id: "cert_2", domain: "api.railflow.io", type: "lets-encrypt", status: "active", issuer: "Let's Encrypt R3", issuedAt: dayAgo(45), expiresAt: dayAgo(-45), autoRenew: true, projectId: "p_api", fingerprint: "b7e9d1f5a2c8e3d6" },
  { id: "cert_3", domain: "docs.railflow.io", type: "lets-encrypt", status: "active", issuer: "Let's Encrypt R3", issuedAt: dayAgo(30), expiresAt: dayAgo(-60), autoRenew: true, projectId: "p_docs", fingerprint: "e5b2c4d8f1a7b9e2" },
  { id: "cert_4", domain: "infer.railflow.io", type: "lets-encrypt", status: "active", issuer: "Let's Encrypt R3", issuedAt: dayAgo(60), expiresAt: dayAgo(-30), autoRenew: true, projectId: "p_ml", fingerprint: "d9c1e2a5b7f3c8d4" },
  { id: "cert_5", domain: "*.preview.railflow.app", type: "wildcard", status: "active", issuer: "Let's Encrypt R3", issuedAt: dayAgo(15), expiresAt: dayAgo(-75), autoRenew: true, fingerprint: "f8a3d9e1c2b4e5a7" },
  { id: "cert_6", domain: "m.railflow.io", type: "lets-encrypt", status: "expired", issuer: "Let's Encrypt R3", issuedAt: dayAgo(95), expiresAt: dayAgo(5), autoRenew: false, projectId: "p_mobile", fingerprint: "c2a8f3b6d9e1a4c8" },
  { id: "cert_7", domain: "staging.railflow.io", type: "custom", status: "renewing", issuer: "DigiCert Inc", issuedAt: dayAgo(80), expiresAt: dayAgo(10), autoRenew: true, fingerprint: "9f2b1c8a4d3e7b2f" },
];

// ---------- Deploy Strategy Configs ----------
export const mockDeployStrategies: DeployStrategyConfig[] = [
  { projectId: "p_web", strategy: "blue-green", healthCheckPath: "/api/health", healthCheckTimeout: 30, healthCheckInterval: 10, switchAfterHealthySeconds: 60, rollbackOnError: true, rollbackThreshold: 5 },
  { projectId: "p_api", strategy: "canary", healthCheckPath: "/health", healthCheckTimeout: 15, healthCheckInterval: 5, canaryPercent: 10, canaryObserveMinutes: 15, rollbackOnError: true, rollbackThreshold: 2 },
  { projectId: "p_worker", strategy: "rolling", healthCheckPath: "/healthz", healthCheckTimeout: 20, healthCheckInterval: 10, rollbackOnError: false, rollbackThreshold: 10 },
  { projectId: "p_ml", strategy: "canary", healthCheckPath: "/health", healthCheckTimeout: 45, healthCheckInterval: 15, canaryPercent: 5, canaryObserveMinutes: 30, rollbackOnError: true, rollbackThreshold: 1 },
  { projectId: "p_docs", strategy: "rolling", healthCheckPath: "/", healthCheckTimeout: 10, healthCheckInterval: 5, rollbackOnError: false, rollbackThreshold: 20 },
  { projectId: "p_mobile", strategy: "rolling", healthCheckPath: "/health", healthCheckTimeout: 20, healthCheckInterval: 10, rollbackOnError: true, rollbackThreshold: 5 },
];

// ---------- Environments ----------
export const mockEnvironments: Environment[] = [
  { id: "env_web_prod", projectId: "p_web", name: "Production", tier: "production", status: "active", url: "https://railflow.io", domain: "railflow.io", branch: "main", commitSha: "a3f5c2e", commitMessage: "feat: ship onboarding v2 with RTL support", lastDeployAt: minAgo(14), autoScale: true, replicas: 3, resources: { cpuCores: 2, memoryMb: 2048 }, variables: 24 },
  { id: "env_web_staging", projectId: "p_web", name: "Staging", tier: "staging", status: "active", url: "https://staging.railflow.io", domain: "staging.railflow.io", branch: "develop", commitSha: "9f2b1c8", commitMessage: "fix: dark mode toggle persists", lastDeployAt: hourAgo(20), autoScale: false, replicas: 1, resources: { cpuCores: 1, memoryMb: 1024 }, variables: 18 },
  { id: "env_web_pr_42", projectId: "p_web", name: "PR #42 — Login redesign", tier: "preview", status: "active", url: "https://pr-42-preview.railflow.app", branch: "feat/login-redesign", commitSha: "8a7d2b3", commitMessage: "wip: new login form", lastDeployAt: hourAgo(2), autoScale: false, replicas: 1, resources: { cpuCores: 0.5, memoryMb: 512 }, variables: 16 },
  { id: "env_api_prod", projectId: "p_api", name: "Production", tier: "production", status: "active", url: "https://api.railflow.io", domain: "api.railflow.io", branch: "main", commitSha: "b7e9d1f", commitMessage: "perf: reduce p99 latency by 22%", lastDeployAt: hourAgo(3), autoScale: true, replicas: 5, resources: { cpuCores: 4, memoryMb: 4096 }, variables: 18 },
  { id: "env_api_staging", projectId: "p_api", name: "Staging", tier: "staging", status: "sleeping", url: "https://staging-api.railflow.io", branch: "develop", commitSha: "5e2c1a9", commitMessage: "test: add integration tests for auth", lastDeployAt: dayAgo(2), autoScale: false, replicas: 1, resources: { cpuCores: 1, memoryMb: 1024 }, variables: 14 },
  { id: "env_ml_prod", projectId: "p_ml", name: "Production", tier: "production", status: "building", url: "https://infer.railflow.io", domain: "infer.railflow.io", branch: "main", commitSha: "d9c1e2a", commitMessage: "chore: upgrade onnxruntime", lastDeployAt: minAgo(3), autoScale: true, replicas: 2, resources: { cpuCores: 8, memoryMb: 8192 }, variables: 9 },
  { id: "env_worker_prod", projectId: "p_worker", name: "Production", tier: "production", status: "active", branch: "main", commitSha: "c2a8f3b", commitMessage: "fix: dead-letter queue retries", lastDeployAt: hourAgo(11), autoScale: true, replicas: 4, resources: { cpuCores: 1, memoryMb: 1024 }, variables: 14 },
  { id: "env_docs_prod", projectId: "p_docs", name: "Production", tier: "production", status: "active", url: "https://docs.railflow.io", domain: "docs.railflow.io", branch: "main", commitSha: "e5b2c4d", commitMessage: "docs: add Rust backend architecture", lastDeployAt: dayAgo(2), autoScale: false, replicas: 1, resources: { cpuCores: 0.5, memoryMb: 512 }, variables: 4 },
  { id: "env_mobile_staging", projectId: "p_mobile", name: "Staging", tier: "staging", status: "failed", url: "https://staging-m.railflow.io", branch: "develop", commitSha: "f8a3d9e", commitMessage: "wip: push notifications", lastDeployAt: hourAgo(8), autoScale: false, replicas: 1, resources: { cpuCores: 2, memoryMb: 2048 }, variables: 16 },
];

// ---------- API Endpoints ----------
export const mockApiEndpoints: ApiEndpoint[] = [
  { id: "ep_1", method: "POST", path: "/api/auth/login", description: "Authenticate user with email + password", auth: "none", category: "auth", sampleRequest: `{\n  "email": "user@example.com",\n  "password": "secret"\n}`, sampleResponse: `{\n  "requires_2fa": false,\n  "access_token": "eyJhbGc...",\n  "user": { "id": "u_1", "email": "user@example.com" }\n}` },
  { id: "ep_2", method: "POST", path: "/api/auth/verify-2fa", description: "Verify TOTP 6-digit code", auth: "none", category: "auth", sampleRequest: `{\n  "session_token": "abc-123",\n  "code": "123456"\n}`, sampleResponse: `{\n  "access_token": "eyJhbGc...",\n  "user": { ... }\n}` },
  { id: "ep_3", method: "GET", path: "/api/auth/me", description: "Get current authenticated user", auth: "bearer", category: "auth", sampleRequest: `// Headers:\nAuthorization: Bearer <token>`, sampleResponse: `{\n  "id": "u_1",\n  "email": "ahmed@railflow.io",\n  "role": "owner",\n  "two_factor_enabled": true\n}` },
  { id: "ep_4", method: "GET", path: "/api/projects", description: "List all projects", auth: "bearer", category: "projects", sampleRequest: `// Headers:\nAuthorization: Bearer <token>`, sampleResponse: `[\n  { "id": "p_web", "name": "Web Platform", "status": "done" },\n  { "id": "p_api", "name": "API Gateway", "status": "done" }\n]` },
  { id: "ep_5", method: "POST", path: "/api/projects", description: "Create a new project from a GitHub repo", auth: "bearer", category: "projects", sampleRequest: `{\n  "name": "my-app",\n  "repo": "owner/repo",\n  "branch": "main",\n  "runtime": "node",\n  "build_command": "npm run build",\n  "start_command": "npm start"\n}`, sampleResponse: `{\n  "id": "p_new",\n  "name": "my-app",\n  "status": "queued"\n}` },
  { id: "ep_6", method: "POST", path: "/api/projects/:id/deploy", description: "Trigger a new deployment", auth: "bearer", category: "deployments", sampleRequest: `{\n  "project_id": "p_web",\n  "environment": "production"\n}`, sampleResponse: `{\n  "deployment_id": "d_new",\n  "status": "queued"\n}` },
  { id: "ep_7", method: "GET", path: "/api/containers", description: "List all Docker containers", auth: "bearer", category: "containers", sampleRequest: `?all=true  // include stopped`, sampleResponse: `[\n  { "id": "c_web_1", "name": "web-platform-prod", "status": "running" }\n]` },
  { id: "ep_8", method: "POST", path: "/api/containers/:id/restart", description: "Restart a container", auth: "bearer", category: "containers", sampleRequest: `{}`, sampleResponse: `{ "restarted": true, "id": "c_web_1" }` },
  { id: "ep_9", method: "GET", path: "/api/databases", description: "List managed databases", auth: "bearer", category: "databases", sampleRequest: `// Headers:\nAuthorization: Bearer <token>`, sampleResponse: `[\n  { "id": "db_pg", "name": "postgres-prod", "engine": "postgresql", "status": "running" }\n]` },
  { id: "ep_10", method: "GET", path: "/api/server/info", description: "Get live server metrics (CPU, RAM, disk, network)", auth: "bearer", category: "server", sampleRequest: `// Headers:\nAuthorization: Bearer <token>`, sampleResponse: `{\n  "hostname": "railflow-prod-01",\n  "cpu": { "overall_usage": 46.9, "cores": 16 },\n  "memory": { "used_gb": 28.4, "total_gb": 64 }\n}` },
  { id: "ep_11", method: "POST", path: "/api/webhooks/github", description: "GitHub webhook receiver (auto-deploy on push)", auth: "none", category: "webhooks", sampleRequest: `// Headers:\nX-Hub-Signature-256: sha256=...\nX-GitHub-Event: push\n\n// Body: GitHub push event payload`, sampleResponse: `{ "received": true }` },
  { id: "ep_12", method: "DELETE", path: "/api/projects/:id", description: "Delete project and stop its container", auth: "bearer", category: "projects", sampleRequest: `// Headers:\nAuthorization: Bearer <token>`, sampleResponse: `{ "deleted": true }` },
];

export const mockApiLog: ApiLogEntry[] = [
  { id: "al_1", timestamp: minAgo(0.2), method: "GET", path: "/api/server/info", status: 200, durationMs: 12, responseSize: 1247 },
  { id: "al_2", timestamp: minAgo(0.5), method: "POST", path: "/api/auth/login", status: 200, durationMs: 89, requestSize: 64, responseSize: 412 },
  { id: "al_3", timestamp: minAgo(1), method: "GET", path: "/api/projects", status: 200, durationMs: 23, responseSize: 4823 },
  { id: "al_4", timestamp: minAgo(2), method: "POST", path: "/api/projects/p_ml/deploy", status: 201, durationMs: 124, requestSize: 48 },
  { id: "al_5", timestamp: minAgo(3), method: "GET", path: "/api/containers", status: 200, durationMs: 18, responseSize: 3421 },
  { id: "al_6", timestamp: minAgo(4), method: "POST", path: "/api/containers/c_old_mobile/stop", status: 200, durationMs: 1247, responseSize: 28 },
  { id: "al_7", timestamp: minAgo(5), method: "GET", path: "/api/databases", status: 200, durationMs: 15, responseSize: 2847 },
  { id: "al_8", timestamp: minAgo(6), method: "POST", path: "/api/webhooks/github", status: 200, durationMs: 8, requestSize: 4823, responseSize: 24 },
  { id: "al_9", timestamp: minAgo(8), method: "DELETE", path: "/api/projects/p_old_legacy", status: 200, durationMs: 234, responseSize: 24 },
  { id: "al_10", timestamp: minAgo(10), method: "GET", path: "/api/deployments", status: 200, durationMs: 17, responseSize: 6234 },
  { id: "al_11", timestamp: minAgo(12), method: "POST", path: "/api/auth/verify-2fa", status: 401, durationMs: 12, requestSize: 48 },
  { id: "al_12", timestamp: minAgo(14), method: "GET", path: "/api/server/processes", status: 200, durationMs: 28, responseSize: 4128 },
];

// ---------- Alerts ----------
export const mockAlerts: Alert[] = [
  { id: "al_1", severity: "critical", category: "deployment", title: "Deployment failed: Mobile API", message: "Build failed — Cannot find module '@notifee/react-native' in src/push.ts:14:23. Stage: building. Auto-rollback initiated.", timestamp: hourAgo(8), acknowledged: false, resolved: false, resourceType: "project", resourceId: "p_mobile", actions: [{ label: "View logs", type: "primary" }, { label: "Retry", type: "secondary" }] },
  { id: "al_2", severity: "warning", category: "container", title: "High memory usage: ml-inference-prod", message: "Container ml-inference-prod is using 64% of memory (5234 MB / 8192 MB). Sustained for 12 minutes.", timestamp: hourAgo(1), acknowledged: false, resolved: false, resourceType: "container", resourceId: "c_ml_1", actions: [{ label: "Scale up", type: "primary" }] },
  { id: "al_3", severity: "warning", category: "certificate", title: "SSL certificate expiring soon", message: "m.railflow.io certificate expires in 5 days. Auto-renew is disabled.", timestamp: hourAgo(2), acknowledged: true, resolved: false, resourceType: "certificate", resourceId: "cert_6", actions: [{ label: "Renew now", type: "primary" }] },
  { id: "al_4", severity: "info", category: "deployment", title: "Deployment succeeded: API Gateway", message: "API Gateway deployed to production in 145s. Commit b7e9d1f is now live at api.railflow.io.", timestamp: hourAgo(3), acknowledged: true, resolved: true, resourceType: "project", resourceId: "p_api" },
  { id: "al_5", severity: "critical", category: "database", title: "Database backup failed: ml-storage", message: "Automatic backup of ml-storage (MongoDB) failed: connection timeout. Backups are disabled for this database.", timestamp: hourAgo(5), acknowledged: false, resolved: false, resourceType: "database", resourceId: "db_mongo", actions: [{ label: "Enable backups", type: "primary" }, { label: "Run manually", type: "secondary" }] },
  { id: "al_6", severity: "warning", category: "server", title: "Disk usage high: /var/lib/docker", message: "Docker volume partition at 46.8% (234 GB / 500 GB). Trending upward — projected to fill in 18 days.", timestamp: hourAgo(6), acknowledged: true, resolved: false, resourceType: "server", resourceId: "disk" },
  { id: "al_7", severity: "info", category: "security", title: "New login from unrecognized device", message: "Login from IP 197.43.x.x (Alexandria, EG) — Linux/Firefox. If this wasn't you, revoke the session.", timestamp: hourAgo(20), acknowledged: true, resolved: true, resourceType: "session", resourceId: "s_4" },
  { id: "al_8", severity: "info", category: "deployment", title: "PR preview deployed: PR #42", message: "Preview for PR #42 (Login redesign) is now live at https://pr-42-preview.railflow.app", timestamp: hourAgo(2), acknowledged: false, resolved: true, resourceType: "project", resourceId: "p_web" },
  { id: "al_9", severity: "warning", category: "billing", title: "Approaching plan limits", message: "You're using 12/50 containers (24%). At current growth, you'll exceed the plan in 7 days.", timestamp: dayAgo(1), acknowledged: false, resolved: false, resourceType: "billing", resourceId: "plan", actions: [{ label: "Upgrade plan", type: "primary" }] },
  { id: "al_10", severity: "critical", category: "container", title: "Container unhealthy: mobile-api-staging", message: "Container mobile-api-staging became unhealthy after 3 failed health checks. Auto-stopped.", timestamp: hourAgo(8), acknowledged: true, resolved: false, resourceType: "container", resourceId: "c_old_mobile", actions: [{ label: "View logs", type: "primary" }] },
];

export const mockNotificationRules: NotificationRule[] = [
  { id: "nr_1", name: "Failed deployments", enabled: true, events: ["deployment.failed", "deployment.rolled_back"], channels: ["email", "slack"], target: "#deploys", createdAt: dayAgo(89) },
  { id: "nr_2", name: "Critical alerts", enabled: true, events: ["alert.critical"], channels: ["email", "sms", "slack"], target: "#alerts", createdAt: dayAgo(120) },
  { id: "nr_3", name: "Successful deploys", enabled: false, events: ["deployment.success"], channels: ["slack"], target: "#deploys", createdAt: dayAgo(60) },
  { id: "nr_4", name: "SSL expiring soon", enabled: true, events: ["certificate.expiring"], channels: ["email"], target: "ahmed@railflow.io", createdAt: dayAgo(45) },
  { id: "nr_5", name: "Database backup failures", enabled: true, events: ["backup.failed"], channels: ["email", "slack"], target: "#databases", createdAt: dayAgo(30) },
  { id: "nr_6", name: "Container unhealthy", enabled: true, events: ["container.unhealthy", "container.stopped"], channels: ["slack"], target: "#alerts", createdAt: dayAgo(15) },
];

// ---------- Help Topics ----------
export const mockHelpTopics: HelpTopic[] = [
  { id: "h_1", title: "Getting started with Railflow", category: "getting-started", icon: "🚀", description: "Deploy your first project from GitHub to production in under 90 seconds.", readTimeMin: 5, lastUpdated: dayAgo(7), content: "## Quick start\n\n1. Connect your GitHub account\n2. Click **New Project**\n3. Pick a repository\n4. Choose your runtime (Node, Rust, Python, etc.)\n5. Configure build & start commands\n6. Hit **Deploy**\n\nThat's it! Railflow clones your repo, builds a Docker image, and starts a container on your server with automatic TLS.\n\n## Next steps\n\n- Add custom domains in **Project → Domains**\n- Set environment variables (secrets are encrypted)\n- Enable auto-deploy from the `main` branch\n- Set up preview deployments for pull requests" },
  { id: "h_2", title: "Configuring build commands", category: "deployment", icon: "🔨", description: "Understand how Railflow builds your project for each runtime.", readTimeMin: 4, lastUpdated: dayAgo(3), content: "## Build vs Start\n\n**Build command** runs once during deployment. Use it to compile, transpile, or bundle your code.\n\n**Start command** runs every time the container starts. It should launch your production server.\n\n## Per-runtime defaults\n\n| Runtime | Install | Build | Start |\n|---------|---------|-------|-------|\n| Node.js | `npm ci` | `npm run build` | `npm start` |\n| Rust | `cargo fetch` | `cargo build --release` | `./app` |\n| Python | `pip install -r requirements.txt` | — | `uvicorn app:app` |\n| Go | `go mod download` | `go build -o app ./cmd/app` | `./app` |\n| Static | `npm ci` | `astro build` | `npx serve dist` |" },
  { id: "h_3", title: "Managing databases", category: "databases", icon: "🐘", description: "Create, connect, and backup managed PostgreSQL, Redis, MongoDB instances.", readTimeMin: 6, lastUpdated: dayAgo(2), content: "## Creating a database\n\n1. Go to **Databases → New**\n2. Pick an engine (PostgreSQL, MySQL, Redis, MongoDB, MariaDB)\n3. Choose a plan (Small / Medium / Large / X-Large)\n4. Pick a region\n5. Optionally link it to a project\n\n## Connection strings\n\nEach database gets two URLs:\n- **Internal** — used by your containers (low latency, free)\n- **External** — used from outside the cluster (rate-limited)\n\n## Backups\n\nAutomatic backups run every 24h with configurable retention (default: 30 days). Manual backups can be triggered anytime. Pre-deploy backups run before each deployment as a safety net." },
  { id: "h_4", title: "Setting up 2FA & security", category: "security", icon: "🔐", description: "Enable two-factor authentication and review security best practices.", readTimeMin: 3, lastUpdated: dayAgo(5), content: "## Enable 2FA\n\n1. Go to **Settings → Security**\n2. Click **Enable 2FA**\n3. Scan the QR code with Google Authenticator / Authy / 1Password\n4. Enter the 6-digit code to confirm\n5. Save your backup codes somewhere safe\n\n## Best practices\n\n- Use a strong, unique password (we hash with Argon2id)\n- Enable 2FA for all team members with admin/owner roles\n- Rotate API keys every 90 days\n- Review active sessions weekly\n- Use scoped API keys (not full-access) for CI/CD\n\n## Security defaults\n\nRailflow enforces:\n- CSP, HSTS, X-Frame-Options: DENY (via Caddy)\n- Argon2id password hashing (210k iterations)\n- Per-request CSRF tokens\n- Constant-time HMAC verification for webhooks\n- JWT with 24h expiration + refresh tokens" },
  { id: "h_5", title: "Understanding the deployment pipeline", category: "deployment", icon: "🌊", description: "The 7 stages every deployment goes through, explained.", readTimeMin: 5, lastUpdated: dayAgo(4), content: "## The 7 stages\n\n1. **Queued** — waiting for a build slot (max 4 concurrent builds)\n2. **Cloning** — `git clone` + `git checkout <branch>`\n3. **Building** — runs your build command inside a Docker build context\n4. **Pushing** — pushes the image to your registry (ghcr.io by default)\n5. **Starting** — pulls the image and starts the container with env vars + ports\n6. **Health Check** — polls your `/health` endpoint until 200 OK\n7. **Live** — deployment is live; old container is stopped\n\n## Failure handling\n\nIf any stage fails:\n- The deployment is marked `failed`\n- The error message is captured\n- Auto-rollback is triggered if enabled\n- The previous deployment remains live\n\n## Deploy strategies\n\n- **Rolling** — default, replaces instances one-by-one\n- **Blue/Green** — spins up a new environment, swaps traffic when healthy\n- **Canary** — sends X% of traffic to the new version, monitors error rate\n\nConfigure strategy in **Project → Settings → Deploy Strategy**." },
  { id: "h_6", title: "Using the API", category: "api", icon: "🔌", description: "Automate Railflow with our REST API and WebSocket streams.", readTimeMin: 8, lastUpdated: dayAgo(1), content: "## Authentication\n\nAll API requests require a Bearer token:\n```\nAuthorization: Bearer <token>\n```\n\nGet a token by logging in via `POST /api/auth/login`, or create a long-lived API key in **Settings → API Keys**.\n\n## WebSocket streams\n\nReal-time updates via WebSocket:\n- `/api/ws/stats/:container_id` — container stats (1Hz)\n- `/api/ws/events` — Docker daemon events\n- `/api/ws/logs/:container_id` — live log tail\n- `/api/ws/server?interval_ms=2000` — host metrics\n\n## Rate limits\n\n- 100 requests/minute per IP (configurable)\n- 10 concurrent WebSocket connections per user\n- API keys inherit the user's rate limit\n\nUse the **API Playground** to test endpoints interactively." },
  { id: "h_7", title: "Billing & plans", category: "billing", icon: "💳", description: "Plans, limits, overages, and how to upgrade.", readTimeMin: 3, lastUpdated: dayAgo(10), content: "## Plans\n\n| Plan | Price | Projects | Containers | Bandwidth |\n|------|-------|----------|------------|-----------|\n| Hobby | $0/mo | 3 | 5 | 50 GB |\n| Pro | $49/mo | 15 | 25 | 500 GB |\n| Scale | $199/mo | 25 | 50 | 2 TB |\n| Enterprise | Custom | Unlimited | Unlimited | Custom |\n\n## Overages\n\n- Bandwidth: $0.02/GB over plan\n- Storage: $0.10/GB/mo over plan\n- Managed databases: billed per-hour based on plan tier\n\n## Upgrading\n\nGo to **Settings → Billing** to upgrade. Changes are prorated and take effect immediately." },
  { id: "h_8", title: "Team management & RBAC", category: "security", icon: "👥", description: "Invite team members and assign roles with granular permissions.", readTimeMin: 4, lastUpdated: dayAgo(2), content: "## Roles\n\n- **Owner** — full access including billing, team management, and deletion\n- **Admin** — manage projects, deployments, containers, databases (no billing/team)\n- **Developer** — deploy, view logs, manage environment variables\n- **Viewer** — read-only access to all resources\n\n## Inviting members\n\n1. Go to **Team → Invite Member**\n2. Enter their email\n3. Pick a role\n4. They get an email invitation valid for 7 days\n\n## Permissions matrix\n\n| Action | Owner | Admin | Developer | Viewer |\n|--------|-------|-------|-----------|--------|\n| View projects | ✓ | ✓ | ✓ | ✓ |\n| Deploy | ✓ | ✓ | ✓ | ✗ |\n| Manage env vars | ✓ | ✓ | ✓ | ✗ |\n| Create/delete projects | ✓ | ✓ | ✗ | ✗ |\n| Manage databases | ✓ | ✓ | ✗ | ✗ |\n| Invite members | ✓ | ✓ | ✗ | ✗ |\n| Billing | ✓ | ✗ | ✗ | ✗ |\n| Delete account | ✓ | ✗ | ✗ | ✗ |" },
];

// ---------- CI/CD Pipelines ----------
export const mockPipelines: Pipeline[] = [
  {
    id: "pipe_web",
    name: "Web Platform CI/CD",
    projectId: "p_web",
    projectName: "Web Platform",
    enabled: true,
    trigger: { events: ["push", "pull_request"], branches: ["main", "develop"] },
    stages: [
      { id: "s1", type: "trigger", name: "Trigger", enabled: true, onFailure: "stop" },
      { id: "s2", type: "lint", name: "ESLint + Prettier", enabled: true, command: "bun run lint", image: "node:22-alpine", timeoutSec: 60, onFailure: "stop" },
      { id: "s3", type: "test", name: "Unit Tests", enabled: true, command: "bun test", image: "node:22-alpine", timeoutSec: 180, onFailure: "stop" },
      { id: "s4", type: "build", name: "Build", enabled: true, command: "bun run build", image: "node:22-alpine", timeoutSec: 300, onFailure: "stop" },
      { id: "s5", type: "security-scan", name: "Dependency Audit", enabled: true, command: "bun audit", image: "node:22-alpine", timeoutSec: 90, onFailure: "continue" },
      { id: "s6", type: "deploy", name: "Deploy to Production", enabled: true, condition: "branch == 'main'", command: "railflow deploy --env production", onFailure: "stop" },
      { id: "s7", type: "notify", name: "Notify Slack", enabled: true, command: "curl -X POST $SLACK_WEBHOOK", onFailure: "continue" },
    ],
    lastRun: { id: "run_42", status: "success", startedAt: minAgo(14), durationMs: 187_000, triggeredBy: "GitHub Webhook" },
    stats: { totalRuns: 412, successRate: 98.3, avgDurationMs: 192_000, last24h: 6 },
    createdAt: dayAgo(245),
    updatedAt: minAgo(14),
  },
  {
    id: "pipe_api",
    name: "API Gateway CI/CD",
    projectId: "p_api",
    projectName: "API Gateway",
    enabled: true,
    trigger: { events: ["push", "tag"], branches: ["main"] },
    stages: [
      { id: "s1", type: "trigger", name: "Trigger", enabled: true, onFailure: "stop" },
      { id: "s2", type: "lint", name: "cargo clippy", enabled: true, command: "cargo clippy -- -D warnings", image: "rust:1.82", timeoutSec: 120, onFailure: "stop" },
      { id: "s3", type: "test", name: "cargo test", enabled: true, command: "cargo test", image: "rust:1.82", timeoutSec: 300, onFailure: "stop" },
      { id: "s4", type: "build", name: "cargo build --release", enabled: true, command: "cargo build --release", image: "rust:1.82", timeoutSec: 600, onFailure: "stop" },
      { id: "s5", type: "security-scan", name: "cargo audit", enabled: true, command: "cargo audit", image: "rust:1.82", timeoutSec: 60, onFailure: "continue" },
      { id: "s6", type: "deploy", name: "Deploy", enabled: true, condition: "branch == 'main'", command: "railflow deploy --env production", onFailure: "stop" },
    ],
    lastRun: { id: "run_87", status: "success", startedAt: hourAgo(3), durationMs: 145_000, triggeredBy: "GitHub Webhook" },
    stats: { totalRuns: 287, successRate: 99.6, avgDurationMs: 152_000, last24h: 2 },
    createdAt: dayAgo(312),
    updatedAt: hourAgo(3),
  },
  {
    id: "pipe_ml",
    name: "ML Inference CI/CD",
    projectId: "p_ml",
    projectName: "ML Inference",
    enabled: true,
    trigger: { events: ["push", "schedule"], branches: ["main"], schedule: "0 2 * * *" },
    stages: [
      { id: "s1", type: "trigger", name: "Trigger", enabled: true, onFailure: "stop" },
      { id: "s2", type: "test", name: "pytest", enabled: true, command: "pytest tests/", image: "python:3.12", timeoutSec: 240, onFailure: "stop" },
      { id: "s3", type: "build", name: "Docker build", enabled: true, command: "docker build -t ml-inference .", image: "docker:24", timeoutSec: 900, onFailure: "stop" },
      { id: "s4", type: "deploy", name: "Deploy", enabled: true, condition: "branch == 'main'", command: "railflow deploy --env production", onFailure: "stop" },
      { id: "s5", type: "notify", name: "Notify Team", enabled: false, onFailure: "continue" },
    ],
    lastRun: { id: "run_12", status: "running", startedAt: minAgo(3), durationMs: 0, triggeredBy: "Ahmed Hassan" },
    stats: { totalRuns: 87, successRate: 94.2, avgDurationMs: 312_000, last24h: 4 },
    createdAt: dayAgo(64),
    updatedAt: minAgo(3),
  },
  {
    id: "pipe_worker",
    name: "Background Workers CI/CD",
    projectId: "p_worker",
    projectName: "Background Workers",
    enabled: true,
    trigger: { events: ["push"], branches: ["main"] },
    stages: [
      { id: "s1", type: "trigger", name: "Trigger", enabled: true, onFailure: "stop" },
      { id: "s2", type: "test", name: "go test", enabled: true, command: "go test ./...", image: "golang:1.22", timeoutSec: 120, onFailure: "stop" },
      { id: "s3", type: "build", name: "go build", enabled: true, command: "go build -o worker ./cmd/worker", image: "golang:1.22", timeoutSec: 90, onFailure: "stop" },
      { id: "s4", type: "deploy", name: "Deploy", enabled: true, command: "railflow deploy --env production", onFailure: "stop" },
    ],
    lastRun: { id: "run_34", status: "success", startedAt: hourAgo(11), durationMs: 64_000, triggeredBy: "GitHub Webhook" },
    stats: { totalRuns: 198, successRate: 97.5, avgDurationMs: 68_000, last24h: 3 },
    createdAt: dayAgo(188),
    updatedAt: hourAgo(11),
  },
  {
    id: "pipe_mobile",
    name: "Mobile API CI/CD",
    projectId: "p_mobile",
    projectName: "Mobile API",
    enabled: false,
    trigger: { events: ["push", "pull_request"], branches: ["develop"] },
    stages: [
      { id: "s1", type: "trigger", name: "Trigger", enabled: true, onFailure: "stop" },
      { id: "s2", type: "lint", name: "eslint", enabled: true, command: "npm run lint", image: "node:22", onFailure: "continue" },
      { id: "s3", type: "test", name: "jest", enabled: true, command: "npm test", image: "node:22", onFailure: "stop" },
      { id: "s4", type: "build", name: "tsc", enabled: true, command: "tsc", onFailure: "stop" },
    ],
    lastRun: { id: "run_8", status: "failed", startedAt: hourAgo(8), durationMs: 92_000, triggeredBy: "Layla Ibrahim" },
    stats: { totalRuns: 233, successRate: 92.1, avgDurationMs: 76_000, last24h: 2 },
    createdAt: dayAgo(98),
    updatedAt: hourAgo(8),
  },
];

// ---------- Webhook Endpoints & Deliveries ----------
export const mockWebhooks: WebhookEndpoint[] = [
  {
    id: "wh_1",
    name: "Slack #deploys",
    url: "https://hooks.slack.com/services/T0/B0/xxx",
    events: ["deployment.success", "deployment.failed"],
    secret: "whsec_••••••••",
    enabled: true,
    sslVerification: true,
    deliveries: { total: 1247, success: 1245, failed: 2, last24h: 8 },
    createdAt: dayAgo(89),
    lastDeliveryAt: minAgo(14),
  },
  {
    id: "wh_2",
    name: "Discord #alerts",
    url: "https://discord.com/api/webhooks/xxx/yyy",
    events: ["alert.critical", "container.unhealthy"],
    secret: "whsec_••••••••",
    enabled: true,
    sslVerification: true,
    deliveries: { total: 87, success: 87, failed: 0, last24h: 1 },
    createdAt: dayAgo(120),
    lastDeliveryAt: hourAgo(8),
  },
  {
    id: "wh_3",
    name: "Internal Analytics",
    url: "https://analytics.internal.railflow.io/webhooks/railflow",
    events: ["deployment.success", "project.created", "user.joined"],
    secret: "whsec_••••••••",
    enabled: true,
    sslVerification: true,
    deliveries: { total: 4234, success: 4231, failed: 3, last24h: 12 },
    createdAt: dayAgo(245),
    lastDeliveryAt: minAgo(3),
  },
  {
    id: "wh_4",
    name: "Zapier Integration",
    url: "https://hooks.zapier.com/hooks/catch/xxx/yyy",
    events: ["deployment.success"],
    secret: "",
    enabled: false,
    sslVerification: true,
    deliveries: { total: 156, success: 156, failed: 0, last24h: 0 },
    createdAt: dayAgo(45),
    lastDeliveryAt: dayAgo(7),
  },
];

export const mockWebhookDeliveries: WebhookDelivery[] = [
  { id: "wd_1", webhookId: "wh_1", webhookName: "Slack #deploys", event: "deployment.success", status: "delivered", statusCode: 200, attempt: 1, maxAttempts: 3, requestHeaders: { "Content-Type": "application/json", "X-Railflow-Event": "deployment.success", "X-Railflow-Signature": "sha256=abc123" }, requestBody: `{"event":"deployment.success","project":"Web Platform","commit":"a3f5c2e","url":"https://railflow.io"}`, responseBody: "OK", durationMs: 247, deliveredAt: minAgo(14) },
  { id: "wd_2", webhookId: "wh_3", webhookName: "Internal Analytics", event: "deployment.success", status: "delivered", statusCode: 200, attempt: 1, maxAttempts: 3, requestHeaders: { "Content-Type": "application/json" }, requestBody: `{"event":"deployment.success","project":"Web Platform"}`, responseBody: `{"received":true}`, durationMs: 18, deliveredAt: minAgo(14) },
  { id: "wd_3", webhookId: "wh_2", webhookName: "Discord #alerts", event: "alert.critical", status: "failed", statusCode: 500, attempt: 3, maxAttempts: 3, requestHeaders: { "Content-Type": "application/json" }, requestBody: `{"event":"alert.critical","title":"Container unhealthy"}`, responseBody: `{"error":"Internal server error"}`, durationMs: 5024, deliveredAt: hourAgo(8), nextRetryAt: hourAgo(7) },
  { id: "wd_4", webhookId: "wh_1", webhookName: "Slack #deploys", event: "deployment.failed", status: "delivered", statusCode: 200, attempt: 1, maxAttempts: 3, requestHeaders: { "Content-Type": "application/json" }, requestBody: `{"event":"deployment.failed","project":"Mobile API","error":"Build failed"}`, responseBody: "OK", durationMs: 312, deliveredAt: hourAgo(8) },
  { id: "wd_5", webhookId: "wh_3", webhookName: "Internal Analytics", event: "deployment.success", status: "delivered", statusCode: 200, attempt: 1, maxAttempts: 3, requestHeaders: { "Content-Type": "application/json" }, requestBody: `{"event":"deployment.success","project":"API Gateway"}`, responseBody: `{"received":true}`, durationMs: 22, deliveredAt: hourAgo(3) },
  { id: "wd_6", webhookId: "wh_2", webhookName: "Discord #alerts", event: "alert.critical", status: "retrying", statusCode: 0, attempt: 2, maxAttempts: 3, requestHeaders: { "Content-Type": "application/json" }, requestBody: `{"event":"alert.critical"}`, responseBody: "", durationMs: 30000, deliveredAt: minAgo(2), nextRetryAt: minAgo(-2) },
  { id: "wd_7", webhookId: "wh_1", webhookName: "Slack #deploys", event: "deployment.success", status: "delivered", statusCode: 200, attempt: 1, maxAttempts: 3, requestHeaders: { "Content-Type": "application/json" }, requestBody: `{"event":"deployment.success","project":"Background Workers"}`, responseBody: "OK", durationMs: 189, deliveredAt: hourAgo(11) },
  { id: "wd_8", webhookId: "wh_3", webhookName: "Internal Analytics", event: "user.joined", status: "delivered", statusCode: 200, attempt: 1, maxAttempts: 3, requestHeaders: { "Content-Type": "application/json" }, requestBody: `{"event":"user.joined","user":"Yusuf Ali"}`, responseBody: `{"received":true}`, durationMs: 14, deliveredAt: dayAgo(1) },
];

// ---------- Cost / Billing ----------
export const mockCostBreakdown: CostBreakdown[] = [
  { category: "compute", label: "Compute (containers)", cost: 142.50, unit: "vCPU-hours", usage: 712, limit: 1500, trend: 12.4 },
  { category: "database", label: "Managed databases", cost: 89.00, unit: "instances", usage: 5, limit: 10, trend: 0 },
  { category: "storage", label: "Storage (volumes)", cost: 23.40, unit: "GB-month", usage: 234, limit: 500, trend: 8.2 },
  { category: "bandwidth", label: "Bandwidth", cost: 18.20, unit: "GB", usage: 892, limit: 2000, trend: -3.1 },
  { category: "backup", label: "Backups (S3)", cost: 4.80, unit: "GB-month", usage: 48, trend: 1.2 },
  { category: "ssl", label: "SSL certificates", cost: 0, unit: "certs", usage: 7, trend: 0 },
  { category: "support", label: "Priority support", cost: 49.00, unit: "month", usage: 1, trend: 0 },
];

export const mockInvoices: Invoice[] = [
  { id: "inv_2026_07", number: "RF-2026-0007", period: { start: "2026-07-01", end: "2026-07-31" }, amount: 326.90, currency: "USD", status: "pending", method: "Visa ending 4242", issuedAt: dayAgo(2) },
  { id: "inv_2026_06", number: "RF-2026-0006", period: { start: "2026-06-01", end: "2026-06-30" }, amount: 312.40, currency: "USD", status: "paid", method: "Visa ending 4242", issuedAt: dayAgo(32), pdfUrl: "#" },
  { id: "inv_2026_05", number: "RF-2026-0005", period: { start: "2026-05-01", end: "2026-05-31" }, amount: 287.10, currency: "USD", status: "paid", method: "Visa ending 4242", issuedAt: dayAgo(62), pdfUrl: "#" },
  { id: "inv_2026_04", number: "RF-2026-0004", period: { start: "2026-04-01", end: "2026-04-30" }, amount: 254.80, currency: "USD", status: "paid", method: "Visa ending 4242", issuedAt: dayAgo(92), pdfUrl: "#" },
  { id: "inv_2026_03", number: "RF-2026-0003", period: { start: "2026-03-01", end: "2026-03-31" }, amount: 234.20, currency: "USD", status: "paid", method: "Visa ending 4242", issuedAt: dayAgo(122), pdfUrl: "#" },
  { id: "inv_2026_02", number: "RF-2026-0002", period: { start: "2026-02-01", end: "2026-02-28" }, amount: 218.50, currency: "USD", status: "paid", method: "Visa ending 4242", issuedAt: dayAgo(152), pdfUrl: "#" },
];

export const mockCostAlerts: CostAlert[] = [
  { id: "ca_1", threshold: 300, current: 326.90, period: "monthly", enabled: true, lastTriggered: dayAgo(2) },
  { id: "ca_2", threshold: 50, current: 18.20, period: "daily", enabled: true },
  { id: "ca_3", threshold: 100, current: 0, period: "daily", enabled: false },
];

// ---------- API Health Checks ----------
export const mockApiHealthChecks: ApiHealthCheck[] = [
  { id: "hc_1", name: "Web Platform", url: "https://railflow.io/api/health", method: "GET", expectedStatus: 200, intervalSec: 30, timeoutSec: 5, regions: ["fra1", "ny1", "sin1"], enabled: true, status: "up", uptime30d: 99.97, responseTimeMs: 42, lastCheck: minAgo(0.2), history: Array.from({ length: 30 }, (_, i) => ({ timestamp: dayAgo(i), status: "up" as const, responseTimeMs: 35 + Math.floor(Math.random() * 20) })) },
  { id: "hc_2", name: "API Gateway", url: "https://api.railflow.io/health", method: "GET", expectedStatus: 200, intervalSec: 30, timeoutSec: 5, regions: ["fra1", "ny1"], enabled: true, status: "up", uptime30d: 100, responseTimeMs: 18, lastCheck: minAgo(0.1), lastIncident: dayAgo(45), history: Array.from({ length: 30 }, (_, i) => ({ timestamp: dayAgo(i), status: "up" as const, responseTimeMs: 12 + Math.floor(Math.random() * 15) })) },
  { id: "hc_3", name: "ML Inference", url: "https://infer.railflow.io/health", method: "GET", expectedStatus: 200, intervalSec: 60, timeoutSec: 10, regions: ["fra1"], enabled: true, status: "degraded", uptime30d: 94.2, responseTimeMs: 1247, lastCheck: minAgo(0.5), lastIncident: hourAgo(2), history: Array.from({ length: 30 }, (_, i) => ({ timestamp: dayAgo(i), status: i === 0 ? "down" as const : "up" as const, responseTimeMs: 800 + Math.floor(Math.random() * 600) })) },
  { id: "hc_4", name: "Documentation", url: "https://docs.railflow.io/", method: "HEAD", expectedStatus: 200, intervalSec: 300, timeoutSec: 5, regions: ["fra1"], enabled: true, status: "up", uptime30d: 100, responseTimeMs: 28, lastCheck: minAgo(3), history: Array.from({ length: 30 }, (_, i) => ({ timestamp: dayAgo(i), status: "up" as const, responseTimeMs: 20 + Math.floor(Math.random() * 15) })) },
  { id: "hc_5", name: "Mobile API (staging)", url: "https://staging-m.railflow.io/health", method: "GET", expectedStatus: 200, intervalSec: 60, timeoutSec: 5, regions: ["fra1"], enabled: true, status: "down", uptime30d: 78.5, responseTimeMs: 0, lastCheck: minAgo(0.4), lastIncident: hourAgo(8), history: Array.from({ length: 30 }, (_, i) => ({ timestamp: dayAgo(i), status: i < 1 ? "down" as const : "up" as const, responseTimeMs: 0 })) },
];

export function generateApiMetrics(hours: number = 24): ApiMetricPoint[] {
  const points: ApiMetricPoint[] = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    const ts = new Date(now - i * 3_600_000).toISOString();
    const reqs = Math.floor(800 + Math.random() * 600 + Math.sin(i / 4) * 200);
    const errs = Math.floor(reqs * (Math.random() * 0.02));
    points.push({
      timestamp: ts,
      requests: reqs,
      errors: errs,
      avgResponseMs: 35 + Math.random() * 25,
      p95ResponseMs: 80 + Math.random() * 40,
      p99ResponseMs: 180 + Math.random() * 80,
    });
  }
  return points;
}

// ---------- Saved Audit Queries ----------
export const mockAuditQueries: AuditQuery[] = [
  { id: "aq_1", name: "Failed deploys this week", filters: { categories: ["deployment"], actions: ["deployment failed"], dateFrom: dayAgo(7) }, savedAt: dayAgo(14) },
  { id: "aq_2", name: "Admin actions by Omar", filters: { actors: ["Omar Khaled"], categories: ["project", "container", "database"] }, savedAt: dayAgo(30) },
  { id: "aq_3", name: "Logins from Egypt", filters: { categories: ["auth"], ipAddresses: ["156.21x.x.x", "197.43.x.x"] }, savedAt: dayAgo(45) },
  { id: "aq_4", name: "All 2FA changes", filters: { categories: ["auth", "settings"], actions: ["enabled 2FA", "disabled 2FA"] }, savedAt: dayAgo(60) },
];

// ---------- Marketplace Templates ----------
export const mockTemplates: Template[] = [
  { id: "tpl_next", name: "Next.js Starter", description: "Production-ready Next.js 16 app with App Router, Tailwind CSS 4, shadcn/ui, and TypeScript.", category: "framework", runtime: "node", framework: "Next.js 16", icon: "▲", author: "Railflow", stars: 4823, deployments: 12450, tags: ["react", "ssr", "tailwind"], features: ["App Router", "Server Components", "shadcn/ui", "Dark mode"], repoUrl: "https://github.com/railflow/next-starter", demoUrl: "https://demo-next.railflow.io", buildCommand: "next build", startCommand: "next start", installCommand: "npm install", envVars: [], estimatedDeployTime: 87, lastUpdated: dayAgo(3) },
  { id: "tpl_astro", name: "Astro Blog", description: "Lightning-fast static blog with MDX support, RSS feeds, and built-in search.", category: "static", runtime: "static", framework: "Astro", icon: "🚀", author: "Railflow", stars: 2104, deployments: 5230, tags: ["static", "blog", "mdx"], features: ["MDX support", "RSS feeds", "Built-in search", "Sitemap"], repoUrl: "https://github.com/railflow/astro-blog", demoUrl: "https://demo-astro.railflow.io", buildCommand: "astro build", startCommand: "npx serve dist", installCommand: "npm install", envVars: [], estimatedDeployTime: 42, lastUpdated: dayAgo(7) },
  { id: "tpl_rust_api", name: "Rust API (axum)", description: "High-performance REST API with axum, sqlx, JWT auth, and OpenAPI docs.", category: "api", runtime: "rust", framework: "axum", icon: "🦀", author: "Railflow", stars: 1876, deployments: 3420, tags: ["rust", "api", "jwt"], features: ["JWT auth", "SQLx + PostgreSQL", "OpenAPI/Swagger", "Rate limiting"], repoUrl: "https://github.com/railflow/rust-api", buildCommand: "cargo build --release", startCommand: "./api", installCommand: "cargo fetch", envVars: [{ key: "DATABASE_URL", description: "PostgreSQL connection string", required: true }, { key: "JWT_SECRET", description: "Secret for JWT signing", required: true }], estimatedDeployTime: 145, lastUpdated: dayAgo(2) },
  { id: "tpl_go_worker", name: "Go Worker", description: "Background job processor with Redis queues, scheduled tasks, and dead-letter handling.", category: "worker", runtime: "go", framework: "Go + Redis", icon: "🐹", author: "community", stars: 892, deployments: 1240, tags: ["go", "worker", "redis"], features: ["Redis queues", "Cron schedules", "Dead-letter queues", "Health checks"], repoUrl: "https://github.com/railflow/go-worker", buildCommand: "go build -o worker ./cmd", startCommand: "./worker", installCommand: "go mod download", envVars: [{ key: "REDIS_URL", description: "Redis connection URL", required: true }], estimatedDeployTime: 64, lastUpdated: dayAgo(5) },
  { id: "tpl_python_fastapi", name: "FastAPI + SQLAlchemy", description: "Modern Python API with FastAPI, async SQLAlchemy, Alembic migrations, and Pydantic v2.", category: "api", runtime: "python", framework: "FastAPI", icon: "🐍", author: "community", stars: 3421, deployments: 8900, tags: ["python", "api", "async"], features: ["Auto OpenAPI docs", "Async SQLAlchemy", "Alembic migrations", "Pydantic v2"], repoUrl: "https://github.com/railflow/fastapi-template", demoUrl: "https://demo-fastapi.railflow.io", buildCommand: "pip install -r requirements.txt", startCommand: "uvicorn app:app --host 0.0.0.0 --port 8000", installCommand: "pip install -r requirements.txt", envVars: [{ key: "DATABASE_URL", description: "PostgreSQL URL", required: true }], estimatedDeployTime: 112, lastUpdated: dayAgo(1) },
  { id: "tpl_next_prisma", name: "Next.js + Prisma", description: "Full-stack app with Next.js, Prisma ORM, NextAuth, and PostgreSQL.", category: "fullstack", runtime: "node", framework: "Next.js + Prisma", icon: "🔺", author: "Railflow", stars: 5634, deployments: 15600, tags: ["fullstack", "prisma", "auth"], features: ["Prisma ORM", "NextAuth.js", "PostgreSQL", "Server Actions"], repoUrl: "https://github.com/railflow/next-prisma", demoUrl: "https://demo-prisma.railflow.io", buildCommand: "prisma generate && next build", startCommand: "next start", installCommand: "npm install", envVars: [{ key: "DATABASE_URL", description: "PostgreSQL URL", required: true }, { key: "NEXTAUTH_SECRET", description: "NextAuth secret", required: true }], estimatedDeployTime: 124, lastUpdated: dayAgo(4) },
  { id: "tpl_ml_pytorch", name: "ML Inference (PyTorch)", description: "Real-time ML inference service with PyTorch, ONNX export, and batched predictions.", category: "ml", runtime: "python", framework: "FastAPI + PyTorch", icon: "🧠", author: "community", stars: 1245, deployments: 890, tags: ["ml", "pytorch", "inference"], features: ["ONNX export", "Batched predictions", "GPU support", "Model versioning"], repoUrl: "https://github.com/railflow/ml-inference", buildCommand: "pip install -r requirements.txt", startCommand: "uvicorn app:app --host 0.0.0.0 --port 8000", installCommand: "pip install -r requirements.txt", envVars: [{ key: "MODEL_PATH", description: "Path to model weights", required: true }], estimatedDeployTime: 312, lastUpdated: dayAgo(6) },
  { id: "tpl_bun_api", name: "Bun API (Hono)", description: "Ultra-fast API with Bun runtime, Hono framework, and native TypeScript.", category: "api", runtime: "bun", framework: "Hono", icon: "🍞", author: "community", stars: 1876, deployments: 4200, tags: ["bun", "api", "fast"], features: ["Bun runtime", "Hono framework", "Zero config", "TypeScript native"], repoUrl: "https://github.com/railflow/bun-api", demoUrl: "https://demo-bun.railflow.io", buildCommand: "bun run build", startCommand: "bun run src/index.ts", installCommand: "bun install", envVars: [], estimatedDeployTime: 38, lastUpdated: dayAgo(2) },
  { id: "tpl_svelte", name: "SvelteKit App", description: "Full-stack SvelteKit app with SSR, TypeScript, and Tailwind CSS.", category: "framework", runtime: "node", framework: "SvelteKit", icon: "🧡", author: "community", stars: 2340, deployments: 5600, tags: ["svelte", "ssr"], features: ["SSR/SSG", "TypeScript", "Tailwind CSS", "File-based routing"], repoUrl: "https://github.com/railflow/sveltekit-template", demoUrl: "https://demo-svelte.railflow.io", buildCommand: "vite build", startCommand: "node build", installCommand: "npm install", envVars: [], estimatedDeployTime: 56, lastUpdated: dayAgo(8) },
  { id: "tpl_redis_queue", name: "Redis Queue Worker", description: "Distributed job queue with Redis Streams, Python, and monitoring dashboard.", category: "worker", runtime: "python", framework: "Redis + Python", icon: "⚡", author: "community", stars: 654, deployments: 1230, tags: ["redis", "queue", "python"], features: ["Redis Streams", "Worker monitoring", "Auto-retry", "Priority queues"], repoUrl: "https://github.com/railflow/redis-queue", buildCommand: "pip install -r requirements.txt", startCommand: "python worker.py", installCommand: "pip install -r requirements.txt", envVars: [{ key: "REDIS_URL", description: "Redis connection URL", required: true }], estimatedDeployTime: 48, lastUpdated: dayAgo(10) },
  { id: "tpl_deno_api", name: "Deno API (Fresh)", description: "Modern API with Deno, Fresh framework, and built-in TypeScript.", category: "api", runtime: "deno", framework: "Fresh", icon: "🦕", author: "community", stars: 1023, deployments: 2100, tags: ["deno", "api"], features: ["Deno runtime", "Fresh framework", "Islands architecture", "TypeScript native"], repoUrl: "https://github.com/railflow/deno-api", buildCommand: "deno task build", startCommand: "deno task start", installCommand: "deno cache src/main.ts", envVars: [], estimatedDeployTime: 52, lastUpdated: dayAgo(5) },
  { id: "tpl_postgres_admin", name: "PostgreSQL + pgAdmin", description: "Managed PostgreSQL with pgAdmin web interface and automated backups.", category: "database", runtime: "docker", framework: "PostgreSQL 17", icon: "🐘", author: "Railflow", stars: 3421, deployments: 18900, tags: ["postgres", "database", "pgadmin"], features: ["PostgreSQL 17", "pgAdmin UI", "Auto backups", "Point-in-time recovery"], repoUrl: "https://github.com/railflow/postgres-template", buildCommand: "", startCommand: "postgres", installCommand: "", envVars: [{ key: "POSTGRES_PASSWORD", description: "Root password", required: true }, { key: "POSTGRES_DB", description: "Default database name", required: false }], estimatedDeployTime: 18, lastUpdated: dayAgo(1) },
];

// ---------- Regions ----------
export const mockRegions: Region[] = [
  { id: "r_fra1", name: "Frankfurt", code: "fra1", country: "Germany", flag: "🇩🇪", latencyMs: 12, status: "active", resources: { cpuAvailable: 48, memoryAvailableGb: 192, storageAvailableGb: 2400 }, projects: 6, isDefault: true },
  { id: "r_ams3", name: "Amsterdam", code: "ams3", country: "Netherlands", flag: "🇳🇱", latencyMs: 18, status: "active", resources: { cpuAvailable: 32, memoryAvailableGb: 128, storageAvailableGb: 1600 }, projects: 0, isDefault: false },
  { id: "r_london", name: "London", code: "lhr1", country: "UK", flag: "🇬🇧", latencyMs: 22, status: "active", resources: { cpuAvailable: 64, memoryAvailableGb: 256, storageAvailableGb: 3200 }, projects: 0, isDefault: false },
  { id: "r_ny1", name: "New York", code: "ny1", country: "USA", flag: "🇺🇸", latencyMs: 87, status: "active", resources: { cpuAvailable: 96, memoryAvailableGb: 384, storageAvailableGb: 4800 }, projects: 0, isDefault: false },
  { id: "r_sin1", name: "Singapore", code: "sin1", country: "Singapore", flag: "🇸🇬", latencyMs: 167, status: "active", resources: { cpuAvailable: 24, memoryAvailableGb: 96, storageAvailableGb: 1200 }, projects: 0, isDefault: false },
  { id: "r_tokyo", name: "Tokyo", code: "tyo1", country: "Japan", flag: "🇯🇵", latencyMs: 198, status: "maintenance", resources: { cpuAvailable: 0, memoryAvailableGb: 0, storageAvailableGb: 0 }, projects: 0, isDefault: false },
  { id: "r_sydney", name: "Sydney", code: "syd1", country: "Australia", flag: "🇦🇺", latencyMs: 245, status: "planned", resources: { cpuAvailable: 0, memoryAvailableGb: 0, storageAvailableGb: 0 }, projects: 0, isDefault: false },
];

export const mockEdgeConfigs: EdgeConfig[] = mockProjects.slice(0, 4).map((p, i) => ({
  projectId: p.id,
  primaryRegion: "r_fra1",
  replicaRegions: i === 0 ? ["r_ny1", "r_sin1"] : i === 1 ? ["r_ny1"] : [],
  edgeCache: i < 3,
  cdnEnabled: i < 2,
  customRules: i === 0 ? [
    { id: "rule_1", pattern: "/api/*", action: "cache" as const, value: "", ttl: 60 },
    { id: "rule_2", pattern: "/old/*", action: "redirect" as const, value: "/new/$1", ttl: undefined },
    { id: "rule_3", pattern: "/blocked", action: "block" as const, value: "403", ttl: undefined },
  ] : [],
}));

// ---------- Aggregated Logs ----------
const logSources = [
  { name: "web-platform-prod", id: "c_web_1", projectId: "p_web" },
  { name: "api-gateway-prod", id: "c_api_1", projectId: "p_api" },
  { name: "workers-prod", id: "c_worker_1", projectId: "p_worker" },
  { name: "ml-inference-prod", id: "c_ml_1", projectId: "p_ml" },
  { name: "docs-prod", id: "c_docs_1", projectId: "p_docs" },
];

const logTemplates: Array<[AggregatedLog["level"], string]> = [
  ["info", "GET /api/v1/users 200 12ms"],
  ["info", "POST /api/v1/deployments 201 87ms"],
  ["success", "Health check passed (status=200, ms=42)"],
  ["info", "Worker connected to Redis at redis-cache:6379"],
  ["warn", "Rate limit threshold reached for IP 197.43.x.x (1000 req/min)"],
  ["info", "WebSocket connection established (client=c_8x2a)"],
  ["success", "Build completed in 87s (size: 4.2MB)"],
  ["info", "Image pushed to ghcr.io/railflow/web-platform:main"],
  ["error", "Failed to connect to stripe API (timeout after 5000ms) — retrying"],
  ["info", "Stripe API retry succeeded (attempt 2)"],
  ["debug", "Cache hit for key user:42:profile"],
  ["success", "Deployment d_2 marked as live"],
  ["info", "Container c_web_1 health status: healthy"],
  ["warn", "Memory usage at 78% on container c_ml_1"],
  ["error", "Build failed: Cannot find module '@notifee/react-native'"],
  ["info", "Pulling image ghcr.io/railflow/ml-inference:main (1.2GB)"],
  ["success", "Image pulled successfully"],
  ["info", "Starting container ml-inference-prod"],
  ["info", "GET /health 200 8ms"],
  ["error", "Database connection pool exhausted (max=100, active=100)"],
];

export function generateAggregatedLogs(count: number = 100): AggregatedLog[] {
  const out: AggregatedLog[] = [];
  for (let i = 0; i < count; i++) {
    const [level, msg] = logTemplates[Math.floor(Math.random() * logTemplates.length)];
    const src = logSources[Math.floor(Math.random() * logSources.length)];
    out.push({
      id: `alog_${i}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(now - i * (3_000 + Math.random() * 10_000)).toISOString(),
      containerName: src.name,
      containerId: src.id,
      level,
      source: level === "error" || level === "warn" ? "stderr" : "stdout",
      message: msg,
      projectId: src.projectId,
    });
  }
  return out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const mockLogStreams: LogStream[] = [
  { id: "ls_1", name: "Production errors", containers: ["c_web_1", "c_api_1", "c_worker_1"], filter: "level:error", level: "error", enabled: true, lastMessageAt: minAgo(0.5) },
  { id: "ls_2", name: "API Gateway traffic", containers: ["c_api_1"], filter: "path:/api/*", level: "all", enabled: true, lastMessageAt: minAgo(0.2) },
  { id: "ls_3", name: "ML inference alerts", containers: ["c_ml_1"], filter: "level:warn OR level:error", level: "warn", enabled: true, lastMessageAt: hourAgo(1) },
  { id: "ls_4", name: "All deployments", containers: [], filter: "message:deployment", level: "all", enabled: false, lastMessageAt: hourAgo(3) },
];
