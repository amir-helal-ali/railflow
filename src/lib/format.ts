/**
 * Helper formatters & utility hooks
 */
import { useEffect, useRef, useState } from "react";

export function formatUptime(seconds: number, locale: "ar" | "en" = "en"): string {
  if (seconds <= 0) return locale === "ar" ? "متوقف" : "stopped";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(locale === "ar" ? `${d}ي` : `${d}d`);
  if (h > 0) parts.push(locale === "ar" ? `${h}س` : `${h}h`);
  if (m > 0 && d === 0) parts.push(locale === "ar" ? `${m}د` : `${m}m`);
  return parts.join(" ") || (locale === "ar" ? "<1د" : "<1m");
}

export function formatBytes(mb: number, locale: "ar" | "en" = "en"): string {
  if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
  if (mb < 1024) return `${mb.toFixed(0)} MB`;
  if (mb < 1024 * 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${(mb / 1024 / 1024).toFixed(2)} TB`;
}

export function formatMbps(mbps: number): string {
  if (mbps < 1) return `${(mbps * 1000).toFixed(0)} Kbps`;
  if (mbps < 1000) return `${mbps.toFixed(1)} Mbps`;
  return `${(mbps / 1000).toFixed(2)} Gbps`;
}

export function formatDuration(ms: number, locale: "ar" | "en" = "en"): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return locale === "ar" ? `${s}ث` : `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return locale === "ar" ? `${m}د ${rs}ث` : `${m}m ${rs}s`;
}

export function timeAgo(iso: string, locale: "ar" | "en" = "en"): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (locale === "ar") {
    if (sec < 60) return "الآن";
    if (min < 60) return `منذ ${min} دقيقة`;
    if (hr < 24) return `منذ ${hr} ساعة`;
    if (day < 30) return `منذ ${day} يوم`;
    return new Date(iso).toLocaleDateString("ar-EG");
  }
  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-US");
}

/**
 * useInterval — declarative setInterval
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * useLocalStorage — persisted state.
 * SSR-safe: returns initial on server, hydrates on client mount.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(key);
      if (v) setState(JSON.parse(v) as T);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [key]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state, hydrated]);
  return [state, setState] as const;
}
