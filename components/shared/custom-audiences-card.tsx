"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  MOCK_CUSTOM_AUDIENCES,
  SOURCE_META,
  formatAudienceSize,
} from "@/lib/custom-audiences";
import { Search, Check, X, Sparkles } from "lucide-react";

export type CustomAudiencesAccent = "primary" | "meta";

export interface CustomAudiencesCardProps {
  includeIds: string[];
  onIncludeIdsChange: (ids: string[]) => void;
  excludeIds: string[];
  onExcludeIdsChange: (ids: string[]) => void;
  accent?: CustomAudiencesAccent;
  infoTipText?: string;
  className?: string;
}

function toggle(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export function CustomAudiencesCard({
  includeIds,
  onIncludeIdsChange,
  excludeIds,
  onExcludeIdsChange,
  className,
}: CustomAudiencesCardProps) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"include" | "exclude">("include");

  const currentIds = mode === "include" ? includeIds : excludeIds;
  const onChange = mode === "include" ? onIncludeIdsChange : onExcludeIdsChange;

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_CUSTOM_AUDIENCES;
    const q = search.toLowerCase();
    return MOCK_CUSTOM_AUDIENCES.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        SOURCE_META[a.source].label.toLowerCase().includes(q)
    );
  }, [search]);

  // Group by source
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const aud of filtered) {
      const key = SOURCE_META[aud.source].label;
      const list = map.get(key) ?? [];
      list.push(aud);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const getName = (id: string) =>
    MOCK_CUSTOM_AUDIENCES.find((a) => a.id === id)?.name ?? id;

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <h3 className="text-base font-bold text-foreground">Custom Audiences</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Use this feature for retargeting or to prevent showing ads to the same audience repeatedly.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted/30"
        >
          New audience
          <Sparkles className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {/* Include / Exclude tabs */}
        <div className="mb-6 flex h-[37px] rounded-xl bg-[#f4f4f4] p-0.5">
          <button
            type="button"
            onClick={() => setMode("include")}
            className={cn(
              "flex flex-1 items-center justify-center rounded-[10px] text-sm transition-all",
              mode === "include"
                ? "bg-white font-bold text-foreground shadow-md"
                : "text-muted-foreground"
            )}
          >
            Include{includeIds.length > 0 ? ` (${includeIds.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setMode("exclude")}
            className={cn(
              "flex flex-1 items-center justify-center rounded-[10px] text-sm transition-all",
              mode === "exclude"
                ? "bg-white font-bold text-foreground shadow-md"
                : "text-muted-foreground"
            )}
          >
            Exclude{excludeIds.length > 0 ? ` (${excludeIds.length})` : ""}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="(e.g., Website Visitors, Buyers)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 text-sm"
          />
        </div>

        {/* Audience list grouped by source */}
        <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border">
          {grouped.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No audiences found</p>
          ) : (
            grouped.map(([sourceName, audiences]) => (
              <div key={sourceName}>
                {/* Source header */}
                <div className="border-b border-border bg-white px-3 py-2.5">
                  <p className="text-sm font-bold text-muted-foreground">{sourceName}</p>
                </div>
                {/* Audience items */}
                {audiences.map((aud) => {
                  const sel = currentIds.includes(aud.id);
                  return (
                    <div key={aud.id} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => onChange(toggle(currentIds, aud.id))}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/30",
                          sel && (mode === "include" ? "bg-[#f1fffb]" : "bg-red-50/50")
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded",
                            sel
                              ? "bg-[#004956] text-white"
                              : "border border-[#004956]"
                          )}
                        >
                          {sel && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground">{aud.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatAudienceSize(aud.size)} users
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Selected chips */}
        {currentIds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {currentIds.map((id) => (
              <span
                key={id}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                  mode === "include"
                    ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956]"
                    : "border-red-200 bg-red-50 text-red-600"
                )}
              >
                {getName(id)}
                <button type="button" onClick={() => onChange(currentIds.filter((x) => x !== id))} className="hover:opacity-70">
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-[#004956] underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
