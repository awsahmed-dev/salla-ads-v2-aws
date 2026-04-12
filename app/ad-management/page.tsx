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
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Eye,
  BarChart3,
  Layers,
  ChevronDown,
  ExternalLink,
  Pause,
  Play,
  Pencil,
  Check,
  X,
  Zap,
  TrendingUp,
} from "lucide-react";

/* ── Platform visuals ── */
const PLATFORM_LOGOS: Record<string, React.ReactNode> = {
  snapchat: <SnapchatLogo className="size-5" />,
  tiktok: <svg viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V8.75a8.18 8.18 0 0 0 4.3 1.38V6.84a4.83 4.83 0 0 1-1-.15Z" /></svg>,
  google: <svg viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48Z" /></svg>,
  dv360: <svg viewBox="0 0 24 24" className="size-5 text-red-600" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.76 31.76 0 0 0 0 12a31.76 31.76 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.76 31.76 0 0 0 24 12a31.76 31.76 0 0 0-.5-5.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" /></svg>,
  meta: <svg viewBox="0 0 24 24" className="size-5 text-[#1877F2]" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" /></svg>,
};

const PLATFORM_NAMES: Record<string, string> = {
  snapchat: "Snapchat", tiktok: "TikTok", google: "Google Ads", dv360: "YouTube (DV360)", meta: "Meta",
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  draft: { label: "Draft", dot: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted" },
  active: { label: "Active", dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" },
  paused: { label: "Paused", dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" },
  completed: { label: "Completed", dot: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50" },
  stopped: { label: "Stopped", dot: "bg-red-500", text: "text-red-600", bg: "bg-red-50" },
};

/* ── Realistic mock data ── */
const MOCK_CAMPAIGNS = [
  { id: "mc_snap_1", platform: "snapchat", name: "Summer Sale - Snapchat", objective: "Sales", status: "active", dailyBudget: 250, spent: 3115.9, startDate: "2026-03-18", endDate: "2026-04-30", orders: 1, costPerOrder: 3115.9, revenue: 38.62, roas: 0.01, reach: 164318, reachChange: 687.65, clicks: 1110, clicksChange: 484.49, cpc: 2.81, ctr: 0.68, impressions: 164318, cpm: 18.96, addToCart: 22, atcValue: 640.76, checkouts: 5, checkoutValue: 132.93, pageViews: 0 },
  { id: "mc_snap_2", platform: "snapchat", name: "Ramadan Collection", objective: "Sales", status: "completed", dailyBudget: 400, spent: 5600, startDate: "2026-03-01", endDate: "2026-03-31", orders: 8, costPerOrder: 700, revenue: 2840, roas: 0.51, reach: 280000, reachChange: 320.5, clicks: 3200, clicksChange: 210.8, cpc: 1.75, ctr: 1.14, impressions: 280000, cpm: 20, addToCart: 45, atcValue: 1800, checkouts: 12, checkoutValue: 850, pageViews: 1200 },
  { id: "mc_tiktok_1", platform: "tiktok", name: "TikTok - Add to Cart", objective: "Sales", status: "stopped", dailyBudget: 300, spent: 4200, startDate: "2026-03-07", endDate: "2026-03-31", orders: 3, costPerOrder: 1400, revenue: 420, roas: 0.10, reach: 95000, reachChange: 150.2, clicks: 2800, clicksChange: 180.3, cpc: 1.50, ctr: 2.95, impressions: 95000, cpm: 44.21, addToCart: 18, atcValue: 540, checkouts: 4, checkoutValue: 220, pageViews: 800 },
  { id: "mc_tiktok_2", platform: "tiktok", name: "TikTok Reach Campaign", objective: "Reach", status: "active", dailyBudget: 150, spent: 1050, startDate: "2026-04-05", endDate: "", orders: 0, costPerOrder: 0, revenue: 0, roas: 0, reach: 220000, reachChange: 0, clicks: 890, clicksChange: 0, cpc: 1.18, ctr: 0.40, impressions: 220000, cpm: 4.77, addToCart: 0, atcValue: 0, checkouts: 0, checkoutValue: 0, pageViews: 320 },
  { id: "mc_google_1", platform: "google", name: "PMax - Electronics", objective: "Performance Max", status: "active", dailyBudget: 500, spent: 8500, startDate: "2026-03-15", endDate: "2026-04-15", orders: 22, costPerOrder: 386, revenue: 12400, roas: 1.46, reach: 450000, reachChange: 85.3, clicks: 8900, clicksChange: 120.5, cpc: 0.96, ctr: 1.98, impressions: 450000, cpm: 18.89, addToCart: 120, atcValue: 9600, checkouts: 35, checkoutValue: 5200, pageViews: 4500 },
  { id: "mc_meta_1", platform: "meta", name: "Meta - Brand Awareness", objective: "Awareness", status: "paused", dailyBudget: 200, spent: 2800, startDate: "2026-03-20", endDate: "2026-04-20", orders: 0, costPerOrder: 0, revenue: 0, roas: 0, reach: 380000, reachChange: 420.1, clicks: 5200, clicksChange: 310.5, cpc: 0.54, ctr: 1.37, impressions: 380000, cpm: 7.37, addToCart: 8, atcValue: 320, checkouts: 2, checkoutValue: 80, pageViews: 2100 },
];

type MockCampaign = typeof MOCK_CAMPAIGNS[number];

function ChangeIndicator({ value }: { value: number }) {
  if (!value) return null;
  const isUp = value > 0;
  return (
    <span className={cn("ml-1 inline-flex items-center text-[10px] font-semibold tabular-nums", isUp ? "text-emerald-600" : "text-red-500")}>
      {isUp ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
      {Math.abs(value).toFixed(0)}%
    </span>
  );
}

function MetricCard({ label, value, change, small }: { label: string; value: string; change?: number; small?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card", small ? "p-2.5 text-center" : "p-3 sm:p-4")}>
      <p className={cn("text-muted-foreground", small ? "text-[9px]" : "text-[11px]")}>{label}</p>
      <div className="mt-0.5 flex items-baseline gap-1">
        <p className={cn("font-bold tabular-nums text-foreground", small ? "text-xs" : "text-lg")}>{value}</p>
        {change ? <ChangeIndicator value={change} /> : null}
      </div>
    </div>
  );
}

/* ── Component ── */

export default function AdManagementPage() {
  const router = useRouter();
  const { setActive } = useApp();
  const [campaigns, setCampaigns] = useState<MockCampaign[]>(MOCK_CAMPAIGNS);
  const [drafts, setDrafts] = useState<DraftMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string>(MOCK_CAMPAIGNS[0].id);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailTab, setDetailTab] = useState<"overview" | "ads">("overview");
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(0);

  useEffect(() => {
    setDrafts(getDraftIndex());
  }, []);

  /* Merge mock + drafts */
  const allCampaigns: MockCampaign[] = [
    ...campaigns,
    ...drafts.map((d): MockCampaign => ({
      id: d.id, platform: d.platform, name: d.campaignName || "Untitled Draft",
      objective: d.objective || "—", status: "draft",
      dailyBudget: 150, spent: 0, startDate: d.createdAt.split("T")[0], endDate: "",
      orders: 0, costPerOrder: 0, revenue: 0, roas: 0, reach: 0, reachChange: 0,
      clicks: 0, clicksChange: 0, cpc: 0, ctr: 0, impressions: 0, cpm: 0,
      addToCart: 0, atcValue: 0, checkouts: 0, checkoutValue: 0, pageViews: 0,
    })),
  ];

  const filtered = allCampaigns.filter((c) => {
    if (platformFilter !== "all" && c.platform !== platformFilter) return false;
    if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;
  const statusCfg = STATUS_CONFIG[selected?.status ?? "draft"];

  const handlePauseResume = () => {
    if (!selected) return;
    setCampaigns((prev) => prev.map((c) =>
      c.id === selected.id ? { ...c, status: c.status === "active" ? "paused" : c.status === "paused" ? "active" : c.status } : c
    ));
  };

  const handleBudgetSave = () => {
    if (!selected || tempBudget < 150) return;
    setCampaigns((prev) => prev.map((c) => c.id === selected.id ? { ...c, dailyBudget: tempBudget } : c));
    setEditingBudget(false);
  };

  const handleQuickBoost = () => {
    if (!selected) return;
    const newBudget = Math.round(selected.dailyBudget * 1.2);
    setCampaigns((prev) => prev.map((c) => c.id === selected.id ? { ...c, dailyBudget: newBudget } : c));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this campaign? This cannot be undone.")) return;
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    removeDraftMeta(id);
    setDrafts(getDraftIndex());
    if (selectedId === id) {
      const remaining = allCampaigns.filter((c) => c.id !== id);
      setSelectedId(remaining[0]?.id ?? "");
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "Ongoing";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
  };

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
        {/* ═══ LEFT SIDEBAR ═══ */}
        <div className="flex w-full shrink-0 flex-col border-b border-border bg-background lg:w-[380px] lg:border-b-0 lg:border-r">
          {/* Filters */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-3">
            <div className="relative flex-1">
              <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}
                className="h-9 w-full appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm font-medium outline-none focus:border-[#a4ffe5]">
                <option value="all">All ({allCampaigns.length})</option>
                {["snapchat", "tiktok", "google", "dv360", "meta"].map((p) => {
                  const count = allCampaigns.filter((c) => c.platform === p).length;
                  return count > 0 ? <option key={p} value={p}>{PLATFORM_NAMES[p]} ({count})</option> : null;
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-28 rounded-lg border border-border bg-card pl-8 pr-2 text-xs outline-none focus:border-[#a4ffe5] sm:w-36" />
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
              filtered.map((c) => {
                const isSelected = c.id === selected?.id;
                const cfg = STATUS_CONFIG[c.status];
                return (
                  <button key={c.id} type="button" onClick={() => { setSelectedId(c.id); setDetailTab("overview"); setEditingBudget(false); }}
                    className={cn(
                      "flex w-full flex-col gap-1.5 border-b border-border px-4 py-3.5 text-left transition-colors",
                      isSelected ? "border-l-[3px] border-l-[#004956] bg-[#e6fff9]/40" : "hover:bg-muted/20"
                    )}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-6 shrink-0 items-center justify-center [&>svg]:size-4">{PLATFORM_LOGOS[c.platform]}</div>
                        <p className={cn("truncate text-sm font-semibold", isSelected ? "text-[#004956]" : "text-foreground")}>{c.name}</p>
                      </div>
                      <span className={cn("flex shrink-0 items-center gap-1.5 text-[11px] font-medium", cfg.text)}>
                        <span className={cn("size-1.5 rounded-full", cfg.dot)} />{cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pl-[34px] text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Layers className="size-2.5" />{c.objective}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="size-2.5" />{formatDate(c.startDate)} - {formatDate(c.endDate)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* New Campaign */}
          <div className="border-t border-border p-3">
            <button type="button" onClick={() => router.push("/")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#004956] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003a44]">
              <Plus className="size-4" />New Campaign
            </button>
          </div>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="flex-1 overflow-y-auto bg-[#f8f8f8]">
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <BarChart3 className="mb-3 size-10 text-muted-foreground/20" />
              <p className="text-sm font-semibold text-muted-foreground">Select a campaign</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {/* Tabs */}
              <div className="mb-5 flex items-center gap-4">
                <button type="button" onClick={() => router.push("/")} className="rounded-xl border border-border bg-card px-4 py-2.5 text-center transition-colors hover:border-[#a4ffe5]">
                  <Plus className="mx-auto mb-0.5 size-4 text-muted-foreground" />
                  <p className="text-[10px] font-medium text-muted-foreground">New ad</p>
                </button>
                {(["overview", "ads"] as const).map((tab) => (
                  <button key={tab} type="button" onClick={() => setDetailTab(tab)}
                    className={cn("rounded-xl border px-5 py-2.5 text-center transition-colors",
                      detailTab === tab ? "border-[#a4ffe5] bg-[#e6fff9]" : "border-border bg-card hover:border-[#a4ffe5]/60")}>
                    {tab === "overview" ? <BarChart3 className={cn("mx-auto mb-0.5 size-4", detailTab === tab ? "text-[#004956]" : "text-muted-foreground")} />
                      : <Layers className={cn("mx-auto mb-0.5 size-4", detailTab === tab ? "text-[#004956]" : "text-muted-foreground")} />}
                    <p className={cn("text-[10px] font-medium", detailTab === tab ? "text-[#004956]" : "text-muted-foreground")}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</p>
                  </button>
                ))}
              </div>

              {/* Quick actions */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {(selected.status === "active" || selected.status === "paused") && (
                  <button type="button" onClick={handlePauseResume}
                    className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                      selected.status === "active" ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}>
                    {selected.status === "active" ? <><Pause className="size-3" />Pause</> : <><Play className="size-3" />Resume</>}
                  </button>
                )}
                {selected.status === "draft" && (
                  <button type="button" onClick={() => { setActive({ platform: selected.platform as Platform, draftId: selected.id }); router.push("/"); }}
                    className="flex items-center gap-1.5 rounded-lg bg-[#a4ffe5] px-3 py-2 text-xs font-semibold text-[#004956] transition-colors hover:bg-[#8af5d5]">
                    <Pencil className="size-3" />Continue editing
                  </button>
                )}
                <button type="button" onClick={handleQuickBoost}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-[#a4ffe5]">
                  <Zap className="size-3 text-[#004956]" />Boost +20%
                </button>
                <button type="button" onClick={() => alert("Duplicate — coming soon")}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-[#a4ffe5]">
                  <Copy className="size-3" />Duplicate
                </button>
                <button type="button" onClick={() => { navigator.clipboard.writeText(selected.id); alert(`Copied: ${selected.id}`); }}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-[#a4ffe5] hover:text-foreground">
                  Copy ID
                </button>
                <button type="button" onClick={() => alert("Preview — coming soon")}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-[#a4ffe5] hover:text-foreground">
                  <Eye className="size-3" />Preview ad
                </button>
                <div className="flex-1" />
                <button type="button" onClick={() => handleDelete(selected.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="size-3" />
                </button>
              </div>

              {detailTab === "overview" && (
                <>
                  {/* Budget stats */}
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                      <p className="text-[11px] text-muted-foreground">Daily Budget</p>
                      {editingBudget ? (
                        <div className="mt-1 flex items-center gap-1">
                          <input type="number" value={tempBudget} onChange={(e) => setTempBudget(Number(e.target.value))} min={150}
                            className="h-7 w-20 rounded border border-[#a4ffe5] bg-white px-2 text-sm font-bold tabular-nums outline-none" autoFocus />
                          <button type="button" onClick={handleBudgetSave} className="rounded p-1 text-emerald-600 hover:bg-emerald-50"><Check className="size-3.5" /></button>
                          <button type="button" onClick={() => setEditingBudget(false)} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="size-3.5" /></button>
                        </div>
                      ) : (
                        <div className="mt-0.5 flex items-center gap-1">
                          <p className="text-sm font-bold tabular-nums text-foreground">SAR {selected.dailyBudget}</p>
                          <button type="button" onClick={() => { setTempBudget(selected.dailyBudget); setEditingBudget(true); }}
                            className="rounded p-0.5 text-muted-foreground hover:text-[#004956]"><Pencil className="size-3" /></button>
                        </div>
                      )}
                    </div>
                    <MetricCard label="Spent" value={selected.spent > 0 ? `SAR ${selected.spent.toLocaleString()}` : "SAR 0"} />
                    <MetricCard label="ROAS" value={selected.roas.toFixed(2)} />
                    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                      <p className="text-[11px] text-muted-foreground">Ends on</p>
                      <p className="mt-0.5 text-sm font-bold text-foreground">{selected.endDate ? formatDate(selected.endDate) : "Ongoing"}</p>
                    </div>
                  </div>

                  {/* Period label */}
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="size-3 text-emerald-500" />
                    <p className="text-[11px] text-muted-foreground">
                      vs previous period · {formatDate(selected.startDate)} to {selected.endDate ? formatDate(selected.endDate) : "now"}
                    </p>
                  </div>

                  {/* Performance grid */}
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MetricCard label="Orders" value={selected.orders.toString()} change={selected.orders > 0 ? 600 : 0} />
                    <MetricCard label="Cost / Order" value={selected.costPerOrder > 0 ? `SAR ${selected.costPerOrder.toLocaleString()}` : "—"} />
                    <MetricCard label="Revenue" value={`SAR ${selected.revenue.toLocaleString()}`} />
                    <MetricCard label="ROAS" value={selected.roas.toFixed(2)} />
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MetricCard label="Reach" value={selected.reach.toLocaleString()} change={selected.reachChange} />
                    <MetricCard label="Clicks" value={selected.clicks.toLocaleString()} change={selected.clicksChange} />
                    <MetricCard label="Avg. CPC" value={`SAR ${selected.cpc.toFixed(2)}`} />
                    <MetricCard label="CTR" value={`${selected.ctr.toFixed(2)}%`} />
                  </div>

                  {/* Additional metrics (V1 parity) */}
                  <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-7">
                    <MetricCard label="Impressions" value={selected.impressions.toLocaleString()} small />
                    <MetricCard label="CPM" value={`SAR ${selected.cpm.toFixed(2)}`} small />
                    <MetricCard label="Add to Cart" value={selected.addToCart.toString()} small />
                    <MetricCard label="ATC Value" value={`SAR ${selected.atcValue.toLocaleString()}`} small />
                    <MetricCard label="Checkouts" value={selected.checkouts.toString()} small />
                    <MetricCard label="Checkout Value" value={`SAR ${selected.checkoutValue.toLocaleString()}`} small />
                    <MetricCard label="Page Views" value={selected.pageViews.toString()} small />
                  </div>

                  {/* Chart placeholder */}
                  <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className="rounded-full bg-[#a4ffe5] px-3 py-1 text-[11px] font-semibold text-[#004956]">Comparison</span>
                        <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">Audience</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="rounded-lg border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground">Impressions ▾</span>
                        <span className="rounded-lg border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground">Spent ▾</span>
                      </div>
                    </div>
                    <div className="flex h-52 items-center justify-center rounded-xl bg-gradient-to-br from-[#e6fff9]/50 to-muted/20">
                      <div className="text-center">
                        <BarChart3 className="mx-auto mb-2 size-8 text-[#004956]/20" />
                        <p className="text-sm font-medium text-[#004956]/40">Performance chart</p>
                        <p className="text-[11px] text-muted-foreground/50">Connected to platform APIs in production</p>
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
