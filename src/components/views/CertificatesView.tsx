"use client";

import * as React from "react";
import {
  Plus,
  Lock,
  RefreshCw,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Fingerprint,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockCertificates } from "@/lib/mock-data";
import { ProgressBar } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Certificate } from "@/lib/types";

const statusConfig: Record<Certificate["status"], { color: string; icon: React.ElementType }> = {
  active: { color: "text-emerald-400", icon: ShieldCheck },
  pending: { color: "text-sky-400", icon: Globe },
  expired: { color: "text-rose-400", icon: AlertTriangle },
  renewing: { color: "text-amber-300", icon: RefreshCw },
};

const typeColor: Record<Certificate["type"], string> = {
  "lets-encrypt": "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  custom: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  wildcard: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

export function CertificatesView() {
  const { t, locale: _locale } = useI18n();

  const activeCount = mockCertificates.filter(c => c.status === "active").length;
  const expiringSoon = mockCertificates.filter(c => {
    const days = (new Date(c.expiresAt).getTime() - Date.now()) / 86400000;
    return days > 0 && days < 15;
  }).length;
  const expiredCount = mockCertificates.filter(c => c.status === "expired").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("certificates.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("certificates.subtitle")}</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Plus className="w-4 h-4" />
          {t("certificates.new")}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("certificates.status.active")}</div>
          <div className="text-2xl font-semibold tabular-nums text-emerald-400">{activeCount}</div>
        </div>
        <div className="glass-card p-4 border-amber-500/20">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expiring soon</div>
          <div className="text-2xl font-semibold tabular-nums text-amber-400">{expiringSoon}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">&lt; 15 days</div>
        </div>
        <div className="glass-card p-4 border-rose-500/20">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("certificates.status.expired")}</div>
          <div className="text-2xl font-semibold tabular-nums text-rose-400">{expiredCount}</div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mockCertificates.map((cert) => (
          <CertificateCard key={cert.id} cert={cert} />
        ))}
      </div>
    </div>
  );
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const { t, locale } = useI18n();
  const cfg = statusConfig[cert.status];
  const StatusIcon = cfg.icon;
  const daysToExpiry = Math.floor((new Date(cert.expiresAt).getTime() - Date.now()) / 86400000);
  const totalLifetime = new Date(cert.expiresAt).getTime() - new Date(cert.issuedAt).getTime();
  const elapsed = Date.now() - new Date(cert.issuedAt).getTime();
  const lifetimePct = Math.min(100, (elapsed / totalLifetime) * 100);

  return (
    <div className={cn(
      "glass-card p-5 transition-all",
      cert.status === "expired" && "border-rose-500/30",
      cert.status === "renewing" && "border-amber-500/30",
      daysToExpiry > 0 && daysToExpiry < 15 && "border-amber-500/30"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", cert.status === "active" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10")}>
            <Lock className={cn("w-5 h-5", cert.status === "active" ? "text-emerald-300" : "text-muted-foreground")} />
          </div>
          <div>
            <h3 className="font-mono text-sm font-medium">{cert.domain}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", typeColor[cert.type])}>
                {t(`certificates.type.${cert.type}`)}
              </span>
              <span className="text-[10px] text-muted-foreground">{cert.issuer}</span>
            </div>
          </div>
        </div>
        <span className={cn("flex items-center gap-1 text-xs font-medium", cfg.color)}>
          <StatusIcon className={cn("w-3.5 h-3.5", cert.status === "renewing" && "animate-spin")} />
          {t(`certificates.status.${cert.status}`)}
        </span>
      </div>

      {/* Lifetime bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground" suppressHydrationWarning>{t("certificates.issuedAt")}: {timeAgo(cert.issuedAt, locale)}</span>
          <span className={cn(
            "tabular-nums font-medium",
            daysToExpiry < 0 ? "text-rose-400" : daysToExpiry < 15 ? "text-amber-400" : "text-emerald-400"
          )}>
            {daysToExpiry < 0 ? `${Math.abs(daysToExpiry)}d ago` : `${daysToExpiry}d left`}
          </span>
        </div>
        <ProgressBar
          value={lifetimePct}
          color={daysToExpiry < 0 ? "oklch(0.7 0.24 25)" : daysToExpiry < 15 ? "oklch(0.78 0.18 75)" : "linear-gradient(90deg, oklch(0.75 0.2 145), oklch(0.78 0.17 190))"}
        />
      </div>

      {/* Details */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {t("certificates.expiresAt")}
          </span>
          <span className="tabular-nums">{new Date(cert.expiresAt).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Fingerprint className="w-3 h-3" />
            {t("certificates.fingerprint")}
          </span>
          <code className="font-mono text-[10px] text-violet-300">{cert.fingerprint}</code>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("certificates.autoRenew")}</span>
          {cert.autoRenew ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {t("common.yes")}
            </span>
          ) : (
            <span className="text-muted-foreground/60">{t("common.no")}</span>
          )}
        </div>
      </div>

      {/* Action */}
      {(cert.status === "expired" || daysToExpiry < 15) && (
        <Button variant="outline" size="sm" className="w-full mt-4 border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
          <RefreshCw className="w-3.5 h-3.5" />
          {t("certificates.renewNow")}
        </Button>
      )}
    </div>
  );
}
