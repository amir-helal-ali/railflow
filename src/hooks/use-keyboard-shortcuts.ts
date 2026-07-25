"use client";

/**
 * Global keyboard shortcuts system for Railflow.
 *
 * Supports:
 *  - Cmd/Ctrl + K  → open command palette
 *  - Cmd/Ctrl + B  → toggle sidebar
 *  - Cmd/Ctrl + /  → show shortcuts help
 *  - G then D / P / C / S (server) / E (settings) → navigate
 *  - N             → new project
 *  - Esc           → close modals
 *
 * The hook is intentionally side-effect-light: it just listens for
 * key presses and dispatches custom events on `window`. Consumers
 * (command palette, sidebar, etc.) subscribe via the `onShortcut`
 * helper below or directly with `window.addEventListener`.
 */

import { useEffect } from "react";

export type ShortcutEvent =
  | "railflow:command-palette"
  | "railflow:toggle-sidebar"
  | "railflow:show-shortcuts"
  | "railflow:close-modals"
  | "railflow:go-dashboard"
  | "railflow:go-projects"
  | "railflow:go-containers"
  | "railflow:go-deployments"
  | "railflow:go-server"
  | "railflow:go-settings"
  | "railflow:new-project"
  | "railflow:quick-deploy"
  | "railflow:open-terminal";

const G_PREFIX_TARGETS: Record<string, ShortcutEvent> = {
  d: "railflow:go-dashboard",
  p: "railflow:go-projects",
  c: "railflow:go-containers",
  s: "railflow:go-server",
  e: "railflow:go-settings", // E for sEttings (S is used for server)
};

function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

function dispatch(name: ShortcutEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name));
}

/** Subscribe to one or more shortcut events. Returns an unsubscribe fn. */
export function onShortcut(
  events: ShortcutEvent | ShortcutEvent[],
  handler: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const list = Array.isArray(events) ? events : [events];
  list.forEach((e) => window.addEventListener(e, handler));
  return () => {
    list.forEach((e) => window.removeEventListener(e, handler));
  };
}

export function useKeyboardShortcuts(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    // Single-key buffer for "G then X" sequences
    let gPrefix = false;
    let gPrefixTimer: ReturnType<typeof setTimeout> | null = null;

    const resetGPrefix = () => {
      gPrefix = false;
      if (gPrefixTimer) {
        clearTimeout(gPrefixTimer);
        gPrefixTimer = null;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = isMac() ? e.metaKey : e.ctrlKey;

      // Escape always works — even in inputs (e.g. to blur search)
      if (e.key === "Escape") {
        // Only dispatch when no input is focused OR allow always (modals trap focus)
        dispatch("railflow:close-modals");
        resetGPrefix();
        return;
      }

      // Cmd/Ctrl + K → command palette
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        dispatch("railflow:command-palette");
        resetGPrefix();
        return;
      }

      // Cmd/Ctrl + B → toggle sidebar
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        dispatch("railflow:toggle-sidebar");
        resetGPrefix();
        return;
      }

      // Cmd/Ctrl + / → show shortcuts help
      if (mod && e.key === "/") {
        e.preventDefault();
        dispatch("railflow:show-shortcuts");
        resetGPrefix();
        return;
      }

      // Ignore the rest while typing in form fields
      if (isTextInput(e.target)) {
        resetGPrefix();
        return;
      }

      // Don't trigger shortcuts when modifier keys are pressed (other than the
      // cases above) — avoids stealing browser shortcuts like Cmd+R.
      if (e.altKey || e.metaKey || e.ctrlKey) {
        resetGPrefix();
        return;
      }

      const key = e.key.toLowerCase();

      // Two-key navigation: G then D/P/C/S/E
      if (key === "g" && !gPrefix) {
        gPrefix = true;
        if (gPrefixTimer) clearTimeout(gPrefixTimer);
        gPrefixTimer = setTimeout(resetGPrefix, 1200); // window to press the next key
        return;
      }
      if (gPrefix) {
        const target = G_PREFIX_TARGETS[key];
        if (target) {
          e.preventDefault();
          dispatch(target);
        }
        resetGPrefix();
        return;
      }

      // Single-key actions
      switch (key) {
        case "n":
          e.preventDefault();
          dispatch("railflow:new-project");
          break;
        case "t":
          e.preventDefault();
          dispatch("railflow:open-terminal");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (gPrefixTimer) clearTimeout(gPrefixTimer);
    };
  }, [enabled]);
}
