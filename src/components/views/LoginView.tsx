"use client";

import * as React from "react";
import { Zap, Mail, Lock, Github, ArrowRight, ShieldCheck, Cpu, Boxes, Rocket } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginView() {
  const { t, dir } = useI18n();
  const { navigate } = useRouter();
  const [step, setStep] = React.useState<"credentials" | "2fa">("credentials");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("2fa");
    }, 800);
  };

  const handle2fa = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate({ name: "dashboard" });
    }, 800);
  };

  const handleDemo = () => {
    navigate({ name: "dashboard" });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden grid-bg items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-400/5" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative z-10 max-w-md space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center neon-glow">
              <Zap className="w-7 h-7 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">{t("app.name")}</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("app.tagline")}</p>
            </div>
          </div>

          {/* Hero */}
          <div>
            <h2 className="text-4xl font-bold leading-tight mb-3">
              {dir === "rtl" ? (
                <>النشر السحابي <span className="gradient-text">بحماية عسكرية</span></>
              ) : (
                <>Cloud deployment with <span className="gradient-text">military-grade security</span></>
              )}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {dir === "rtl"
                ? "نشر تطبيقاتك من GitHub إلى الإنتاج في ثوانٍ. مراقبة فورية، نسخ احتياطي تلقائي، تحكم كامل في الموارد. كل ذلك بسرعة Rust وقوة Docker."
                : "Deploy from GitHub to production in seconds. Real-time monitoring, automatic backups, full resource control. All powered by Rust's speed and Docker's flexibility."}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              { icon: Rocket, title: dir === "rtl" ? "نشر فوري" : "Instant Deploy", desc: dir === "rtl" ? "من Git إلى الإنتاج في <90 ثانية" : "Git to production in <90s" },
              { icon: Cpu, title: dir === "rtl" ? "أداء Rust" : "Rust Performance", desc: dir === "rtl" ? "Backend بسرعة native" : "Native-speed backend" },
              { icon: Boxes, title: dir === "rtl" ? "إدارة Docker" : "Docker Native", desc: dir === "rtl" ? "تحكم كامل بالحاويات" : "Full container control" },
              { icon: ShieldCheck, title: dir === "rtl" ? "أمان متقدم" : "Advanced Security", desc: dir === "rtl" ? "2FA + JWT + rate limiting" : "2FA + JWT + rate limiting" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg glass-card">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-400/20 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-violet-300" />
                </div>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center neon-glow">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <h1 className="text-xl font-bold gradient-text">{t("app.name")}</h1>
          </div>

          {step === "credentials" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{t("login.title")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("login.subtitle")}</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("login.email")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="ps-9 bg-white/5 border-white/10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("login.password")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="ps-9 bg-white/5 border-white/10"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    {t("login.remember")}
                  </label>
                  <button type="button" className="text-violet-300 hover:text-violet-200">{t("login.forgot")}</button>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 border-0 h-11"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("common.loading")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t("login.submit")}
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">or</span>
                </div>
              </div>

              <Button variant="outline" className="w-full h-11">
                <Github className="w-4 h-4" />
                {t("login.github")}
              </Button>

              <div className="text-center">
                <button
                  onClick={handleDemo}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card"
                >
                  <Zap className="w-3 h-3 text-violet-300" />
                  {t("login.demoButton")}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => setStep("credentials")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="w-3 h-3 rtl:rotate-180 rotate-180" />
                {t("common.back")}
              </button>
              <div>
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-violet-300" />
                </div>
                <h2 className="text-2xl font-bold">{t("login.2fa.title")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("login.2fa.subtitle")}</p>
              </div>

              <form onSubmit={handle2fa} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("login.2fa.code")}</label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="bg-white/5 border-white/10 text-center text-3xl font-mono tracking-[0.5em] h-14"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 border-0 h-11"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("common.loading")}
                    </span>
                  ) : (
                    t("login.2fa.verify")
                  )}
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground">
                {t("login.demo")} · <span className="text-violet-300">123456</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
