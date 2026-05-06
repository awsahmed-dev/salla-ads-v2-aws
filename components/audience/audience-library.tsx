"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Grid3x3,
  List,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  X,
  RefreshCw,
  Archive,
  Sparkles,
  Crown,
  Target,
  Pin,
  Users,
  ShoppingCart,
  Database,
  Cloud,
  Shield,
  Wand2,
  TrendingUp,
  Share2,
} from "lucide-react";
import type { Audience, AudienceSource, AdPlatform } from "@/lib/audience/rfdm";

/* ────────────────────────────────────────────────────────── */

interface Props {
  audiences: Audience[];
  onSelectAudience: (a: Audience) => void;
  merchantTier: "starter" | "growing" | "enterprise";
}

type SortKey = "name" | "size" | "updated" | "growth";
type SortDir = "asc" | "desc";

const SOURCE_META: Record<AudienceSource, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; group: string }> = {
  rfdm:           { label: "RFDM",            icon: Crown,        color: "bg-emerald-50 text-emerald-700", group: "RFDM" },
  salla_segment:  { label: "Store Segment",   icon: Database,     color: "bg-emerald-50 text-emerald-700", group: "Store" },
  website_event:  { label: "Website Event",   icon: Target,       color: "bg-blue-50 text-blue-700",       group: "Website Events" },
  ad_engagement:  { label: "Ad Engagement",   icon: ShoppingCart, color: "bg-amber-50 text-amber-700",     group: "Ad Engagement" },
  lookalike:      { label: "Lookalike",       icon: Share2,       color: "bg-teal-50 text-teal-700",       group: "Lookalikes" },
  custom_list:    { label: "Custom List",     icon: Cloud,        color: "bg-slate-100 text-slate-700",    group: "Custom Lists" },
  ai_chat:        { label: "AI Chat",         icon: Wand2,        color: "bg-violet-50 text-violet-700",   group: "AI" },
  blocklist:      { label: "Blocklist",       icon: Shield,       color: "bg-red-50 text-red-700",         group: "Exclusions" },
};

const PLATFORM_DOT: Record<AdPlatform, { label: string; color: string }> = {
  meta:      { label: "M", color: "#1877F2" },
  google:    { label: "G", color: "#4285F4" },
  snapchat:  { label: "S", color: "#F5B700" },
  tiktok:    { label: "T", color: "#000" },
  dv360:     { label: "Y", color: "#DC2626" },
};

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

function formatDate(iso: string) {
  const diff = Date.now() - Date.parse(iso);
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "now";
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

/** Mini platform dot showing match status + rate as fill level */
function PlatformDot({ match }: { match: Audience["platformMatches"][number] }) {
  const meta = PLATFORM_DOT[match.platform];
  const opacity = match.status === "not_connected" ? 0.2 : match.status === "synced" ? 1 : 0.6;
  return (
    <div
      className="group/dot relative flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white transition-all"
      style={{
        backgroundColor: meta.color,
        opacity,
      }}
      title={`${match.platform} · ${formatNumber(match.matched)} matched (${(match.matchRate * 100).toFixed(0)}%)`}
    >
      {meta.label}
      {match.status === "synced" && (
        <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-emerald-400 ring-1 ring-white" />
      )}
      {match.status === "syncing" && (
        <span className="absolute -right-0.5 -top-0.5 size-1.5 animate-pulse rounded-full bg-blue-400 ring-1 ring-white" />
      )}
      {match.status === "failed" && (
        <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-red-500 ring-1 ring-white" />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Saved view chips — quick segment of the library            */
/* ────────────────────────────────────────────────────────── */

const SAVED_VIEWS = [
  { id: "all",         label: "All",             filter: () => true },
  { id: "ready",       label: "Ready to activate", filter: (a: Audience) => a.status === "ready" && a.size >= 1000 },
  { id: "ai",          label: "AI-powered",      filter: (a: Audience) => a.source.startsWith("ai_") },
  { id: "events",      label: "Website events",  filter: (a: Audience) => a.source === "website_event" },
  { id: "engagement",  label: "Ad engagement",   filter: (a: Audience) => a.source === "ad_engagement" },
  { id: "lookalikes",  label: "Lookalikes",      filter: (a: Audience) => a.source === "lookalike" },
  { id: "custom",      label: "Custom lists",    filter: (a: Audience) => a.source === "custom_list" },
  { id: "exclusions",  label: "Exclusions",      filter: (a: Audience) => a.source === "blocklist" },
  { id: "attention",   label: "Needs attention", filter: (a: Audience) => a.status === "stale" || a.status === "too_small" || a.status === "error" },
];

const SOURCE_FILTER_GROUPS: Array<{ label: string; sources: AudienceSource[] }> = [
  { label: "RFDM",           sources: ["rfdm"] },
  { label: "Store",          sources: ["salla_segment"] },
  { label: "Website Events", sources: ["website_event"] },
  { label: "Ad Engagement",  sources: ["ad_engagement"] },
  { label: "Lookalikes",     sources: ["lookalike"] },
  { label: "Custom Lists",   sources: ["custom_list"] },
  { label: "AI",             sources: ["ai_chat"] },
  { label: "Exclusions",     sources: ["blocklist"] },
];

/* ────────────────────────────────────────────────────────── */
/*  Row renderers                                              */
/* ────────────────────────────────────────────────────────── */

function AudienceRow({
  audience,
  selected,
  onSelect,
  onOpen,
  density,
}: {
  audience: Audience;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (a: Audience) => void;
  density: "compact" | "comfortable";
}) {
  const source = SOURCE_META[audience.source];
  const SourceIcon = source.icon;
  const padY = density === "compact" ? "py-2" : "py-3";

  return (
    <tr
      onClick={() => onOpen(audience)}
      className={cn(
        "cursor-pointer border-t border-border transition-colors hover:bg-muted/40",
        selected && "bg-[#e6fff9]/40"
      )}
    >
      <td className={cn("px-3", padY)} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(audience.id)}
          className="size-3.5 cursor-pointer accent-[#004956]"
        />
      </td>
      <td className={cn("px-3", padY)}>
        <div className="flex items-center gap-2.5">
          <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", source.color)}>
            <SourceIcon className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-foreground">{audience.name}</p>
              {audience.status === "stale" && (
                <span className="rounded-full bg-amber-50 px-1 py-0 text-[9px] font-semibold text-amber-700">stale</span>
              )}
              {audience.status === "too_small" && (
                <span className="rounded-full bg-red-50 px-1 py-0 text-[9px] font-semibold text-red-700">too small</span>
              )}
              {audience.confidence !== undefined && (
                <span className="rounded-full bg-violet-50 px-1 py-0 text-[9px] font-semibold text-violet-700">
                  {(audience.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            {density === "comfortable" && (
              <p className="truncate text-[11px] text-muted-foreground">{audience.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className={cn("px-3", padY)}>
        <Badge variant="outline" className={cn("rounded-full border-transparent px-1.5 py-0 text-[10px] font-medium", source.color)}>
          {source.label}
        </Badge>
      </td>
      <td className={cn("px-3 text-right", padY)}>
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-sm font-bold tabular-nums text-foreground">{formatNumber(audience.size)}</span>
          {/* 2-week change only meaningful for RFDM segments — pixel/conversion/imports
              are always-up or one-time, so a delta would be misleading. */}
          {audience.source === "rfdm" && audience.growth30d !== 0 && (
            <span
              className={cn(
                "inline-flex items-center text-[10px] font-bold tabular-nums",
                audience.growth30d >= 0 ? "text-emerald-600" : "text-red-500"
              )}
            >
              {audience.growth30d >= 0 ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
              {Math.abs(audience.growth30d).toFixed(0)}%
            </span>
          )}
        </div>
      </td>
      <td className={cn("px-3", padY)}>
        <div className="flex items-center gap-0.5">
          {audience.platformMatches.map((m) => (
            <PlatformDot key={m.platform} match={m} />
          ))}
        </div>
      </td>
      <td className={cn("hidden px-3 text-right text-[11px] text-muted-foreground sm:table-cell", padY)}>
        {formatDate(audience.updatedAt)}
      </td>
      <td className={cn("px-3 text-right", padY)}>
        <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </td>
    </tr>
  );
}

function AudienceGridCard({
  audience,
  onOpen,
}: {
  audience: Audience;
  onOpen: (a: Audience) => void;
}) {
  const source = SOURCE_META[audience.source];
  const SourceIcon = source.icon;
  return (
    <div
      onClick={() => onOpen(audience)}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#a4ffe5] hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", source.color)}>
          <SourceIcon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-bold text-foreground">{audience.name}</h3>
            {audience.confidence !== undefined && (
              <span className="rounded-full bg-violet-50 px-1 text-[9px] font-semibold text-violet-700">
                {(audience.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <Badge variant="outline" className={cn("mt-1 rounded-full border-transparent px-1.5 py-0 text-[9px] font-medium", source.color)}>
            {source.label}
          </Badge>
        </div>
      </div>
      <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{audience.description}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-bold tabular-nums text-foreground">{formatNumber(audience.size)}</p>
          <p className="text-[10px] font-medium uppercase text-muted-foreground">members</p>
        </div>
        {/* Growth shown only for RFDM (which actually fluctuates biweekly). */}
        {audience.source === "rfdm" && audience.growth30d !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              audience.growth30d >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
            )}
          >
            {audience.growth30d >= 0 ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
            {Math.abs(audience.growth30d).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-0.5">
          {audience.platformMatches.map((m) => (
            <PlatformDot key={m.platform} match={m} />
          ))}
        </div>
        <span className="text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-[#004956]">
          View details →
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Main component                                             */
/* ────────────────────────────────────────────────────────── */

const PAGE_SIZE = 25;

export function AudienceLibrary({ audiences, onSelectAudience, merchantTier }: Props) {
  const [view, setView] = useState<"list" | "grid">(merchantTier === "enterprise" ? "list" : "list");
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");
  const [search, setSearch] = useState("");
  const [savedView, setSavedView] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<Set<AudienceSource>>(new Set());
  const [minSize, setMinSize] = useState(0);
  const [sort, setSort] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<"none" | "source">("none");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const view = SAVED_VIEWS.find((v) => v.id === savedView);
    return audiences
      .filter((a) => view?.filter(a) ?? true)
      .filter((a) => (sourceFilter.size === 0 ? true : sourceFilter.has(a.source)))
      .filter((a) => a.size >= minSize)
      .filter((a) =>
        !search
          ? true
          : a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.description.toLowerCase().includes(search.toLowerCase()) ||
            a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sort === "name") return a.name.localeCompare(b.name) * dir;
        if (sort === "size") return (a.size - b.size) * dir;
        if (sort === "growth") return (a.growth30d - b.growth30d) * dir;
        return (Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) * dir;
      });
  }, [audiences, savedView, sourceFilter, minSize, search, sort, sortDir]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  );

  // Groups (only if groupBy != none)
  const grouped = useMemo(() => {
    if (groupBy === "none") return null;
    const groups: Record<string, Audience[]> = {};
    filtered.forEach((a) => {
      const key = SOURCE_META[a.source].group;
      (groups[key] ??= []).push(a);
    });
    return groups;
  }, [filtered, groupBy]);

  function toggleSource(s: AudienceSource) {
    setSourceFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      setPage(0);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllPage() {
    setSelected((prev) => {
      const allSelected = paged.every((a) => prev.has(a.id));
      if (allSelected) {
        const next = new Set(prev);
        paged.forEach((a) => next.delete(a.id));
        return next;
      }
      const next = new Set(prev);
      paged.forEach((a) => next.add(a.id));
      return next;
    });
  }

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="space-y-3">
      {/* Saved views row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SAVED_VIEWS.map((v) => {
          const count = audiences.filter(v.filter).length;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setSavedView(v.id);
                setPage(0);
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                savedView === v.id
                  ? "border-[#004956] bg-[#004956] text-white"
                  : "border-border bg-white text-muted-foreground hover:border-[#a4ffe5] hover:text-[#004956]"
              )}
            >
              {v.label}
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border-transparent px-1.5 py-0 text-[9px] font-semibold",
                  savedView === v.id ? "bg-white/20 text-white" : "bg-muted/40 text-muted-foreground"
                )}
              >
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Toolbar — single search + view controls. Source filtering lives in saved-views above. */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white px-2 py-1.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name, tag, or description…"
            className="h-8 border-0 bg-transparent pl-8 text-sm shadow-none focus-visible:ring-1"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 border-l border-border pl-2">
          {/* Group by */}
          <button
            type="button"
            onClick={() => setGroupBy(groupBy === "none" ? "source" : "none")}
            className={cn(
              "flex h-8 items-center gap-1 rounded-lg border px-2 text-xs font-medium transition-colors",
              groupBy !== "none"
                ? "border-[#004956] bg-[#e6fff9] text-[#004956]"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Pin className="size-3" />
            Group
          </button>

          {/* Density */}
          <button
            type="button"
            onClick={() => setDensity(density === "compact" ? "comfortable" : "compact")}
            className="flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {density === "compact" ? "Compact" : "Comfy"}
          </button>

          {/* View */}
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors",
                view === "list" ? "bg-[#e6fff9] text-[#004956]" : "text-muted-foreground"
              )}
            >
              <List className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors",
                view === "grid" ? "bg-[#e6fff9] text-[#004956]" : "text-muted-foreground"
              )}
            >
              <Grid3x3 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-[#004956] bg-[#004956] px-4 py-2 text-white shadow-md">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="tabular-nums">{selected.size}</span> selected
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] hover:bg-white/20"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-white hover:bg-white/10">
              <Download className="size-3" />
              Export
            </Button>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-white hover:bg-white/10">
              <Archive className="size-3" />
              Archive
            </Button>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {filtered.length === 0
            ? "No audiences match"
            : `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${formatNumber(filtered.length)}`}
        </span>
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-6 px-2 text-xs">
              Prev
            </Button>
            <span className="tabular-nums">
              {page + 1} / {pageCount}
            </span>
            <Button size="sm" variant="ghost" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)} className="h-6 px-2 text-xs">
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {view === "list" ? (
        grouped ? (
          <div className="space-y-4">
            {Object.entries(grouped).map(([groupName, items]) => (
              <div key={groupName} className="overflow-hidden rounded-2xl border border-border bg-white">
                <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[#004956]">{groupName}</h3>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                    {items.length}
                  </Badge>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map((a) => (
                      <AudienceRow
                        key={a.id}
                        audience={a}
                        selected={selected.has(a.id)}
                        onSelect={toggleSelect}
                        onOpen={onSelectAudience}
                        density={density}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2.5 text-left">
                    <input
                      type="checkbox"
                      checked={paged.length > 0 && paged.every((a) => selected.has(a.id))}
                      onChange={toggleAllPage}
                      className="size-3.5 cursor-pointer accent-[#004956]"
                    />
                  </th>
                  <th
                    className="cursor-pointer px-3 py-2.5 text-left font-medium hover:text-foreground"
                    onClick={() => toggleSort("name")}
                  >
                    Audience {sort === "name" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium">Source</th>
                  <th
                    className="cursor-pointer px-3 py-2.5 text-right font-medium hover:text-foreground"
                    onClick={() => toggleSort("size")}
                  >
                    Size {sort === "size" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium">Platforms</th>
                  <th
                    className="hidden cursor-pointer px-3 py-2.5 text-right font-medium hover:text-foreground sm:table-cell"
                    onClick={() => toggleSort("updated")}
                  >
                    Updated {sort === "updated" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="w-20 px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((a) => (
                  <AudienceRow
                    key={a.id}
                    audience={a}
                    selected={selected.has(a.id)}
                    onSelect={toggleSelect}
                    onOpen={onSelectAudience}
                    density={density}
                  />
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Users className="size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No audiences match your filters</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setSourceFilter(new Set());
                    setSavedView("all");
                  }}
                  className="text-xs"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((a) => (
            <AudienceGridCard key={a.id} audience={a} onOpen={onSelectAudience} />
          ))}
        </div>
      )}
    </div>
  );
}
