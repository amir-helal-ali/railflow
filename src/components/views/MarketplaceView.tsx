"use client";

import * as React from "react";
import {
  Search,
  Star,
  GitFork,
  Rocket,
  ExternalLink,
  Clock,
  CheckCircle2,
  Settings2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockTemplates } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Template } from "@/lib/types";

const categoryColors: Record<Template["category"], string> = {
  framework: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  api: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  static: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  database: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  ml: "bg-pink-500/10 text-pink-300 border-pink-500/20",
  worker: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  fullstack: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

export function MarketplaceView() {
  const { t, locale } = useI18n();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<Template["category"] | "all">("all");
  const [selected, setSelected] = React.useState<Template | null>(null);

  const filtered = mockTemplates.filter((tpl) => {
    if (category !== "all" && tpl.category !== category) return false;
    if (query) {
      const q = query.toLowerCase();
      return tpl.name.toLowerCase().includes(q) || tpl.description.toLowerCase().includes(q) || tpl.tags.some((tag) => tag.includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("marketplace.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("marketplace.subtitle")}</p>
      </div>

      {/* Search + categories */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("marketplace.search")}
            className="pl-9 bg-white/5 border-white/10 h-10"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10 flex-wrap">
          {(["all", "framework", "api", "static", "database", "ml", "worker", "fullstack"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                category === c ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`marketplace.category.${c}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className="glass-card glass-card-hover p-5 cursor-pointer transition-all"
            onClick={() => setSelected(tpl)}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="text-4xl shrink-0">{tpl.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate group-hover:text-violet-300 transition-colors">{tpl.name}</h3>
                <p className="text-xs text-muted-foreground">{tpl.framework}</p>
              </div>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded border shrink-0", categoryColors[tpl.category])}>
                {t(`marketplace.category.${tpl.category}`)}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">{tpl.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {tpl.tags.slice(0, 3).map((tag) => (
                <code key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{tag}</code>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-white/5">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span className="tabular-nums">{tpl.stars.toLocaleString()}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Rocket className="w-3 h-3 text-violet-300" />
                  <span className="tabular-nums">{tpl.deployments.toLocaleString()}</span>
                </span>
              </div>
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="w-3 h-3" />
                ~{tpl.estimatedDeployTime}s
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail dialog */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="text-5xl">{selected.icon}</div>
                <div>
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <p className="text-sm text-muted-foreground">{selected.framework} · by {selected.author}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" />
                      <span className="tabular-nums">{selected.stars.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Rocket className="w-3 h-3 text-violet-300" />
                      <span className="tabular-nums">{selected.deployments.toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground">{selected.description}</p>

              {/* Features */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("marketplace.features")}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selected.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Commands */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Build & Run</h4>
                <div className="space-y-1.5">
                  {selected.installCommand && (
                    <div className="flex items-center gap-2 p-2 rounded bg-black/30">
                      <span className="text-[10px] text-muted-foreground w-16 shrink-0">Install:</span>
                      <code className="text-xs font-mono text-violet-300 truncate">{selected.installCommand}</code>
                    </div>
                  )}
                  {selected.buildCommand && (
                    <div className="flex items-center gap-2 p-2 rounded bg-black/30">
                      <span className="text-[10px] text-muted-foreground w-16 shrink-0">Build:</span>
                      <code className="text-xs font-mono text-cyan-300 truncate">{selected.buildCommand}</code>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-2 rounded bg-black/30">
                    <span className="text-[10px] text-muted-foreground w-16 shrink-0">Start:</span>
                    <code className="text-xs font-mono text-emerald-300 truncate">{selected.startCommand}</code>
                  </div>
                </div>
              </div>

              {/* Env vars */}
              {selected.envVars.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("marketplace.envVars")}</h4>
                  <div className="space-y-1.5">
                    {selected.envVars.map((v) => (
                      <div key={v.key} className="flex items-center gap-2 p-2 rounded bg-white/5">
                        <code className="text-xs font-mono text-violet-300">{v.key}</code>
                        {v.required && <span className="text-[9px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">required</span>}
                        <span className="text-xs text-muted-foreground flex-1 truncate">{v.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
                  <Rocket className="w-4 h-4" />
                  {t("marketplace.deploy")} (~{selected.estimatedDeployTime}s)
                </Button>
                {selected.demoUrl && (
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4" />
                    {t("marketplace.preview")}
                  </Button>
                )}
                <Button variant="outline" onClick={() => window.open(selected.repoUrl, "_blank")}>
                  <GitFork className="w-4 h-4" />
                  {t("marketplace.viewRepo")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
