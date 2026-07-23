"use client";

import * as React from "react";
import { timeAgo as formatTimeAgo } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

/**
 * TimeAgo — SSR-safe relative time display.
 *
 * Problem: `timeAgo()` uses `Date.now()`, which differs between server
 * render time and client hydration time, causing React hydration mismatch.
 *
 * Solution: render nothing on the server (or a stable ISO fallback) and
 * populate the relative string only after mount.
 */
export function TimeAgo({
  iso,
  locale = "ar",
  className,
  fallback = "—",
}: {
  iso: string;
  locale?: Locale;
  className?: string;
  fallback?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [text, setText] = React.useState(fallback);

  React.useEffect(() => {
    setMounted(true);
    setText(formatTimeAgo(iso, locale));
    // refresh every 30s
    const id = setInterval(() => setText(formatTimeAgo(iso, locale)), 30_000);
    return () => clearInterval(id);
  }, [iso, locale]);

  if (!mounted) {
    return <span className={className} suppressHydrationWarning>{fallback}</span>;
  }
  return <span className={className}>{text}</span>;
}
