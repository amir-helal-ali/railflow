"use client";

/**
 * Railflow Status Bar — sticky bottom bar showing the current region,
 * API status, build version, active deployments count, and an
 * "all systems operational" indicator. Sits above the page footer.
 */

import * as React from "react";
import {
  Globe2,
  Activity,
  GitCommitHorizontal,
  ShieldCheck,
  Zap,
  Wifi,
  Server as ServerIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockDeployments, mockApiHealthChecks } from "@/lib/mock-data";
import { useInterval } from "@/lib/format";
import { cn } from "@/lib/utils";

const APP_VERSION = "v2.4.1";
const DEFAULT_REGION = "EU-Central-1";

export function StatusBar() {
  const { t, dir } = useI18n();
  const [latency, setLatency] = React.useState(42);
  const [apiOnline, setApiOnline] = React.useState(true);
  const [operational, setOperational] = React.useState(true);

  // Simulate live latency & health checks
  useInterval(() => {
    setLatency(28 + Math.floor(Math.random() * 60));
    const downServices = mockApiHealthChecks.filter((c) => c.status === "down").length;
    setApiOnline(downServices === 0);
    setOperational(downServices === 0);
  }, 4000);

  const activeDeployments = mockDeployments.filter(
    (d) => d.status === "building" || d.status === "queued" || d.status === "pushing" || d.status === "starting",
  ).length;

  return (
    <div
      dir={dir}
      className={cn(
        "sticky bottom-0 z-30 mt-6",
        "h-9 px-3 lg:px-6 flex items-center gap-3 lg:gap-5",
        "glass-card rounded-none border-x-0 border-b-0",
        "text-[11px] text-muted-foreground",
        "overflow-hidden",
      )}
      role="status"
      aria-live="polite"
    >
      {/* Operational indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative inline-flex">
          <span
            className={cn(
              "inline-block w-1.5 h-1.5 rounded-full",
              operational ? "bg-emerald-400" : "bg-amber-400",
            )}
          />
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-60",
              operational ? "bg-emerald-400" : "bg-amber-400",
            )}
          />
        </span>
        <span className={cn("hidden sm:inline", operational ? "text-emerald-400" : "text-amber-400")}>
          {operational ? t("statusBar.operational") : t("status.unhealthy")}
        </span>
      </div>

      <Divider />

      {/* Region */}
      <div className="flex items-center gap-1.5 shrink-0" title={t("statusBar.region")}>
        <Globe2 className="w-3 h-3 text-violet-300" />
        <span className="font-medium text-foreground/80">{DEFAULT_REGION}</span>
      </div>

      <Divider />

      {/* API status */}
      <button
        className="flex items-center gap-1.5 shrink-0 hover:text-foreground transition-colors"
        title={t("statusBar.apiStatus")}
        onClick={() => setApiOnline((v) => !v)}
      >
        <Wifi className={cn("w-3 h-3", apiOnline ? "text-emerald-400" : "text-rose-400")} />
        <span className="hidden md:inline">{t("statusBar.apiStatus")}</span>
        <span className={cn("font-mono", apiOnline ? "text-emerald-400" : "text-rose-400")}>
          {apiOnline ? "200" : "503"}
        </span>
        <span className="hidden lg:inline text-muted-foreground/60 tabular-nums">
          · {latency}ms {t("statusBar.latency")}
        </span>
      </button>

      <Divider />

      {/* Active deployments */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        title={t("statusBar.activeDeployments")}
      >
        <Activity className="w-3 h-3 text-cyan-300" />
        <span className="hidden sm:inline">{t("statusBar.activeDeployments")}:</span>
        <span className="font-mono font-medium text-foreground/80 tabular-nums">
          {activeDeployments}
        </span>
      </div>

      {/* Spacer pushes the rest to the trailing edge */}
      <div className="flex-1" />

      <Divider />

      {/* Server hostname */}
      <div className="hidden md:flex items-center gap-1.5 shrink-0" title="Hostname">
        <ServerIcon className="w-3 h-3 text-muted-foreground" />
        <span className="font-mono text-muted-foreground/80">railflow-prod-01</span>
      </div>

      <Divider />

      {/* Security */}
      <div className="hidden lg:flex items-center gap-1.5 shrink-0" title="Security">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        <span className="text-muted-foreground/80">Secure</span>
      </div>

      <Divider />

      {/* Version */}
      <div className="flex items-center gap-1.5 shrink-0" title={t("statusBar.version")}>
        <GitCommitHorizontal className="w-3 h-3 text-muted-foreground" />
        <span className="font-mono text-muted-foreground/80">{APP_VERSION}</span>
      </div>

      <Divider />

      {/* Brand */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <Zap className="w-3 h-3 text-violet-300" fill="currentColor" />
        <span className="gradient-text font-semibold">{t("app.name")}</span>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="w-px h-3.5 bg-white/10 shrink-0" aria-hidden />;
}
