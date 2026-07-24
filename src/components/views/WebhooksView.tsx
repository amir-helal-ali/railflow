"use client";

import * as React from "react";
import {
  Plus,
  Webhook as WebhookIcon,
  Copy,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockWebhooks, mockWebhookDeliveries } from "@/lib/mock-data";
import { StatusBadge, SectionHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WebhookDelivery } from "@/lib/types";

const deliveryStatusConfig: Record<WebhookDelivery["status"], { color: string; icon: React.ElementType }> = {
  delivered: { color: "text-emerald-400", icon: CheckCircle2 },
  failed: { color: "text-rose-400", icon: XCircle },
  pending: { color: "text-sky-400", icon: Clock },
  retrying: { color: "text-amber-300", icon: Loader2 },
};

export function WebhooksView() {
  const { t, locale } = useI18n();
  const [selectedDelivery, setSelectedDelivery] = React.useState<WebhookDelivery | null>(null);
  const [filter, setFilter] = React.useState<string>("all");
  const [query, setQuery] = React.useState("");
  const [expandedWebhook, setExpandedWebhook] = React.useState<string | null>(mockWebhooks[0].id);

  const filteredDeliveries = mockWebhookDeliveries.filter((d) => {
    if (filter !== "all" && d.status !== filter) return false;
    if (query && !d.webhookName.toLowerCase().includes(query.toLowerCase()) && !d.event.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <WebhookIcon className="w-6 h-6 text-violet-300" />
            {t("webhooks.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("webhooks.subtitle")}</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Plus className="w-4 h-4" />
          {t("webhooks.new")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Webhook endpoints */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-3">
            <div className="space-y-1">
              {mockWebhooks.map((wh) => {
                const expanded = expandedWebhook === wh.id;
                const successRate = wh.deliveries.total > 0 ? (wh.deliveries.success / wh.deliveries.total) * 100 : 0;
                return (
                  <div key={wh.id}>
                    <button
                      onClick={() => setExpandedWebhook(expanded ? null : wh.id)}
                      className={cn(
                        "flex items-center gap-2 w-full p-2.5 rounded-lg text-start transition-colors",
                        expanded ? "bg-white/10" : "hover:bg-white/5"
                      )}
                    >
                      {expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border shrink-0", wh.enabled ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10")}>
                        <WebhookIcon className={cn("w-4 h-4", wh.enabled ? "text-emerald-300" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{wh.name}</p>
                        <code className="text-[10px] text-muted-foreground font-mono truncate block">{wh.url.slice(0, 40)}…</code>
                      </div>
                      <div className="text-end shrink-0">
                        <div className={cn("text-[10px] font-mono tabular-nums", successRate > 99 ? "text-emerald-400" : successRate > 95 ? "text-amber-400" : "text-rose-400")}>
                          {successRate.toFixed(1)}%
                        </div>
                        <div className="text-[9px] text-muted-foreground">{wh.deliveries.last24h} in 24h</div>
                      </div>
                    </button>
                    {expanded && (
                      <div className="p-3 ms-9 me-3 rounded-b-lg bg-black/30 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{t("webhooks.url")}</span>
                          <code className="font-mono text-violet-300 truncate max-w-[200px]">{wh.url}</code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("webhooks.events")}:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {wh.events.map((e) => (
                              <code key={e} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-cyan-300">{e}</code>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{t("webhooks.ssl")}</span>
                          <span className="flex items-center gap-1 text-emerald-400">
                            <ShieldCheck className="w-3 h-3" />
                            {wh.sslVerification ? t("common.yes") : t("common.no")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{t("webhooks.lastDelivery")}</span>
                          <span suppressHydrationWarning>{wh.lastDeliveryAt ? timeAgo(wh.lastDeliveryAt, locale) : "—"}</span>
                        </div>
                        <div className="flex items-center gap-1 pt-2 border-t border-white/5">
                          <Button variant="outline" size="sm" className="h-7 text-xs flex-1">
                            <Send className="w-3 h-3" />
                            {t("webhooks.testWebhook")}
                          </Button>
                          <Button variant="outline" size="icon" className="h-7 w-7">
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-7 w-7 text-rose-400">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Delivery history */}
        <div className="lg:col-span-3 glass-card p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("common.search")}
                className="pl-9 bg-white/5 border-white/10 h-9"
              />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              {(["all", "delivered", "failed", "retrying", "pending"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-2 py-1 text-[10px] font-medium rounded transition-colors",
                    filter === f ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "all" ? t("alerts.all") : t(`webhooks.delivery.status.${f}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 max-h-[640px] overflow-y-auto scrollbar-thin">
            {filteredDeliveries.map((d) => {
              const cfg = deliveryStatusConfig[d.status];
              const StatusIcon = cfg.icon;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDelivery(d)}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg text-start transition-colors",
                    selectedDelivery?.id === d.id ? "bg-white/10" : "hover:bg-white/5"
                  )}
                >
                  <StatusIcon className={cn("w-4 h-4 shrink-0", cfg.color, d.status === "retrying" && "animate-spin")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{d.webhookName}</span>
                      <code className="text-[10px] text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded font-mono">{d.event}</code>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span className="tabular-nums">{d.statusCode}</span>
                      <span>·</span>
                      <span className="tabular-nums">{d.durationMs}ms</span>
                      <span>·</span>
                      <span suppressHydrationWarning>{timeAgo(d.deliveredAt, locale)}</span>
                      {d.attempt > 1 && (
                        <>
                          <span>·</span>
                          <span className="text-amber-300">{t("webhooks.delivery.attempt")} {d.attempt}/{d.maxAttempts}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Delivery detail */}
          {selectedDelivery && (
            <div className="mt-3 p-4 rounded-lg bg-black/30 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("webhooks.delivery.viewDetails")}</h4>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Send className="w-3 h-3" />
                  {t("webhooks.delivery.redeliver")}
                </Button>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">{t("webhooks.delivery.request")}</p>
                <pre className="text-[11px] font-mono p-2 rounded bg-black/40 border border-white/5 overflow-x-auto text-violet-200">
                  {selectedDelivery.requestBody}
                </pre>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">{t("webhooks.delivery.response")}</p>
                <pre className="text-[11px] font-mono p-2 rounded bg-black/40 border border-white/5 overflow-x-auto text-emerald-200">
                  {selectedDelivery.responseBody || "(empty)"}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
