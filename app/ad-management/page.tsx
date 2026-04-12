"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getDraftIndex, removeDraftMeta, formatRelativeTime, getStepLabel, type DraftMeta } from "@/lib/draft-index";
import { useApp } from "@/lib/app-context";
import type { Platform } from "@/components/shared/platform-selection-page";
import { SnapchatLogo } from "@/components/shared/snapchat-logo";
import {
  Trash2,
  Play,
  Pause,
  Copy,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ArrowUpDown,
} from "lucide-react";

/* ── Platform visuals ── */
const PLATFORM_LOGOS: Record<string, React.ReactNode> = {
  snapchat: <SnapchatLogo className="size-5" />,
  tiktok: (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V8.75a8.18 8.18 0 0 0 4.3 1.38V6.84a4.83 4.83 0 0 1-1-.15Z" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48Z" />
    </svg>
  ),
  dv360: (
    <svg viewBox="0 0 24 24" className="size-5 text-red-600" fill="currentColor">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.76 31.76 0 0 0 0 12a31.76 31.76 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.76 31.76 0 0 0 24 12a31.76 31.76 0 0 0-.5-5.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  ),
  meta: (
    <svg viewBox="0 0 24 24" className="size-5 text-[#1877F2]" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  ),
};

const PLATFORM_NAMES: Record<string, string> = {
  snapchat: "Snapchat",
  tiktok: "TikTok",
  google: "Google Ads",
  dv360: "YouTube (DV360)",
  meta: "Meta",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  paused: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  ended: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
};

/* ── Component ── */

export default function AdManagementPage() {
  const router = useRouter();
  const { setActive } = useApp();
  const [drafts, setDrafts] = useState<DraftMeta[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setDrafts(getDraftIndex());
  }, []);

  const handleResume = (draft: DraftMeta) => {
    setActive({ platform: draft.platform as Platform, draftId: draft.id });
    router.push("/");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this campaign draft? This cannot be undone.")) return;
    removeDraftMeta(id);
    setDrafts(getDraftIndex());
  };

  const handleDuplicate = (draft: DraftMeta) => {
    // For now, just show the concept — real implementation would copy localStorage data
    alert(`Duplicate "${draft.campaignName}" — coming soon`);
  };

  /* Filters */
  const filtered = drafts.filter((d) => {
    if (platformFilter !== "all" && d.platform !== platformFilter) return false;
    if (statusFilter !== "all") {
      const status = d.step === 0 ? "draft" : "draft"; // All localStorage items are drafts
      if (status !== statusFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!d.campaignName.toLowerCase().includes(q) && !d.platform.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const platformCounts = drafts.reduce<Record<string, number>>((acc, d) => {
    acc[d.platform] = (acc[d.platform] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-background px-4 py-3 sm:px-6 lg:px-14">
        <p className="text-xs text-muted-foreground">
          Marketing <span className="mx-1">›</span> Advertisements <span className="mx-1">›</span>
          <span className="font-medium text-foreground">Ad Management</span>
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Ad Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View, manage, and track all your ad campaigns across platforms.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-xl bg-[#004956] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003a44]"
          >
            <Plus className="size-4" />
            Create Campaign
          </button>
        </div>

        {/* Filters bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Platform tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setPlatformFilter("all")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
                platformFilter === "all"
                  ? "bg-[#a4ffe5] text-[#004956] shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              All
              <span className={cn("tabular-nums text-[10px]", platformFilter === "all" ? "text-[#004956]/70" : "text-muted-foreground/60")}>
                {drafts.length}
              </span>
            </button>
            {Object.entries(platformCounts).map(([platform, count]) => (
              <button
                key={platform}
                type="button"
                onClick={() => setPlatformFilter(platform)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
                  platformFilter === platform
                    ? "bg-[#a4ffe5] text-[#004956] shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {PLATFORM_NAMES[platform] ?? platform}
                <span className={cn("tabular-nums text-[10px]", platformFilter === platform ? "text-[#004956]/70" : "text-muted-foreground/60")}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-full border border-border bg-muted/40 pl-9 pr-4 text-xs outline-none focus:border-[#a4ffe5] focus:ring-1 focus:ring-[#a4ffe5] sm:w-64"
            />
          </div>
        </div>

        {/* Campaign list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted/60">
              <Filter className="size-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {drafts.length === 0 ? "No campaigns yet" : "No matching campaigns"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {drafts.length === 0
                ? "Create your first campaign to get started."
                : "Try a different search or filter."}
            </p>
            {drafts.length === 0 && (
              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-4 flex items-center gap-2 rounded-xl bg-[#004956] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003a44]"
              >
                <Plus className="size-4" />
                Create Campaign
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {/* Table header */}
            <div className="hidden border-b border-border bg-muted/20 px-4 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
              <div className="col-span-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Campaign</div>
              <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</div>
              <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Progress</div>
              <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Last Updated</div>
              <div className="col-span-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</div>
            </div>

            {/* Rows */}
            {filtered.map((draft) => {
              const status = "draft";
              const style = STATUS_STYLES[status];
              return (
                <div
                  key={draft.id}
                  className="flex flex-col gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                >
                  {/* Campaign name + platform */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f4] [&>svg]:size-5">
                      {PLATFORM_LOGOS[draft.platform]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">
                        {draft.campaignName || "Untitled Campaign"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {PLATFORM_NAMES[draft.platform]} · {draft.objective || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", style.bg, style.text)}>
                      <span className={cn("size-1.5 rounded-full", style.dot)} />
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
                        <div
                          className="h-full rounded-full bg-[#004956] transition-all"
                          style={{ width: `${(draft.step / draft.totalSteps) * 100}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#004956]">
                        {draft.step}/{draft.totalSteps}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{getStepLabel(draft.step)}</p>
                  </div>

                  {/* Last updated */}
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(draft.updatedAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleResume(draft)}
                      className="flex items-center gap-1 rounded-lg bg-[#a4ffe5] px-3 py-1.5 text-[11px] font-semibold text-[#004956] transition-colors hover:bg-[#8af5d5]"
                    >
                      Resume
                      <ArrowRight className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(draft)}
                      className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                      title="Duplicate"
                    >
                      <Copy className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(draft.id)}
                      className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
