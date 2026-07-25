"use client";

/**
 * Railflow Toaster — wraps the `sonner` library with the Dark Premium
 * look & feel and bilingual labels.
 *
 * Use the exported `notify` helpers instead of calling `sonner.toast`
 * directly so that translations + theming stay consistent.
 */

import * as React from "react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Rocket,
  FolderPlus,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Variant = "success" | "error" | "warning" | "info" | "loading";

const ICONS: Record<Variant, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  error: <XCircle className="w-4 h-4 text-rose-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  info: <Info className="w-4 h-4 text-cyan-400" />,
  loading: <Loader2 className="w-4 h-4 text-violet-300 animate-spin" />,
};

const ACCENT: Record<Variant, string> = {
  success: "var(--color-success)",
  error: "var(--color-destructive)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
  loading: "var(--color-primary)",
};

export function Toaster() {
  const { dir } = useI18n();
  return (
    <SonnerToaster
      position={dir === "rtl" ? "bottom-left" : "bottom-right"}
      dir={dir}
      richColors={false}
      closeButton
      duration={5000}
      toastOptions={{
        style: {
          background: "oklch(0.17 0.02 280 / 0.85)",
          backdropFilter: "blur(12px)",
          border: "1px solid oklch(1 0 0 / 0.1)",
          color: "var(--color-foreground)",
          borderRadius: "0.75rem",
        },
        className: "railflow-toast",
      }}
    />
  );
}

/** Internal helper to render a toast with our icon + accent border. */
function show(
  variant: Variant,
  title: string,
  description?: string,
  opts?: { duration?: number; id?: string | number; icon?: React.ReactNode },
) {
  const id = sonnerToast(title, {
    id: opts?.id,
    duration: opts?.duration ?? 5000,
    description,
    icon: opts?.icon ?? ICONS[variant],
    style: {
      borderInlineStartWidth: "3px",
      borderInlineStartColor: ACCENT[variant],
    } as React.CSSProperties,
  });
  return id;
}

/** Public notification helpers — bilingual + themed. */
export const notify = {
  success: (title: string, description?: string) =>
    show("success", title, description),
  error: (title: string, description?: string) =>
    show("error", title, description, { duration: 7000 }),
  warning: (title: string, description?: string) =>
    show("warning", title, description),
  info: (title: string, description?: string) =>
    show("info", title, description),
  loading: (title: string, description?: string) =>
    show("loading", title, description, { duration: Infinity }),
  /** Bilingual shortcuts tied to i18n keys. Call from inside a component. */
  deployStarted: () => undefined, // placeholder, used via hook below
  projectCreated: () => undefined,
};

/**
 * useNotify — bilingual toast helpers that pull strings from i18n.
 * Prefer this inside React components for translated messages.
 */
export function useNotify() {
  const { t } = useI18n();
  return React.useMemo(
    () => ({
      deployStarted: () =>
        show("success", t("toast.deployStarted"), t("toast.deployStarted.desc"), {
          icon: <Rocket className="w-4 h-4 text-violet-300" />,
        }),
      projectCreated: () =>
        show("success", t("toast.projectCreated"), t("toast.projectCreated.desc"), {
          icon: <FolderPlus className="w-4 h-4 text-emerald-400" />,
        }),
      containerStarted: (name?: string) =>
        show("success", t("toast.containerStarted"), name),
      containerStopped: (name?: string) =>
        show("info", t("toast.containerStopped"), name),
      saved: () => show("success", t("toast.saved")),
      copied: () => show("info", t("toast.copied")),
      error: (msg?: string) => show("error", t("toast.error"), msg),
      warning: (msg?: string) => show("warning", t("toast.warning"), msg),
      info: (msg?: string) => show("info", t("toast.info"), msg),
      success: (title: string, description?: string) =>
        show("success", title, description),
      loading: (title: string, description?: string) =>
        show("loading", title, description),
      dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    }),
    [t],
  );
}
