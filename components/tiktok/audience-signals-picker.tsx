"use client";

/**
 * Unified audience-signals picker for TikTok Smart+ Sales.
 *
 * Replaces three previously-separate UIs (Interest Categories,
 * Interest Keywords, Purchase Intent Keywords) with ONE searchable
 * picker that queries TikTok's catalog. Each signal carries a type so
 * the parent splits the selection back into the three API arrays at
 * submit time.
 *
 * Salla-merchant best practice:
 *   - Pre-suggestion bundle row appears when the store's category
 *     matches OR a Saudi season is in its prep window.
 *   - "Reset to AI-recommended" loads a starter bundle for the store
 *     category.
 *   - Inline conflict guards (interest keywords vs. shopping intent
 *     cannot mix in the same ad group per TikTok docs — soft warn +
 *     offer to swap).
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Search,
  X,
  Sparkles,
  Plus,
  Layers,
  ShoppingBag,
  Heart,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  AUDIENCE_CATALOG,
  SIGNAL_BUNDLES,
  searchCatalog,
  getSignal,
  type AudienceSignal,
  type SignalType,
  type StoreCategory,
  type SeasonalTag,
} from "@/lib/tiktok/interest-catalog";
import { SectionCard } from "@/components/shared/section-card";

interface Props {
  /** Currently selected IDs across all three signal types. */
  interestCategoryIds: string[];
  interestKeywordIds: string[];
  shoppingIntentIds: string[];

  /** Selection callbacks (one per type). */
  onChange: (next: {
    interestCategoryIds: string[];
    interestKeywordIds: string[];
    shoppingIntentIds: string[];
  }) => void;

  /** Salla store category, used to seed recommendations. Default: undefined = no bias. */
  storeCategory?: StoreCategory;
  /** Active seasonal window (within prep days). Used to surface a seasonal bundle. */
  activeSeason?: SeasonalTag;
}

const TYPE_META: Record<SignalType, { label: string; icon: typeof Layers; chipBg: string }> = {
  CATEGORY:        { label: "Category",     icon: Layers,       chipBg: "bg-blue-50 text-blue-700" },
  INTEREST:        { label: "Interest",     icon: Heart,        chipBg: "bg-violet-50 text-violet-700" },
  SHOPPING_INTENT: { label: "Shopping",     icon: ShoppingBag,  chipBg: "bg-emerald-50 text-emerald-700" },
};

function formatReach(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

export function AudienceSignalsPicker({
  interestCategoryIds,
  interestKeywordIds,
  shoppingIntentIds,
  onChange,
  storeCategory,
  activeSeason,
}: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SignalType | "ALL">("ALL");

  const selectedIds = useMemo(
    () => new Set([...interestCategoryIds, ...interestKeywordIds, ...shoppingIntentIds]),
    [interestCategoryIds, interestKeywordIds, shoppingIntentIds]
  );

  // TikTok ad-group API constraint: interest_keyword_ids and
  // purchase_intention_keyword_ids cannot both be set on the same ad group.
  const hasInterestKws = interestKeywordIds.length > 0;
  const hasShoppingKws = shoppingIntentIds.length > 0;
  const conflictActive = hasInterestKws && hasShoppingKws;

  // Search results.
  const results = useMemo(() => {
    if (!query.trim() && typeFilter === "ALL") {
      // Default view: show top-reach items in the store category (or all if no category)
      let pool = AUDIENCE_CATALOG;
      if (storeCategory) pool = pool.filter((s) => s.storeCategories.includes(storeCategory));
      return pool.sort((a, b) => b.reachKsa - a.reachKsa).slice(0, 30);
    }
    return searchCatalog(query, {
      storeCategory,
      type: typeFilter === "ALL" ? undefined : typeFilter,
      limit: 50,
    });
  }, [query, typeFilter, storeCategory]);

  // Suggested bundles: store-category-based + active-season-based.
  const suggestedBundles = useMemo(() => {
    return SIGNAL_BUNDLES.filter((b) => {
      if (b.seasonal && b.seasonal === activeSeason) return true;
      if (b.forCategories && storeCategory && b.forCategories.includes(storeCategory)) return true;
      return false;
    });
  }, [storeCategory, activeSeason]);

  const addSignal = (signal: AudienceSignal) => {
    const next = {
      interestCategoryIds: [...interestCategoryIds],
      interestKeywordIds: [...interestKeywordIds],
      shoppingIntentIds: [...shoppingIntentIds],
    };
    if (signal.type === "CATEGORY" && !next.interestCategoryIds.includes(signal.id)) {
      next.interestCategoryIds.push(signal.id);
    } else if (signal.type === "INTEREST" && !next.interestKeywordIds.includes(signal.id)) {
      next.interestKeywordIds.push(signal.id);
    } else if (signal.type === "SHOPPING_INTENT" && !next.shoppingIntentIds.includes(signal.id)) {
      next.shoppingIntentIds.push(signal.id);
    }
    onChange(next);
  };

  const removeSignal = (id: string) => {
    onChange({
      interestCategoryIds: interestCategoryIds.filter((x) => x !== id),
      interestKeywordIds: interestKeywordIds.filter((x) => x !== id),
      shoppingIntentIds: shoppingIntentIds.filter((x) => x !== id),
    });
  };

  const applyBundle = (bundleId: string) => {
    const bundle = SIGNAL_BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) return;
    const next = {
      interestCategoryIds: [...interestCategoryIds],
      interestKeywordIds: [...interestKeywordIds],
      shoppingIntentIds: [...shoppingIntentIds],
    };
    for (const id of bundle.signalIds) {
      const sig = getSignal(id);
      if (!sig) continue;
      if (sig.type === "CATEGORY" && !next.interestCategoryIds.includes(id)) next.interestCategoryIds.push(id);
      if (sig.type === "INTEREST" && !next.interestKeywordIds.includes(id)) next.interestKeywordIds.push(id);
      if (sig.type === "SHOPPING_INTENT" && !next.shoppingIntentIds.includes(id)) next.shoppingIntentIds.push(id);
    }
    onChange(next);
  };

  const resetToAI = () => {
    // Apply the first "starter" bundle that matches the store category.
    const starter = SIGNAL_BUNDLES.find(
      (b) => b.id.startsWith("starter_") && b.forCategories?.includes(storeCategory ?? "FASHION")
    );
    if (!starter) return;
    onChange({
      interestCategoryIds: starter.signalIds.filter((id) => getSignal(id)?.type === "CATEGORY"),
      interestKeywordIds: starter.signalIds.filter((id) => getSignal(id)?.type === "INTEREST"),
      shoppingIntentIds: starter.signalIds.filter((id) => getSignal(id)?.type === "SHOPPING_INTENT"),
    });
  };

  const swapShoppingForInterest = () => {
    // Resolve the conflict by clearing shopping intent (the merchant just
    // added interest keywords — most recent action wins).
    onChange({
      interestCategoryIds,
      interestKeywordIds,
      shoppingIntentIds: [],
    });
  };

  const totalSelected = selectedIds.size;
  const allSelected = useMemo(() => {
    const ids = [...interestCategoryIds, ...interestKeywordIds, ...shoppingIntentIds];
    return ids.map((id) => getSignal(id)).filter((s): s is AudienceSignal => s != null);
  }, [interestCategoryIds, interestKeywordIds, shoppingIntentIds]);

  return (
    <SectionCard>
      <div className="flex flex-col gap-4">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="size-4 text-primary" />
              Audience signals
              <Badge className="rounded-full bg-[#e6fff9] px-1.5 py-0 text-[10px] font-bold text-[#004956] hover:bg-[#e6fff9]">
                AI · recommended
              </Badge>
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick from TikTok's catalog of interest categories, topics, and shopping intent. Smart+ uses these as signals to find your buyers — leave empty to let TikTok auto-target.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetToAI}
            className="h-8 gap-1.5 text-xs"
            title="Apply the recommended starter bundle for your store"
          >
            <RefreshCw className="size-3" />
            AI-recommended
          </Button>
        </div>

        {/* ── Suggested bundles ──────────────────────────────────── */}
        {suggestedBundles.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/40 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">
              Pre-built bundles for you
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedBundles.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => applyBundle(b.id)}
                  className="group flex flex-col items-start gap-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-left transition-all hover:border-amber-400 hover:shadow-sm"
                >
                  <span className="text-xs font-bold text-amber-900">{b.label}</span>
                  <span className="text-[10px] leading-snug text-amber-700">{b.description}</span>
                  <span className="text-[10px] font-semibold text-amber-800 group-hover:underline">
                    + Add {b.signalIds.length} signals
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Conflict guard ─────────────────────────────────────── */}
        {conflictActive && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
            <div className="flex-1 text-[11px] leading-snug text-red-800">
              <strong>Conflict:</strong> Interest keywords and Shopping intent can't both run in the same ad group. TikTok will reject this at submit.
              <button
                type="button"
                onClick={swapShoppingForInterest}
                className="ml-1 font-semibold underline hover:text-red-900"
              >
                Clear shopping intent and keep interests
              </button>
            </div>
          </div>
        )}

        {/* ── Selected chip rail ─────────────────────────────────── */}
        {totalSelected > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {totalSelected} selected
              </span>
              <button
                type="button"
                onClick={() => onChange({ interestCategoryIds: [], interestKeywordIds: [], shoppingIntentIds: [] })}
                className="text-[10px] font-semibold text-muted-foreground hover:text-red-600"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allSelected.map((s) => {
                const meta = TYPE_META[s.type];
                const Icon = meta.icon;
                return (
                  <Badge
                    key={s.id}
                    variant="outline"
                    className={cn("flex items-center gap-1 rounded-full border-transparent px-2 py-1 text-[11px] font-medium", meta.chipBg)}
                  >
                    <Icon className="size-3" />
                    {s.label}
                    <button
                      type="button"
                      onClick={() => removeSignal(s.id)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                    >
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            {totalSelected < 3 && (
              <p className="text-[10px] italic text-muted-foreground">
                Tip: TikTok Smart+ optimizes best with at least 3–5 signals.
              </p>
            )}
          </div>
        )}

        {/* ── Search + type filter ───────────────────────────────── */}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/10 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search TikTok's audience catalog — try 'skincare', 'eid', or 'gaming'"
              className="h-10 pl-9 text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {(["ALL", "CATEGORY", "INTEREST", "SHOPPING_INTENT"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  typeFilter === t
                    ? "border-[#004956] bg-[#004956] text-white"
                    : "border-border bg-white text-muted-foreground hover:border-[#a4ffe5]"
                )}
              >
                {t === "ALL" ? "All" : t === "SHOPPING_INTENT" ? "Shopping intent" : t === "CATEGORY" ? "Categories" : "Interests"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results ─────────────────────────────────────────────── */}
        <div className="grid max-h-[360px] gap-1 overflow-y-auto pr-1">
          {results.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No matches for "{query}". Try a broader term or pick a category filter.
            </p>
          )}
          {results.map((s) => {
            const meta = TYPE_META[s.type];
            const Icon = meta.icon;
            const isSelected = selectedIds.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => !isSelected && addSignal(s)}
                disabled={isSelected}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                  isSelected
                    ? "cursor-default border-[#a4ffe5] bg-[#e6fff9]/40"
                    : "border-border bg-white hover:border-[#a4ffe5] hover:bg-[#e6fff9]/30"
                )}
              >
                <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", meta.chipBg)}>
                  <Icon className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {meta.label}
                    {s.labelAr && <span className="mx-1 text-muted-foreground/60">·</span>}
                    {s.labelAr && <span className="text-muted-foreground/80">{s.labelAr}</span>}
                    <span className="mx-1 text-muted-foreground/60">·</span>
                    <span>~{formatReach(s.reachKsa)} reach</span>
                  </p>
                </div>
                {isSelected ? (
                  <Badge className="rounded-full bg-emerald-50 px-1.5 py-0 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50">
                    Added
                  </Badge>
                ) : (
                  <Plus className="size-3.5 shrink-0 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
