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
  AlertTriangle,
  PauseCircle,
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
  // Show the lookalike education whenever Build Lookalike is a real action
  // for this audience (i.e. it's not a blocklist and meets the platform seed
  // minimum). Universal — no per-segment branching.
  const lookalikeMakesSense = audience.source !== "blocklist" && lookalikeCheck.ok;
  // Cohort sources (rfdm, salla_segment, website_event, ad_engagement) genuinely
  // shift in/out — show 2-week change with up/down. Cumulative sources only grow,
  // so we relabel and hide the negative case.
  const isCohort =
    audience.source === "rfdm" ||
    audience.source === "salla_segment" ||
    audience.source === "website_event" ||
    audience.source === "ad_engagement";

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
    rfdm:           "RFDM Segment",
    salla_segment:  "Store Segment",
    website_event:  "Website Event",
    ad_engagement:  audience.originPlatform ? `Ad Engagement · ${audience.originPlatform}` : "Ad Engagement",
    lookalike:      "Lookalike",
    custom_list:    "Custom List",
    ai_chat:        "AI · Chat-generated",
    blocklist:      "Blocklist / Exclusion",
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
                  <Badge variant="outline" className="rounded-full border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                    <AlertTriangle className="mr-1 size-2.5" />
                    Won't activate
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
                {/* Primary: Create Campaign — disabled when the audience is below
                    the universal 1,000-customer minimum. The banner below the
                    action row explains exactly why. */}
                <Button
                  size="sm"
                  onClick={() => onCreateCampaign?.(audience)}
                  disabled={audience.status === "too_small"}
                  title={audience.status === "too_small" ? "Below 1,000 customers — can't activate as audience. Build a Lookalike instead." : undefined}
                  className="h-9 gap-1.5 bg-[#a4ffe5] text-[#004956] hover:bg-[#8fffd8] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
                  <Zap className="size-3.5" />
                  Create Campaign
                </Button>
                {/* Secondary: Build Lookalike — even small lists can seed a
                    lookalike (Meta accepts 100+), so this stays enabled when
                    Create Campaign is not. */}
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
          {audience.status === "too_small" ? (
            <p className="mt-2 flex items-center gap-1.5 text-[10px] italic text-red-600">
              <PauseCircle className="size-3" />
              <span>
                Holding locally — won't push to ad platforms until this passes 1,000 customers.
              </span>
            </p>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-[10px] italic text-muted-foreground">
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>
                Auto-synced to your connected platforms. Last refreshed {formatDate(audience.updatedAt)}.
              </span>
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Universal 4-level recommendation. Same structure for every audience —
              merchant gets used to it after seeing it twice. No platform pills,
              no per-segment text. */}
          {audience.healthHint && (() => {
            const hint = audience.healthHint;
            const tone = {
              perfect: { bg: "from-emerald-50 to-white", border: "border-emerald-200", icon: CheckCircle2, iconColor: "text-emerald-600", label: "Performing well", labelBg: "bg-emerald-100 text-emerald-700" },
              good:    { bg: "from-teal-50 to-white",    border: "border-teal-200",    icon: Heart,        iconColor: "text-teal-600",    label: "Ready to use",   labelBg: "bg-teal-100 text-teal-700" },
              warning: { bg: "from-amber-50 to-white",   border: "border-amber-200",   icon: Activity,     iconColor: "text-amber-600",   label: "Needs attention", labelBg: "bg-amber-100 text-amber-700" },
              danger:  { bg: "from-red-50 to-white",     border: "border-red-200",     icon: ShieldAlert,  iconColor: "text-red-600",     label: "Won't activate", labelBg: "bg-red-100 text-red-700" },
            }[hint.level];
            const HintIcon = tone.icon;
            return (
              <div className={cn("rounded-xl border bg-gradient-to-br p-3.5", tone.border, tone.bg)}>
                <div className="flex items-center gap-2">
                  <HintIcon className={cn("size-3.5 shrink-0", tone.iconColor)} />
                  <span className={cn("inline-flex rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide", tone.labelBg)}>
                    {tone.label}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] font-bold leading-snug text-foreground">{hint.reason}</p>
                <p className="mt-1 text-[11px] leading-snug text-foreground/80">{hint.action}</p>
                {hint.target && (
                  <p className="mt-2 text-[10px] italic text-muted-foreground">→ {hint.target}</p>
                )}
              </div>
            );
          })()}

          {/* Prominent "won't activate" banner — the single most important
              piece of information when an audience is too small. Replaces the
              small grey tip that was easy to miss. */}
          {audience.status === "too_small" && (
            <div className="rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-white p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-red-900">This list won't push to ad platforms yet</h3>
                  <p className="mt-1 text-[11px] leading-snug text-red-800">
                    <strong>{audience.size.toLocaleString()}</strong> customers — Meta, Google, Snap, TikTok and YouTube each
                    require at least <strong>1,000</strong> matched customers before they'll activate an audience.
                  </p>
                  {/* Progress to threshold */}
                  <div className="mt-3">
                    <div className="mb-1 flex items-baseline justify-between text-[10px] font-semibold text-red-700">
                      <span>{audience.size.toLocaleString()} now</span>
                      <span>{(1000 - audience.size).toLocaleString()} more needed</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-red-100">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all"
                        style={{ width: `${Math.min(100, (audience.size / 1000) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* What to do now */}
                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-red-900">What you can do now</p>
                    <ul className="mt-1 space-y-1 text-[11px] leading-snug text-red-900">
                      <li className="flex gap-1.5">
                        <span className="mt-0.5 inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[9px] font-bold">1</span>
                        <span><strong>Build a Lookalike</strong> — Meta accepts seeds as small as 100. Use the button above to find similar new customers on Meta.</span>
                      </li>
                      <li className="flex gap-1.5">
                        <span className="mt-0.5 inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[9px] font-bold">2</span>
                        <span><strong>Widen the filters</strong> — relax the criteria to grow the list past 1,000.</span>
                      </li>
                      <li className="flex gap-1.5">
                        <span className="mt-0.5 inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[9px] font-bold">3</span>
                        <span><strong>Wait</strong> — auto-sync starts the moment it grows past the threshold.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="flex items-start gap-2 rounded-xl border border-[#a4ffe5] bg-[#e6fff9]/60 p-2.5">
              <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
              <p className="text-[11px] leading-snug text-foreground/80">
                <strong>About lookalikes:</strong> finds similar new buyers, doesn't replicate this list. New people enter as "New" and grow through RFDM.
              </p>
            </div>
          )}

          {/* Stats row — cohort sources (rfdm/salla_segment/website_event/ad_engagement)
              genuinely shift biweekly, so we show "2-week change" with up/down arrows.
              Cumulative sources (lookalike/custom_list/ai_chat) only grow — we relabel
              to "Growth" and only show the positive movement. */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Total size</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{formatNumber(audience.size)}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[10px] font-medium uppercase text-muted-foreground">{isCohort ? "2-week change" : "Growth"}</p>
              {isCohort ? (
                <p className={cn("mt-0.5 inline-flex items-center gap-0.5 text-lg font-bold tabular-nums", audience.growth30d >= 0 ? "text-emerald-600" : "text-red-500")}>
                  {audience.growth30d >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                  {Math.abs(audience.growth30d).toFixed(1)}%
                </p>
              ) : (
                <p className="mt-0.5 inline-flex items-center gap-0.5 text-lg font-bold tabular-nums text-emerald-600">
                  {audience.growth30d > 0 ? <><ArrowUpRight className="size-4" />{audience.growth30d.toFixed(1)}%</> : "—"}
                </p>
              )}
            </div>
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
                  <p className="text-[11px] leading-snug text-violet-800">{audience.aiRationale}</p>
                  {audience.prompt && (
                    <p className="mt-1.5 rounded-md bg-white/60 px-2 py-1 text-[10px] italic text-violet-700">
                      "{audience.prompt}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Platform matches — collapsed to a "paused" state when too small,
              so we don't show misleading sync progress bars and "Synced 2h ago"
              pills for an audience that isn't actually pushing anywhere. */}
          {audience.status === "too_small" ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <PauseCircle className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-bold text-muted-foreground">Platform Match · paused</h3>
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                We won't compute or push platform matches for this list until it has at least 1,000 customers.
                The 5-platform breakdown reappears here automatically once it grows past the threshold.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Target className="size-4 text-[#004956]" />
                <h3 className="text-sm font-bold text-foreground">Platform Match</h3>
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                  {(avgMatch * 100).toFixed(0)}% avg
                </Badge>
                <Info className="size-3 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                {audience.platformMatches.map((m) => (
                  <MatchRow key={m.platform} match={m} totalSize={audience.size} />
                ))}
              </div>
              <SallaTip className="mt-3" compact>
                <strong>60%+</strong> is healthy. Low rates = collect more emails/phones at checkout.
              </SallaTip>
            </div>
          )}

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
