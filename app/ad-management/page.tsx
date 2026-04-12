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
  Copy,
  Plus,
  Search,
  Filter,
  ArrowRight,
  CalendarDays,
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  Layers,
  ChevronDown,
  ExternalLink,
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

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  draft: { label: "Draft", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  active: { label: "Active", dot: "bg-emerald-500", text: "text-emerald-600" },
  paused: { label: "Paused", dot: "bg-amber-500", text: "text-amber-600" },
  completed: { label: "Completed", dot: "bg-blue-500", text: "text-blue-600" },
  stopped: { label: "Stopped", dot: "bg-red-500", text: "text-red-600" },
};

/* ── Mock performance data (from API in production) ── */
function getMockPerformance(draft: DraftMeta) {
  const seed = draft.id.charCodeAt(5) || 42;
  return {
    dailyBudget: 150 + (seed % 8) * 50,
    totalBudget: 0,
    spent: Math.round((150 + (seed % 8) * 50) * (seed % 14)),
    orders: seed % 12,
    costPerOrder: seed % 12 > 0 ? Math.round(((150 + (seed % 8) * 50) * (seed % 14)) / (seed % 12)) : 0,
    revenue: (seed % 12) * (seed % 5) * 38,
    roas: seed % 12 > 0 ? ((seed % 12) * (seed % 5) * 38 / Math.max(1, (150 + (seed % 8) * 50) * (seed % 14))).toFixed(2) : "0.00",
    reach: (seed % 20) * 8200,
    clicks: (seed % 15) * 74,
    avgCpc: seed % 15 > 0 ? ((150 + (seed % 8) * 50) * (seed % 14) / Math.max(1, (seed % 15) * 74)).toFixed(2) : "0",
    ctr: seed % 15 > 0 ? ((seed % 15) * 74 / Math.max(1, (seed % 20) * 8200) * 100).toFixed(2) : "0",
    impressions: (seed % 20) * 8200,
    addToCart: seed % 22,
  };
}

/* ── Component ── */

export default function AdManagementPage() {
  const router = useRouter();
  const { setActive } = useApp();
  const [drafts, setDrafts] = useState<DraftMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailTab, setDetailTab] = useState<"overview" | "ads">("overview");

  useEffect(() => {
    const all = getDraftIndex();
    setDrafts(all);
    if (all.length > 0) setSelectedId(all[0].id);
  }, []);

  const handleResume = (draft: DraftMeta) => {
    setActive({ platform: draft.platform as Platform, draftId: draft.id });
    router.push("/");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this campaign draft? This cannot be undone.")) return;
    removeDraftMeta(id);
    const updated = getDraftIndex();
    setDrafts(updated);
    if (selectedId === id) setSelectedId(updated[0]?.id ?? null);
  };

  /* Filters */
  const filtered = drafts.filter((d) => {
    if (platformFilter !== "all" && d.platform !== platformFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!d.campaignName.toLowerCase().includes(q) && !d.platform.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selected = filtered.find((d) => d.id === selectedId) ?? filtered[0] ?? null;
  const perf = selected ? getMockPerformance(selected) : null;
  const status = selected ? (selected.step >= selected.totalSteps ? "completed" : "draft") : "draft";
  const statusCfg = STATUS_CONFIG[status];

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-background px-4 py-3 sm:px-6 lg:px-14">
        <p className="text-xs text-muted-foreground">
          Marketing <span className="mx-1">›</span> Advertisements <span className="mx-1">›</span>
          <span className="font-medium text-foreground">Ad Management</span>
        </p>
      </div>

      <div className="flex h-[calc(100vh-120px)] flex-col lg:flex-row">
        {/* ═══════════ LEFT SIDEBAR — Campaign List ═══════════ */}
        <div className="flex w-full shrink-0 flex-col border-b border-border bg-background lg:w-[360px] lg:border-b-0 lg:border-r">
          {/* Sidebar header */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            {/* Platform filter */}
            <div className="relative flex-1">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="h-9 w-full appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm font-medium outline-none focus:border-[#a4ffe5]"
              >
                <option value="all">All ({drafts.length})</option>
                {["snapchat", "tiktok", "google", "dv360", "meta"].map((p) => {
                  const count = drafts.filter((d) => d.platform === p).length;
                  if (count === 0) return null;
                  return <option key={p} value={p}>{PLATFORM_NAMES[p]} ({count})</option>;
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-28 rounded-lg border border-border bg-card pl-8 pr-2 text-xs outline-none focus:border-[#a4ffe5] sm:w-36"
              />
            </div>
          </div>

          {/* Campaign list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Filter className="mb-2 size-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No campaigns found</p>
              </div>
            ) : (
              filtered.map((draft) => {
                const isSelected = draft.id === selected?.id;
                const draftStatus = draft.step >= draft.totalSteps ? "completed" : "draft";
                const cfg = STATUS_CONFIG[draftStatus];
                return (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => { setSelectedId(draft.id); setDetailTab("overview"); }}
                    className={cn(
                      "flex w-full flex-col gap-1 border-b border-border px-4 py-3.5 text-left transition-colors",
                      isSelected
                        ? "border-l-2 border-l-[#004956] bg-[#e6fff9]/50"
                        : "hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex size-6 shrink-0 items-center justify-center [&>svg]:size-4">
                          {PLATFORM_LOGOS[draft.platform]}
                        </div>
                        <p className={cn("truncate text-sm font-semibold", isSelected ? "text-[#004956]" : "text-foreground")}>
                          {draft.campaignName || "Untitled Campaign"}
                        </p>
                      </div>
                      <span className={cn("flex shrink-0 items-center gap-1 text-[11px] font-medium", cfg.text)}>
                        <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pl-8 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="size-2.5" />
                        {draft.objective || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-2.5" />
                        {formatRelativeTime(draft.updatedAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Sidebar footer */}
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#004956] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003a44]"
            >
              <Plus className="size-4" />
              New Campaign
            </button>
          </div>
        </div>

        {/* ═══════════ RIGHT PANEL — Campaign Detail ═══════════ */}
        <div className="flex-1 overflow-y-auto bg-[#f8f8f8]">
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <BarChart3 className="mb-3 size-10 text-muted-foreground/20" />
              <p className="text-sm font-semibold text-muted-foreground">Select a campaign</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Click a campaign on the left to view details</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {/* Detail tabs */}
              <div className="mb-6 flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="rounded-xl border border-border bg-card px-4 py-3 text-center transition-colors hover:border-[#a4ffe5]"
                >
                  <Plus className="mx-auto mb-1 size-5 text-muted-foreground" />
                  <p className="text-[11px] font-medium text-muted-foreground">New ad</p>
                </button>
                {(["overview", "ads"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDetailTab(tab)}
                    className={cn(
                      "rounded-xl border px-5 py-3 text-center transition-colors",
                      detailTab === tab
                        ? "border-[#a4ffe5] bg-[#e6fff9]"
                        : "border-border bg-card hover:border-[#a4ffe5]/60"
                    )}
                  >
                    {tab === "overview" ? (
                      <BarChart3 className={cn("mx-auto mb-1 size-5", detailTab === tab ? "text-[#004956]" : "text-muted-foreground")} />
                    ) : (
                      <Layers className={cn("mx-auto mb-1 size-5", detailTab === tab ? "text-[#004956]" : "text-muted-foreground")} />
                    )}
                    <p className={cn("text-[11px] font-medium", detailTab === tab ? "text-[#004956]" : "text-muted-foreground")}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </p>
                  </button>
                ))}
              </div>

              {/* Quick actions bar */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResume(selected)}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-[#a4ffe5]"
                >
                  <ArrowRight className="size-3" />
                  Resume editing
                </button>
                <button
                  type="button"
                  onClick={() => alert("Duplicate — coming soon")}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-[#a4ffe5]"
                >
                  <Copy className="size-3" />
                  Duplicate campaign
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => handleDelete(selected.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-3" />
                  Delete
                </button>
              </div>

              {detailTab === "overview" && perf && (
                <>
                  {/* Budget stats row */}
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Daily Budget", value: `SAR ${perf.dailyBudget}` },
                      { label: "Total Budget", value: perf.totalBudget > 0 ? `SAR ${perf.totalBudget.toLocaleString()}` : "—" },
                      { label: "Spent", value: perf.spent > 0 ? `SAR ${perf.spent.toLocaleString()}` : "SAR 0" },
                      { label: "Status", value: statusCfg.label },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Performance metrics */}
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Orders", value: perf.orders.toString(), icon: ShoppingCart },
                      { label: "Cost / Order", value: perf.costPerOrder > 0 ? `SAR ${perf.costPerOrder.toLocaleString()}` : "—", icon: DollarSign },
                      { label: "Revenue", value: perf.revenue > 0 ? `SAR ${perf.revenue.toLocaleString()}` : "SAR 0", icon: TrendingUp },
                      { label: "ROAS", value: perf.roas, icon: BarChart3 },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                        <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{metric.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Reach", value: perf.reach > 0 ? perf.reach.toLocaleString() : "0" },
                      { label: "Clicks", value: perf.clicks > 0 ? perf.clicks.toLocaleString() : "0" },
                      { label: "Avg. CPC", value: `SAR ${perf.avgCpc}` },
                      { label: "CTR", value: `${perf.ctr}%` },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-border bg-card p-3 sm:p-4">
                        <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                        <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{metric.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Additional metrics */}
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {[
                      { label: "Impressions", value: perf.impressions.toLocaleString() },
                      { label: "Add to Cart", value: perf.addToCart.toString() },
                      { label: "Page Views", value: "0" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl border border-border bg-card p-3 text-center">
                        <p className="text-[10px] text-muted-foreground">{m.label}</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart placeholder */}
                  <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className="rounded-full bg-[#a4ffe5] px-3 py-1 text-[11px] font-semibold text-[#004956]">Comparison</span>
                        <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">Audience</span>
                      </div>
                    </div>
                    <div className="flex h-48 items-center justify-center rounded-xl bg-muted/20">
                      <div className="text-center">
                        <BarChart3 className="mx-auto mb-2 size-8 text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground">Performance chart</p>
                        <p className="text-[11px] text-muted-foreground/60">Connected to platform API in production</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {detailTab === "ads" && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                  <Layers className="mb-3 size-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-muted-foreground">Ad creatives</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">View and manage individual ads within this campaign.</p>
                  <button
                    type="button"
                    onClick={() => handleResume(selected)}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-[#004956] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003a44]"
                  >
                    <ArrowRight className="size-4" />
                    Open Campaign Editor
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
