"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getDraftIndex, removeDraftMeta, formatRelativeTime, getStepLabel, type DraftMeta } from "@/lib/draft-index";
import { Trash2, Clock, ChevronRight, Sparkles, ArrowRight, FileText } from "lucide-react";
import { SnapchatLogo } from "@/components/shared/snapchat-logo";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const [draftsSheetOpen, setDraftsSheetOpen] = useState(false);
  const [draftFilter, setDraftFilter] = useState<Platform | "all">("all");

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

        {/* ── Drafts Bar ── */}
        {drafts.length > 0 && (
          <section className="mb-8">
            <button
              type="button"
              onClick={() => { setDraftFilter("all"); setDraftsSheetOpen(true); }}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-all hover:border-[#a4ffe5] hover:shadow-sm"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e6fff9]">
                <FileText className="size-4 text-[#004956]" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">
                  {drafts.length} draft{drafts.length !== 1 ? "s" : ""} in progress
                </p>
                <p className="text-xs text-muted-foreground">Continue where you left off</p>
              </div>
              {/* Platform avatar preview */}
              <div className="flex -space-x-2">
                {Array.from(new Set(drafts.map((d) => d.platform))).slice(0, 3).map((p) => (
                  <div key={p} className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-muted/60 [&>svg]:size-4">
                    {PLATFORM_LOGOS[p as Platform]}
                  </div>
                ))}
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </section>
        )}

        {/* ── Drafts Sheet ── */}
        <Sheet open={draftsSheetOpen} onOpenChange={setDraftsSheetOpen}>
          <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]">
            {/* Branded header */}
            <div className="bg-[#004956] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <FileText className="size-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-base font-bold text-white">Your Drafts</SheetTitle>
                  <p className="mt-0.5 text-xs text-white/70">
                    {drafts.length} campaign{drafts.length !== 1 ? "s" : ""} in progress
                  </p>
                </div>
              </div>
            </div>

            {/* Platform filter tabs */}
            <div className="flex gap-1.5 overflow-x-auto border-b border-border bg-white px-4 py-3">
              {(["all", ...Array.from(new Set(drafts.map((d) => d.platform)))] as (Platform | "all")[]).map((tab) => {
                const count = tab === "all" ? drafts.length : drafts.filter((d) => d.platform === tab).length;
                const active = draftFilter === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDraftFilter(tab)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
                      active
                        ? "bg-[#a4ffe5] text-[#004956] shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {tab === "all" ? "All" : PLATFORM_NAMES[tab]}
                    <span className={cn("tabular-nums text-[10px]", active ? "text-[#004956]/70" : "text-muted-foreground/60")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Draft list */}
            <div className="flex-1 overflow-y-auto bg-[#f8f8f8] px-4 py-3">
              <div className="flex flex-col gap-2">
                {drafts
                  .filter((d) => draftFilter === "all" || d.platform === draftFilter)
                  .map((draft) => (
                    <div
                      key={draft.id}
                      className="overflow-hidden rounded-2xl border border-white bg-white shadow-sm transition-all hover:border-[#a4ffe5] hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Platform logo */}
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f4] [&>svg]:size-5">
                          {PLATFORM_LOGOS[draft.platform as Platform]}
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs font-bold text-foreground">
                            {draft.campaignName || "Untitled Campaign"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {PLATFORM_NAMES[draft.platform as Platform]} · {formatRelativeTime(draft.updatedAt)}
                          </p>
                          {/* Progress bar */}
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/40">
                              <div
                                className="h-full rounded-full bg-[#004956] transition-all"
                                style={{ width: `${(draft.step / draft.totalSteps) * 100}%` }}
                              />
                            </div>
                            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-[#004956]">
                              {draft.step}/{draft.totalSteps}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDraftsSheetOpen(false);
                              setTimeout(() => onResumeDraft?.(draft.platform as Platform, draft.id), 200);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-[#a4ffe5] px-3 py-1.5 text-[11px] font-semibold text-[#004956] transition-colors hover:bg-[#8af5d5]"
                          >
                            Resume
                            <ArrowRight className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDiscardDraft(draft.id)}
                            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setDraftsSheetOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#004956] py-3 text-sm font-bold text-white transition-colors hover:bg-[#003a44]"
              >
                <Sparkles className="size-4" />
                Start New Campaign
              </button>
            </div>
          </SheetContent>
        </Sheet>

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
