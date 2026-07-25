"use client";

import * as React from "react";
import {
  User as UserIcon,
  Shield,
  Key,
  Webhook,
  Plug,
  CreditCard,
  Palette,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Copy,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  QrCode,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockUser, mockApiKeys, mockSessions } from "@/lib/mock-data";
import { SectionHeader, EmptyState, StatusBadge } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  useAppearance,
  ACCENT_VALUES,
  type AccentColor,
  type Density,
} from "@/hooks/use-appearance";
import { useNotify } from "@/components/dashboard/Toaster";

export function SettingsView({ tab: initialTab }: { tab?: string }) {
  const { t } = useI18n();
  const [tab, setTab] = React.useState(initialTab || "profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.profile")} · {t("settings.security")} · {t("settings.apiKeys")}</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} orientation="vertical" className="flex flex-col md:flex-row gap-6">
        <TabsList className="bg-white/5 border border-white/10 h-auto p-1.5 md:w-56 flex-row md:flex-col gap-1 overflow-x-auto">
          <TabsTrigger value="profile" className="text-xs justify-start gap-2 data-[state=active]:bg-white/10 w-full">
            <UserIcon className="w-3.5 h-3.5" />
            {t("settings.profile")}
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs justify-start gap-2 data-[state=active]:bg-white/10 w-full">
            <Shield className="w-3.5 h-3.5" />
            {t("settings.security")}
          </TabsTrigger>
          <TabsTrigger value="apiKeys" className="text-xs justify-start gap-2 data-[state=active]:bg-white/10 w-full">
            <Key className="w-3.5 h-3.5" />
            {t("settings.apiKeys")}
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="text-xs justify-start gap-2 data-[state=active]:bg-white/10 w-full">
            <Webhook className="w-3.5 h-3.5" />
            {t("settings.webhooks")}
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs justify-start gap-2 data-[state=active]:bg-white/10 w-full">
            <Plug className="w-3.5 h-3.5" />
            {t("settings.integrations")}
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs justify-start gap-2 data-[state=active]:bg-white/10 w-full">
            <CreditCard className="w-3.5 h-3.5" />
            {t("settings.billing")}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs justify-start gap-2 data-[state=active]:bg-white/10 w-full">
            <Palette className="w-3.5 h-3.5" />
            {t("settings.appearance")}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="profile"><ProfileTab /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
          <TabsContent value="apiKeys"><ApiKeysTab /></TabsContent>
          <TabsContent value="webhooks"><WebhooksTab /></TabsContent>
          <TabsContent value="integrations"><IntegrationsTab /></TabsContent>
          <TabsContent value="billing"><BillingTab /></TabsContent>
          <TabsContent value="appearance"><AppearanceTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ProfileTab() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <SectionHeader title={t("settings.profile")} />
        <div className="flex items-start gap-4 mb-5">
          <Avatar className="w-20 h-20 ring-2 ring-violet-400/30">
            <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-white text-xl">
              {mockUser.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Button variant="outline" size="sm">{t("settings.avatar")}</Button>
            <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max size 2MB.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.accountName")}</label>
            <Input defaultValue={mockUser.name} className="bg-white/5 border-white/10" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.email")}</label>
            <Input defaultValue={mockUser.email} className="bg-white/5 border-white/10" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">{t("common.save")}</Button>
        </div>
      </div>

      <div className="glass-card p-5">
        <SectionHeader title={t("settings.changePassword")} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.currentPassword")}</label>
            <Input type="password" className="bg-white/5 border-white/10" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.newPassword")}</label>
            <Input type="password" className="bg-white/5 border-white/10" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.confirmPassword")}</label>
            <Input type="password" className="bg-white/5 border-white/10" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline">{t("settings.changePassword")}</Button>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const { t } = useI18n();
  const [twofaEnabled, setTwofaEnabled] = React.useState(mockUser.twoFactorEnabled);
  const [show2faSetup, setShow2faSetup] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [verified, setVerified] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <SectionHeader
          title={t("settings.twoFactor")}
          action={<StatusBadge status={twofaEnabled ? "healthy" : "unhealthy"} className={twofaEnabled ? "" : "border-rose-500/30 bg-rose-500/5"} />}
        />
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 mb-4">
          <div>
            <p className="text-sm font-medium">
              {t("settings.2fa.enabled")}: <span className={twofaEnabled ? "text-emerald-400" : "text-rose-400"}>{twofaEnabled ? t("common.yes") : t("common.no")}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">TOTP-based authentication via Google Authenticator, Authy, or 1Password</p>
          </div>
          {twofaEnabled ? (
            <Button variant="outline" size="sm" onClick={() => setTwofaEnabled(false)} className="border-rose-500/30 text-rose-300">
              {t("settings.2fa.disable")}
            </Button>
          ) : (
            <Button size="sm" onClick={() => setShow2faSetup(true)} className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
              {t("settings.2fa.enable")}
            </Button>
          )}
        </div>

        {/* Backup codes (only if 2FA enabled) */}
        {twofaEnabled && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("settings.2fa.backupCodes")}</p>
            <p className="text-xs text-muted-foreground mb-3">{t("settings.2fa.backupCodes.desc")}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-lg bg-white/5 font-mono text-xs">
              {["ABCD-1234", "EFGH-5678", "IJKL-9012", "MNOP-3456", "QRST-7890", "UVWX-1234", "YZAB-5678", "CDEF-9012"].map((code, i) => (
                <div key={i} className="text-center py-1 rounded bg-white/5">{code}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active sessions */}
      <div className="glass-card p-5">
        <SectionHeader title={t("settings.sessions")} subtitle={`${mockSessions.length} active sessions`} />
        <div className="space-y-2">
          {mockSessions.map((session) => {
            const Icon = session.device.includes("iPhone") || session.device.includes("iPad") ? Smartphone : session.device.includes("Linux") || session.device.includes("MacBook") ? Monitor : Tablet;
            return (
              <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{session.device}</span>
                    {session.current && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{t("settings.sessions.current")}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{session.browser} · {session.os} · {session.ip} · {session.location}</p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-[10px] text-muted-foreground">{t("settings.sessions.lastUsed") || "last active"}</p>
                  <p className="text-xs" suppressHydrationWarning>{timeAgo(session.lastActiveAt)}</p>
                </div>
                {!session.current && (
                  <Button variant="ghost" size="sm" className="text-rose-400 hover:bg-rose-500/10">
                    {t("settings.sessions.revoke")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2FA Setup Dialog */}
      {show2faSetup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{t("settings.2fa.enable")}</h3>
            {!verified ? (
              <>
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="w-44 h-44 rounded-lg bg-white p-3 flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{t("settings.2fa.scanQr")}</p>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.2fa.enterCode")}</label>
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="bg-white/5 border-white/10 text-center text-2xl font-mono tracking-[0.5em]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShow2faSetup(false)}>{t("common.cancel")}</Button>
                  <Button
                    onClick={() => {
                      if (verificationCode.length === 6) { setVerified(true); setTimeout(() => { setTwofaEnabled(true); setShow2faSetup(false); setVerified(false); }, 1500); }
                    }}
                    disabled={verificationCode.length !== 6}
                    className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0"
                  >
                    {t("common.verify")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-sm font-medium">2FA enabled successfully!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ApiKeysTab() {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState<string | null>(null);

  const copy = (key: string, val: string) => {
    navigator.clipboard?.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="glass-card p-5">
      <SectionHeader
        title={t("settings.apiKeys")}
        action={
          <Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
            <Plus className="w-3.5 h-3.5" />
            {t("settings.apiKeys.create")}
          </Button>
        }
      />
      <div className="space-y-2">
        {mockApiKeys.map((k) => (
          <div key={k.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <Key className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{k.name}</span>
                {k.expiresAt && new Date(k.expiresAt) < new Date() && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">expired</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-xs font-mono text-violet-300">{k.prefix}••••••••</code>
                <button onClick={() => copy(k.id, k.prefix)} className="text-muted-foreground hover:text-foreground">
                  {copied === k.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {k.scopes.map((s) => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground font-mono">{s}</span>
                ))}
              </div>
            </div>
            <div className="text-end shrink-0">
              <p className="text-[10px] text-muted-foreground">{t("settings.apiKeys.lastUsed")}</p>
              <p className="text-xs" suppressHydrationWarning>{k.lastUsedAt ? timeAgo(k.lastUsedAt) : t("settings.apiKeys.never")}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-rose-400 hover:bg-rose-500/10">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebhooksTab() {
  const { t } = useI18n();
  return (
    <div className="glass-card p-5">
      <SectionHeader
        title={t("settings.webhooks")}
        action={<Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0"><Plus className="w-3.5 h-3.5" />Add webhook</Button>}
      />
      <EmptyState
        icon={<Webhook className="w-12 h-12" />}
        title="No webhooks configured"
        description="Configure webhooks to receive real-time notifications about deployments, container status, and more."
      />
    </div>
  );
}

function IntegrationsTab() {
  const { t } = useI18n();
  const integrations = [
    { name: "GitHub", icon: "🐙", connected: true, desc: "Source control & auto-deploy" },
    { name: "Slack", icon: "💬", connected: true, desc: "Deployment notifications" },
    { name: "Discord", icon: "🎮", connected: false, desc: "Real-time alerts" },
    { name: "Sentry", icon: "🛡️", connected: true, desc: "Error tracking" },
    { name: "Grafana", icon: "📊", connected: true, desc: "Metrics dashboards" },
    { name: "Stripe", icon: "💳", connected: false, desc: "Payment processing" },
  ];
  return (
    <div className="glass-card p-5">
      <SectionHeader title={t("settings.integrations")} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {integrations.map((i) => (
          <div key={i.name} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">{i.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{i.name}</span>
                {i.connected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{i.desc}</p>
            </div>
            <Button variant={i.connected ? "outline" : "default"} size="sm" className={i.connected ? "" : "bg-gradient-to-r from-violet-500 to-cyan-500 border-0"}>
              {i.connected ? "Manage" : "Connect"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingTab() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <SectionHeader title="Current Plan" />
        <div className="flex items-start justify-between p-4 rounded-lg bg-gradient-to-br from-violet-500/10 to-cyan-400/10 border border-violet-500/20">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Plan</p>
            <p className="text-2xl font-bold gradient-text mt-1">Scale</p>
            <p className="text-xs text-muted-foreground mt-1">Renews on Aug 22, 2026</p>
          </div>
          <div className="text-end">
            <p className="text-3xl font-bold tabular-nums">$199</p>
            <p className="text-xs text-muted-foreground">/month</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-xl font-semibold tabular-nums">6 / 25</div>
            <div className="text-[10px] text-muted-foreground uppercase">Projects</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-xl font-semibold tabular-nums">12 / 50</div>
            <div className="text-[10px] text-muted-foreground uppercase">Containers</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-xl font-semibold tabular-nums">412 GB</div>
            <div className="text-[10px] text-muted-foreground uppercase">Bandwidth</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppearanceTab() {
  const { t, locale, setLocale } = useI18n();
  const [prefs, setPrefs, resetPrefs] = useAppearance();
  const notify = useNotify();

  const accentColors: { id: AccentColor; labelKey: string }[] = [
    { id: "violet", labelKey: "settings.themeColor.violet" },
    { id: "cyan", labelKey: "settings.themeColor.cyan" },
    { id: "emerald", labelKey: "settings.themeColor.emerald" },
    { id: "amber", labelKey: "settings.themeColor.amber" },
  ];

  const densities: { id: Density; labelKey: string }[] = [
    { id: "compact", labelKey: "settings.density.compact" },
    { id: "comfortable", labelKey: "settings.density.comfortable" },
  ];

  const fontPct = Math.round(prefs.fontScale * 100);

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <SectionHeader
          title={t("settings.appearance")}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetPrefs();
                notify.info(t("settings.appearance.reset"));
              }}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t("settings.appearance.reset")}
            </Button>
          }
        />

        <div className="space-y-6">
          {/* Language */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              {t("settings.language")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLocale("ar")}
                className={cn(
                  "p-3 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
                  locale === "ar"
                    ? "border-violet-400 bg-violet-500/10 text-violet-300"
                    : "border-white/10 bg-white/5 hover:border-white/20",
                )}
              >
                <Globe className="w-4 h-4" />
                العربية (RTL)
                {locale === "ar" && <Check className="w-3 h-3 ms-auto" />}
              </button>
              <button
                onClick={() => setLocale("en")}
                className={cn(
                  "p-3 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
                  locale === "en"
                    ? "border-violet-400 bg-violet-500/10 text-violet-300"
                    : "border-white/10 bg-white/5 hover:border-white/20",
                )}
              >
                <Globe className="w-4 h-4" />
                English (LTR)
                {locale === "en" && <Check className="w-3 h-3 ms-auto" />}
              </button>
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              {t("settings.themeColor")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {accentColors.map((c) => {
                const active = prefs.accent === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setPrefs({ accent: c.id })}
                    className={cn(
                      "group relative p-3 rounded-lg border text-start transition-all overflow-hidden",
                      active
                        ? "border-white/20 bg-white/[0.07]"
                        : "border-white/10 bg-white/5 hover:border-white/20",
                    )}
                    style={
                      active
                        ? { boxShadow: `0 0 0 1px ${ACCENT_VALUES[c.id]}, 0 0 16px ${ACCENT_VALUES[c.id]}33` }
                        : undefined
                    }
                  >
                    <div
                      className="w-8 h-8 rounded-lg mb-2 transition-transform group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${ACCENT_VALUES[c.id]}, ${ACCENT_VALUES[c.id]}99)`,
                        boxShadow: `0 0 12px ${ACCENT_VALUES[c.id]}66`,
                      }}
                    />
                    <div className="text-xs font-medium">{t(c.labelKey)}</div>
                    {active && (
                      <div className="absolute top-2 end-2 w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                        <Check className="w-3 h-3" style={{ color: ACCENT_VALUES[c.id] }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Density */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              {t("settings.density")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {densities.map((d) => {
                const active = prefs.density === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setPrefs({ density: d.id })}
                    className={cn(
                      "p-3 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
                      active
                        ? "border-violet-400 bg-violet-500/10 text-violet-300"
                        : "border-white/10 bg-white/5 hover:border-white/20",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded border border-white/10",
                        d.id === "compact" ? "w-4 h-3" : "w-5 h-4",
                      )}
                      style={active ? { background: ACCENT_VALUES[prefs.accent] } : undefined}
                    />
                    {t(d.labelKey)}
                    {active && <Check className="w-3 h-3 ms-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-300" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("settings.animations")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.animations.desc")}</p>
              </div>
            </div>
            <Switch
              checked={prefs.animations}
              onCheckedChange={(v) => setPrefs({ animations: v })}
            />
          </div>

          {/* Font size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">
                {t("settings.fontSize")}
              </label>
              <span className="text-xs font-mono tabular-nums px-1.5 py-0.5 rounded bg-white/5">
                {fontPct}%
              </span>
            </div>
            <div className="px-1">
              <Slider
                value={[prefs.fontScale * 100]}
                min={87}
                max={112}
                step={1}
                onValueChange={(v) => setPrefs({ fontScale: v[0] / 100 })}
                className="w-full"
              />
              <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/60">
                <span>A</span>
                <span style={{ fontSize: "12px" }}>A</span>
                <span style={{ fontSize: "14px" }}>A</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="glass-card p-5">
        <SectionHeader title={t("settings.appearance.preview")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: ACCENT_VALUES[prefs.accent] }}
              >
                RF
              </div>
              <div>
                <p className="text-sm font-medium">{t("app.name")}</p>
                <p className="text-[10px] text-muted-foreground">{t("app.tagline")}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: "67%", background: ACCENT_VALUES[prefs.accent] }}
                />
              </div>
              <div className="flex gap-1.5">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{
                    background: `${ACCENT_VALUES[prefs.accent]}22`,
                    color: ACCENT_VALUES[prefs.accent],
                  }}
                >
                  {t("status.running")}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                  {t("common.live")}
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex flex-col gap-2">
            <Button
              size="sm"
              className="w-full border-0 text-white"
              style={{ background: ACCENT_VALUES[prefs.accent] }}
              onClick={() => notify.success(t("toast.saved"))}
            >
              {t("common.save")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => notify.info(t("common.refresh"))}
            >
              {t("common.refresh")}
            </Button>
            <div className="text-[10px] text-muted-foreground text-center mt-1">
              {prefs.density === "compact" ? t("settings.density.compact") : t("settings.density.comfortable")}
              {" · "}
              {fontPct}%
              {" · "}
              {prefs.animations ? t("settings.animations") : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
