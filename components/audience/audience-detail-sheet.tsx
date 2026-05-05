"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Activity,
  ShieldAlert,
  Heart,
  Share2,
  Ban,
  Loader2,
  Zap,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import {
  PLATFORM_API_SPECS,
  canBuildLookalike,
  mockBuildLookalike,
  mockToggleExclusion,
} from "@/lib/audience/platform-apis";
import type { Audience, AdPlatform, PlatformMatch } from "@/lib/audience/rfdm";
import { SallaTip } from "@/components/audience/salla-tip";

interface Props {
  audience: Audience | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called after a successful Build Lookalike — parent inserts the new audience into the library */
  onLookalikeCreated?: (sourceId: string, newId: string, mode: string, platform: AdPlatform) => void;
  /** Called after the exclusion toggle flips */
  onExclusionToggled?: (audienceId: string, enabled: boolean) => void;
  /** Called when "Create Campaign" is clicked — navigate to /ad-management with audience preselected */
  onCreateCampaign?: (audience: Audience) => void;
}

const PLATFORM_META: Record<AdPlatform, { label: string; color: string; bgColor: string; ring: string }> = {
  meta: { label: "Meta", color: "#1877F2", bgColor: "#E7F0FE", ring: "ring-[#1877F2]/20" },
  google: { label: "Google", color: "#4285F4", bgColor: "#E8F0FE", ring: "ring-[#4285F4]/20" },
  snapchat: { label: "Snapchat", color: "#F5B700", bgColor: "#FFFBEB", ring: "ring-yellow-500/20" },
  tiktok: { label: "TikTok", color: "#000", bgColor: "#F4F4F5", ring: "ring-slate-500/20" },
  dv360: { label: "YouTube / DV360", color: "#DC2626", bgColor: "#FEF2F2", ring: "ring-red-500/20" },
};

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

function formatDate(iso: string) {
  const diff = Date.now() - Date.parse(iso);
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function MatchRow({ match, totalSize }: { match: PlatformMatch; totalSize: number }) {
  const meta = PLATFORM_META[match.platform];
  const tooSmall = match.matched < match.minRequired;

  const statusChip = {
    synced: { label: `Synced · ${match.lastSyncedAt ? formatDate(match.lastSyncedAt) : ""}`, cls: "bg-emerald-50 text-emerald-700" },
    syncing: { label: "Syncing…", cls: "bg-blue-50 text-blue-700" },
    failed: { label: "Sync failed", cls: "bg-red-50 text-red-700" },
    not_connected: { label: "Not connected", cls: "bg-slate-100 text-slate-500" },
  }[match.status];

  return (
    <div className={cn("rounded-xl border border-border bg-white p-3.5 transition-all hover:shadow-sm", match.status === "not_connected" && "opacity-60")}>
      <div className="flex items-start gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
          style={{ backgroundColor: meta.bgColor, color: meta.color }}
        >
          {meta.label[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{meta.label}</span>
            <Badge variant="outline" className={cn("rounded-full border-transparent px-1.5 py-0 text-[9px] font-medium", statusChip.cls)}>
              {statusChip.label}
            </Badge>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-lg font-bold tabular-nums text-foreground">{formatNumber(match.matched)}</span>
            <span className="text-[11px] text-muted-foreground">
              of {formatNumber(totalSize)} · {(match.matchRate * 100).toFixed(0)}% match
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${match.matchRate * 100}%`,
                backgroundColor: meta.color,
              }}
            />
          </div>
          {/* Warnings */}
          {tooSmall && match.status !== "not_connected" && (
            <div className="mt-2 flex items-start gap-1 rounded-md bg-amber-50 p-1.5">
              <AlertCircle className="mt-0.5 size-3 shrink-0 text-amber-600" />
              <span className="text-[10px] text-amber-700">
                Below {formatNumber(match.minRequired)} minimum — won't activate on {meta.label}
              </span>
            </div>
          )}
        </div>
        {/* Only Connect is a real merchant action — everything else is auto. */}
        {match.status === "not_connected" && (
          <Button size="sm" variant="outline" className="h-7 shrink-0 gap-1 text-xs">
            <ExternalLink className="size-3" />
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

export function AudienceDetailSheet({
  audience,
  open,
  onOpenChange,
  onLookalikeCreated,
  onExclusionToggled,
  onCreateCampaign,
}: Props) {
  const [pending, setPending] = useState<"lookalike" | "exclusion" | null>(null);
  const [exclusionEnabled, setExclusionEnabled] = useState(false);

  if (!audience) return null;

  const objective = audience.healthHint?.objective;
  const isSuppression = objective === "SUPPRESS" || audience.source === "blocklist";
  const isLookalikeSeed = objective === "LOOKALIKE";
  const recommendedPlatforms = audience.healthHint?.platforms ?? ["meta", "google", "snapchat"];
  // Default lookalike target: highest-priority platform that supports min seed size
  const lookalikeTarget = recommendedPlatforms.find((p) => audience.size >= PLATFORM_API_SPECS[p].lookalikeMinSeedSize) ?? "meta";
  const lookalikeCheck = canBuildLookalike(audience.size, lookalikeTarget);
  // Audiences where lookalike is genuinely useful — driving the educational tip.
  const lookalikeMakesSense =
    audience.source === "rfdm" &&
    ["champions", "loyal", "active", "explorers"].includes(audience.rfdmKey ?? "");

  async function handleLookalike() {
    if (!audience || !lookalikeCheck.ok) return;
    setPending("lookalike");
    const spec = PLATFORM_API_SPECS[lookalikeTarget];
    const mode = spec.lookalikeModes[0];
    const res = await mockBuildLookalike({
      seedAudienceId: audience.id,
      country: "SA",
      mode,
      platform: lookalikeTarget,
    });
    setPending(null);
    onLookalikeCreated?.(audience.id, res.newAudienceId, mode, lookalikeTarget);
  }

  async function handleExclusionToggle() {
    if (!audience) return;
    setPending("exclusion");
    const res = await mockToggleExclusion({ audienceId: audience.id, enable: !exclusionEnabled });
    setExclusionEnabled(res.enabled);
    setPending(null);
    onExclusionToggled?.(audience.id, res.enabled);
  }

  const totalMatched = audience.platformMatches.reduce((a, m) => a + m.matched, 0);
  const avgMatch = totalMatched / audience.platformMatches.length / audience.size;
  const connectedCount = audience.platformMatches.filter((m) => m.status === "synced").length;

  const sourceLabel: Record<typeof audience.source, string> = {
    rfdm: "RFDM Segment",
    ai_predicted: "AI · Predicted",
    ai_discovered: "AI · Discovered Cluster",
    ai_chat: "AI · Chat-generated",
    pixel: "Pixel Event",
    conversion: "Conversion Event",
    csv: "CSV Upload",
    meta_import: "Imported from Meta",
    google_import: "Imported from Google",
    snap_import: "Imported from Snapchat",
    tiktok_import: "Imported from TikTok",
    lookalike: "Lookalike",
    blocklist: "Blocklist / Exclusion",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full border-[#a4ffe5] bg-[#e6fff9] px-1.5 py-0 text-[9px] font-semibold text-[#004956]">
                  {sourceLabel[audience.source]}
                </Badge>
                {audience.status === "stale" && (
                  <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 px-1.5 py-0 text-[9px] font-semibold text-amber-700">
                    Stale
                  </Badge>
                )}
                {audience.status === "too_small" && (
                  <Badge variant="outline" className="rounded-full border-red-200 bg-red-50 px-1.5 py-0 text-[9px] font-semibold text-red-700">
                    Too small
                  </Badge>
                )}
                {audience.confidence !== undefined && (
                  <Badge variant="outline" className="rounded-full border-violet-200 bg-violet-50 px-1.5 py-0 text-[9px] font-semibold text-violet-700">
                    {(audience.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                )}
              </div>
              <SheetTitle className="mt-1 text-lg font-bold leading-tight">{audience.name}</SheetTitle>
              <SheetDescription className="mt-0.5 text-xs leading-snug text-muted-foreground">
                {audience.description}
              </SheetDescription>
            </div>
          </div>

          {/* Action row — only the things that ARE the user's job to do.
              Auto-sync runs in the background. Refresh, Export, Archive, Edit
              filters, Duplicate are all stripped — they were noise. */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {isSuppression ? (
              /* Suppression / blocklist audiences have a single dedicated action. */
              <Button
                size="sm"
                onClick={handleExclusionToggle}
                disabled={pending === "exclusion"}
                className={cn(
                  "h-9 gap-1.5",
                  exclusionEnabled
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-[#a4ffe5] text-[#004956] hover:bg-[#8fffd8]"
                )}
              >
                {pending === "exclusion" ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
                {exclusionEnabled ? "Exclusion active" : "Use as Exclusion"}
              </Button>
            ) : (
              <>
                {/* Primary: Create Campaign — opens Ad Management with this audience pre-selected. */}
                <Button
                  size="sm"
                  onClick={() => onCreateCampaign?.(audience)}
                  className="h-9 gap-1.5 bg-[#a4ffe5] text-[#004956] hover:bg-[#8fffd8]"
                >
                  <Zap className="size-3.5" />
                  Create Campaign
                </Button>
                {/* Secondary: Build Lookalike — only if seed size is large enough. */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLookalike}
                  disabled={!lookalikeCheck.ok || pending === "lookalike"}
                  title={lookalikeCheck.reason ?? `Lookalike on ${PLATFORM_API_SPECS[lookalikeTarget].label}`}
                  className="h-9 gap-1.5"
                >
                  {pending === "lookalike" ? <Loader2 className="size-3.5 animate-spin" /> : <Share2 className="size-3.5" />}
                  Build Lookalike
                </Button>
              </>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[10px] italic text-muted-foreground">
            <CheckCircle2 className="size-3 text-emerald-500" />
            <span>
              Auto-synced to your connected platforms. Last refreshed {formatDate(audience.updatedAt)}.
            </span>
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Recommended Action — clearer, action-first layout.
              Headline = what to do. Body = one sentence on platforms + why.
              Footer = the benchmark to watch. */}
          {audience.healthHint && (() => {
            const hint = audience.healthHint;
            const tone = {
              needs_campaign: { bg: "from-amber-50 to-white",   border: "border-amber-200",   icon: ShieldAlert, iconColor: "text-amber-600",   label: "Needs a campaign", labelBg: "bg-amber-100 text-amber-700" },
              watch:          { bg: "from-blue-50 to-white",    border: "border-blue-200",    icon: Activity,    iconColor: "text-blue-600",    label: "Watch this list",  labelBg: "bg-blue-100 text-blue-700" },
              healthy:        { bg: "from-emerald-50 to-white", border: "border-emerald-200", icon: Heart,       iconColor: "text-emerald-600", label: "Healthy",           labelBg: "bg-emerald-100 text-emerald-700" },
              low_priority:   { bg: "from-slate-50 to-white",   border: "border-slate-200",   icon: Info,        iconColor: "text-slate-500",   label: "Low priority",      labelBg: "bg-slate-100 text-slate-600" },
            }[hint.level];
            const HintIcon = tone.icon;
            return (
              <div className={cn("rounded-xl border bg-gradient-to-br p-4", tone.border, tone.bg)}>
                <div className="flex items-center gap-2">
                  <HintIcon className={cn("size-4 shrink-0", tone.iconColor)} />
                  <span className={cn("inline-flex rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide", tone.labelBg)}>
                    {tone.label}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold leading-snug text-foreground">{hint.reason}</p>

                <div className="mt-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#004956] text-[9px] font-bold text-white">1</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold leading-snug text-foreground">Do this</p>
                      <p className="text-[11px] leading-snug text-muted-foreground">{hint.action}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {hint.platforms.map((p) => (
                          <span key={p} className="rounded-full border border-border bg-white px-1.5 py-0 text-[9px] font-medium uppercase text-foreground">
                            {p === "dv360" ? "YouTube" : p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {hint.target && (
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#004956] text-[9px] font-bold text-white">2</span>
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold leading-snug text-foreground">Watch this number</p>
                        <p className="text-[11px] leading-snug text-muted-foreground">{hint.target}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Status-specific notes — only when there's actually a problem */}
          {audience.status === "too_small" && (
            <SallaTip kind="note" title="Why is this list disabled?" compact>
              This audience has fewer than 1,000 matched customers — most ad platforms won't activate it. Either widen the filters, or use it as a seed for a Lookalike audience instead.
            </SallaTip>
          )}
          {audience.status === "stale" && (
            <SallaTip kind="note" compact>
              This list hasn't been refreshed in a while. The next auto-sync will pull the latest customers from your store data.
            </SallaTip>
          )}

          {/* Lookalike education — appears for any RFDM-derived list where a lookalike
              is actually useful. Teaches the merchant what a lookalike does (and doesn't)
              before they click the button. */}
          {lookalikeMakesSense && (
            <div className="rounded-xl border border-[#a4ffe5] bg-[#e6fff9]/60 p-3">
              <div className="flex items-start gap-2">
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-[#004956]" />
                <div>
                  <p className="text-xs font-bold text-[#004956]">How a lookalike works</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-foreground/80">
                    Building a lookalike from <strong>{audience.name}</strong> finds <em>new</em> people on Meta who behave like this group. Important: those new people don't enter your store as <strong>{audience.name}</strong> — they start as <strong>New customers</strong> and progress through RFDM as they buy. Use this to find people likely to <em>grow into</em> your best segment, not to replicate it instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats row — 30d change shown only for RFDM segments (those actually
              fluctuate biweekly as customers move between segments). Pixel events,
              conversions, imports, lookalikes, CSV are one-time or always-up;
              showing a delta there is misleading. */}
          <div className={cn("grid gap-2", audience.source === "rfdm" ? "grid-cols-3" : "grid-cols-2")}>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Total size</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{formatNumber(audience.size)}</p>
            </div>
            {audience.source === "rfdm" && (
              <div className="rounded-xl border border-border bg-white p-3">
                <p className="text-[10px] font-medium uppercase text-muted-foreground">2-week change</p>
                <p
                  className={cn(
                    "mt-0.5 inline-flex items-center gap-0.5 text-lg font-bold tabular-nums",
                    audience.growth30d >= 0 ? "text-emerald-600" : "text-red-500"
                  )}
                >
                  {audience.growth30d >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                  {Math.abs(audience.growth30d).toFixed(1)}%
                </p>
              </div>
            )}
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Connected</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
                {connectedCount}<span className="text-xs font-normal text-muted-foreground">/5</span>
              </p>
            </div>
          </div>

          {/* AI rationale */}
          {audience.aiRationale && (
            <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-500" />
                <div>
                  <p className="text-xs font-semibold text-violet-900">Why this audience</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-violet-700">{audience.aiRationale}</p>
                  {audience.prompt && (
                    <p className="mt-1.5 rounded-md bg-white/60 px-2 py-1 text-[10px] italic text-violet-700">
                      "{audience.prompt}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Platform matches — the killer panel */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Target className="size-4 text-[#004956]" />
              <h3 className="text-sm font-bold text-foreground">Platform Match</h3>
              <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                {(avgMatch * 100).toFixed(0)}% avg
              </Badge>
              <Info className="size-3 text-muted-foreground" />
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Your {formatNumber(audience.size)} customers matched to each ad platform's user base. Low match rates mean the platform has fewer identifiers (email/phone) for these users.
            </p>
            <div className="space-y-2">
              {audience.platformMatches.map((m) => (
                <MatchRow key={m.platform} match={m} totalSize={audience.size} />
              ))}
            </div>
            <SallaTip className="mt-3" compact>
              <strong>60% or higher</strong> is a healthy match rate. Below 30% usually means we don't have enough email or phone numbers for these customers — collect both at checkout to lift it.
            </SallaTip>
          </div>

          {/* Compact footer — created date + ID only. No tags, no use-cases
              (already covered by the recommended-action card), no activity log. */}
          <div className="flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
            <span>Created {formatDate(audience.createdAt)}</span>
            <span className="font-mono">{audience.id}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
