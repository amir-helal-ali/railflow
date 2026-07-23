"use client";

import * as React from "react";
import {
  Plus,
  Mail,
  Shield,
  Crown,
  MoreVertical,
  UserPlus,
  Clock,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockTeam, mockInvites, mockUser } from "@/lib/mock-data";
import { SectionHeader, StatusBadge } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Role, TeamMember } from "@/lib/types";

const roleConfig: Record<Role, { color: string; icon: React.ElementType; descKey: string }> = {
  owner: { color: "bg-amber-500/10 text-amber-300 border-amber-500/20", icon: Crown, descKey: "team.role.owner.desc" },
  admin: { color: "bg-violet-500/10 text-violet-300 border-violet-500/20", icon: Shield, descKey: "team.role.admin.desc" },
  developer: { color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20", icon: UserPlus, descKey: "team.role.developer.desc" },
  viewer: { color: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20", icon: Mail, descKey: "team.role.viewer.desc" },
};

export function TeamView() {
  const { t, locale } = useI18n();
  const [showInvite, setShowInvite] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("team.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("team.subtitle")}</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Plus className="w-4 h-4" />
          {t("team.invite")}
        </Button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {(["owner", "admin", "developer", "viewer"] as Role[]).map((r) => {
          const cfg = roleConfig[r];
          const Icon = cfg.icon;
          return (
            <div key={r} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", cfg.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium">{t(`team.role.${r}`)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t(cfg.descKey)}</p>
            </div>
          );
        })}
      </div>

      {/* Pending invites */}
      {mockInvites.length > 0 && (
        <div className="glass-card p-5">
          <SectionHeader title={t("team.pendingInvites")} subtitle={`${mockInvites.length} ${t("team.pendingInvites").toLowerCase()}`} />
          <div className="space-y-2">
            {mockInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("team.role")}: {t(`team.role.${inv.role}`)} · {t("team.invite.expiresIn")}
                  </p>
                </div>
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t("team.status.invited")}
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs">{t("team.invite.resend")}</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10">{t("team.invite.cancel")}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="glass-card p-5">
        <SectionHeader title={t("team.members")} subtitle={`${mockTeam.length} ${t("team.members").toLowerCase()}`} />
        <div className="space-y-2">
          {mockTeam.map((member) => (
            <MemberRow key={member.id} member={member} isCurrentUser={member.id === mockUser.id} />
          ))}
        </div>
      </div>

      {showInvite && <InviteDialog onClose={() => setShowInvite(false)} />}
    </div>
  );
}

function MemberRow({ member, isCurrentUser }: { member: TeamMember; isCurrentUser: boolean }) {
  const { t, locale } = useI18n();
  const cfg = roleConfig[member.role];
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] group">
      <Avatar className="w-10 h-10 ring-2 ring-background">
        <AvatarImage src={member.avatarUrl} alt={member.name} />
        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-white text-xs">
          {member.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{member.name}</span>
          {isCurrentUser && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">{t("settings.sessions.current")}</span>}
          {member.status === "invited" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">{t("team.status.invited")}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>

      <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
        <div className="text-center min-w-[60px]">
          <div className="text-[10px] uppercase tracking-wider">{t("team.projects")}</div>
          <div className="font-medium tabular-nums">{member.projectsCount}</div>
        </div>
        <div className="text-center min-w-[60px]">
          <div className="text-[10px] uppercase tracking-wider">{t("team.twoFactor")}</div>
          <div className={cn("font-medium", member.twoFactorEnabled ? "text-emerald-400" : "text-muted-foreground/60")}>
            {member.twoFactorEnabled ? <CheckCircle2 className="w-3.5 h-3.5 inline" /> : <XCircle className="w-3.5 h-3.5 inline" />}
          </div>
        </div>
        <div className="text-center min-w-[80px]">
          <div className="text-[10px] uppercase tracking-wider">{t("team.lastActive")}</div>
          <div className="font-medium tabular-nums" suppressHydrationWarning>{member.lastActiveAt ? timeAgo(member.lastActiveAt, locale) : "—"}</div>
        </div>
      </div>

      {/* Role badge */}
      <span className={cn("text-xs px-2 py-1 rounded-md border flex items-center gap-1.5", cfg.color)}>
        <Icon className="w-3 h-3" />
        {t(`team.role.${member.role}`)}
      </span>

      {/* Actions */}
      {!isCurrentUser && member.role !== "owner" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-xs">{t("team.changeRole")}</DropdownMenuItem>
            <DropdownMenuItem className="text-xs">→ {t("team.role.admin")}</DropdownMenuItem>
            <DropdownMenuItem className="text-xs">→ {t("team.role.developer")}</DropdownMenuItem>
            <DropdownMenuItem className="text-xs">→ {t("team.role.viewer")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-rose-400 focus:text-rose-400">
              {t("team.removeMember")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("viewer");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{t("team.inviteByEmail")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("team.invite.email")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="pl-9 bg-white/5 border-white/10"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("team.invite.role")}</label>
            <div className="space-y-1.5">
              {(["admin", "developer", "viewer"] as Role[]).map((r) => {
                const cfg = roleConfig[r];
                const Icon = cfg.icon;
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex items-center gap-3 w-full p-2.5 rounded-lg border text-start transition-all",
                      role === r ? "border-violet-400 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", cfg.color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t(`team.role.${r}`)}</div>
                      <div className="text-[10px] text-muted-foreground">{t(cfg.descKey)}</div>
                    </div>
                    {role === r && <CheckCircle2 className="w-4 h-4 text-violet-300" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-white/5 text-[11px] text-muted-foreground flex items-center gap-2">
            <Clock className="w-3 h-3 shrink-0" />
            {t("team.invite.expiresIn")}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
            <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0" disabled={!email}>
              <Mail className="w-4 h-4" />
              {t("team.invite.send")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
