"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Check,
  X,
  Star,
  ExternalLink,
  Plug,
  Settings2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockIntegrations } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Integration } from "@/lib/types";

const categoryColors: Record<Integration["category"], string> = {
  monitoring: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  "ci-cd": "bg-violet-500/10 text-violet-300 border-violet-500/20",
  communication: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  security: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  analytics: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  storage: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  auth: "bg-pink-500/10 text-pink-300 border-pink-500/20",
  payments: "bg-orange-500/10 text-orange-300 border-orange-500/20",
};

export function IntegrationsView() {
  const { t, locale: _locale } = useI18n();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "installed" | "available" | Integration["category"]>("all");
  const [integrations, setIntegrations] = React.useState(mockIntegrations);
  const [selected, setSelected] = React.useState<Integration | null>(null);

  const categories: Array<Integration["category"] | "all" | "installed" | "available"> = [
    "all", "installed", "available", "monitoring", "ci-cd", "communication", "security", "analytics", "storage", "auth", "payments",
  ];

  const filtered = integrations.filter((i) => {
    if (filter === "installed" && !i.installed) return false;
    if (filter === "available" && i.installed) return false;
    if (filter !== "all" && filter !== "installed" && filter !== "available" && i.category !== filter) return false;
    if (query && !i.name.toLowerCase().includes(query.toLowerCase()) && !i.description.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const toggleInstall = (id: string) => {
    setIntegrations((list) =>
      list.map((i) => (i.id === id ? { ...i, installed: !i.installed, connectedAt: !i.installed ? new Date().toISOString() : undefined } : i))
    );
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Plug className="w-6 h-6 text-violet-300" />
          {t("integrations.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("integrations.subtitle")}</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("integrations.search")}
            className="pl-9 bg-white/5 border-white/10 h-10"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "px-2.5 py-1.5 text-[10px] font-medium rounded-md transition-colors",
                filter === c ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c === "all" ? t("integrations.all") : c === "installed" ? t("integrations.installed") : c === "available" ? t("integrations.available") : t(`integrations.category.${c}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((int) => (
          <div
            key={int.id}
            className={cn("glass-card p-5 transition-all", int.installed ? "border-emerald-500/20" : "")}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{int.icon}</div>
                <div>
                  <h3 className="font-semibold">{int.name}</h3>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", categoryColors[int.category])}>
                    {t(`integrations.category.${int.category}`)}
                  </span>
                </div>
              </div>
              {int.installed && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {t("integrations.installed")}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">{int.description}</p>

            {/* Features */}
            <div className="flex flex-wrap gap-1 mb-4">
              {int.features.slice(0, 3).map((f) => (
                <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                  {f}
                </span>
              ))}
              {int.features.length > 3 && (
                <span className="text-[10px] text-muted-foreground/60">+{int.features.length - 3}</span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 text-amber-400" />
                  <span className="tabular-nums">{int.popularity}%</span>
                </span>
                <span className="text-muted-foreground/60 capitalize">{int.authType}</span>
              </div>
              <Button
                variant={int.installed ? "outline" : "default"}
                size="sm"
                className={cn("h-7 text-xs", !int.installed && "bg-gradient-to-r from-violet-500 to-cyan-500 border-0")}
                onClick={() => (int.installed && int.configRequired ? setSelected(int) : toggleInstall(int.id))}
              >
                {int.installed ? (
                  <>
                    <Settings2 className="w-3 h-3" />
                    {t("integrations.configure")}
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    {t("integrations.install")}
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Config dialog */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">{selected.icon}</div>
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-xs text-muted-foreground">{t("integrations.configure")} · {selected.authType}</p>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {selected.authType === "api-key" ? "API Key" : selected.authType === "oauth" ? "OAuth Client ID" : "Webhook URL"}
                </label>
                <Input className="bg-white/5 border-white/10 font-mono text-sm" placeholder={selected.authType === "api-key" ? "sk_..." : selected.authType === "oauth" ? "client_xxx" : "https://..."} />
              </div>
              {selected.authType === "api-key" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Secret / Token</label>
                  <Input type="password" className="bg-white/5 border-white/10 font-mono text-sm" placeholder="••••••••" />
                </div>
              )}
            </div>
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t("integrations.features")}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {selected.features.map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-xs">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="outline" size="sm" className="text-rose-400" onClick={() => toggleInstall(selected.id)}>
                <X className="w-3.5 h-3.5" />
                {t("integrations.disconnect")}
              </Button>
              <div className="flex gap-2">
                {selected.documentation && (
                  <Button variant="ghost" size="sm" onClick={() => window.open(selected.documentation, "_blank")}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    Docs
                  </Button>
                )}
                <Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0" onClick={() => setSelected(null)}>
                  <Check className="w-3.5 h-3.5" />
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
