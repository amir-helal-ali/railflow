"use client";

import * as React from "react";
import {
  Search,
  BookOpen,
  Clock,
  ArrowLeft,
  Mail,
  Github,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockHelpTopics } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HelpTopic } from "@/lib/types";

const categoryColor: Record<HelpTopic["category"], string> = {
  "getting-started": "bg-violet-500/10 text-violet-300 border-violet-500/20",
  deployment: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  databases: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  security: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  billing: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  api: "bg-pink-500/10 text-pink-300 border-pink-500/20",
};

export function HelpView() {
  const { t, locale } = useI18n();
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<HelpTopic | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<HelpTopic["category"] | "all">("all");

  const filtered = mockHelpTopics.filter((topic) => {
    if (activeCategory !== "all" && topic.category !== activeCategory) return false;
    if (query) {
      const q = query.toLowerCase();
      return topic.title.toLowerCase().includes(q) || topic.description.toLowerCase().includes(q) || topic.content.toLowerCase().includes(q);
    }
    return true;
  });

  if (selected) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          {t("help.back")}
        </button>

        <div className="glass-card p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">{selected.icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight mb-2">{selected.title}</h1>
              <p className="text-sm text-muted-foreground">{selected.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className={cn("px-2 py-0.5 rounded border", categoryColor[selected.category])}>
                  {t(`help.category.${selected.category}`)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selected.readTimeMin} {t("help.readTime")}
                </span>
                <span suppressHydrationWarning>
                  {t("help.lastUpdated")}: {timeAgo(selected.lastUpdated, locale)}
                </span>
              </div>
            </div>
          </div>

          <article className="prose prose-invert max-w-none">
            <MarkdownContent content={selected.content} />
          </article>
        </div>

        {/* Related articles */}
        <div>
          <h3 className="text-sm font-semibold mb-3">{t("help.relatedArticles")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mockHelpTopics
              .filter((x) => x.id !== selected.id && x.category === selected.category)
              .slice(0, 4)
              .map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => { setSelected(topic); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="glass-card glass-card-hover p-3 text-start flex items-center gap-3"
                >
                  <div className="text-2xl">{topic.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{topic.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
                  </div>
                  <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                </button>
              ))}
          </div>
        </div>

        {/* Support footer */}
        <div className="glass-card p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 text-center md:text-start">
            <p className="text-sm font-medium">Still need help?</p>
            <p className="text-xs text-muted-foreground mt-1">Our team is here 24/7 to assist you.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Mail className="w-3.5 h-3.5" />
              {t("help.contactSupport")}
            </Button>
            <Button variant="outline" size="sm">
              <Github className="w-3.5 h-3.5" />
              {t("help.openIssue")}
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-3.5 h-3.5" />
              Discord
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-violet-300" />
          {t("help.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("help.subtitle")}</p>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("help.search")}
          className="pl-9 bg-white/5 border-white/10 h-11 text-sm"
        />
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
            activeCategory === "all"
              ? "bg-white/10 text-foreground border-violet-400/40"
              : "bg-white/5 text-muted-foreground hover:text-foreground border-transparent"
          )}
        >
          {t("alerts.all")}
        </button>
        {(["getting-started", "deployment", "databases", "security", "billing", "api"] as HelpTopic["category"][]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
              activeCategory === cat
                ? "bg-white/10 text-foreground border-violet-400/40"
                : "bg-white/5 text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            {t(`help.category.${cat}`)}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelected(topic)}
            className="glass-card glass-card-hover p-5 text-start transition-all group"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl">{topic.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold mb-1 group-hover:text-violet-300 transition-colors">{topic.title}</h3>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", categoryColor[topic.category])}>
                  {t(`help.category.${topic.category}`)}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{topic.description}</p>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {topic.readTimeMin} {t("help.readTime")}
              </span>
              <span suppressHydrationWarning>{timeAgo(topic.lastUpdated, locale)}</span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No articles found.</p>
        </div>
      )}

      {/* Support card */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shrink-0">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-center md:text-start">
          <p className="text-sm font-medium">Can't find what you're looking for?</p>
          <p className="text-xs text-muted-foreground mt-1">Browse our GitHub discussions, join Discord, or email support@railflow.io</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Github className="w-3.5 h-3.5" />
            GitHub
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-3.5 h-3.5" />
            Discord
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Tiny markdown renderer for headers, lists, tables, code blocks, and bold. */
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push(
        <pre key={key++} className="bg-black/40 border border-white/10 rounded-lg p-3 my-3 overflow-x-auto text-xs font-mono text-violet-200">
          {code.join("\n")}
        </pre>
      );
      continue;
    }

    // Headers
    if (line.startsWith("## ")) {
      blocks.push(<h2 key={key++} className="text-lg font-semibold mt-5 mb-2 text-foreground">{line.slice(3)}</h2>);
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(<h1 key={key++} className="text-xl font-bold mt-5 mb-2 text-foreground">{line.slice(2)}</h1>);
      i++;
      continue;
    }

    // Table
    if (line.startsWith("|") && i + 1 < lines.length && lines[i + 1].startsWith("|")) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!lines[i].includes("---")) {
          tableRows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
        }
        i++;
      }
      blocks.push(
        <div key={key++} className="my-3 overflow-x-auto">
          <table className="w-full text-xs border border-white/10 rounded-lg overflow-hidden">
            <thead className="bg-white/5">
              <tr>
                {tableRows[0]?.map((c, ci) => (
                  <th key={ci} className="px-3 py-2 text-start font-medium text-foreground border-b border-white/10">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr key={ri} className="border-b border-white/5">
                  {row.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 text-muted-foreground">{renderInline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // List
    if (line.match(/^\d+\.\s/) || line.startsWith("- ")) {
      const items: string[] = [];
      const isOrdered = !!line.match(/^\d+\.\s/);
      while (i < lines.length && (lines[i].match(/^\d+\.\s/) || lines[i].startsWith("- "))) {
        items.push(lines[i].replace(/^\d+\.\s|^- /, ""));
        i++;
      }
      if (isOrdered) {
        blocks.push(
          <ol key={key++} className="list-decimal list-inside space-y-1 my-2 text-sm text-foreground">
            {items.map((it, ii) => <li key={ii}>{renderInline(it)}</li>)}
          </ol>
        );
      } else {
        blocks.push(
          <ul key={key++} className="list-disc list-inside space-y-1 my-2 text-sm text-foreground">
            {items.map((it, ii) => <li key={ii}>{renderInline(it)}</li>)}
          </ul>
        );
      }
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    blocks.push(<p key={key++} className="text-sm text-foreground my-2 leading-relaxed">{renderInline(line)}</p>);
    i++;
  }

  return <>{blocks}</>;
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold** and `code`
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    const matches = [
      boldMatch ? { type: "bold", match: boldMatch, index: boldMatch.index! } : null,
      codeMatch ? { type: "code", match: codeMatch, index: codeMatch.index! } : null,
    ].filter(Boolean) as Array<{ type: string; match: RegExpMatchArray; index: number }>;

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    matches.sort((a, b) => a.index - b.index);
    const first = matches[0];
    if (first.index > 0) parts.push(remaining.slice(0, first.index));
    if (first.type === "bold") {
      parts.push(<strong key={key++} className="text-foreground font-semibold">{first.match[1]}</strong>);
    } else {
      parts.push(<code key={key++} className="text-xs font-mono px-1 py-0.5 rounded bg-violet-500/10 text-violet-300">{first.match[1]}</code>);
    }
    remaining = remaining.slice(first.index + first.match[0].length);
  }
  return parts;
}
