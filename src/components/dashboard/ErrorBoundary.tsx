"use client";

/**
 * Railflow ErrorBoundary — a beautiful, branded error page that catches
 * render errors in any subtree, shows a friendly message, exposes the
 * raw error in a collapsible section, and reports to the console.
 */

import * as React from "react";
import { AlertTriangle, RotateCcw, ChevronDown, ChevronRight, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  /** Optional label shown in the error UI — useful when nesting boundaries. */
  label?: string;
};

type State = { error: Error | null; info: React.ErrorInfo | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Report to console for debugging
    console.error("[Railflow ErrorBoundary]", error, info.componentStack);
    this.setState({ info });
  }

  reset = () => this.setState({ error: null, info: null });

  render() {
    if (!this.state.error) return this.props.children;
    return <ErrorFallback error={this.state.error} info={this.state.info} label={this.props.label} onReset={this.reset} />;
  }
}

function ErrorFallback({
  error,
  info,
  label,
  onReset,
}: {
  error: Error;
  info: React.ErrorInfo | null;
  label?: string;
  onReset: () => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = React.useState(false);

  // Trigger a full page reload as a last resort fallback.
  const handleReload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl glass-card p-8 relative overflow-hidden">
        {/* Decorative glow */}
        <div
          aria-hidden
          className="absolute -top-24 -end-24 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -start-24 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none"
        />

        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-2xl bg-rose-500/20 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-violet-500/20 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-violet-300" fill="currentColor" />
            <span className="text-xs font-semibold uppercase tracking-wider gradient-text">
              {t("app.name")}
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-2">{t("errorBoundary.title")}</h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            {t("errorBoundary.subtitle")}
          </p>

          {label && (
            <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-mono">
              {label}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-6 w-full sm:w-auto">
            <button
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-medium hover:from-violet-400 hover:to-cyan-400 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t("errorBoundary.reload")}
            </button>
            <button
              onClick={handleReload}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              {t("common.refresh")}
            </button>
          </div>

          <div className="mt-3 text-[10px] text-muted-foreground/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {t("errorBoundary.report")}
          </div>

          {/* Collapsible error details */}
          <div className="w-full mt-6 text-start">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              {t("errorBoundary.details")}
            </button>
            {expanded && (
              <pre
                className={cn(
                  "mt-2 p-3 rounded-lg bg-black/30 border border-white/5 text-[11px]",
                  "font-mono text-rose-300/90 overflow-auto max-h-48 scrollbar-thin",
                )}
              >
                <div className="text-rose-400 mb-1">{error.name}: {error.message}</div>
                {error.stack && (
                  <div className="text-muted-foreground/70 whitespace-pre-wrap">
                    {error.stack.split("\n").slice(1, 8).join("\n")}
                  </div>
                )}
                {info?.componentStack && (
                  <div className="mt-2 text-cyan-300/70 whitespace-pre-wrap">
                    {"Component stack:\n"}
                    {info.componentStack.trim().split("\n").slice(0, 6).join("\n")}
                  </div>
                )}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
