"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { InterestOption } from "@/lib/interest-targeting";
import { Target, Info, Search, ChevronDown, Check } from "lucide-react";

export type InterestTargetingAccent = "primary" | "meta" | "dv360";

const ACCENT = {
  primary: {
    icon: "text-primary",
    iconBg: "bg-primary/10",
    trigger:
      "border-primary/30 hover:border-primary/50 focus:ring-primary/20",
    selectedBg: "bg-primary/10",
    selectedText: "text-primary",
    link: "text-primary",
  },
  meta: {
    icon: "text-[#1877F2]",
    iconBg: "bg-[#1877F2]/10",
    trigger:
      "border-[#1877F2]/30 hover:border-[#1877F2]/50 focus:ring-[#1877F2]/20",
    selectedBg: "bg-[#1877F2]/10",
    selectedText: "text-[#1877F2]",
    link: "text-[#1877F2]",
  },
  dv360: {
    icon: "text-red-600",
    iconBg: "bg-red-600/10",
    trigger: "border-red-400/40 hover:border-red-500/50 focus:ring-red-500/20",
    selectedBg: "bg-red-600/10",
    selectedText: "text-red-600",
    link: "text-red-600",
  },
} as const;

const DEFAULT_TITLE = "Interests";
const DEFAULT_DESCRIPTION =
  "Optional -- leave empty to reach all interests.";
const DEFAULT_TRIGGER_PLACEHOLDER = "Choose the interests that best match your audience.";
const DEFAULT_SEARCH_PLACEHOLDER = "Search interests...";
const DEFAULT_INFO_TIP =
  "Reach people interested in specific topics. Selecting multiple interests means your ad shows to anyone interested in any of them.";

export interface InterestTargetingCardProps {
  /** List of interest options (platform-specific) */
  options: InterestOption[];
  /** Selected option IDs */
  value: string[];
  /** Called when selection changes */
  onChange: (ids: string[]) => void;
  /** Card title */
  title?: string;
  /** Description below title */
  description?: string;
  /** Tooltip for the info icon */
  infoTipText?: string;
  /** Visual accent */
  accent?: InterestTargetingAccent;
  /** Optional API badge (e.g. "flexible_spec") */
  apiBadge?: string;
  /** Dropdown trigger placeholder */
  triggerPlaceholder?: string;
  /** Search input placeholder inside dropdown */
  searchPlaceholder?: string;
  /** Optional sub-label for use inside another card (e.g. "In-Market Segments") */
  sectionLabel?: string;
  /** Whether to show "X selected. Clear all" below dropdown (default true) */
  showClearAll?: boolean;
  className?: string;
}

function toggleInArray(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export function InterestTargetingCard({
  options,
  value,
  onChange,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  infoTipText = DEFAULT_INFO_TIP,
  accent = "primary",
  apiBadge,
  triggerPlaceholder = DEFAULT_TRIGGER_PLACEHOLDER,
  searchPlaceholder = DEFAULT_SEARCH_PLACEHOLDER,
  sectionLabel,
  showClearAll = true,
  className,
}: InterestTargetingCardProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const style = ACCENT[accent];

  const filteredOptions = useMemo(
    () =>
      options.filter(
        (o) =>
          !search.trim() ||
          o.label.toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  );

  const isCard = !sectionLabel;
  const selectedLabels = value
    .map((id) => options.find((o) => o.id === id)?.label)
    .filter(Boolean) as string[];

  const dropdownContent = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2",
            style.trigger
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Select interests"
        >
          <span className={cn(
            "truncate",
            value.length === 0 ? "text-muted-foreground" : "text-foreground"
          )}>
            {value.length === 0
              ? triggerPlaceholder
              : value.length === 1
                ? selectedLabels[0]
                : `${value.length} interests selected`}
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
                aria-label="Search interests"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No interests match your search.
              </p>
            ) : (
              filteredOptions.map((opt) => {
                const selected = value.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange(toggleInArray(value, opt.id))}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/80",
                      selected && style.selectedBg
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        selected
                          ? "border-current bg-current text-white"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {selected ? <Check className="size-2.5" /> : null}
                    </span>
                    <span className={cn("truncate", selected && style.selectedText)}>
                      {opt.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {value.length > 0 && (
            <div className="border-t p-2">
              <button
                type="button"
                onClick={() => {
                  onChange([]);
                  setOpen(false);
                }}
                className={cn("text-xs font-medium underline", style.link)}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  const blockContent = (
    <>
      <div className={cn(sectionLabel ? "mb-2" : "mb-3")}>
        {dropdownContent}
      </div>
      {showClearAll && value.length > 0 && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {value.length} interest{value.length !== 1 ? "s" : ""} selected.{" "}
          <button
            type="button"
            onClick={() => onChange([])}
            className={cn("underline", style.link)}
          >
            Clear all
          </button>
        </p>
      )}
    </>
  );

  if (!isCard) {
    return (
      <div className={cn("space-y-0", className)}>
        {sectionLabel && (
          <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            {sectionLabel}
          </Label>
        )}
        {blockContent}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/5",
        className
      )}
      role="region"
      aria-labelledby="interest-targeting-title"
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            style.iconBg
          )}
        >
          <Target className={cn("size-4", style.icon)} />
        </div>
        <Label
          id="interest-targeting-title"
          className="text-sm font-semibold text-foreground"
        >
          {title}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="More information"
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">
            {infoTipText}
          </TooltipContent>
        </Tooltip>
        {apiBadge && (
          <Badge
            variant="secondary"
            className="ml-auto rounded-full px-1.5 py-0 text-[10px]"
          >
            {apiBadge}
          </Badge>
        )}
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      {blockContent}
    </div>
  );
}
