"use client";

import * as React from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Bell,
  Plus,
  Check,
  X,
  Mail,
  MessageSquare,
  Phone,
  Webhook,
  Filter,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockAlerts, mockNotificationRules } from "@/lib/mock-data";
import { SectionHeader, EmptyState } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AlertSeverity, AlertCategory } from "@/lib/types";

const severityConfig: Record<AlertSeverity, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  info: { color: "text-sky-300", bg: "bg-sky-500/5", border: "border-sky-500/20", icon: Info },
  warning: { color: "text-amber-300", bg: "bg-amber-500/5", border: "border-amber-500/20", icon: AlertTriangle },
  critical: { color: "text-rose-400", bg: "bg-rose-500/5", border: "border-rose-500/20", icon: AlertCircle },
};

const categoryColor: Record<AlertCategory, string> = {
  deployment: "bg-violet-500/10 text-violet-300",
  container: "bg-cyan-500/10 text-cyan-300",
  database: "bg-amber-500/10 text-amber-300",
  server: "bg-emerald-500/10 text-emerald-300",
  certificate: "bg-pink-500/10 text-pink-300",
  billing: "bg-orange-500/10 text-orange-300",
  security: "bg-red-500/10 text-red-300",
};

const channelIcon: Record<string, React.ElementType> = {
  email: Mail,
  slack: MessageSquare,
  discord: MessageSquare,
  webhook: Webhook,
  sms: Phone,
};

export function AlertsView() {
  const { t, locale } = useI18n();
  const [alerts, setAlerts] = React.useState(mockAlerts);
  const [filter, setFilter] = React.useState<"active" | "acknowledged" | "resolved" | "all">("active");

  const acknowledge = (id: string) => {
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, acknowledged: true } : x)));
  };
  const resolve = (id: string) => {
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, resolved: true, acknowledged: true } : x)));
  };
  const acknowledgeAll = () => {
    setAlerts((a) => a.map((x) => ({ ...x, acknowledged: true })));
  };

  const filtered = alerts.filter((a) => {
    if (filter === "active") return !a.resolved && !a.acknowledged;
    if (filter === "acknowledged") return a.acknowledged && !a.resolved;
    if (filter === "resolved") return a.resolved;
    return true;
  });

  const counts = {
    active: alerts.filter((a) => !a.resolved && !a.acknowledged).length,
    acknowledged: alerts.filter((a) => a.acknowledged && !a.resolved).length,
    resolved: alerts.filter((a) => a.resolved).length,
    all: alerts.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-violet-300" />
            {t("alerts.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("alerts.subtitle")}</p>
        </div>
        {counts.active > 0 && (
          <Button variant="outline" onClick={acknowledgeAll} className="text-xs">
            <Check className="w-3.5 h-3.5" />
            {t("alerts.acknowledgeAll")} ({counts.active})
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {([
            { id: "active", label: t("alerts.active"), count: counts.active },
            { id: "acknowledged", label: t("alerts.acknowledged"), count: counts.acknowledged },
            { id: "resolved", label: t("alerts.resolved"), count: counts.resolved },
            { id: "all", label: t("alerts.all"), count: counts.all },
          ] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                filter === f.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              <span className="text-[10px] text-muted-foreground/70 tabular-nums">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alerts list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-12 h-12 text-emerald-400" />}
          title={t("alerts.noActive")}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => {
            const cfg = severityConfig[alert.severity];
            const SevIcon = cfg.icon;
            return (
              <div
                key={alert.id}
                className={cn("glass-card p-4 border-l-4", cfg.border, alert.resolved && "opacity-60")}
              >
                <div className="flex items-start gap-3">
                  {/* Severity icon */}
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                    <SevIcon className={cn("w-4 h-4", cfg.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold">{alert.title}</h3>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded capitalize", categoryColor[alert.category])}>
                        {alert.category}
                      </span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", cfg.color, cfg.border)}>
                        {t(`alerts.severity.${alert.severity}`)}
                      </span>
                      {alert.acknowledged && !alert.resolved && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300">
                          <Check className="w-2.5 h-2.5 inline" /> {t("alerts.acknowledged")}
                        </span>
                      )}
                      {alert.resolved && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                          <CheckCircle2 className="w-2.5 h-2.5 inline" /> {t("alerts.resolved")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70">
                      <span suppressHydrationWarning>{timeAgo(alert.timestamp, locale)}</span>
                      {alert.ip && <span>IP: <code className="font-mono">{alert.ip}</code></span>}
                    </div>

                    {/* Actions */}
                    {alert.actions && !alert.resolved && (
                      <div className="flex items-center gap-1.5 mt-3">
                        {alert.actions.map((action, i) => (
                          <Button
                            key={i}
                            variant={action.type === "primary" ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "h-7 text-xs",
                              action.type === "primary" && "bg-gradient-to-r from-violet-500 to-cyan-500 border-0",
                              action.type === "danger" && "border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                            )}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right actions */}
                  <div className="flex flex-col gap-1">
                    {!alert.acknowledged && !alert.resolved && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => acknowledge(alert.id)} title={t("alerts.acknowledge")}>
                        <Check className="w-3.5 h-3.5 text-sky-300" />
                      </Button>
                    )}
                    {!alert.resolved && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => resolve(alert.id)} title={t("alerts.resolve")}>
                        <X className="w-3.5 h-3.5 text-emerald-300" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notification rules */}
      <div className="glass-card p-5">
        <SectionHeader
          title={t("alerts.rules")}
          action={
            <Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
              <Plus className="w-3.5 h-3.5" />
              {t("alerts.newRule")}
            </Button>
          }
        />
        <div className="space-y-2">
          {mockNotificationRules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <Switch defaultChecked={rule.enabled} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{rule.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {rule.events.map((ev) => (
                    <code key={ev} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-violet-300">
                      {ev}
                    </code>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {rule.channels.map((ch) => {
                  const Icon = channelIcon[ch] ?? Bell;
                  return (
                    <div key={ch} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center" title={ch}>
                      <Icon className="w-3 h-3 text-muted-foreground" />
                    </div>
                  );
                })}
                <code className="text-[10px] text-muted-foreground font-mono ms-2">{rule.target}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
