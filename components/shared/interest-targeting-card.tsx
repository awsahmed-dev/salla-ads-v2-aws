"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { InterestGroup } from "@/lib/interest-targeting";
import {
  Target,
  Info,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Check,
  Star,
  Minus,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Accent config                                                      */
/* ------------------------------------------------------------------ */

const ACCENT = {
  primary: {
    icon: "text-primary",
    iconBg: "bg-primary/10",
    badge: "bg-primary/10 text-primary",
    check: "bg-primary text-white",
    exclude: "bg-red-500 text-white",
    chip: "bg-primary/10 text-primary border-primary/20",
    chipExclude: "bg-red-50 text-red-600 border-red-200",
    rec: "text-amber-600",
  },
  meta: {
    icon: "text-[#1877F2]",
    iconBg: "bg-[#1877F2]/10",
    badge: "bg-[#1877F2]/10 text-[#1877F2]",
    check: "bg-[#1877F2] text-white",
    exclude: "bg-red-500 text-white",
    chip: "bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20",
    chipExclude: "bg-red-50 text-red-600 border-red-200",
    rec: "text-amber-600",
  },
  dv360: {
    icon: "text-red-600",
    iconBg: "bg-red-600/10",
    badge: "bg-red-600/10 text-red-600",
    check: "bg-red-600 text-white",
    exclude: "bg-red-500 text-white",
    chip: "bg-red-600/10 text-red-600 border-red-200",
    chipExclude: "bg-red-50 text-red-600 border-red-200",
    rec: "text-amber-600",
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toggle(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function InterestTargetingCard({
  groups,
  includeIds,
  excludeIds,
  onIncludeChange,
  onExcludeChange,
  interestExpansion,
  onInterestExpansionChange,
  accent = "primary",
  className,
}: InterestTargetingCardProps) {
  const style = ACCENT[accent];

  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const rec = groups.filter((g) => g.recommended).map((g) => g.id);
    return new Set(rec);
  });
  const [mode, setMode] = useState<"include" | "exclude">("include");

  const totalSelected = includeIds.length + excludeIds.length;

  const toggleGroup = (gid: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        children: g.children.filter(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            g.label.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.children.length > 0);
  }, [groups, search]);

  const handleToggle = (id: string) => {
    if (mode === "include") {
      if (excludeIds.includes(id)) onExcludeChange(excludeIds.filter((x) => x !== id));
      onIncludeChange(toggle(includeIds, id));
    } else {
      if (includeIds.includes(id)) onIncludeChange(includeIds.filter((x) => x !== id));
      onExcludeChange(toggle(excludeIds, id));
    }
  };

  const removeChip = (id: string) => {
    if (includeIds.includes(id)) onIncludeChange(includeIds.filter((x) => x !== id));
    if (excludeIds.includes(id)) onExcludeChange(excludeIds.filter((x) => x !== id));
  };

  const allOptions = groups.flatMap((g) => g.children);
  const getLabel = (id: string) => allOptions.find((o) => o.id === id)?.label ?? id;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/5",
        className
      )}
      role="region"
      aria-labelledby="interest-targeting-title"
    >
      {/* ── Header ── */}
      <div className="mb-1 flex items-center gap-2">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", style.iconBg)}>
          <Target className={cn("size-4", style.icon)} />
        </div>
        <div className="flex-1">
          <Label id="interest-targeting-title" className="text-sm font-semibold text-foreground">
            Interest Targeting
          </Label>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Snap Lifestyle Categories (SLC) — select interests your audience cares about
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">
            Selecting multiple interests uses OR logic — your ad reaches anyone
            interested in <strong>any</strong> of the selected categories.
            Excluding interests removes those audiences from targeting.
          </TooltipContent>
        </Tooltip>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Optional — leave empty to reach all interests. Recommended categories are
        highlighted for e-commerce campaigns.
      </p>

      {/* ── Include / Exclude mode toggle ── */}
      <div className="mb-3 flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
        <button
          type="button"
          onClick={() => setMode("include")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            mode === "include"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Check className="mr-1 inline-block size-3" />
          Include{includeIds.length > 0 && ` (${includeIds.length})`}
        </button>
        <button
          type="button"
          onClick={() => setMode("exclude")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            mode === "exclude"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Minus className="mr-1 inline-block size-3" />
          Exclude{excludeIds.length > 0 && ` (${excludeIds.length})`}
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search interests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-8 text-xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* ── Selected chips ── */}
      {totalSelected > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {includeIds.map((id) => (
            <span
              key={id}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                style.chip
              )}
            >
              {getLabel(id)}
              <button type="button" onClick={() => removeChip(id)} className="hover:opacity-70">
                <X className="size-2.5" />
              </button>
            </span>
          ))}
          {excludeIds.map((id) => (
            <span
              key={id}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                style.chipExclude
              )}
            >
              <Minus className="size-2.5" />
              {getLabel(id)}
              <button type="button" onClick={() => removeChip(id)} className="hover:opacity-70">
                <X className="size-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => { onIncludeChange([]); onExcludeChange([]); }}
            className="text-[10px] font-medium text-muted-foreground underline hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Category groups ── */}
      <div className="max-h-[320px] overflow-y-auto rounded-lg border border-border">
        {filteredGroups.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No interests match &ldquo;{search}&rdquo;
          </p>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id) || search.trim().length > 0;
            const selectedInGroup = group.children.filter(
              (c) => includeIds.includes(c.id) || excludeIds.includes(c.id)
            ).length;

            return (
              <div key={group.id} className="border-b border-border last:border-b-0">
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="text-sm leading-none">{group.icon}</span>
                  <span className="flex-1 text-xs font-semibold text-foreground">
                    {group.label}
                  </span>
                  {group.recommended && (
                    <span className={cn("flex items-center gap-0.5 text-[9px] font-medium", style.rec)}>
                      <Star className="size-2.5 fill-current" />
                      Recommended
                    </span>
                  )}
                  {selectedInGroup > 0 && (
                    <Badge variant="secondary" className="h-4 min-w-4 justify-center rounded-full px-1 text-[9px]">
                      {selectedInGroup}
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  )}
                </button>

                {/* Children */}
                {isExpanded && (
                  <div className="bg-muted/20 px-2 pb-2">
                    {group.children.map((opt) => {
                      const isIncluded = includeIds.includes(opt.id);
                      const isExcluded = excludeIds.includes(opt.id);
                      const isSelected = isIncluded || isExcluded;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleToggle(opt.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/80",
                            isIncluded && "bg-primary/5",
                            isExcluded && "bg-red-50"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                              isIncluded
                                ? cn("border-transparent", style.check)
                                : isExcluded
                                  ? "border-transparent bg-red-500 text-white"
                                  : "border-muted-foreground/30"
                            )}
                          >
                            {isIncluded && <Check className="size-2.5" />}
                            {isExcluded && <Minus className="size-2.5" />}
                          </span>
                          <span className={cn(
                            "truncate",
                            isIncluded && "font-medium text-foreground",
                            isExcluded && "font-medium text-red-600"
                          )}>
                            {opt.label}
                          </span>
                          {isExcluded && (
                            <span className="ml-auto text-[9px] text-red-400">excluded</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Interest Expansion ── */}
      <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5">
        <Sparkles className={cn("size-4 shrink-0", style.icon)} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">Interest Expansion</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Let Snapchat find similar users beyond your selected interests for broader reach.
          </p>
        </div>
        <Switch
          checked={interestExpansion}
          onCheckedChange={onInterestExpansionChange}
        />
      </div>

      {/* ── Summary note ── */}
      {totalSelected > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          <strong className="text-foreground">{includeIds.length}</strong> included
          {excludeIds.length > 0 && (
            <>, <strong className="text-red-600">{excludeIds.length}</strong> excluded</>
          )}
          {" — "}
          Multiple included interests use <strong>OR</strong> logic (broader reach).
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Legacy wrapper — used by Meta, TikTok, DV360, Google platforms     */
/*  that haven't been migrated to the grouped component yet.           */
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
  infoTipText = "Reach people interested in specific topics. Selecting multiple interests means your ad shows to anyone interested in any of them.",
  accent = "primary",
  apiBadge,
  triggerPlaceholder = "Choose interests...",
  searchPlaceholder = "Search interests...",
  sectionLabel,
  showClearAll = true,
  className,
}: LegacyInterestTargetingCardProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const s = ACCENT[accent];

  const filtered = useMemo(
    () => options.filter((o) => !search.trim() || o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const selectedLabels = value.map((id) => options.find((o) => o.id === id)?.label).filter(Boolean) as string[];

  const content = (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors",
          open && "ring-2 ring-primary/20"
        )}
      >
        <span className={cn("truncate", value.length === 0 ? "text-muted-foreground" : "text-foreground")}>
          {value.length === 0 ? triggerPlaceholder : value.length === 1 ? selectedLabels[0] : `${value.length} selected`}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 rounded-lg border border-border bg-background shadow-md">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No results</p>
            ) : filtered.map((opt) => {
              const sel = value.includes(opt.id);
              return (
                <button key={opt.id} type="button" onClick={() => onChange(toggle(value, opt.id))} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/80", sel && "bg-primary/5")}>
                  <span className={cn("flex size-4 shrink-0 items-center justify-center rounded border", sel ? cn("border-transparent", s.check) : "border-muted-foreground/40")}>
                    {sel && <Check className="size-2.5" />}
                  </span>
                  <span className={cn("truncate", sel && "font-medium")}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {showClearAll && value.length > 0 && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {value.length} selected.{" "}
          <button type="button" onClick={() => onChange([])} className="underline text-primary">Clear all</button>
        </p>
      )}
    </>
  );

  if (sectionLabel) {
    return (
      <div className={className}>
        <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">{sectionLabel}</Label>
        {content}
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/5", className)} role="region">
      <div className="mb-3 flex items-center gap-2">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", s.iconBg)}>
          <Target className={cn("size-4", s.icon)} />
        </div>
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Info className="size-3.5" /></button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">{infoTipText}</TooltipContent>
        </Tooltip>
        {apiBadge && <Badge variant="secondary" className="ml-auto rounded-full px-1.5 py-0 text-[10px]">{apiBadge}</Badge>}
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      {content}
    </div>
  );
}
