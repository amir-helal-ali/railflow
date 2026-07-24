"use client";

import * as React from "react";
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  Trash2,
  Copy,
  AlertTriangle,
  ChevronDown,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockContainers } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Line = {
  id: string;
  type: "input" | "output" | "error" | "system";
  text: string;
  timestamp: string;
};

const fakeResponses: Record<string, string> = {
  ls: "bin   etc   node_modules   package.json   src   tsconfig.json   next.config.ts",
  pwd: "/app",
  "node --version": "v22.4.0",
  "npm --version": "10.8.1",
  "cat package.json": `{\n  "name": "web-platform",\n  "version": "1.4.2",\n  "private": true,\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start"\n  }\n}`,
  whoami: "root",
  uptime: " 14:23:45 up 14 days,  3:21,  1 user,  load average: 0.42, 0.38, 0.41",
  "free -h": `              total        used        free      shared  buff/cache   available\nMem:            2.0Gi       412Mi       1.2Gi        12Mi       412Mi       1.4Gi\nSwap:             0B          0B          0B`,
  "df -h": `Filesystem      Size  Used Avail Use% Mounted on\noverlay         500G  234G  266G  47% /\ntmpfs            64M     0   64M   0% /dev\nshm             1.0G   12M 1012M   2% /dev/shm`,
  env: `NODE_ENV=production\nPORT=3000\nDATABASE_URL=postgres://railflow:••••@postgres-prod:5432/railflow\nREDIS_URL=redis://redis-cache:6379/0`,
  help: "Available commands: ls, pwd, whoami, uptime, free -h, df -h, env, node --version, npm --version, cat package.json, clear",
};

export function TerminalView() {
  const { t } = useI18n();
  const [selectedContainer, setSelectedContainer] = React.useState<string>(mockContainers[0]?.id ?? "");
  const [connected, setConnected] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [input, setInput] = React.useState("");
  const [history, setHistory] = React.useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = React.useState(-1);

  const endRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const container = mockContainers.find((c) => c.id === selectedContainer);

  React.useEffect(() => {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight;
  }, [lines]);

  const connect = () => {
    if (!container) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      setLines([
        {
          id: `l_${Date.now()}`,
          type: "system",
          text: `Connected to ${container.name} (${container.image})`,
          timestamp: new Date().toISOString(),
        },
        {
          id: `l_${Date.now() + 1}`,
          type: "system",
          text: `Type 'help' to see available commands. Type 'clear' to clear the screen.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 800);
  };

  const disconnect = () => {
    setConnected(false);
    setLines((l) => [
      ...l,
      { id: `l_${Date.now()}`, type: "system", text: "Session disconnected", timestamp: new Date().toISOString() },
    ]);
  };

  const clear = () => setLines([]);

  const execute = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const ts = new Date().toISOString();
    setHistory((h) => [...h, trimmed]);
    setHistoryIdx(-1);

    setLines((l) => [
      ...l,
      { id: `l_in_${Date.now()}`, type: "input", text: trimmed, timestamp: ts },
    ]);

    if (trimmed === "clear") {
      setLines([]);
      return;
    }

    if (trimmed === "exit") {
      disconnect();
      return;
    }

    // Simulate response
    setTimeout(() => {
      const response = fakeResponses[trimmed] ?? fakeResponses[trimmed.toLowerCase()];
      if (response) {
        response.split("\n").forEach((line, i) => {
          setLines((l) => [
            ...l,
            { id: `l_out_${Date.now()}_${i}`, type: "output", text: line, timestamp: new Date().toISOString() },
          ]);
        });
      } else if (trimmed.startsWith("echo ")) {
        setLines((l) => [
          ...l,
          { id: `l_out_${Date.now()}`, type: "output", text: trimmed.slice(5), timestamp: new Date().toISOString() },
        ]);
      } else {
        setLines((l) => [
          ...l,
          {
            id: `l_err_${Date.now()}`,
            type: "error",
            text: `command not found: ${trimmed.split(" ")[0]}. Type 'help' for available commands.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }, 100 + Math.random() * 200);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      execute(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(newIdx);
      setInput(history[newIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      const newIdx = historyIdx + 1;
      if (newIdx >= history.length) {
        setHistoryIdx(-1);
        setInput("");
      } else {
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      clear();
    }
  };

  const lineColor: Record<Line["type"], string> = {
    input: "text-violet-300",
    output: "text-foreground",
    error: "text-rose-400",
    system: "text-emerald-300",
  };
  const linePrefix: Record<Line["type"], string> = {
    input: "→",
    output: " ",
    error: "✗",
    system: "●",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TerminalIcon className="w-6 h-6 text-violet-300" />
            {t("terminal.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("terminal.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card text-xs">
            {connected ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">{t("terminal.connected")}</span>
              </>
            ) : connecting ? (
              <>
                <span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                <span className="text-violet-300">{t("terminal.connecting")}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{t("terminal.disconnected")}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar: container list */}
        <div className="lg:col-span-1 glass-card p-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("terminal.selectContainer")}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>
          <div className="space-y-1 max-h-[480px] overflow-y-auto scrollbar-thin">
            {mockContainers.filter((c) => c.status === "running").map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedContainer(c.id);
                  if (connected) disconnect();
                }}
                className={cn(
                  "flex items-center gap-2 w-full p-2 rounded-lg text-start text-xs transition-colors",
                  selectedContainer === c.id ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", "bg-emerald-400")} />
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-medium truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.image.split(":")[0]}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-300 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-300/80">{t("terminal.warning")}</p>
          </div>
          <div className="mt-2 flex items-center gap-1.5 px-2 text-[10px] text-muted-foreground/70">
            <Clock className="w-3 h-3" />
            {t("terminal.sessionTimeout")}
          </div>
        </div>

        {/* Terminal */}
        <div className="lg:col-span-3">
          <div className="terminal rounded-lg overflow-hidden">
            {/* Terminal header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/30">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <span className="text-xs text-muted-foreground font-mono ms-2">
                  {container ? `${container.name} — /bin/sh` : t("terminal.noContainer")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={clear}
                  title={t("terminal.clear")}
                  disabled={!connected}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => navigator.clipboard?.writeText(lines.map((l) => l.text).join("\n"))}
                  title={t("terminal.copyOutput")}
                  disabled={lines.length === 0}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                {connected ? (
                  <Button variant="ghost" size="sm" className="h-7 text-rose-400 hover:bg-rose-500/10" onClick={disconnect}>
                    <Square className="w-3 h-3" />
                    {t("terminal.detach")}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                    onClick={connect}
                    disabled={!container || connecting}
                  >
                    <Play className="w-3 h-3" />
                    {t("terminal.attach")}
                  </Button>
                )}
              </div>
            </div>

            {/* Terminal body */}
            <div
              ref={endRef}
              className="p-4 h-[480px] overflow-y-auto scrollbar-thin text-xs font-mono leading-relaxed"
              onClick={() => inputRef.current?.focus()}
            >
              {!connected && lines.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40">
                  <TerminalIcon className="w-12 h-12 mb-3" />
                  <p className="text-sm">{t("terminal.noContainer")}</p>
                  <p className="text-xs mt-1">{t("terminal.warning")}</p>
                </div>
              ) : (
                <>
                  {lines.map((line) => (
                    <div key={line.id} className="flex items-start gap-2 py-0.5 hover:bg-white/[0.02]">
                      <span className={cn("shrink-0 select-none", lineColor[line.type])}>{linePrefix[line.type]}</span>
                      <span className={cn("flex-1 whitespace-pre-wrap break-all", lineColor[line.type])}>
                        {line.text}
                      </span>
                    </div>
                  ))}
                  {connected && (
                    <div className="flex items-center gap-2 py-0.5">
                      <span className="shrink-0 text-violet-300 select-none">→</span>
                      <span className="text-emerald-400 select-none shrink-0">root@{container?.name}:/app$</span>
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKey}
                        placeholder={t("terminal.commandPlaceholder")}
                        className="flex-1 bg-transparent outline-none text-foreground caret-violet-300"
                        autoFocus
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick commands */}
          {connected && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Quick:</span>
              {["ls", "pwd", "node --version", "free -h", "df -h", "uptime", "env", "help"].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => execute(cmd)}
                  className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-violet-300 transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
