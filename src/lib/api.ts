/**
 * API client — typed wrapper for calling the Railflow backend.
 * Uses relative URLs so requests go through the Next.js API proxy.
 *
 * In production (Docker), Caddy routes /api/* to the Rust backend.
 * In development, the Next.js catch-all proxy at /api/[...path] forwards to BACKEND_URL.
 */

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("railflow-token", token);
      else localStorage.removeItem("railflow-token");
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("railflow-token");
    }
    return this.token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new ApiError(response.status, error.error || "Request failed", error);
    }

    // Handle 204 No Content
    if (response.status === 204) return undefined as T;
    return response.json();
  }

  get<T>(path: string) { return this.request<T>("GET", path); }
  post<T>(path: string, body?: unknown) { return this.request<T>("POST", path, body); }
  put<T>(path: string, body?: unknown) { return this.request<T>("PUT", path, body); }
  patch<T>(path: string, body?: unknown) { return this.request<T>("PATCH", path, body); }
  delete<T>(path: string) { return this.request<T>("DELETE", path); }

  /** Create a WebSocket connection to the backend */
  ws(path: string): WebSocket {
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = typeof window !== "undefined" ? window.location.host : "localhost:3000";
    return new WebSocket(`${protocol}//${host}${path}`);
  }
}

export class ApiError extends Error {
  status: number;
  details: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Singleton instance
export const api = new ApiClient();

// Type-safe API methods
export const apiMethods = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      api.post<{ requires_2fa: boolean; session_token?: string; access_token?: string; user?: unknown }>("/api/auth/login", { email, password }),
    verify2fa: (sessionToken: string, code: string) =>
      api.post<{ access_token: string; user: unknown }>("/api/auth/verify-2fa", { session_token: sessionToken, code }),
    register: (email: string, password: string) =>
      api.post<{ access_token: string; user: unknown }>("/api/auth/register", { email, password }),
    me: () => api.get<unknown>("/api/auth/me"),
    logout: () => api.post("/api/auth/logout"),
  },

  // Projects
  projects: {
    list: () => api.get<unknown[]>("/api/projects"),
    get: (id: string) => api.get<unknown>(`/api/projects/${id}`),
    create: (data: unknown) => api.post<unknown>("/api/projects", data),
    update: (id: string, data: unknown) => api.put<unknown>(`/api/projects/${id}`, data),
    delete: (id: string) => api.delete(`/api/projects/${id}`),
    deploy: (id: string) => api.post<unknown>(`/api/projects/${id}/deploy`),
    envVars: (id: string) => api.get<unknown[]>(`/api/projects/${id}/env`),
  },

  // Containers
  containers: {
    list: () => api.get<unknown[]>("/api/containers"),
    get: (id: string) => api.get<unknown>(`/api/containers/${id}`),
    start: (id: string) => api.post(`/api/containers/${id}/start`),
    stop: (id: string) => api.post(`/api/containers/${id}/stop`),
    restart: (id: string) => api.post(`/api/containers/${id}/restart`),
    remove: (id: string) => api.post(`/api/containers/${id}/remove`),
  },

  // Deployments
  deployments: {
    list: (projectId?: string) => api.get<unknown[]>(`/api/deployments${projectId ? `?project_id=${projectId}` : ""}`),
    get: (id: string) => api.get<unknown>(`/api/deployments/${id}`),
    cancel: (id: string) => api.post(`/api/deployments/${id}/cancel`),
  },

  // Server
  server: {
    info: () => api.get<unknown>("/api/server/info"),
    processes: (limit = 20) => api.get<unknown[]>(`/api/server/processes?limit=${limit}`),
  },

  // Databases
  databases: {
    list: () => api.get<unknown[]>("/api/databases"),
    get: (id: string) => api.get<unknown>(`/api/databases/${id}`),
    start: (id: string) => api.post(`/api/databases/${id}/start`),
    stop: (id: string) => api.post(`/api/databases/${id}/stop`),
    restart: (id: string) => api.post(`/api/databases/${id}/restart`),
    backup: (id: string) => api.post(`/api/databases/${id}/backup`),
  },

  // Pipelines
  pipelines: {
    list: () => api.get<unknown[]>("/api/pipelines"),
    get: (id: string) => api.get<unknown>(`/api/pipelines/${id}`),
    run: (id: string) => api.post<unknown>(`/api/pipelines/${id}/run`),
  },

  // Security
  security: {
    findings: () => api.get<unknown[]>("/api/security/findings"),
    score: () => api.get<unknown>("/api/security/score"),
    firewall: () => api.get<unknown[]>("/api/security/firewall"),
    scans: () => api.get<unknown[]>("/api/security/scans"),
    acknowledge: (id: string) => api.post(`/api/security/findings/${id}/acknowledge`),
    resolve: (id: string) => api.post(`/api/security/findings/${id}/resolve`),
  },

  // Alerts
  alerts: {
    list: () => api.get<unknown[]>("/api/alerts"),
    acknowledge: (id: string) => api.post(`/api/alerts/${id}/acknowledge`),
    resolve: (id: string) => api.post(`/api/alerts/${id}/resolve`),
    acknowledgeAll: () => api.post("/api/alerts/acknowledge-all"),
  },

  // Environments
  environments: {
    list: (projectId?: string) => api.get<unknown[]>(`/api/environments${projectId ? `?project_id=${projectId}` : ""}`),
    sleep: (id: string) => api.post(`/api/environments/${id}/sleep`),
    wake: (id: string) => api.post(`/api/environments/${id}/wake`),
    promote: (id: string) => api.post(`/api/environments/${id}/promote`),
  },

  // Webhooks
  webhooks: {
    list: () => api.get<unknown[]>("/api/webhooks"),
    test: (id: string) => api.post(`/api/webhooks/${id}/test`),
    deliveries: (id: string) => api.get<unknown[]>(`/api/webhooks/${id}/deliveries`),
    redeliver: (deliveryId: string) => api.post(`/api/webhooks/deliveries/${deliveryId}/redeliver`),
  },

  // Templates
  templates: {
    list: () => api.get<unknown[]>("/api/templates"),
    deploy: (templateId: string, projectName: string) =>
      api.post<unknown>("/api/templates", { template_id: templateId, project_name: projectName }),
  },

  // Regions
  regions: {
    list: () => api.get<unknown[]>("/api/regions"),
    edgeConfig: (projectId: string) => api.get<unknown>(`/api/projects/${projectId}/edge`),
  },

  // Logs
  logs: {
    aggregate: (params?: { containers?: string; level?: string; filter?: string }) =>
      api.get<unknown[]>(`/api/logs/aggregate${params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : ""}`),
    streams: () => api.get<unknown[]>("/api/logs/streams"),
  },
};
