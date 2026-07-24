"use client";

import * as React from "react";
import {
  Search,
  Filter,
  X,
  Save,
  Download,
  Clock,
  User as UserIcon,
  Bot,
  Webhook,
  Key,
  ChevronDown,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockActivity, mockAuditQueries, mockTeam } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityEntry } from "@/lib/types";

const categoryColor: Record<ActivityEntry["category"], string> = {
  auth: "bg-violet-500/10 text-violet-300",
  project: "bg-blue-500/10 text-blue-300",
  deployment: "bg-emerald-500/10 text-emerald-300",
  container: "bg-cyan-500/10 text-cyan-300",
  database: "bg-amber-500/10 text-amber-300",
  settings: "bg-rose-500/10 text-rose-300",
  billing: "bg-pink-500/10 text-pink-300",
};

const actorIcon: Record<ActivityEntry["actor"]["type"], React.ElementType> = {
  user: UserIcon,
  system: Bot,
  webhook: Webhook,
  api: Key,
};

export function AuditSearchView() {
  const { t, locale } = useI18n();
  const [query, setQuery] = React.useState("");
  const [selectedActors, setSelectedActors] = React.useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);

  const allCategories: ActivityEntry["category"][] = ["auth", "project", "deployment", "container", "database", "settings"];

  const toggle = (set: Set<string>, value: string, setter: (s: Set<string>) => void) => {
    const n = new Set(set);
    if (n.has(value)) n.delete(value); else n.add(value);
    setter(n);
  };

  const filtered = mockActivity.filter((a) => {
    if (query) {
      const q = query.toLowerCase();
      if (!a.action.toLowerCase().includes(q) && !a.resource.name.toLowerCase().includes(q) && !a.actor.name.toLowerCase().includes(q)) return false;
    }
    if (selectedActors.size > 0 && !selectedActors.has(a.actor.name)) return false;
    if (selectedCategories.size > 0 && !selectedCategories.has(a.category)) return false;
    if (dateFrom && new Date(a.timestamp) < new Date(dateFrom)) return false;
    if (dateTo && new Date(a.timestamp) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const clearFilters = () => {
    setQuery("");
    setSelectedActors(new Set());
    setSelectedCategories(new Set());
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = query || selectedActors.size > 0 || selectedCategories.size > 0 || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-violet-300" />
          {t("auditSearch.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auditSearch.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Filter className="w-3 h-3" />
                {t("auditSearch.filters")}
              </span>
              {hasFilters && (
                <button onClick={clearFilters} className="text-[10px] text-rose-400 hover:text-rose-300">
                  {t("auditSearch.clear")}
                </button>
              )}
            </div>

            {/* Actors */}
            <div className="mb-4">
              <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block uppercase">{t("auditSearch.actors")}</label>
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                {mockTeam.slice(0, 5).map((m) => (
                  <label key={m.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedActors.has(m.name)}
                      onChange={() => toggle(selectedActors, m.name, setSelectedActors)}
                      className="rounded"
                    />
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={m.avatarUrl} />
                      <AvatarFallback className="text-[8px]">{m.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs truncate">{m.name}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedActors.has("GitHub Webhook")}
                    onChange={() => toggle(selectedActors, "GitHub Webhook", setSelectedActors)}
                    className="rounded"
                  />
                  <Webhook className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs">GitHub Webhook</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedActors.has("System")}
                    onChange={() => toggle(selectedActors, "System", setSelectedActors)}
                    className="rounded"
                  />
                  <Bot className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs">System</span>
                </label>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-4">
              <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block uppercase">{t("auditSearch.categories")}</label>
              <div className="flex flex-wrap gap-1">
                {allCategories.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggle(selectedCategories, c, setSelectedCategories)}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded border transition-colors capitalize",
                      selectedCategories.has(c) ? "bg-violet-500/10 text-violet-300 border-violet-500/30" : "bg-white/5 text-muted-foreground border-white/10 hover:text-foreground"
                    )}
                  >
                    {t(`activity.filter.${c}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="mb-4">
              <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block uppercase">{t("auditSearch.dateRange")}</label>
              <div className="space-y-2">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white/5 border-white/10 h-8 text-xs" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white/5 border-white/10 h-8 text-xs" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 pt-2 border-t border-white/5">
              <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => setShowSaveDialog(true)}>
                <Save className="w-3 h-3" />
                {t("auditSearch.saveQuery")}
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                <Download className="w-3 h-3" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                <Download className="w-3 h-3" />
                JSON
              </Button>
            </div>
          </div>

          {/* Saved queries */}
          <div className="glass-card p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
              {t("auditSearch.savedQueries")}
            </span>
            <div className="space-y-1">
              {mockAuditQueries.map((q) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedCategories(new Set(q.filters.categories ?? []));
                    setSelectedActors(new Set(q.filters.actors ?? []));
                    if (q.filters.dateFrom) setDateFrom(q.filters.dateFrom.slice(0, 10));
                  }}
                  className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-white/5 text-start transition-colors"
                >
                  <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{q.name}</p>
                    <p className="text-[10px] text-muted-foreground" suppressHydrationWarning>{timeAgo(q.savedAt, locale)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 glass-card p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("auditSearch.search")}
              className="pl-9 bg-white/5 border-white/10 h-10"
            />
          </div>

          <div className="text-xs text-muted-foreground mb-3 px-1">
            {filtered.length} {t("auditSearch.results")}
          </div>

          <div className="space-y-1 max-h-[640px] overflow-y-auto scrollbar-thin">
            {filtered.map((entry) => {
              const ActorIcon = actorIcon[entry.actor.type];
              return (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5">
                  {entry.actor.type === "user" && entry.actor.avatarUrl ? (
                    <Avatar className="w-8 h-8 ring-1 ring-white/10 shrink-0">
                      <AvatarImage src={entry.actor.avatarUrl} />
                      <AvatarFallback className="text-[10px]">{entry.actor.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <ActorIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{entry.actor.name}</span>
                      <span className="text-xs text-muted-foreground">{entry.action}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded", categoryColor[entry.category])}>
                        {entry.category}
                      </span>
                    </div>
                    <p className="text-xs text-violet-300 mt-0.5">{entry.resource.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/70">
                      <span className="flex items-center gap-1" suppressHydrationWarning>
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(entry.timestamp, locale)}
                      </span>
                      {entry.ip && <code className="font-mono">{entry.ip}</code>}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t("auditSearch.noResults")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSaveDialog(false)}>
          <div className="glass-card rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{t("auditSearch.saveQuery")}</h3>
            <Input placeholder={t("auditSearch.queryName")} className="bg-white/5 border-white/10 mb-4" autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>{t("common.cancel")}</Button>
              <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0" onClick={() => setShowSaveDialog(false)}>
                <Save className="w-4 h-4" />
                {t("common.save")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
