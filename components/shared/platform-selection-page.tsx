"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getDraftIndex, removeDraftMeta, formatRelativeTime, getStepLabel, type DraftMeta } from "@/lib/draft-index";
import { Trash2, Clock, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { SnapchatLogo } from "@/components/shared/snapchat-logo";

export type Platform = "snapchat" | "tiktok" | "google" | "dv360" | "meta";

/* ── Platform logos ── */
const PLATFORM_LOGOS: Record<Platform, React.ReactNode> = {
  snapchat: <SnapchatLogo className="size-8" />,
  tiktok: (
    <svg viewBox="0 0 24 24" className="size-8" fill="currentColor">
      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" className="size-8" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48Z" />
    </svg>
  ),
  dv360: (
    <svg viewBox="0 0 24 24" className="size-8 text-red-600" fill="currentColor">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.76 31.76 0 0 0 0 12a31.76 31.76 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.76 31.76 0 0 0 24 12a31.76 31.76 0 0 0-.5-5.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  ),
  meta: (
    <svg viewBox="0 0 24 24" className="size-8 text-[#1877F2]" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  ),
};

const PLATFORM_NAMES: Record<Platform, string> = {
  snapchat: "Snapchat",
  tiktok: "TikTok",
  google: "Google Ads",
  dv360: "YouTube (DV360)",
  meta: "Meta",
};

const PLATFORM_DESCRIPTIONS: Record<Platform, string> = {
  snapchat: "Reach a young, engaged audience",
  tiktok: "Short-form video ads that convert",
  google: "Search and display advertising",
  dv360: "Video ads on YouTube",
  meta: "Ads on Facebook and Instagram",
};

/* ── Quick Templates ── */
const TEMPLATES = [
  {
    id: "ramadan-sale",
    name: "Ramadan Sale",
    desc: "Boost sales during the holy month with conversion-optimized ads",
    platform: "snapchat" as Platform,
    objective: "SALES",
    emoji: "🌙",
  },
  {
    id: "white-friday",
    name: "White Friday Deal",
    desc: "Maximize revenue during the biggest shopping event",
    platform: "snapchat" as Platform,
    objective: "SALES",
    emoji: "🛍️",
  },
  {
    id: "store-launch",
    name: "New Store Launch",
    desc: "Drive traffic to your new store and build awareness",
    platform: "snapchat" as Platform,
    objective: "WEBSITE_VISITS",
    emoji: "🚀",
  },
  {
    id: "product-launch",
    name: "Product Launch",
    desc: "Announce a new product to targeted audiences",
    platform: "snapchat" as Platform,
    objective: "SALES",
    emoji: "📦",
  },
  {
    id: "brand-awareness",
    name: "Brand Awareness",
    desc: "Get your brand in front of as many people as possible",
    platform: "snapchat" as Platform,
    objective: "ENGAGEMENT",
    emoji: "📢",
  },
  {
    id: "retargeting",
    name: "Retargeting Campaign",
    desc: "Re-engage visitors who didn't convert yet",
    platform: "snapchat" as Platform,
    objective: "SALES",
    emoji: "🎯",
  },
];

/* ── Component ── */

interface PlatformSelectionPageProps {
  onSelect: (platform: Platform) => void;
  onResumeDraft?: (platform: Platform, draftId: string) => void;
  onTemplate?: (platform: Platform, templateId: string) => void;
}

export function PlatformSelectionPage({ onSelect, onResumeDraft, onTemplate }: PlatformSelectionPageProps) {
  const [drafts, setDrafts] = useState<DraftMeta[]>([]);

  useEffect(() => {
    setDrafts(getDraftIndex());
  }, []);

  const handleDiscardDraft = (id: string) => {
    removeDraftMeta(id);
    setDrafts(getDraftIndex());
  };

  const platforms: Platform[] = ["snapchat", "tiktok", "google", "dv360", "meta"];

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* ── Page Header ── */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-foreground">Campaign Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, manage, and optimize your ad campaigns across all platforms.
          </p>
        </div>

        {/* ── Saved Drafts ── */}
        {drafts.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground">Continue Where You Left Off</h2>
                <span className="rounded-full bg-[#e6fff9] px-2 py-0.5 text-xs font-medium text-[#004956]">
                  {drafts.length}
                </span>
              </div>
              {drafts.length > 3 && (
                <p className="text-xs text-muted-foreground">Scroll for more →</p>
              )}
            </div>
            {/* Horizontal scrollable slider */}
            <div className="-mx-6 px-6">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ scrollSnapType: "x mandatory" }}>
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-[#a4ffe5] hover:shadow-md"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted/60">
                      {PLATFORM_LOGOS[draft.platform as Platform]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">
                        {draft.campaignName || "Untitled Campaign"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {PLATFORM_NAMES[draft.platform as Platform]} · {formatRelativeTime(draft.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{getStepLabel(draft.step)}</span>
                      <span className="font-medium text-[#004956]">{draft.step}/{draft.totalSteps}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/60">
                      <div
                        className="h-full rounded-full bg-[#004956] transition-all"
                        style={{ width: `${(draft.step / draft.totalSteps) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onResumeDraft?.(draft.platform as Platform, draft.id)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#a4ffe5] px-3 py-2 text-xs font-medium text-[#004956] transition-colors hover:bg-[#8af5d5]"
                    >
                      Resume
                      <ArrowRight className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDiscardDraft(draft.id)}
                      className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Create New Campaign ── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-bold text-foreground">
            {drafts.length > 0 ? "Or Start a New Campaign" : "Create New Campaign"}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {platforms.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onSelect(p)}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-6 text-center transition-all hover:border-[#a4ffe5] hover:bg-[#e6fff9] hover:shadow-md"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
                  {PLATFORM_LOGOS[p]}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{PLATFORM_NAMES[p]}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{PLATFORM_DESCRIPTIONS[p]}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Quick Templates ── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-[#004956]" />
            <h2 className="text-sm font-bold text-foreground">Quick Templates</h2>
            <span className="text-xs text-muted-foreground">Pre-built campaigns to get started fast</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTemplate?.(t.platform, t.id)}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-[#a4ffe5] hover:shadow-md"
              >
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
