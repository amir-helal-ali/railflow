"use client";

import * as React from "react";
import { Plus, Search, HardDrive, Trash2, AlertTriangle, FolderTree } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockVolumes } from "@/lib/mock-data";
import { EmptyState } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function VolumesView() {
  const { t, locale } = useI18n();
  const [query, setQuery] = React.useState("");
  const [showUnusedOnly, _setShowUnusedOnly] = React.useState(false);

  const filtered = mockVolumes.filter((v) => {
    if (showUnusedOnly && v.inUse) return false;
    if (query && !v.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const totalSize = mockVolumes.reduce((sum, v) => sum + v.sizeMb, 0);
  const unusedCount = mockVolumes.filter((v) => !v.inUse).length;
  const unusedSize = mockVolumes.filter((v) => !v.inUse).reduce((sum, v) => sum + v.sizeMb, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("volumes.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("volumes.subtitle")}</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Plus className="w-4 h-4" />
          {t("volumes.new")}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("common.name")}</div>
          <div className="text-2xl font-semibold tabular-nums">{mockVolumes.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">volumes</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("volumes.size")}</div>
          <div className="text-2xl font-semibold tabular-nums">{formatBytes(totalSize)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">total allocated</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("volumes.inUse")}</div>
          <div className="text-2xl font-semibold tabular-nums text-emerald-400">{mockVolumes.length - unusedCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">attached</div>
        </div>
        <div className="glass-card p-4 border-amber-500/20">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("volumes.unused")}</div>
          <div className="text-2xl font-semibold tabular-nums text-amber-400">{unusedCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{formatBytes(unusedSize)} reclaimable</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.search")}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        <Button variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10" disabled={unusedCount === 0}>
          <Trash2 className="w-3.5 h-3.5" />
          {t("volumes.deleteUnused")} ({unusedCount})
        </Button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-start font-medium px-4 py-3">{t("volumes.name")}</th>
                <th className="text-start font-medium px-4 py-3 hidden md:table-cell">{t("volumes.driver")}</th>
                <th className="text-start font-medium px-4 py-3 hidden lg:table-cell">{t("volumes.mountpoint")}</th>
                <th className="text-end font-medium px-4 py-3">{t("volumes.size")}</th>
                <th className="text-start font-medium px-4 py-3 hidden md:table-cell">{t("volumes.containers")}</th>
                <th className="text-start font-medium px-4 py-3">{t("volumes.inUse")}</th>
                <th className="text-end font-medium px-4 py-3 hidden lg:table-cell">{t("volumes.created")}</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02] group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <HardDrive className={cn("w-4 h-4 shrink-0", v.inUse ? "text-emerald-400" : "text-amber-400")} />
                      <span className="font-mono text-xs">{v.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <code className="text-xs text-muted-foreground">{v.driver}</code>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <code className="text-[10px] text-muted-foreground/70 truncate block max-w-xs">{v.mountpoint}</code>
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">{formatBytes(v.sizeMb)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {v.containers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {v.containers.slice(0, 2).map((c) => (
                          <code key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-violet-300">{c}</code>
                        ))}
                        {v.containers.length > 2 && <span className="text-[10px] text-muted-foreground">+{v.containers.length - 2}</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {v.inUse ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {t("volumes.inUse")}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {t("volumes.unused")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>{timeAgo(v.createdAt, locale)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {!v.inUse && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState icon={<FolderTree className="w-12 h-12" />} title={t("common.noData")} />
        )}
      </div>
    </div>
  );
}
