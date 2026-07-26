"use client";

import * as React from "react";
import {
  Send,
  Copy,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockApiEndpoints, mockApiLog } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ApiEndpoint } from "@/lib/types";

const methodColor: Record<ApiEndpoint["method"], string> = {
  GET: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  POST: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  PUT: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  PATCH: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  DELETE: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

const categoryLabels: Record<ApiEndpoint["category"], string> = {
  auth: "Auth",
  projects: "Projects",
  deployments: "Deployments",
  containers: "Containers",
  databases: "Databases",
  server: "Server",
  webhooks: "Webhooks",
};

export function PlaygroundView() {
  const { t } = useI18n();
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<ApiEndpoint | null>(mockApiEndpoints[0]);
  const [authToken, setAuthToken] = React.useState("rf_live_8K9p2XmN7qL3rT5yU1iH6wZ");
  const [body, setBody] = React.useState(mockApiEndpoints[0]?.sampleRequest ?? "");
  const [response, setResponse] = React.useState<string>("");
  const [status, setStatus] = React.useState<number | null>(null);
  const [duration, setDuration] = React.useState<number | null>(null);
  const [sending, setSending] = React.useState(false);
  const [history, setHistory] = React.useState(mockApiLog);
  const [openCategories, setOpenCategories] = React.useState<Set<string>>(new Set(["projects"]));

  React.useEffect(() => {
    if (selected) {
      setBody(selected.sampleRequest);
      setResponse("");
      setStatus(null);
      setDuration(null);
    }
  }, [selected]);

  const send = () => {
    if (!selected) return;
    setSending(true);
    setResponse("");
    setStatus(null);
    const start = performance.now();
    setTimeout(() => {
      const elapsed = performance.now() - start;
      setDuration(elapsed);
      setResponse(selected.sampleResponse);
      setStatus(selected.method === "DELETE" ? 200 : selected.method === "POST" ? 201 : 200);
      setSending(false);
      setHistory((h) => [
        {
          id: `al_${Date.now()}`,
          timestamp: new Date().toISOString(),
          method: selected.method,
          path: selected.path,
          status: selected.method === "DELETE" ? 200 : selected.method === "POST" ? 201 : 200,
          durationMs: Math.round(elapsed),
          requestSize: body.length,
          responseSize: selected.sampleResponse.length,
        },
        ...h,
      ].slice(0, 20));
    }, 400 + Math.random() * 800);
  };

  const filtered = mockApiEndpoints.filter(
    (e) => !query || e.path.toLowerCase().includes(query.toLowerCase()) || e.description.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, ApiEndpoint[]>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {});

  const copyCurl = () => {
    if (!selected) return;
    const curl = `curl -X ${selected.method} \\
  https://api.railflow.io${selected.path} \\
  -H "Authorization: Bearer ${authToken || "<token>"}" \\
  -H "Content-Type: application/json"${body && selected.method !== "GET" ? ` \\\n  -d '${body.replace(/\n/g, "")}'` : ""}`;
    navigator.clipboard?.writeText(curl);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Code className="w-6 h-6 text-violet-300" />
          {t("playground.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("playground.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Endpoints list */}
        <div className="lg:col-span-1 glass-card p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("help.search")}
              className="pl-9 bg-white/5 border-white/10 h-9"
            />
          </div>
          <div className="space-y-2 max-h-[640px] overflow-y-auto scrollbar-thin">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <button
                  onClick={() => {
                    setOpenCategories((s) => {
                      const n = new Set(s);
                      if (n.has(cat)) n.delete(cat); else n.add(cat);
                      return n;
                    });
                  }}
                  className="flex items-center gap-1 w-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  {openCategories.has(cat) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {categoryLabels[cat as ApiEndpoint["category"]]} ({items.length})
                </button>
                {openCategories.has(cat) && (
                  <div className="space-y-0.5 mt-1">
                    {items.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => setSelected(ep)}
                        className={cn(
                          "flex items-center gap-2 w-full p-2 rounded-lg text-start transition-colors",
                          selected?.id === ep.id ? "bg-white/10" : "hover:bg-white/5"
                        )}
                      >
                        <span className={cn("text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 w-14 text-center", methodColor[ep.method])}>
                          {ep.method}
                        </span>
                        <span className="text-[11px] font-mono truncate flex-1">{ep.path}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Request/Response */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              {/* Endpoint info */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-xs font-mono font-bold px-2 py-1 rounded border", methodColor[selected.method])}>
                    {selected.method}
                  </span>
                  <code className="text-sm font-mono flex-1 truncate">{selected.path}</code>
                  <Button variant="ghost" size="sm" onClick={copyCurl} className="text-xs">
                    <Copy className="w-3 h-3" />
                    {t("playground.copyCurl")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{selected.description}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                    Auth: <span className="text-violet-300">{selected.auth}</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                    Category: <span className="text-cyan-300">{categoryLabels[selected.category]}</span>
                  </span>
                </div>
              </div>

              {/* Auth token */}
              <div className="glass-card p-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("playground.authToken")}</label>
                <Input
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="bg-white/5 border-white/10 font-mono text-xs"
                  placeholder="rf_live_..."
                />
              </div>

              {/* Request body */}
              {selected.method !== "GET" && (
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("playground.body")}</label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => navigator.clipboard?.writeText(body)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-40 p-3 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-foreground outline-none focus:border-violet-400/40 resize-none"
                    spellCheck={false}
                  />
                </div>
              )}

              {/* Send button */}
              <Button
                onClick={send}
                disabled={sending}
                className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 border-0 h-11"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("playground.sending")}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t("playground.send")}
                  </>
                )}
              </Button>

              {/* Response */}
              {(response || sending) && (
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("playground.response")}</label>
                    {status !== null && (
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1">
                          {status >= 200 && status < 300 ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-400" />
                          )}
                          <span className={status >= 200 && status < 300 ? "text-emerald-400" : "text-rose-400"}>
                            {status} {t("playground.statusCode")}
                          </span>
                        </span>
                        {duration !== null && (
                          <span className="text-muted-foreground tabular-nums">{duration.toFixed(0)}ms</span>
                        )}
                        <span className="text-muted-foreground tabular-nums">{response.length}B</span>
                      </div>
                    )}
                  </div>
                  <pre className="p-3 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
                    {sending ? "…" : response}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* History */}
        <div className="lg:col-span-1 glass-card p-3">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("playground.history")}</span>
          </div>
          <div className="space-y-1 max-h-[640px] overflow-y-auto scrollbar-thin">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-2 p-2 rounded hover:bg-white/5">
                <span className={cn("text-[9px] font-mono font-bold px-1 py-0.5 rounded shrink-0 w-12 text-center", methodColor[h.method as ApiEndpoint["method"]] ?? "bg-white/5")}>
                  {h.method}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono truncate">{h.path}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {h.status} · {h.durationMs}ms
                  </p>
                </div>
                <span className={cn("text-[10px] font-mono", h.status >= 200 && h.status < 300 ? "text-emerald-400" : "text-rose-400")}>
                  {h.status >= 200 && h.status < 300 ? "✓" : "✗"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
