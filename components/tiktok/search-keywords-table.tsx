"use client";

/**
 * Search Ads keyword table for TikTok Sales · Search Ads mode.
 *
 * Backed by TikTok's ad-group `search_keywords` API field. Each row
 * carries:
 *   - keyword       : merchant-typed string (Arabic or English)
 *   - matchType     : BROAD | PHRASE | EXACT
 *   - isExclusion   : true = negative keyword
 *   - bid           : optional per-keyword override (otherwise FOLLOW_ADGROUP)
 *
 * Salla best-practice nudges:
 *   - Recommend at least 3 keywords (2 Exact + 3 Phrase + 2 Broad split)
 *   - Surface obvious mismatches (e.g. brand name spelled wrong vs.
 *     store name) once we have the integration in place
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertCircle, Search, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import type { SearchKeyword, SearchKeywordMatchType } from "@/lib/tiktok/campaign-types";

interface Props {
  keywords: SearchKeyword[];
  onChange: (next: SearchKeyword[]) => void;
}

const MATCH_TYPES: Array<{ value: SearchKeywordMatchType; label: string; desc: string }> = [
  { value: "EXACT",  label: "Exact",  desc: "Search exactly matches the keyword" },
  { value: "PHRASE", label: "Phrase", desc: "Search contains the phrase in order" },
  { value: "BROAD",  label: "Broad",  desc: "Related searches and variants" },
];

const MATCH_BADGE_CLASS: Record<SearchKeywordMatchType, string> = {
  EXACT:  "bg-emerald-50 text-emerald-700",
  PHRASE: "bg-blue-50 text-blue-700",
  BROAD:  "bg-amber-50 text-amber-700",
};

export function SearchKeywordsTable({ keywords, onChange }: Props) {
  const [newKw, setNewKw] = useState("");
  const [newMatch, setNewMatch] = useState<SearchKeywordMatchType>("PHRASE");
  const [newExclusion, setNewExclusion] = useState(false);

  const addKeyword = () => {
    const kw = newKw.trim();
    if (!kw) return;
    // Avoid exact duplicates (same keyword + match + isExclusion).
    if (keywords.some((k) => k.keyword === kw && k.matchType === newMatch && k.isExclusion === newExclusion)) {
      setNewKw("");
      return;
    }
    onChange([...keywords, { keyword: kw, matchType: newMatch, isExclusion: newExclusion }]);
    setNewKw("");
  };

  const updateRow = (idx: number, patch: Partial<SearchKeyword>) => {
    onChange(keywords.map((k, i) => (i === idx ? { ...k, ...patch } : k)));
  };

  const removeRow = (idx: number) => {
    onChange(keywords.filter((_, i) => i !== idx));
  };

  const positiveCount = keywords.filter((k) => !k.isExclusion).length;
  const exclusionCount = keywords.filter((k) => k.isExclusion).length;
  const matchDistribution = {
    EXACT:  keywords.filter((k) => !k.isExclusion && k.matchType === "EXACT").length,
    PHRASE: keywords.filter((k) => !k.isExclusion && k.matchType === "PHRASE").length,
    BROAD:  keywords.filter((k) => !k.isExclusion && k.matchType === "BROAD").length,
  };

  // Salla best-practice: 2 Exact + 3 Phrase + 2 Broad. Surface a nudge
  // if the merchant hasn't reached that split yet.
  const recommendedSplit = matchDistribution.EXACT >= 2 && matchDistribution.PHRASE >= 3 && matchDistribution.BROAD >= 2;

  return (
    <SectionCard>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Search className="size-4 text-primary" />
            Keywords
            <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px] font-medium text-destructive">
              Required for Search Ads
            </Badge>
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Add the search terms that should trigger your ad. Use a mix of match types to balance reach and intent. Add negative keywords to exclude unwanted traffic.
          </p>
        </div>

        {/* Salla nudge */}
        {!recommendedSplit && positiveCount > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5] bg-[#e6fff9]/60 p-2.5">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
            <p className="text-[11px] leading-snug text-foreground/80">
              <strong className="text-[#004956]">Salla tip:</strong> Successful TikTok Search Ads campaigns from KSA merchants typically use <strong>2 Exact + 3 Phrase + 2 Broad</strong>. You currently have {matchDistribution.EXACT} Exact, {matchDistribution.PHRASE} Phrase, {matchDistribution.BROAD} Broad.
            </p>
          </div>
        )}

        {/* Match-type composition summary */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {positiveCount} positive · {exclusionCount} negative
            </span>
            <span className="text-muted-foreground/40">·</span>
            {MATCH_TYPES.map((t) => (
              <span key={t.value} className={cn("rounded-full px-1.5 py-0 text-[10px] font-bold", MATCH_BADGE_CLASS[t.value])}>
                {t.label} {matchDistribution[t.value]}
              </span>
            ))}
          </div>
        )}

        {/* Row list */}
        <div className="flex flex-col gap-2">
          {keywords.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/10 py-8 text-center">
              <p className="text-xs font-medium text-muted-foreground">No keywords yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Add your first keyword below. Most stores start with 5–7 keywords.</p>
            </div>
          ) : (
            keywords.map((kw, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5",
                  kw.isExclusion ? "border-red-200 bg-red-50/40" : "border-border bg-white"
                )}
              >
                <Input
                  value={kw.keyword}
                  onChange={(e) => updateRow(idx, { keyword: e.target.value })}
                  placeholder="Keyword"
                  className="h-9 min-w-[160px] flex-1 text-sm"
                />
                <select
                  value={kw.matchType}
                  onChange={(e) => updateRow(idx, { matchType: e.target.value as SearchKeywordMatchType })}
                  className={cn(
                    "h-9 rounded-md border border-border bg-white px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#a4ffe5]",
                    MATCH_BADGE_CLASS[kw.matchType]
                  )}
                >
                  {MATCH_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 rounded-md border border-border bg-white px-2 py-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={kw.isExclusion}
                    onChange={(e) => updateRow(idx, { isExclusion: e.target.checked })}
                    className="size-3 cursor-pointer accent-red-600"
                  />
                  <span className="font-medium">Exclude</span>
                </label>
                <Input
                  type="number"
                  value={kw.bid ?? ""}
                  onChange={(e) => updateRow(idx, { bid: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Bid (SAR)"
                  className="h-9 w-28 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  title="Remove"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add row */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 p-3">
          <Input
            value={newKw}
            onChange={(e) => setNewKw(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
            placeholder="Type a keyword and press Enter"
            className="h-9 min-w-[200px] flex-1 text-sm"
          />
          <select
            value={newMatch}
            onChange={(e) => setNewMatch(e.target.value as SearchKeywordMatchType)}
            className={cn(
              "h-9 rounded-md border border-border bg-white px-2 text-xs font-medium",
              MATCH_BADGE_CLASS[newMatch]
            )}
          >
            {MATCH_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 rounded-md border border-border bg-white px-2 py-1.5 text-xs">
            <input
              type="checkbox"
              checked={newExclusion}
              onChange={(e) => setNewExclusion(e.target.checked)}
              className="size-3 cursor-pointer accent-red-600"
            />
            <span className="font-medium">Negative</span>
          </label>
          <Button
            type="button"
            size="sm"
            onClick={addKeyword}
            disabled={!newKw.trim()}
            className="h-9 gap-1 bg-[#004956] text-white hover:bg-[#003a44]"
          >
            <Plus className="size-3" />
            Add
          </Button>
        </div>

        {/* Match-type explainer */}
        <div className="grid gap-2 sm:grid-cols-3">
          {MATCH_TYPES.map((t) => (
            <div key={t.value} className="rounded-md border border-border bg-muted/10 p-2.5">
              <span className={cn("inline-block rounded-full px-1.5 py-0 text-[10px] font-bold", MATCH_BADGE_CLASS[t.value])}>
                {t.label}
              </span>
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>

        {/* Error: no positive keywords */}
        {keywords.length > 0 && positiveCount === 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
            <p className="text-[11px] leading-snug text-red-800">
              You only have negative keywords. Add at least one positive keyword for the ad to deliver.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
