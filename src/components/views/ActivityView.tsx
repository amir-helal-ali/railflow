"use client";

import * as React from "react";
import {
  User as UserIcon,
  Bot,
  Webhook,
  Key,
  GitBranch,
  Container,
  Database as DatabaseIcon,
  Settings as SettingsIcon,
  Filter,
  Shield,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockActivity } from "@/lib/mock-data";
import { SectionHeader } from "@/components/dashboard/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityEntry } from "@/lib/types";

const categoryConfig: Record<ActivityEntry["category"], { color: string; icon: React.ElementType; bg: string }> = {
  auth: { color: "text-violet-300", icon: Shield, bg: "bg-violet-500/10" },
  project: { color: "text-blue-300", icon: GitBranch, bg: "bg-blue-500/10" },
  deployment: { color: "text-emerald-300", icon: GitBranch, bg: "bg-emerald-500/10" },
  container: { color: "text-cyan-300", icon: Container, bg: "bg-cyan-500/10" },
  database: { color: "text-amber-300", icon: DatabaseIcon, bg: "bg-amber-500/10" },
  settings: { color: "text-rose-300", icon: SettingsIcon, bg: "bg-rose-500/10" },
  billing: { color: "text-pink-300", icon: Key, bg: "bg-pink-500/10" },
};

const actorIcon: Record<ActivityEntry["actor"]["type"], React.ElementType> = {
  user: UserIcon,
  system: Bot,
  webhook: Webhook,
  api: Key,
};

export function ActivityView() {
  const { t, locale } = useI18n();
  const [filter, setFilter] = React.useState<"all" | ActivityEntry["category"]>("all");

  const filtered = mockActivity.filter((a) => filter === "all" || a.category === filter);

  const filters: Array<{ id: "all" | ActivityEntry["category"]; label: string; count: number }> = [
    { id: "all", label: t("activity.filter.all"), count: mockActivity.length },
    { id: "auth", label: t("activity.filter.auth"), count: mockActivity.filter(a => a.category === "auth").length },
    { id: "project", label: t("activity.filter.project"), count: mockActivity.filter(a => a.category === "project").length },
    { id: "deployment", label: t("activity.filter.deployment"), count: mockActivity.filter(a => a.category === "deployment").length },
    { id: "container", label: t("activity.filter.container"), count: mockActivity.filter(a => a.category === "container").length },
    { id: "database", label: t("activity.filter.database"), count: mockActivity.filter(a => a.category === "database").length },
    { id: "settings", label: t("activity.filter.settings"), count: mockActivity.filter(a => a.category === "settings").length },
  ];

  // Group by day
  const grouped = React.useMemo(() => {
    const groups: Record<string, ActivityEntry[]> = {};
    filtered.forEach((a) => {
      const day = new Date(a.timestamp).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      if (!groups[day]) groups[day] = [];
      groups[day].push(a);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("activity.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("activity.subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10 flex-wrap">
          {filters.map((f) => (
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

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([day, entries]) => (
          <div key={day}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3 sticky top-16 bg-background/80 backdrop-blur py-1 z-10">
              {day}
            </div>
            <div className="glass-card p-2">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute top-0 bottom-0 w-px bg-white/5 start-[28px]" />

                <div className="space-y-1">
                  {entries.map((entry) => {
                    const cat = categoryConfig[entry.category];
                    const Icon = cat.icon;
                    const ActorIcon = actorIcon[entry.actor.type];
                    return (
                      <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 relative">
                        {/* Avatar with category badge */}
                        <div className="relative shrink-0">
                          {entry.actor.type === "user" && entry.actor.avatarUrl ? (
                            <Avatar className="w-9 h-9 ring-2 ring-background">
                              <AvatarImage src={entry.actor.avatarUrl} />
                              <AvatarFallback className="text-[10px]">{entry.actor.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                              <ActorIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className={cn("absolute -bottom-1 -end-1 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-background", cat.bg)}>
                            <Icon className={cn("w-2.5 h-2.5", cat.color)} />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm">
                              <span className="font-medium">{entry.actor.name}</span>
                              <span className="text-muted-foreground"> {entry.action} </span>
                              <span className={cn("font-medium", cat.color)}>{entry.resource.name}</span>
                            </p>
                            <span className="text-[10px] text-muted-foreground/70 tabular-nums shrink-0" suppressHydrationWarning>{timeAgo(entry.timestamp, locale)}</span>
                          </div>
                          {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {Object.entries(entry.metadata).slice(0, 4).map(([k, v]) => (
                                <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 font-mono text-muted-foreground">
                                  {k}: <span className="text-violet-300">{v}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {entry.ip && (
                            <div className="text-[10px] text-muted-foreground/50 mt-1">
                              <span>{t("activity.ip")}: </span>
                              <code className="font-mono">{entry.ip}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
