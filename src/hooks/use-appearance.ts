"use client";

/**
 * Appearance preferences store — persisted to localStorage and reflected
 * to :root as CSS custom properties so the whole app restyles instantly.
 *
 *   • accent color    → --color-primary (and --neon)
 *   • density         → data-density="compact|comfortable" on <html>
 *   • animations      → data-animations="on|off" on <html>
 *   • font size       → --font-scale (0.875 – 1.125)
 */

import * as React from "react";

export type AccentColor = "violet" | "cyan" | "emerald" | "amber";
export type Density = "compact" | "comfortable";

export type AppearancePrefs = {
  accent: AccentColor;
  density: Density;
  animations: boolean;
  fontScale: number; // 0.875 – 1.125
};

const STORAGE_KEY = "railflow-appearance";

const DEFAULTS: AppearancePrefs = {
  accent: "violet",
  density: "comfortable",
  animations: true,
  fontScale: 1,
};

/** Accent color → oklch value (mirrors the Dark Premium palette). */
export const ACCENT_VALUES: Record<AccentColor, string> = {
  violet: "oklch(0.72 0.22 295)",
  cyan: "oklch(0.78 0.17 190)",
  emerald: "oklch(0.75 0.2 145)",
  amber: "oklch(0.78 0.18 75)",
};

/** Soft variant (lower chroma) for backgrounds / borders. */
const ACCENT_SOFT: Record<AccentColor, string> = {
  violet: "oklch(0.72 0.22 295 / 35%)",
  cyan: "oklch(0.78 0.17 190 / 35%)",
  emerald: "oklch(0.75 0.2 145 / 35%)",
  amber: "oklch(0.78 0.18 75 / 35%)",
};

function applyPrefs(prefs: AppearancePrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const accent = ACCENT_VALUES[prefs.accent];
  const soft = ACCENT_SOFT[prefs.accent];
  root.style.setProperty("--color-primary", accent);
  root.style.setProperty("--color-ring", accent);
  root.style.setProperty("--color-sidebar-primary", accent);
  root.style.setProperty("--color-sidebar-ring", accent);
  root.style.setProperty("--color-neon", accent);
  root.style.setProperty("--color-neon-soft", soft);
  root.style.setProperty("--color-chart-1", accent);
  root.style.setProperty("--font-scale", String(prefs.fontScale));
  root.dataset.density = prefs.density;
  root.dataset.animations = prefs.animations ? "on" : "off";
}

let memory: AppearancePrefs = DEFAULTS;
const listeners = new Set<(p: AppearancePrefs) => void>();

function load(): AppearancePrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v) return { ...DEFAULTS, ...(JSON.parse(v) as Partial<AppearancePrefs>) };
  } catch {
    /* ignore */
  }
  return DEFAULTS;
}

function persist(p: AppearancePrefs) {
  memory = p;
  applyPrefs(p);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((fn) => fn(p));
}

/** Initialize on first import in the browser. */
if (typeof window !== "undefined") {
  memory = load();
  // Defer apply until after paint to avoid blocking initial render.
  queueMicrotask(() => applyPrefs(memory));
}

export function getAppearance(): AppearancePrefs {
  return memory;
}

export function setAppearance(patch: Partial<AppearancePrefs>) {
  persist({ ...memory, ...patch });
}

export function resetAppearance() {
  persist(DEFAULTS);
}

/** React hook — re-renders subscribers when prefs change. */
export function useAppearance(): [AppearancePrefs, (patch: Partial<AppearancePrefs>) => void, () => void] {
  const [prefs, setPrefs] = React.useState<AppearancePrefs>(memory);
  React.useEffect(() => {
    // Sync from another tab / initial mount
    const v = load();
    memory = v;
    setPrefs(v);
    applyPrefs(v);
    const fn = (p: AppearancePrefs) => setPrefs(p);
    listeners.add(fn);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const v2 = load();
        memory = v2;
        setPrefs(v2);
        applyPrefs(v2);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return [prefs, setAppearance, resetAppearance];
}
