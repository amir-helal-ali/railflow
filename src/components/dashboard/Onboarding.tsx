"use client";

/**
 * Railflow Onboarding — a 4-step welcome wizard shown on first visit.
 * Dismissal state is persisted in localStorage so it doesn't bother
 * returning users.
 *
 * Steps:
 *   1. Welcome — feature highlights
 *   2. Connect GitHub
 *   3. Deploy first project (mock repo picker)
 *   4. Explore features + keyboard shortcuts
 */

import * as React from "react";
import {
  X,
  Rocket,
  Github,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
  Terminal,
  Search,
  Keyboard,
  ArrowRight,
  FolderGit2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { cn } from "@/lib/utils";
import { useNotify } from "@/components/dashboard/Toaster";

const STORAGE_KEY = "railflow-onboarding-completed";

const ACCENTS = [
  "from-violet-500/20 via-violet-500/5 to-transparent",
  "from-cyan-500/20 via-cyan-500/5 to-transparent",
  "from-emerald-500/20 via-emerald-500/5 to-transparent",
  "from-amber-500/20 via-amber-500/5 to-transparent",
];

const REPO_OPTIONS = [
  { name: "railflow/web-platform", desc: "Next.js · TypeScript", stars: "1.2k" },
  { name: "railflow/api-gateway", desc: "Rust · Axum", stars: "842" },
  { name: "railflow/ml-inference", desc: "Python · FastAPI", stars: "631" },
  { name: "railflow/mobile-api", desc: "Node · Express", stars: "412" },
];

export function Onboarding() {
  const { t, dir } = useI18n();
  const { navigate } = useRouter();
  const notify = useNotify();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);

  // Check localStorage on mount (avoid SSR/hydration issues)
  React.useEffect(() => {
    try {
      const done = window.localStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    } catch {
      // ignore
    }
  }, []);

  const close = React.useCallback((persist: boolean) => {
    setOpen(false);
    if (persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }, []);

  const next = React.useCallback(() => {
    setStep((s) => {
      if (s >= 3) {
        close(true);
        return 0;
      }
      return s + 1;
    });
  }, [close]);

  const prev = React.useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  const finish = React.useCallback(() => {
    close(true);
    navigate({ name: "projects" });
    notify.success(t("onboarding.finish"), t("toast.projectCreated.desc"));
  }, [close, navigate, notify, t]);

  if (!open) return null;

  const rtl = dir === "rtl";
  const Back = rtl ? ChevronRight : ChevronLeft;
  const Forward = rtl ? ChevronLeft : ChevronRight;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("onboarding.welcome")}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={() => close(true)}
      />

      {/* Card */}
      <div className="relative w-full max-w-2xl glass-card rounded-2xl overflow-hidden animate-in">
        {/* Accent gradient header strip */}
        <div className={cn("h-1 w-full bg-gradient-to-r", ACCENTS[step])} />

        {/* Close button */}
        <button
          onClick={() => close(true)}
          className="absolute top-4 end-4 z-10 p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          aria-label={t("onboarding.skip")}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress dots */}
        <div className="absolute top-5 start-5 flex items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step
                  ? "w-6 bg-gradient-to-r from-violet-400 to-cyan-400"
                  : i < step
                    ? "w-1.5 bg-violet-400/60"
                    : "w-1.5 bg-white/15",
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="p-8 pt-12">
          {step === 0 && <StepWelcome t={t} />}
          {step === 1 && <StepConnectGithub t={t} />}
          {step === 2 && <StepDeploy t={t} />}
          {step === 3 && <StepExplore t={t} />}

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => close(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("onboarding.skip")}
            </button>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Back className="w-3.5 h-3.5" />
                  {t("onboarding.previous")}
                </button>
              )}
              <button
                onClick={step === 3 ? finish : next}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white transition-all neon-glow"
              >
                {step === 3 ? t("onboarding.finish") : t("onboarding.next")}
                <Forward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 1: Welcome ---------- */
function StepWelcome({ t }: { t: (_k: string) => string }) {
  const features = [
    { icon: Activity, label: t("onboarding.step1.feature1"), color: "text-emerald-400" },
    { icon: Rocket, label: t("onboarding.step1.feature2"), color: "text-violet-300" },
    { icon: Terminal, label: t("onboarding.step1.feature3"), color: "text-cyan-300" },
  ];
  return (
    <div className="text-center">
      <div className="relative inline-flex mb-5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/40 to-cyan-400/40 blur-2xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center neon-glow">
          <Zap className="w-8 h-8 text-white" fill="white" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2 gradient-text inline-block">
        {t("onboarding.step1.title")}
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        {t("onboarding.step1.desc")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center gap-2"
          >
            <f.icon className={cn("w-5 h-5", f.color)} />
            <span className="text-xs text-center">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Step 2: Connect GitHub ---------- */
function StepConnectGithub({ t }: { t: (_k: string) => string }) {
  const [connected, setConnected] = React.useState(false);
  return (
    <div className="text-center">
      <div className="relative inline-flex mb-5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/40 to-violet-400/40 blur-2xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center">
          <Github className="w-8 h-8 text-foreground" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2">{t("onboarding.step2.title")}</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        {t("onboarding.step2.desc")}
      </p>
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setConnected(true)}
          disabled={connected}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all",
            connected
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white neon-glow",
          )}
        >
          {connected ? (
            <>
              <Check className="w-4 h-4" />
              {t("onboarding.step2.connected")}
            </>
          ) : (
            <>
              <Github className="w-4 h-4" />
              {t("onboarding.step2.connect")}
            </>
          )}
        </button>
      </div>
      {connected && (
        <p className="mt-3 text-xs text-emerald-400 flex items-center justify-center gap-1.5 animate-in">
          <Sparkles className="w-3.5 h-3.5" />
          {t("onboarding.step2.connected")}
        </p>
      )}
    </div>
  );
}

/* ---------- Step 3: Deploy first project ---------- */
function StepDeploy({ t }: { t: (_k: string) => string }) {
  const [selected, setSelected] = React.useState<string | null>(null);
  return (
    <div className="text-center">
      <div className="relative inline-flex mb-5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/40 to-cyan-400/40 blur-2xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
          <Rocket className="w-8 h-8 text-emerald-300" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2">{t("onboarding.step3.title")}</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-4">
        {t("onboarding.step3.desc")}
      </p>
      <div className="text-start max-w-md mx-auto space-y-2">
        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
          <FolderGit2 className="w-3.5 h-3.5" />
          {t("onboarding.step3.placeholder")}
        </div>
        {REPO_OPTIONS.map((r) => (
          <button
            key={r.name}
            onClick={() => setSelected(r.name)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border text-start transition-all",
              selected === r.name
                ? "border-violet-400/60 bg-violet-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]",
            )}
          >
            <Github className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{r.name}</div>
              <div className="text-[11px] text-muted-foreground">{r.desc}</div>
            </div>
            <div className="text-[10px] text-muted-foreground tabular-nums">★ {r.stars}</div>
            {selected === r.name && (
              <Check className="w-4 h-4 text-violet-300 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Step 4: Explore features ---------- */
function StepExplore({ t }: { t: (_k: string) => string }) {
  const tips = [
    { icon: Search, text: t("onboarding.step4.tip1"), keys: ["⌘", "K"] },
    { icon: Keyboard, text: t("onboarding.step4.tip2"), keys: ["G", "D"] },
    { icon: Sparkles, text: t("onboarding.step4.tip3"), keys: ["⌘", "B"] },
  ];
  return (
    <div className="text-center">
      <div className="relative inline-flex mb-5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/40 to-violet-400/40 blur-2xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-amber-300" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2">{t("onboarding.step4.title")}</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-5">
        {t("onboarding.step4.desc")}
      </p>
      <div className="max-w-md mx-auto space-y-2 text-start">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5"
          >
            <tip.icon className="w-4 h-4 text-violet-300 shrink-0" />
            <span className="text-xs flex-1">{tip.text}</span>
            <div className="flex items-center gap-1">
              {tip.keys.map((k, j) => (
                <kbd
                  key={j}
                  className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-mono font-semibold"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5">
        {t("onboarding.finish")}
        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
      </p>
    </div>
  );
}
