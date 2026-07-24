"use client";

import * as React from "react";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Download,
  AlertCircle,
  Plus,
  Cpu,
  Database as DatabaseIcon,
  HardDrive,
  Activity,
  Archive,
  ShieldCheck,
  Headphones,
  DollarSign,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockCostBreakdown, mockInvoices, mockCostAlerts } from "@/lib/mock-data";
import { SectionHeader, ProgressBar } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CostBreakdown } from "@/lib/types";
import { AreaTimeChart } from "@/components/charts";
import { generateTimeSeries } from "@/lib/mock-data";

const categoryIcon: Record<CostBreakdown["category"], React.ElementType> = {
  compute: Cpu,
  database: DatabaseIcon,
  storage: HardDrive,
  bandwidth: Activity,
  backup: Archive,
  ssl: ShieldCheck,
  support: Headphones,
};

const invoiceStatusColor: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  failed: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  refunded: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
};

export function CostView() {
  const { t, locale } = useI18n();
  const [costSeries] = React.useState(() => generateTimeSeries(30, 250, 80, 86_400_000, "USD"));

  const totalCurrent = mockCostBreakdown.reduce((sum, c) => sum + c.cost, 0);
  const projected = totalCurrent * 1.08; // 8% growth projection

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-violet-300" />
          {t("cost.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("cost.subtitle")}</p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t("cost.currentMonth")}</div>
          <div className="text-3xl font-bold tabular-nums gradient-text">${totalCurrent.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">July 2026 · USD</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t("cost.lastMonth")}</div>
          <div className="text-3xl font-bold tabular-nums">$312.40</div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
            <TrendingUp className="w-3 h-3" />
            +4.6% vs current
          </div>
        </div>
        <div className="glass-card p-5 border-amber-500/20">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t("cost.projected")}</div>
          <div className="text-3xl font-bold tabular-nums text-amber-300">${projected.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">Based on current usage trend</div>
        </div>
      </div>

      {/* 30-day trend chart */}
      <div className="glass-card p-5">
        <SectionHeader title="30-day cost trend" subtitle="Daily spend in USD" />
        <AreaTimeChart series={[{ ...costSeries, name: "Cost", color: "oklch(0.72 0.22 295)", unit: "USD" }]} height={200} unit="USD" />
      </div>

      {/* Cost breakdown */}
      <div className="glass-card p-5">
        <SectionHeader title={t("cost.breakdown")} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-start font-medium px-3 py-3">{t("cost.category")}</th>
                <th className="text-end font-medium px-3 py-3">{t("cost.usage")}</th>
                <th className="text-end font-medium px-3 py-3">{t("cost.cost")}</th>
                <th className="text-end font-medium px-3 py-3 hidden md:table-cell">{t("cost.trend")}</th>
                <th className="text-end font-medium px-3 py-3 hidden lg:table-cell w-32">Usage %</th>
              </tr>
            </thead>
            <tbody>
              {mockCostBreakdown.map((c) => {
                const Icon = categoryIcon[c.category];
                const pct = c.limit ? (c.usage / c.limit) * 100 : 0;
                return (
                  <tr key={c.category} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium">{c.label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-end tabular-nums text-xs">
                      <span>{c.usage}</span>
                      <span className="text-muted-foreground"> {c.unit}</span>
                    </td>
                    <td className="px-3 py-3 text-end font-medium tabular-nums">${c.cost.toFixed(2)}</td>
                    <td className="px-3 py-3 text-end hidden md:table-cell">
                      {c.trend === 0 ? (
                        <span className="text-muted-foreground/60">—</span>
                      ) : (
                        <span className={cn("flex items-center justify-end gap-1 text-xs", c.trend > 0 ? "text-rose-400" : "text-emerald-400")}>
                          {c.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(c.trend).toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      {c.limit ? (
                        <div className="w-24 ms-auto">
                          <ProgressBar
                            value={pct}
                            color={pct > 80 ? "oklch(0.7 0.24 25)" : pct > 60 ? "oklch(0.78 0.18 75)" : "linear-gradient(90deg, oklch(0.72 0.22 295), oklch(0.78 0.17 190))"}
                          />
                          <div className="text-[9px] text-muted-foreground text-center mt-1 tabular-nums">{pct.toFixed(0)}%</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td className="px-3 py-3 text-sm font-semibold">Total</td>
                <td className="px-3 py-3"></td>
                <td className="px-3 py-3 text-end text-base font-bold tabular-nums gradient-text">${totalCurrent.toFixed(2)}</td>
                <td className="px-3 py-3 hidden md:table-cell"></td>
                <td className="px-3 py-3 hidden lg:table-cell"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Invoices */}
        <div className="lg:col-span-2 glass-card p-5">
          <SectionHeader title={t("cost.invoices")} />
          <div className="space-y-2">
            {mockInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium font-mono">{inv.number}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", invoiceStatusColor[inv.status])}>
                      {t(`cost.invoice.status.${inv.status}`)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(inv.period.start).toLocaleDateString("en-GB", { month: "short", day: "numeric" })} — {new Date(inv.period.end).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                    {" · "}{inv.method}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <div className="text-sm font-semibold tabular-nums">${inv.amount.toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground" suppressHydrationWarning>{timeAgo(inv.issuedAt, locale)}</div>
                </div>
                {inv.pdfUrl && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Budget alerts + payment */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <SectionHeader
              title={t("cost.budgetAlerts")}
              action={
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Plus className="w-3 h-3" />
                  {t("cost.budgetAlert.add")}
                </Button>
              }
            />
            <div className="space-y-2">
              {mockCostAlerts.map((alert) => {
                const pct = (alert.current / alert.threshold) * 100;
                const triggered = alert.current >= alert.threshold;
                return (
                  <div key={alert.id} className={cn("p-3 rounded-lg border", triggered && alert.enabled ? "bg-rose-500/5 border-rose-500/20" : "bg-white/5 border-white/10")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {triggered && alert.enabled ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full bg-white/10" />
                        )}
                        <span className="text-xs font-medium capitalize">{alert.period}</span>
                      </div>
                      <Switch defaultChecked={alert.enabled} />
                    </div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">{t("cost.budgetAlert.threshold")}</span>
                      <span className="text-xs font-semibold tabular-nums">${alert.threshold}</span>
                    </div>
                    <ProgressBar
                      value={Math.min(100, pct)}
                      color={triggered ? "oklch(0.7 0.24 25)" : pct > 80 ? "oklch(0.78 0.18 75)" : "linear-gradient(90deg, oklch(0.72 0.22 295), oklch(0.78 0.17 190))"}
                    />
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{t("cost.budgetAlert.current")}: <span className="tabular-nums text-foreground">${alert.current}</span></span>
                      <span className="tabular-nums">{pct.toFixed(0)}%</span>
                    </div>
                    {alert.lastTriggered && (
                      <div className="text-[10px] text-rose-400 mt-1" suppressHydrationWarning>
                        {t("cost.budgetAlert.lastTriggered")}: {timeAgo(alert.lastTriggered, locale)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-5">
            <SectionHeader title={t("cost.paymentMethod")} />
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
                VISA
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                <p className="text-[10px] text-muted-foreground">Expires 08/27 · Ahmed Hassan</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3">
              {t("cost.updatePayment")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
