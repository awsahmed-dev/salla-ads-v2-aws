"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getDraftIndex, removeDraftMeta, formatRelativeTime, type DraftMeta } from "@/lib/draft-index";
import { useApp } from "@/lib/app-context";
import type { Platform } from "@/components/shared/platform-selection-page";
import { SnapchatLogo } from "@/components/shared/snapchat-logo";
import {
  Trash2, Copy, Plus, Search, ArrowUpRight, ArrowDownRight,
  CalendarDays, Eye, BarChart3, Layers, ChevronDown,
  Pause, Play, Pencil, Check, X, Zap, TrendingUp,
  AlertTriangle, ArrowUpDown, Sparkles, ImageIcon,
} from "lucide-react";

/* ── Platform visuals ── */
const PL: Record<string, React.ReactNode> = {
  snapchat: <SnapchatLogo className="size-5" />,
  tiktok: <svg viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V8.75a8.18 8.18 0 0 0 4.3 1.38V6.84a4.83 4.83 0 0 1-1-.15Z" /></svg>,
  google: <svg viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48Z" /></svg>,
  dv360: <svg viewBox="0 0 24 24" className="size-5 text-red-600" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.76 31.76 0 0 0 0 12a31.76 31.76 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.76 31.76 0 0 0 24 12a31.76 31.76 0 0 0-.5-5.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" /></svg>,
  meta: <svg viewBox="0 0 24 24" className="size-5 text-[#1877F2]" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" /></svg>,
};
const PN: Record<string, string> = { snapchat: "Snapchat", tiktok: "TikTok", google: "Google Ads", dv360: "YouTube (DV360)", meta: "Meta" };

const SC: Record<string, { label: string; dot: string; text: string }> = {
  draft: { label: "Draft", dot: "bg-gray-400", text: "text-gray-500" },
  active: { label: "Active", dot: "bg-emerald-500", text: "text-emerald-600" },
  paused: { label: "Paused", dot: "bg-amber-500", text: "text-amber-600" },
  completed: { label: "Completed", dot: "bg-blue-500", text: "text-blue-600" },
  stopped: { label: "Stopped", dot: "bg-red-500", text: "text-red-600" },
  rejected: { label: "Rejected", dot: "bg-red-600", text: "text-red-600" },
};

/* ── Mock campaigns matching Figma ── */
const MOCK_CAMPAIGNS = [
  { id: "mc_1", platform: "snapchat", name: "Ramadan Campaign", objective: "Website Visits", status: "completed", dailyBudget: 520, totalSpending: 23005, startDate: "2026-04-01", endDate: "2026-04-14", purchases: 198, purchaseChange: 12, costPerPurchase: 15, purchaseValue: 830000, roas: 30, reach: 3000567, reachChange: 34, clicks: 24234, clicksChange: 34, cpc: 3.2, ctr: 34, impressions: 130000, cpm: 0.20, addToCart: 43, atcValue: 2343667, checkouts: 43, checkoutValue: 2873.45, pageViews: 1298, pageViewsChange: 34, thumbs: ["/placeholder-1.jpg", "/placeholder-2.jpg", "/placeholder-3.jpg", "/placeholder-4.jpg", "/placeholder-5.jpg", "/placeholder-6.jpg"], rejected: false, rejectedMsg: "" },
  { id: "mc_2", platform: "tiktok", name: "Eid al-Fitr", objective: "Website Visits", status: "active", dailyBudget: 300, totalSpending: 4200, startDate: "2026-04-01", endDate: "2026-04-14", purchases: 12, purchaseChange: 25, costPerPurchase: 350, purchaseValue: 18000, roas: 4.3, reach: 95000, reachChange: 150, clicks: 2800, clicksChange: 180, cpc: 1.5, ctr: 2.95, impressions: 95000, cpm: 44.21, addToCart: 18, atcValue: 540, checkouts: 4, checkoutValue: 220, pageViews: 800, pageViewsChange: 0, thumbs: [], rejected: false, rejectedMsg: "" },
  { id: "mc_3", platform: "dv360", name: "Test Ad", objective: "Sales", status: "rejected", dailyBudget: 150, totalSpending: 0, startDate: "2026-04-01", endDate: "2026-04-14", purchases: 0, purchaseChange: 0, costPerPurchase: 0, purchaseValue: 0, roas: 0, reach: 0, reachChange: 0, clicks: 0, clicksChange: 0, cpc: 0, ctr: 0, impressions: 0, cpm: 0, addToCart: 0, atcValue: 0, checkouts: 0, checkoutValue: 0, pageViews: 0, pageViewsChange: 0, thumbs: [], rejected: true, rejectedMsg: "Your ad has been rejected. Click here for more details." },
  { id: "mc_4", platform: "snapchat", name: "Perfume Ad - Blue 1", objective: "Website Visits", status: "completed", dailyBudget: 400, totalSpending: 5600, startDate: "2026-04-01", endDate: "2026-04-14", purchases: 8, purchaseChange: 0, costPerPurchase: 700, purchaseValue: 2840, roas: 0.51, reach: 280000, reachChange: 320, clicks: 3200, clicksChange: 210, cpc: 1.75, ctr: 1.14, impressions: 280000, cpm: 20, addToCart: 45, atcValue: 1800, checkouts: 12, checkoutValue: 850, pageViews: 1200, pageViewsChange: 15, thumbs: [], rejected: false, rejectedMsg: "" },
  { id: "mc_5", platform: "snapchat", name: "Website Visits Ad 1", objective: "Website Visits", status: "completed", dailyBudget: 200, totalSpending: 2800, startDate: "2026-04-01", endDate: "2026-04-14", purchases: 0, purchaseChange: 0, costPerPurchase: 0, purchaseValue: 0, roas: 0, reach: 380000, reachChange: 420, clicks: 5200, clicksChange: 310, cpc: 0.54, ctr: 1.37, impressions: 380000, cpm: 7.37, addToCart: 8, atcValue: 320, checkouts: 2, checkoutValue: 80, pageViews: 2100, pageViewsChange: 0, thumbs: [], rejected: false, rejectedMsg: "" },
  { id: "mc_6", platform: "tiktok", name: "Year-End Campaign 2024", objective: "Website Visits", status: "completed", dailyBudget: 500, totalSpending: 8500, startDate: "2026-04-01", endDate: "2026-04-14", purchases: 22, purchaseChange: 45, costPerPurchase: 386, purchaseValue: 12400, roas: 1.46, reach: 450000, reachChange: 85, clicks: 8900, clicksChange: 120, cpc: 0.96, ctr: 1.98, impressions: 450000, cpm: 18.89, addToCart: 120, atcValue: 9600, checkouts: 35, checkoutValue: 5200, pageViews: 4500, pageViewsChange: 22, thumbs: [], rejected: false, rejectedMsg: "" },
];

type Campaign = typeof MOCK_CAMPAIGNS[number];

function Pct({ v }: { v: number }) {
  if (!v) return null;
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums", v > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
      {v > 0 ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}{Math.abs(v)}%
    </span>
  );
}

/* ── Component ── */
export default function AdManagementPage() {
  const router = useRouter();
  const { setActive } = useApp();
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [drafts, setDrafts] = useState<DraftMeta[]>([]);
  const [selectedId, setSelectedId] = useState(MOCK_CAMPAIGNS[0].id);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editBudget, setEditBudget] = useState(false);
  const [editEndDate, setEditEndDate] = useState(false);
  const [tmpBudget, setTmpBudget] = useState(0);
  const [tmpEndDate, setTmpEndDate] = useState("");

  useEffect(() => { setDrafts(getDraftIndex()); }, []);

  const all: Campaign[] = [
    ...campaigns,
    ...drafts.map((d): Campaign => ({
      id: d.id, platform: d.platform, name: d.campaignName || "Untitled Draft", objective: d.objective || "—", status: "draft",
      dailyBudget: 150, totalSpending: 0, startDate: d.createdAt.split("T")[0], endDate: "",
      purchases: 0, purchaseChange: 0, costPerPurchase: 0, purchaseValue: 0, roas: 0, reach: 0, reachChange: 0,
      clicks: 0, clicksChange: 0, cpc: 0, ctr: 0, impressions: 0, cpm: 0,
      addToCart: 0, atcValue: 0, checkouts: 0, checkoutValue: 0, pageViews: 0, pageViewsChange: 0,
      thumbs: [], rejected: false, rejectedMsg: "",
    })),
  ];

  const filtered = all.filter((c) => {
    if (filter !== "all" && c.platform !== filter) return false;
    if (search.trim() && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sel = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;
  const sc = SC[sel?.status ?? "draft"];

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Ongoing";
  const fmtFull = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Ongoing";

  const handlePause = () => sel && setCampaigns((p) => p.map((c) => c.id === sel.id ? { ...c, status: c.status === "active" ? "paused" : "active" } : c));
  const handleDelete = (id: string) => { if (!confirm("Delete this campaign?")) return; setCampaigns((p) => p.filter((c) => c.id !== id)); removeDraftMeta(id); setDrafts(getDraftIndex()); };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-[calc(100vh-60px)] flex-col lg:flex-row">
        {/* ═══ SIDEBAR ═══ */}
        <div className="flex w-full shrink-0 flex-col border-b border-border bg-background lg:w-[340px] lg:border-b-0 lg:border-r">
          {/* Filter bar — matches Figma: All(12) | 🔍 | Sort */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-3">
            <div className="relative flex-1">
              <select value={filter} onChange={(e) => setFilter(e.target.value)}
                className="h-9 w-full appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm font-medium outline-none focus:border-[#a4ffe5]">
                <option value="all">All ({all.length})</option>
                {["snapchat","tiktok","google","dv360","meta"].map((p) => { const n = all.filter((c) => c.platform === p).length; return n > 0 ? <option key={p} value={p}>{PN[p]} ({n})</option> : null; })}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <button type="button" className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/30"><Search className="size-4" /></button>
            <button type="button" className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/30">
              <ArrowUpDown className="size-3" />Sort
            </button>
          </div>

          {/* Campaign list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map((c) => {
              const isSel = c.id === sel?.id;
              const cfg = SC[c.status];
              return (
                <button key={c.id} type="button" onClick={() => { setSelectedId(c.id); setEditBudget(false); setEditEndDate(false); }}
                  className={cn("flex w-full flex-col gap-1.5 border-b border-border px-4 py-3.5 text-left transition-colors",
                    isSel ? "border-l-[3px] border-l-[#004956] bg-[#e6fff9]/30" : "hover:bg-muted/20")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center [&>svg]:size-5">{PL[c.platform]}</div>
                      <p className={cn("truncate text-sm font-semibold", isSel ? "text-[#004956]" : "text-foreground")}>{c.name}</p>
                    </div>
                    <span className={cn("flex shrink-0 items-center gap-1.5 text-[11px] font-semibold", cfg.text)}>
                      <span className={cn("size-2 rounded-full", cfg.dot)} />{cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 pl-[38px] text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Layers className="size-3" />{c.objective}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="size-3" />{fmt(c.startDate)} - {fmt(c.endDate)}</span>
                  </div>
                  {/* Rejected warning */}
                  {c.rejected && c.rejectedMsg && (
                    <div className="mt-1 ml-[38px] flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1.5">
                      <AlertTriangle className="size-3 shrink-0 text-red-500" />
                      <p className="text-[10px] font-medium text-red-600">{c.rejectedMsg}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border p-3">
            <button type="button" onClick={() => router.push("/")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#004956] py-2.5 text-sm font-semibold text-white hover:bg-[#003a44]">
              <Plus className="size-4" />New Campaign
            </button>
          </div>
        </div>

        {/* ═══ DETAIL PANEL ═══ */}
        <div className="flex-1 overflow-y-auto bg-[#f8f8f8]">
          {!sel ? (
            <div className="flex h-full flex-col items-center justify-center"><BarChart3 className="mb-3 size-10 text-muted-foreground/20" /><p className="text-sm text-muted-foreground">Select a campaign</p></div>
          ) : (
            <div className="p-4 sm:p-6">
              {/* Creative thumbnails strip — matches Figma */}
              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                <div className="flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 border-[#a4ffe5] bg-[#e6fff9] px-4 py-3">
                  <BarChart3 className="size-5 text-[#004956]" />
                  <span className="text-[10px] font-semibold text-[#004956]">Overview</span>
                </div>
                {sel.thumbs.length > 0 ? sel.thumbs.map((_, i) => (
                  <div key={i} className="flex size-[60px] shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 overflow-hidden">
                    <ImageIcon className="size-5 text-muted-foreground/30" />
                  </div>
                )) : (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex size-[60px] shrink-0 items-center justify-center rounded-xl border border-border bg-muted/20">
                      <ImageIcon className="size-5 text-muted-foreground/20" />
                    </div>
                  ))
                )}
              </div>

              {/* Action bar — matches Figma: Duplicate | Copy campaign ID | Analyse */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {(sel.status === "active" || sel.status === "paused") && (
                  <button type="button" onClick={handlePause}
                    className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium",
                      sel.status === "active" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>
                    {sel.status === "active" ? <><Pause className="size-3" />Pause</> : <><Play className="size-3" />Resume</>}
                  </button>
                )}
                {sel.status === "active" && (
                  <button type="button" onClick={() => { const nb = Math.round(sel.dailyBudget * 1.2); setCampaigns((p) => p.map((c) => c.id === sel.id ? { ...c, dailyBudget: nb } : c)); }}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:border-[#a4ffe5]">
                    <Zap className="size-3 text-[#004956]" />Boost +20%
                  </button>
                )}
                <button type="button" onClick={() => alert("Duplicate")} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:border-[#a4ffe5]">
                  <Copy className="size-3" />Duplicate
                </button>
                <button type="button" onClick={() => { navigator.clipboard.writeText(sel.id); }} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:border-[#a4ffe5] hover:text-foreground">
                  Copy campaign ID
                </button>
                <button type="button" onClick={() => alert("AI Analysis — coming soon")} className="flex items-center gap-1.5 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2 text-xs font-semibold text-[#004956] hover:bg-[#d0fff2]">
                  <Sparkles className="size-3" />Analyse
                </button>
                <div className="flex-1" />
                <button type="button" onClick={() => handleDelete(sel.id)} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/40 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {/* Budget stats — 3 cards matching Figma */}
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Daily Budget — editable */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] text-muted-foreground">Daily Budget</p>
                  {editBudget ? (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">﷼</span>
                      <input type="number" value={tmpBudget} onChange={(e) => setTmpBudget(Number(e.target.value))} min={150} autoFocus
                        className="h-7 w-24 rounded border border-[#a4ffe5] px-2 text-sm font-bold tabular-nums outline-none" />
                      <button type="button" onClick={() => { setCampaigns((p) => p.map((c) => c.id === sel.id ? { ...c, dailyBudget: tmpBudget } : c)); setEditBudget(false); }} className="rounded p-1 text-emerald-600 hover:bg-emerald-50"><Check className="size-3.5" /></button>
                      <button type="button" onClick={() => setEditBudget(false)} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="size-3.5" /></button>
                    </div>
                  ) : (
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <p className="text-sm font-bold tabular-nums text-foreground">﷼ {sel.dailyBudget.toLocaleString()}</p>
                      <button type="button" onClick={() => { setTmpBudget(sel.dailyBudget); setEditBudget(true); }} className="rounded p-0.5 text-muted-foreground/50 hover:text-[#004956]"><Pencil className="size-3" /></button>
                    </div>
                  )}
                </div>
                {/* Total Spending */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] text-muted-foreground">Total Spending</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{sel.totalSpending.toLocaleString()} SAR</p>
                </div>
                {/* End Date — editable */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] text-muted-foreground">Campaign End Date</p>
                  {editEndDate ? (
                    <div className="mt-1 flex items-center gap-1">
                      <input type="date" value={tmpEndDate} onChange={(e) => setTmpEndDate(e.target.value)}
                        className="h-7 rounded border border-[#a4ffe5] px-2 text-xs font-bold outline-none" />
                      <button type="button" onClick={() => { setCampaigns((p) => p.map((c) => c.id === sel.id ? { ...c, endDate: tmpEndDate } : c)); setEditEndDate(false); }} className="rounded p-1 text-emerald-600 hover:bg-emerald-50"><Check className="size-3.5" /></button>
                      <button type="button" onClick={() => setEditEndDate(false)} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="size-3.5" /></button>
                    </div>
                  ) : (
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <p className="text-sm font-bold text-foreground">{sel.endDate ? new Date(sel.endDate).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "Ongoing"}</p>
                      <button type="button" onClick={() => { setTmpEndDate(sel.endDate); setEditEndDate(true); }} className="rounded p-0.5 text-muted-foreground/50 hover:text-[#004956]"><Pencil className="size-3" /></button>
                    </div>
                  )}
                </div>
              </div>

              {/* Period comparison */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <TrendingUp className="size-3 text-emerald-500" /><ArrowDownRight className="size-3 text-red-400" />
                </div>
                <p className="text-[11px] text-muted-foreground">Compared to the Previous Period</p>
                <span className="text-[11px] text-muted-foreground">•</span>
                <span className="rounded-lg border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
                  {fmtFull(sel.startDate)} - {fmtFull(sel.endDate)}
                </span>
              </div>

              {/* Performance — Row 1 */}
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] text-muted-foreground">Purchases</p>
                  <div className="mt-0.5 flex items-center gap-2"><p className="text-lg font-bold tabular-nums">{sel.purchases.toLocaleString()}</p><Pct v={sel.purchaseChange} /></div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] text-muted-foreground">Cost Per Purchase</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">﷼ {sel.costPerPurchase.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] text-muted-foreground">Purchase Value</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">﷼ {sel.purchaseValue.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">ROAS</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">{sel.roas} ﷼</p>
                </div>
              </div>

              {/* Performance — Row 2 */}
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] text-muted-foreground">Reach</p>
                  <div className="mt-0.5 flex items-center gap-2"><p className="text-lg font-bold tabular-nums">{sel.reach.toLocaleString()}</p><Pct v={sel.reachChange} /></div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] text-muted-foreground">Number of Clicks</p>
                  <div className="mt-0.5 flex items-center gap-2"><p className="text-lg font-bold tabular-nums">{sel.clicks.toLocaleString()}</p><Pct v={sel.clicksChange} /></div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] text-muted-foreground">Cost Per Click</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">{sel.cpc} ﷼</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] text-muted-foreground">Click Rate</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">{sel.ctr}%</p>
                </div>
              </div>

              {/* Additional metrics — 7 cols matching Figma */}
              <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-7">
                {[
                  { l: "Impressions", v: sel.impressions.toLocaleString() },
                  { l: "CPM", v: `${sel.cpm.toFixed(2)} ﷼` },
                  { l: "Added to Cart", v: sel.addToCart.toString() },
                  { l: "Add to Cart value", v: `${sel.atcValue.toLocaleString()} ﷼` },
                  { l: "Checkout", v: sel.checkouts.toString() },
                  { l: "Checkout value", v: `${sel.checkoutValue.toLocaleString()} ﷼` },
                  { l: "Page Views", v: sel.pageViews.toLocaleString(), c: sel.pageViewsChange },
                ].map((m) => (
                  <div key={m.l} className="rounded-xl border border-border bg-card p-2.5 text-center">
                    <p className="text-[9px] text-muted-foreground">{m.l}</p>
                    <div className="mt-0.5 flex items-center justify-center gap-1">
                      <p className="text-xs font-bold tabular-nums">{m.v}</p>
                      {"c" in m && m.c ? <Pct v={m.c as number} /> : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart — matches Figma */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <span className="rounded-full bg-[#a4ffe5] px-3 py-1 text-[11px] font-semibold text-[#004956]">Comparison</span>
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">Audience</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-lg border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground">Impressions ▾</span>
                    <span className="rounded-lg border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground">Spending (SAR) ▾</span>
                  </div>
                </div>
                <div className="flex h-52 items-center justify-center rounded-xl bg-gradient-to-br from-[#e6fff9]/50 to-muted/20">
                  <div className="text-center">
                    <BarChart3 className="mx-auto mb-2 size-8 text-[#004956]/20" />
                    <p className="text-sm font-medium text-[#004956]/40">Impressions & Spending chart</p>
                    <p className="text-[11px] text-muted-foreground/50">Connected to platform APIs in production</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
