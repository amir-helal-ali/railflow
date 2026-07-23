"use client";

import * as React from "react";
import { Bell, Search, Command, Languages, Plus, Github, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { mockUser, mockDeployments } from "@/lib/mock-data";
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

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const { navigate } = useRouter();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const activeDeployments = mockDeployments.filter((d) => d.status === "building" || d.status === "queued").length;

  return (
    <header className="sticky top-0 z-20 h-16 px-4 lg:px-6 flex items-center gap-3 border-b border-white/5 glass-card rounded-none">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="w-5 h-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <button
          onClick={() => setSearchOpen(true)}
          className="group flex items-center gap-2 w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-muted-foreground hover:border-violet-400/40 hover:bg-white/[0.07] transition-all"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-start">{t("common.search")}</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* New deploy button */}
        <Button
          onClick={() => navigate({ name: "projects" })}
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
        <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:inline-flex" title="GitHub connected">
          <Github className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="w-4 h-4" />
              {activeDeployments > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-400 ring-2 ring-background" />
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

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </header>
  );
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { navigate } = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = React.useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return [
      ...mockDeployments.filter((d) => d.projectName.toLowerCase().includes(q) || d.commitMessage.toLowerCase().includes(q)).slice(0, 3).map((d) => ({ type: "deployment", label: d.projectName, sub: d.commitMessage, view: { name: "project", projectId: d.projectId } as const })),
    ];
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div className="w-full max-w-xl glass-card rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.search")}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono">ESC</kbd>
        </div>
        {results.length > 0 && (
          <div className="max-h-72 overflow-y-auto p-1.5">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => { navigate(r.view); onClose(); }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/5 text-start"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t("common.noData")}</div>
        )}
      </div>
    </div>
  );
}
