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
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockUser, mockApiKeys, mockSessions } from "@/lib/mock-data";
import { SectionHeader, EmptyState, StatusBadge } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

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
                  <p className="text-xs">{timeAgo(session.lastActiveAt)}</p>
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
              <p className="text-xs">{k.lastUsedAt ? timeAgo(k.lastUsedAt) : t("settings.apiKeys.never")}</p>
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
  return (
    <div className="glass-card p-5">
      <SectionHeader title={t("settings.appearance")} />
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("settings.language")}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLocale("ar")}
              className={cn(
                "p-3 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
                locale === "ar" ? "border-violet-400 bg-violet-500/10 text-violet-300" : "border-white/10 bg-white/5 hover:border-white/20"
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
                locale === "en" ? "border-violet-400 bg-violet-500/10 text-violet-300" : "border-white/10 bg-white/5 hover:border-white/20"
              )}
            >
              <Globe className="w-4 h-4" />
              English (LTR)
              {locale === "en" && <Check className="w-3 h-3 ms-auto" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Theme</label>
          <div className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Premium</p>
              <p className="text-xs text-muted-foreground">Deep void background with neon violet accents</p>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">default</span>
          </div>
        </div>
      </div>
    </div>
  );
}
