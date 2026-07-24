"use client";

import * as React from "react";
import {
  Plus,
  Database as DatabaseIcon,
  Search,
  Copy,
  Eye,
  EyeOff,
  RotateCcw,
  HardDrive,
  Activity,
  ShieldCheck,
  ExternalLink,
  Play,
  Square,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockDatabases } from "@/lib/mock-data";
import { StatusBadge, SectionHeader, ProgressBar } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeAgo, formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DatabaseEngine, ManagedDatabase } from "@/lib/types";

const engineMeta: Record<DatabaseEngine, { color: string; icon: string }> = {
  postgresql: { color: "bg-blue-500/10 text-blue-300 border-blue-500/20", icon: "🐘" },
  mysql: { color: "bg-orange-500/10 text-orange-300 border-orange-500/20", icon: "🐬" },
  redis: { color: "bg-rose-500/10 text-rose-300 border-rose-500/20", icon: "⚡" },
  mongodb: { color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", icon: "🍃" },
  mariadb: { color: "bg-amber-500/10 text-amber-300 border-amber-500/20", icon: "🌊" },
};

export function DatabasesView() {
  const { t, locale } = useI18n();
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<ManagedDatabase | null>(mockDatabases[0]);
  const [showCreate, setShowCreate] = React.useState(false);

  const filtered = mockDatabases.filter((d) =>
    !query || d.name.toLowerCase().includes(query.toLowerCase()) || d.engine.includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("databases.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("databases.subtitle")}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Plus className="w-4 h-4" />
          {t("databases.new")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Database list */}
        <div className="lg:col-span-3 glass-card p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.search")}
              className="pl-9 bg-white/5 border-white/10 h-9"
            />
          </div>
          <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin">
            {filtered.map((db) => {
              const meta = engineMeta[db.engine];
              return (
                <button
                  key={db.id}
                  onClick={() => setSelected(db)}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg text-start transition-colors",
                    selected?.id === db.id ? "bg-white/10" : "hover:bg-white/5"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{db.name}</span>
                      <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border", meta.color)}>
                        {db.engine} {db.version}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span className="tabular-nums">{db.stats.connections}/{db.stats.maxConnections} {t("databases.connections").toLowerCase()}</span>
                      <span className="tabular-nums">{db.stats.queriesPerSecond.toFixed(0)} {t("databases.qps")}</span>
                      <span className="tabular-nums">{db.storage.usedGb.toFixed(1)}/{db.storage.totalGb} GB</span>
                    </div>
                  </div>
                  <StatusBadge status={db.status === "running" ? "running" : db.status === "stopped" ? "stopped" : "building"} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selected ? <DatabaseDetail db={selected} /> : null}
        </div>
      </div>

      {showCreate && <CreateDatabaseDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function DatabaseDetail({ db }: { db: ManagedDatabase }) {
  const { t, locale } = useI18n();
  const [showCreds, setShowCreds] = React.useState(false);
  const [copied, setCopied] = React.useState<string | null>(null);
  const meta = engineMeta[db.engine];

  const copy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
            {meta.icon}
          </div>
          <div>
            <h3 className="font-semibold">{db.name}</h3>
            <p className="text-xs text-muted-foreground">{t(`databases.engine.${db.engine}`)} {db.version} · {t(`databases.plan.${db.plan}`)} · {db.region}</p>
          </div>
        </div>
        <StatusBadge status={db.health} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-white/5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("databases.connections")}</div>
          <div className="text-sm font-semibold tabular-nums">{db.stats.connections} / {db.stats.maxConnections}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white/5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("databases.qps")}</div>
          <div className="text-sm font-semibold tabular-nums">{db.stats.queriesPerSecond.toFixed(1)}</div>
        </div>
      </div>

      {/* Storage */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">{t("databases.storage")}</span>
          <span className="text-xs tabular-nums">{db.storage.usedGb.toFixed(1)} / {db.storage.totalGb} GB</span>
        </div>
        <ProgressBar
          value={(db.storage.usedGb / db.storage.totalGb) * 100}
          color={(db.storage.usedGb / db.storage.totalGb) * 100 > 80 ? "oklch(0.7 0.24 25)" : "linear-gradient(90deg, oklch(0.72 0.22 295), oklch(0.78 0.17 190))"}
        />
      </div>

      {/* Connection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("databases.connection")}</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowCreds(!showCreds)}>
            {showCreds ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showCreds ? t("databases.hideCredentials") : t("databases.showCredentials")}
          </Button>
        </div>
        <div className="space-y-1.5">
          <CredRow label={t("common.host")} value={db.connectionInfo.host} onCopy={() => copy("host", db.connectionInfo.host)} copied={copied === "host"} />
          <CredRow label={t("common.port")} value={String(db.connectionInfo.port)} onCopy={() => copy("port", String(db.connectionInfo.port))} copied={copied === "port"} />
          <CredRow label={t("common.username")} value={db.connectionInfo.username} onCopy={() => copy("user", db.connectionInfo.username)} copied={copied === "user"} />
          <CredRow label={t("common.password")} value={showCreds ? "realpassword" : db.connectionInfo.passwordMasked} onCopy={() => copy("pw", "realpassword")} copied={copied === "pw"} />
          <CredRow label={t("databases.internalUrl")} value={db.connectionInfo.internalUrl} onCopy={() => copy("url", db.connectionInfo.internalUrl)} copied={copied === "url"} mono />
          {db.connectionInfo.externalUrl && (
            <CredRow label={t("databases.externalUrl")} value={db.connectionInfo.externalUrl} onCopy={() => copy("eurl", db.connectionInfo.externalUrl ?? "")} copied={copied === "eurl"} mono />
          )}
        </div>
      </div>

      {/* Backups */}
      <div className="p-3 rounded-lg bg-white/5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" />
            {t("databases.backups")}
          </span>
          {db.backups.enabled ? (
            <span className="text-[10px] text-emerald-400">{t("common.yes")}</span>
          ) : (
            <span className="text-[10px] text-rose-400">{t("common.no")}</span>
          )}
        </div>
        {db.backups.enabled && (
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <div className="flex justify-between">
              <span>{t("databases.lastBackup")}:</span>
              <span className="tabular-nums" suppressHydrationWarning>{db.backups.lastBackupAt ? timeAgo(db.backups.lastBackupAt, locale) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("databases.retention")}:</span>
              <span className="tabular-nums">{db.backups.retention} {t("databases.days")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {db.status === "running" ? (
          <Button variant="outline" size="sm" className="flex-1">
            <Square className="w-3 h-3" />
            {t("common.stop")}
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="flex-1">
            <Play className="w-3 h-3" />
            {t("common.start")}
          </Button>
        )}
        <Button variant="outline" size="sm" className="flex-1">
          <RotateCcw className="w-3 h-3" />
          {t("databases.restart")}
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <HardDrive className="w-3 h-3" />
          {t("databases.createBackup")}
        </Button>
      </div>
    </div>
  );
}

function CredRow({ label, value, onCopy, copied, mono }: { label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded bg-white/[0.03]">
      <span className="text-[10px] text-muted-foreground min-w-[80px]">{label}</span>
      <code className={cn("text-xs flex-1 truncate", mono ? "font-mono text-violet-300" : "text-foreground")}>{value}</code>
      <button onClick={onCopy} className="text-muted-foreground hover:text-foreground">
        {copied ? <span className="text-[10px] text-emerald-400">✓</span> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

function CreateDatabaseDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [engine, setEngine] = React.useState<DatabaseEngine>("postgresql");
  const [name, setName] = React.useState("");

  const engines: DatabaseEngine[] = ["postgresql", "mysql", "redis", "mongodb", "mariadb"];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{t("databases.new")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("common.name")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-database" className="bg-white/5 border-white/10 font-mono" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("databases.engine")}</label>
            <div className="grid grid-cols-5 gap-2">
              {engines.map((e) => (
                <button
                  key={e}
                  onClick={() => setEngine(e)}
                  className={cn(
                    "p-2 rounded-lg border text-center transition-all",
                    engine === e ? "border-violet-400 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  <div className="text-xl mb-1">{engineMeta[e].icon}</div>
                  <div className="text-[10px] capitalize">{e}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("databases.plan")}</label>
              <Input defaultValue={t("databases.plan.medium")} className="bg-white/5 border-white/10 h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("databases.region")}</label>
              <Input defaultValue="fra1 — Frankfurt" className="bg-white/5 border-white/10 h-9 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
            <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0" disabled={!name}>
              <Plus className="w-4 h-4" />
              {t("common.create")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
