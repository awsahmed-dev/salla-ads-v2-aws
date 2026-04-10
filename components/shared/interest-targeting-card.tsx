"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { InterestGroup } from "@/lib/interest-targeting";
import { Search, X, Check, ChevronDown } from "lucide-react";

export type InterestTargetingAccent = "primary" | "meta" | "dv360";

export interface InterestTargetingCardProps {
  groups: InterestGroup[];
  includeIds: string[];
  excludeIds: string[];
  onIncludeChange: (ids: string[]) => void;
  onExcludeChange: (ids: string[]) => void;
  interestExpansion: boolean;
  onInterestExpansionChange: (v: boolean) => void;
  accent?: InterestTargetingAccent;
  className?: string;
}

function toggle(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export function InterestTargetingCard({
  groups,
  includeIds,
  excludeIds,
  onIncludeChange,
  onExcludeChange,
  interestExpansion,
  onInterestExpansionChange,
  className,
}: InterestTargetingCardProps) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"include" | "exclude">("include");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentIds = mode === "include" ? includeIds : excludeIds;
  const onChange = mode === "include" ? onIncludeChange : onExcludeChange;

  // Flatten all interests for the dropdown
  const allInterests = useMemo(() => {
    const items: { id: string; label: string; group: string; recommended?: boolean }[] = [];
    for (const g of groups) {
      for (const c of g.children) {
        items.push({ id: c.id, label: c.label, group: g.label, recommended: g.recommended });
      }
    }
    return items;
  }, [groups]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allInterests;
    const q = search.toLowerCase();
    return allInterests.filter(
      (i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)
    );
  }, [allInterests, search]);

  // Group filtered results by category
  const groupedFiltered = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const selectedLabels = currentIds.map((id) => allInterests.find((i) => i.id === id)?.label).filter(Boolean) as string[];

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {/* Header */}
      <div className="px-6 py-5">
        <h3 className="text-base font-bold text-foreground">Interest Targeting</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose interests to reach people likely to engage with your business. Leave blank to reach all.
        </p>
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

        {/* Search dropdown */}
        <div className="relative">
          <div
            className={cn(
              "flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 transition-colors",
              dropdownOpen && "ring-2 ring-[#a4ffe5]"
            )}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <span className={cn("flex-1 text-sm", currentIds.length === 0 ? "text-muted-foreground" : "text-foreground")}>
              {currentIds.length === 0
                ? "Select interests (e.g. Electronics, Health)"
                : `${currentIds.length} selected`}
            </span>
            <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
          </div>

          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-white shadow-lg">
              {/* Search inside dropdown */}
              <div className="border-b p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search interests..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                    autoFocus
                  />
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[280px] overflow-y-auto p-1">
                {groupedFiltered.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No interests found</p>
                ) : (
                  groupedFiltered.map(([groupName, items]) => (
                    <div key={groupName}>
                      <p className="px-2 py-1.5 text-xs font-bold text-muted-foreground">{groupName}</p>
                      {items.map((item) => {
                        const sel = currentIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onChange(toggle(currentIds, item.id))}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                              sel && "bg-[#e6fff9]"
                            )}
                          >
                            <span className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded",
                              sel ? "bg-[#004956] text-white" : "border border-[#004956]"
                            )}>
                              {sel && <Check className="size-2.5" />}
                            </span>
                            <span className={cn("flex-1 truncate", sel && "font-medium")}>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected chips */}
        {currentIds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedLabels.map((label, i) => (
              <span
                key={currentIds[i]}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                  mode === "include"
                    ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956]"
                    : "border-red-200 bg-red-50 text-red-600"
                )}
              >
                {label}
                <button
                  type="button"
                  onClick={() => onChange(currentIds.filter((id) => id !== currentIds[i]))}
                  className="hover:opacity-70"
                >
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

      {/* Divider */}
      <div className="h-px bg-border/40" />

      {/* Interest Expansion */}
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm font-medium text-foreground">Interest Expansion</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Allow Snapchat to reach audiences similar to your target.
          </p>
        </div>
        <Switch
          checked={interestExpansion}
          onCheckedChange={onInterestExpansionChange}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Legacy wrapper for platforms (Meta, Google, DV360, TikTok)          */
/* ------------------------------------------------------------------ */

export interface LegacyInterestTargetingCardProps {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
  title?: string;
  description?: string;
  infoTipText?: string;
  accent?: InterestTargetingAccent;
  apiBadge?: string;
  triggerPlaceholder?: string;
  searchPlaceholder?: string;
  sectionLabel?: string;
  showClearAll?: boolean;
  className?: string;
}

export function LegacyInterestTargetingCard({
  options,
  value,
  onChange,
  title = "Interests",
  description = "Optional — leave empty to reach all interests.",
  triggerPlaceholder = "Choose interests...",
  searchPlaceholder = "Search interests...",
  sectionLabel,
  showClearAll = true,
  className,
}: LegacyInterestTargetingCardProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => options.filter((o) => !search.trim() || o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const selectedLabels = value.map((id) => options.find((o) => o.id === id)?.label).filter(Boolean) as string[];

  const content = (
    <>
      <div className="relative">
        <div
          className={cn(
            "flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 transition-colors",
            open && "ring-2 ring-[#a4ffe5]"
          )}
          onClick={() => setOpen(!open)}
        >
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("flex-1 text-sm", value.length === 0 ? "text-muted-foreground" : "text-foreground")}>
            {value.length === 0 ? triggerPlaceholder : `${value.length} selected`}
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-white shadow-lg">
            <div className="border-b p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" autoFocus />
              </div>
            </div>
            <div className="max-h-[240px] overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No results</p>
              ) : filtered.map((opt) => {
                const sel = value.includes(opt.id);
                return (
                  <button key={opt.id} type="button" onClick={() => onChange(toggle(value, opt.id))} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/50", sel && "bg-[#e6fff9]")}>
                    <span className={cn("flex size-4 shrink-0 items-center justify-center rounded", sel ? "bg-[#004956] text-white" : "border border-[#004956]")}>
                      {sel && <Check className="size-2.5" />}
                    </span>
                    <span className={cn("truncate", sel && "font-medium")}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {showClearAll && value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedLabels.map((label, i) => (
            <span key={value[i]} className="flex items-center gap-1 rounded-full border border-[#a4ffe5] bg-[#e6fff9] px-2 py-0.5 text-xs font-medium text-[#004956]">
              {label}
              <button type="button" onClick={() => onChange(value.filter((id) => id !== value[i]))} className="hover:opacity-70"><X className="size-3" /></button>
            </span>
          ))}
          <button type="button" onClick={() => onChange([])} className="text-xs text-[#004956] underline">Clear all</button>
        </div>
      )}
    </>
  );

  if (sectionLabel) {
    return <div className={className}><p className="mb-2 text-xs font-semibold text-foreground">{sectionLabel}</p>{content}</div>;
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      <div className="px-6 py-5">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="px-6 pb-6">{content}</div>
    </div>
  );
}
