"use client";

import * as React from "react";
import {
  Bell,
  Search,
  Command,
  Languages,
  Plus,
  Github,
  Menu,
  Rocket,
  FolderPlus,
  TerminalSquare,
  Code2,
  Settings as SettingsIcon,
  LayoutDashboard,
  FolderGit2,
  Boxes,
  Server as ServerIcon,
  PanelLeft,
  Keyboard,
  CornerDownLeft,
  History,
  ChevronRight,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useRouter, type View } from "@/lib/router";
import { mockUser, mockDeployments, mockProjects } from "@/lib/mock-data";
import { timeAgo } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { onShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useNotify } from "@/components/dashboard/Toaster";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const { navigate } = useRouter();
  const notify = useNotify();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const activeDeployments = mockDeployments.filter(
    (d) => d.status === "building" || d.status === "queued",
  ).length;

  // Listen for the global "open command palette" shortcut (Cmd/Ctrl+K)
  React.useEffect(() => {
    return onShortcut("railflow:command-palette", () => setSearchOpen(true));
  }, []);

  // Listen for the "new project" shortcut (N)
  React.useEffect(() => {
    return onShortcut("railflow:new-project", () => {
      navigate({ name: "projects" });
      notify.projectCreated();
    });
  }, [navigate, notify]);

  return (
    <header className="sticky top-0 z-20 h-16 px-4 lg:px-6 flex items-center gap-3 border-b border-white/5 glass-card rounded-none">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="w-5 h-5" />
      </Button>

      {/* Search / Command palette trigger */}
      <div className="flex-1 max-w-md">
        <button
          onClick={() => setSearchOpen(true)}
          className="group flex items-center gap-2 w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-muted-foreground hover:border-violet-400/40 hover:bg-white/[0.07] transition-all"
        >
          <Search className="w-4 h-4 group-hover:text-violet-300 transition-colors" />
          <span className="flex-1 text-start">{t("common.search")}</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono border border-white/5">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* New deploy button */}
        <Button
          onClick={() => {
            navigate({ name: "projects" });
            notify.deployStarted();
          }}
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 border-0 text-white"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">{t("dashboard.quickDeploy")}</span>
        </Button>

        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Languages className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">{t("settings.language")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setLocale("ar")}
              className={cn("flex items-center justify-between cursor-pointer", locale === "ar" && "bg-white/5")}
            >
              <span>العربية</span>
              {locale === "ar" && <span className="text-violet-400">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLocale("en")}
              className={cn("flex items-center justify-between cursor-pointer", locale === "en" && "bg-white/5")}
            >
              <span>English</span>
              {locale === "en" && <span className="text-violet-400">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* GitHub status */}
        <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:inline-flex relative" title="GitHub connected">
          <Github className="w-4 h-4" />
          <span className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="w-4 h-4" />
              {activeDeployments > 0 && (
                <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-violet-400 ring-2 ring-background" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary" className="text-[10px]">{activeDeployments} active</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockDeployments.slice(0, 5).map((d) => (
              <DropdownMenuItem key={d.id} className="flex items-start gap-2 py-2.5 cursor-pointer">
                <div className={cn(
                  "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                  d.status === "done" ? "bg-emerald-400" : d.status === "failed" ? "bg-rose-500" : "bg-amber-400"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{d.projectName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{d.commitMessage}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5" suppressHydrationWarning>{timeAgo(d.startedAt, locale)}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 h-9 px-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <Avatar className="w-7 h-7 ring-2 ring-violet-400/30">
                <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-white text-xs">
                  {mockUser.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start leading-tight">
                <span className="text-xs font-medium">{mockUser.name}</span>
                <span className="text-[10px] text-muted-foreground">{mockUser.email}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{mockUser.name}</span>
                <span className="text-xs text-muted-foreground font-normal">{mockUser.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ name: "settings" })} className="cursor-pointer">
              {t("common.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ name: "settings", tab: "security" })} className="cursor-pointer">
              {t("settings.security")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ name: "settings", tab: "apiKeys" })} className="cursor-pointer">
              {t("settings.apiKeys")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ name: "login" })} className="cursor-pointer text-rose-400 focus:text-rose-400">
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </header>
  );
}

/* ============================================================ *
 *  Command Palette — full-featured Cmd+K with fuzzy search,    *
 *  navigation + action commands, recent items, and shortcuts.  *
 * ============================================================ */

type PaletteCommand = {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  shortcut?: string[];
  group: "navigation" | "actions" | "projects" | "help";
  keywords?: string;
  perform: () => void;
};

const RECENTS_KEY = "railflow-command-recents";
const RECENTS_LIMIT = 4;

function loadRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = window.localStorage.getItem(RECENTS_KEY);
    return v ? (JSON.parse(v) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = loadRecents().filter((x) => x !== id);
    const next = [id, ...current].slice(0, RECENTS_LIMIT);
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Lightweight fuzzy matcher — supports subsequence + token scoring. */
function fuzzyMatch(query: string, target: string): number {
  if (!query) return 1;
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (t.includes(q)) return 100 - t.indexOf(q);
  // Subsequence match
  let qi = 0;
  let score = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      score += 1;
    }
  }
  return qi === q.length ? score : -1;
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const { t, dir } = useI18n();
  const { navigate } = useRouter();
  const notify = useNotify();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [recents, setRecents] = React.useState<string[]>([]);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    setRecents(loadRecents());
  }, []);

  // Close on global "close-modals" shortcut (Esc is handled natively too)
  React.useEffect(() => {
    return onShortcut("railflow:close-modals", () => onClose());
  }, [onClose]);

  const go = React.useCallback(
    (view: View) => {
      navigate(view);
      onClose();
    },
    [navigate, onClose],
  );

  // Build the full command list
  const commands = React.useMemo<PaletteCommand[]>(() => {
    const nav: PaletteCommand[] = [
      { id: "nav.dashboard", label: t("nav.dashboard"), icon: LayoutDashboard, group: "navigation", shortcut: ["G", "D"], perform: () => go({ name: "dashboard" }) },
      { id: "nav.projects", label: t("nav.projects"), icon: FolderGit2, group: "navigation", shortcut: ["G", "P"], perform: () => go({ name: "projects" }) },
      { id: "nav.containers", label: t("nav.containers"), icon: Boxes, group: "navigation", shortcut: ["G", "C"], perform: () => go({ name: "containers" }) },
      { id: "nav.deployments", label: t("nav.deployments"), icon: Rocket, group: "navigation", perform: () => go({ name: "deployments" }) },
      { id: "nav.server", label: t("nav.server"), icon: ServerIcon, group: "navigation", shortcut: ["G", "S"], perform: () => go({ name: "server" }) },
      { id: "nav.settings", label: t("nav.settings"), icon: SettingsIcon, group: "navigation", shortcut: ["G", "E"], perform: () => go({ name: "settings" }) },
    ];
    const actions: PaletteCommand[] = [
      { id: "act.newProject", label: t("commandPalette.action.newProject"), description: t("commandPalette.action.newProject.desc"), icon: FolderPlus, group: "actions", shortcut: ["N"], perform: () => { go({ name: "projects" }); notify.projectCreated(); } },
      { id: "act.deploy", label: t("commandPalette.action.deploy"), description: t("commandPalette.action.deploy.desc"), icon: Rocket, group: "actions", perform: () => { go({ name: "deployments" }); notify.deployStarted(); } },
      { id: "act.terminal", label: t("commandPalette.action.terminal"), description: t("commandPalette.action.terminal.desc"), icon: TerminalSquare, group: "actions", shortcut: ["T"], perform: () => go({ name: "terminal" }) },
      { id: "act.playground", label: t("commandPalette.action.playground"), icon: Code2, group: "actions", perform: () => go({ name: "playground" }) },
      { id: "act.toggleSidebar", label: t("commandPalette.action.toggleSidebar"), icon: PanelLeft, group: "actions", shortcut: ["⌘", "B"], perform: () => window.dispatchEvent(new CustomEvent("railflow:toggle-sidebar")) },
      { id: "act.showShortcuts", label: t("commandPalette.action.showShortcuts"), icon: Keyboard, group: "actions", shortcut: ["⌘", "/"], perform: () => window.dispatchEvent(new CustomEvent("railflow:show-shortcuts")) },
    ];
    const projects: PaletteCommand[] = mockProjects.map((p) => ({
      id: `proj.${p.id}`,
      label: p.name,
      description: p.repo,
      icon: FolderGit2,
      group: "projects",
      keywords: `${p.repo} ${p.description} ${p.framework}`,
      perform: () => go({ name: "project", projectId: p.id }),
    }));
    const help: PaletteCommand[] = [
      { id: "help.docs", label: t("nav.docs"), icon: Keyboard, group: "help", perform: () => go({ name: "help" }) },
    ];
    return [...nav, ...actions, ...projects, ...help];
  }, [t, go, notify]);

  // Filter + score
  const filtered = React.useMemo(() => {
    if (!query.trim()) {
      // When no query, surface recents first (if any), then navigation
      const recentCmds = recents
        .map((id) => commands.find((c) => c.id === id))
        .filter((c): c is PaletteCommand => Boolean(c));
      const rest = commands.filter((c) => !recents.includes(c.id));
      return { recentCmds, rest };
    }
    const scored = commands
      .map((c) => {
        const labelScore = fuzzyMatch(query, c.label);
        const descScore = c.description ? fuzzyMatch(query, c.description) : -1;
        const kwScore = c.keywords ? fuzzyMatch(query, c.keywords) : -1;
        const best = Math.max(labelScore, descScore, kwScore);
        return { cmd: c, score: best };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.cmd);
    return { recentCmds: [] as PaletteCommand[], rest: scored };
  }, [query, commands, recents]);

  const flatList = React.useMemo(
    () => [...filtered.recentCmds, ...filtered.rest],
    [filtered],
  );

  // Reset active index when results change
  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Auto-scroll active item into view
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector(`[data-idx="${activeIndex}"]`) as HTMLElement | null;
    if (active) active.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const runCommand = React.useCallback(
    (cmd: PaletteCommand) => {
      saveRecent(cmd.id);
      setRecents(loadRecents());
      cmd.perform();
    },
    [],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = flatList[activeIndex];
      if (cmd) runCommand(cmd);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const Forward = dir === "rtl" ? ChevronLeft : ChevronRight;

  // Render groups — preserve order: Recent → Navigation → Actions → Projects → Help
  const groupMeta: { key: PaletteCommand["group"]; label: string }[] = [
    { key: "navigation", label: t("commandPalette.group.recent") }, // re-used for recents header below
    { key: "navigation", label: t("commandPalette.group.navigation") },
    { key: "actions", label: t("commandPalette.group.actions") },
    { key: "projects", label: t("commandPalette.group.projects") },
    { key: "help", label: t("commandPalette.group.help") },
  ];

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4 animate-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("commandPalette.title")}
    >
      <div
        className="w-full max-w-xl glass-card rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/5">
          <Search className="w-4 h-4 text-violet-300 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("commandPalette.placeholder")}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono border border-white/5 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto scrollbar-thin p-1.5">
          {flatList.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {t("commandPalette.empty")}
            </div>
          )}

          {/* Recent items (only when no query) */}
          {!query && filtered.recentCmds.length > 0 && (
            <Group
              label={t("commandPalette.group.recent")}
              icon={<History className="w-3 h-3" />}
            >
              {filtered.recentCmds.map((cmd) => {
                runningIndex++;
                const idx = runningIndex;
                return (
                  <CommandRow
                    key={cmd.id}
                    cmd={cmd}
                    active={idx === activeIndex}
                    onClick={() => runCommand(cmd)}
                    onHover={() => setActiveIndex(idx)}
                    dataIdx={idx}
                    trailing={<Forward className="w-3.5 h-3.5 text-muted-foreground/60" />}
                  />
                );
              })}
            </Group>
          )}

          {/* Standard groups */}
          {groupMeta.slice(1).map(({ key, label }) => {
            const items = filtered.rest.filter((c) => c.group === key);
            if (items.length === 0) return null;
            return (
              <Group key={`${key}-${label}`} label={label}>
                {items.map((cmd) => {
                  runningIndex++;
                  const idx = runningIndex;
                  return (
                    <CommandRow
                      key={cmd.id}
                      cmd={cmd}
                      active={idx === activeIndex}
                      onClick={() => runCommand(cmd)}
                      onHover={() => setActiveIndex(idx)}
                      dataIdx={idx}
                    />
                  );
                })}
              </Group>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-mono">↓</kbd>
              <span className="hidden sm:inline">navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-mono flex items-center gap-0.5">
                <CornerDownLeft className="w-2.5 h-2.5" />
              </kbd>
              <span className="hidden sm:inline">select</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{t("app.name")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {icon}
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function CommandRow({
  cmd,
  active,
  onClick,
  onHover,
  dataIdx,
  trailing,
}: {
  cmd: PaletteCommand;
  active: boolean;
  onClick: () => void;
  onHover: () => void;
  dataIdx: number;
  trailing?: React.ReactNode;
}) {
  const Icon = cmd.icon;
  return (
    <button
      data-idx={dataIdx}
      onClick={onClick}
      onMouseMove={onHover}
      className={cn(
        "flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-start transition-colors",
        active ? "bg-white/8 ring-1 ring-violet-400/30" : "hover:bg-white/5",
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-md flex items-center justify-center shrink-0 border",
          active
            ? "bg-gradient-to-br from-violet-500/20 to-cyan-400/20 border-violet-400/30 text-violet-200"
            : "bg-white/5 border-white/5 text-muted-foreground",
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{cmd.label}</div>
        {cmd.description && (
          <div className="text-[11px] text-muted-foreground truncate">{cmd.description}</div>
        )}
      </div>
      {cmd.shortcut && (
        <div className="flex items-center gap-1 shrink-0">
          {cmd.shortcut.map((k, i) => (
            <kbd
              key={i}
              className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-mono font-semibold text-muted-foreground"
            >
              {k}
            </kbd>
          ))}
        </div>
      )}
      {trailing}
    </button>
  );
}
