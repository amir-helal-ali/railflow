"use client";

/**
 * Keyboard shortcuts help dialog — opened via Cmd/Ctrl + / or the
 * command palette. Shows all global shortcuts grouped by category.
 */

import * as React from "react";
import {
  Command,
  PanelLeft,
  Keyboard,
  X,
  LayoutDashboard,
  FolderGit2,
  Boxes,
  Rocket,
  Server as ServerIcon,
  Settings as SettingsIcon,
  TerminalSquare,
  Plus,
  CornerDownLeft,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Shortcut = {
  keys: string[];
  labelKey: string;
  icon: React.ElementType;
};

const GROUPS: { titleKey: string; items: Shortcut[] }[] = [
  {
    titleKey: "shortcuts.global",
    items: [
      { keys: ["⌘", "K"], labelKey: "shortcuts.openCommand", icon: Command },
      { keys: ["⌘", "B"], labelKey: "shortcuts.toggleSidebar", icon: PanelLeft },
      { keys: ["⌘", "/"], labelKey: "shortcuts.showShortcuts", icon: Keyboard },
      { keys: ["Esc"], labelKey: "shortcuts.closeModal", icon: X },
    ],
  },
  {
    titleKey: "shortcuts.navigation",
    items: [
      { keys: ["G", "D"], labelKey: "shortcuts.goDashboard", icon: LayoutDashboard },
      { keys: ["G", "P"], labelKey: "shortcuts.goProjects", icon: FolderGit2 },
      { keys: ["G", "C"], labelKey: "shortcuts.goContainers", icon: Boxes },
      { keys: ["G", "S"], labelKey: "shortcuts.goServer", icon: ServerIcon },
      { keys: ["G", "E"], labelKey: "shortcuts.goSettings", icon: SettingsIcon },
    ],
  },
  {
    titleKey: "shortcuts.actions",
    items: [
      { keys: ["N"], labelKey: "shortcuts.newProject", icon: Plus },
      { keys: ["T"], labelKey: "shortcuts.openTerminal", icon: TerminalSquare },
    ],
  },
];

export function ShortcutsHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, dir } = useI18n();

  // Close on Escape (in addition to the global shortcut)
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in"
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-modal="true"
      aria-label={t("shortcuts.title")}
    >
      <div
        className="w-full max-w-2xl glass-card rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-400/20 border border-white/10 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-violet-300" />
            </div>
            <div>
              <h2 className="text-base font-semibold">{t("shortcuts.title")}</h2>
              <p className="text-[11px] text-muted-foreground">{t("shortcuts.subtitle")}</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
            aria-label={t("common.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto scrollbar-thin space-y-6">
          {GROUPS.map((group) => (
            <div key={group.titleKey}>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
                {t(group.titleKey)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.labelKey}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-xs flex-1">{t(item.labelKey)}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, i) => (
                          <kbd
                            key={i}
                            className={cn(
                              "min-w-[1.5rem] h-6 px-1.5 rounded bg-white/10 border border-white/10 text-[10px] font-mono font-semibold flex items-center justify-center",
                              i > 0 && "opacity-70",
                            )}
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-mono flex items-center">
                <ArrowUp className="w-2.5 h-2.5" />
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-mono flex items-center">
                <ArrowDown className="w-2.5 h-2.5" />
              </kbd>
              <span className="hidden sm:inline ms-1">in command palette</span>
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-mono flex items-center">
                <CornerDownLeft className="w-2.5 h-2.5" />
              </kbd>
              <span>to select</span>
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-1 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 transition-colors"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
