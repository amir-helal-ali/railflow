/**
 * Lightweight view-router for the single-page dashboard.
 * The full Next.js app exposes only one route (`/`) per sandbox rules,
 * so we manage internal "pages" via client-side state.
 */
"use client";

import * as React from "react";

export type View =
  | { name: "dashboard" }
  | { name: "projects" }
  | { name: "project"; projectId: string; tab?: string }
  | { name: "containers" }
  | { name: "deployments" }
  | { name: "server" }
  | { name: "databases" }
  | { name: "volumes" }
  | { name: "networks" }
  | { name: "activity" }
  | { name: "team" }
  | { name: "backups" }
  | { name: "certificates" }
  | { name: "settings"; tab?: string }
  | { name: "login" };

type RouterContextValue = {
  view: View;
  navigate: (v: View) => void;
  back: () => void;
};

const RouterContext = React.createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = React.useState<View[]>([{ name: "dashboard" }]);

  const navigate = React.useCallback((v: View) => {
    setStack((s) => [...s, v]);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const back = React.useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  const value = React.useMemo<RouterContextValue>(
    () => ({ view: stack[stack.length - 1], navigate, back }),
    [stack, navigate, back]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = React.useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within RouterProvider");
  return ctx;
}
