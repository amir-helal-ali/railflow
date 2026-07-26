"use client";

import * as React from "react";
import { Plus, Search, Network as NetworkIcon, Globe, Lock, Shield, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockNetworks } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

const driverColor: Record<string, string> = {
  bridge: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  host: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  overlay: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  macvlan: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  none: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
};

export function NetworksView() {
  const { t, locale: _locale } = useI18n();
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<typeof mockNetworks[number] | null>(mockNetworks[0]);

  const filtered = mockNetworks.filter((n) =>
    !query || n.name.toLowerCase().includes(query.toLowerCase()) || n.driver.includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("networks.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("networks.subtitle")}</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Plus className="w-4 h-4" />
          {t("networks.new")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* List */}
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
          <div className="space-y-1">
            {filtered.map((net) => (
              <button
                key={net.id}
                onClick={() => setSelected(net)}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-lg text-start transition-colors",
                  selected?.id === net.id ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", driverColor[net.driver] ?? driverColor.none)}>
                  <NetworkIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium font-mono">{net.name}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border capitalize", driverColor[net.driver])}>
                      {net.driver}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span className="tabular-nums">{net.containers.length} {t("networks.containers").toLowerCase()}</span>
                    {net.subnet !== "—" && <code className="text-violet-300/80">{net.subnet}</code>}
                    <span className="capitalize">{net.scope}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected && <NetworkDetail net={selected} />}
        </div>
      </div>
    </div>
  );
}

function NetworkDetail({ net }: { net: typeof mockNetworks[number] }) {
  const { t, locale } = useI18n();
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-mono font-semibold text-base">{net.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">{net.driver} · {net.scope}</p>
        </div>
        <span className={cn("text-[10px] px-2 py-1 rounded border capitalize", driverColor[net.driver])}>
          {net.driver}
        </span>
      </div>

      {/* Properties */}
      <div className="space-y-2 text-xs">
        <Prop label={t("networks.subnet")} value={net.subnet} mono />
        <Prop label={t("networks.gateway")} value={net.gateway} mono />
        <Prop label={t("networks.scope")} value={net.scope} capitalize />
        <Prop label={t("common.created")} value={timeAgo(net.createdAt, locale)} suppressHydration />
      </div>

      {/* Flags */}
      <div className="grid grid-cols-3 gap-2">
        <Flag label={t("networks.internal")} active={net.internal} icon={<Lock className="w-3 h-3" />} />
        <Flag label={t("networks.attachable")} active={net.attachable} icon={<Globe className="w-3 h-3" />} />
        <Flag label={t("networks.ingress")} active={net.ingress} icon={<Shield className="w-3 h-3" />} />
      </div>

      {/* Connected containers */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {t("networks.containers")} ({net.containers.length})
        </h4>
        {net.containers.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 py-4 text-center">No containers connected</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
            {net.containers.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{c.name}</p>
                  <code className="text-[10px] text-muted-foreground">{c.id.slice(0, 12)}</code>
                </div>
                <code className="text-[11px] font-mono text-violet-300">{c.ipv4}</code>
              </div>
            ))}
          </div>
        )}
      </div>

      {net.name !== "host" && net.name !== "none" && (
        <Button variant="outline" size="sm" className="w-full text-rose-400 hover:bg-rose-500/10 border-rose-500/30">
          <Trash2 className="w-3.5 h-3.5" />
          {t("common.delete")}
        </Button>
      )}
    </div>
  );
}

function Prop({ label, value, mono, capitalize, suppressHydration }: { label: string; value: string; mono?: boolean; capitalize?: boolean; suppressHydration?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-white/5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(mono ? "font-mono text-violet-300" : "", capitalize && "capitalize")} suppressHydrationWarning={suppressHydration}>{value}</span>
    </div>
  );
}

function Flag({ label, active, icon }: { label: string; active: boolean; icon: React.ReactNode }) {
  return (
    <div className={cn(
      "p-2 rounded-lg border text-center",
      active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-white/5 border-white/10 text-muted-foreground/50"
    )}>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {icon}
      </div>
      <div className="text-[10px] font-medium">{label}</div>
      <div className="text-[10px]">{active ? "ON" : "OFF"}</div>
    </div>
  );
}
