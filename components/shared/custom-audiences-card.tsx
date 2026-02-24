"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { MOCK_CUSTOM_AUDIENCES } from "@/lib/custom-audiences";
import { Users, Info, CheckCircle2, X, Sparkles } from "lucide-react";

export type CustomAudiencesAccent = "primary" | "meta";

const ACCENT = {
  primary: {
    icon: "text-emerald-700 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    button:
      "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/50",
    buttonIcon: "text-emerald-700 dark:text-emerald-300",
  },
  meta: {
    icon: "text-[#1877F2]",
    iconBg: "bg-[#1877F2]/10",
    button:
      "border-[#1877F2]/40 bg-[#1877F2]/5 text-[#1877F2] hover:bg-[#1877F2]/10 dark:border-[#1877F2]/50 dark:bg-[#1877F2]/10 dark:hover:bg-[#1877F2]/20",
    buttonIcon: "text-[#1877F2]",
  },
} as const;

const DEFAULT_INFO_TIP =
  "Include or exclude specific groups like website visitors, past purchasers, or email subscribers.";

export interface CustomAudiencesCardProps {
  /** Selected audience IDs to include in targeting */
  includeIds: string[];
  /** Called when include list changes (add or remove) */
  onIncludeIdsChange: (ids: string[]) => void;
  /** Selected audience IDs to exclude from targeting */
  excludeIds: string[];
  /** Called when exclude list changes (add or remove) */
  onExcludeIdsChange: (ids: string[]) => void;
  /** Visual accent: primary (emerald) or meta (blue) */
  accent?: CustomAudiencesAccent;
  /** Override tooltip for the info icon */
  infoTipText?: string;
  className?: string;
}

function toggleInArray(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function CustomAudiencesCard({
  includeIds,
  onIncludeIdsChange,
  excludeIds,
  onExcludeIdsChange,
  accent = "primary",
  infoTipText = DEFAULT_INFO_TIP,
  className,
}: CustomAudiencesCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const style = ACCENT[accent];

  const onIncludeSelect = (id: string) => {
    onIncludeIdsChange(toggleInArray(includeIds, id));
  };
  const onExcludeSelect = (id: string) => {
    onExcludeIdsChange(toggleInArray(excludeIds, id));
  };

  const includeOptions = MOCK_CUSTOM_AUDIENCES.filter((a) => !includeIds.includes(a.id));
  const excludeOptions = MOCK_CUSTOM_AUDIENCES.filter((a) => !excludeIds.includes(a.id));

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/5",
          className
        )}
        role="region"
        aria-labelledby="custom-audiences-title"
      >
        {/* Header: icon + title/description, info, New Audience button */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                style.iconBg
              )}
            >
              <Users className={cn("size-5", style.icon)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3
                  id="custom-audiences-title"
                  className="text-base font-semibold text-foreground"
                >
                  Custom Audiences
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="More information"
                    >
                      <Info className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {infoTipText}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Use this feature to retarget specific audiences or prevent your ads from being shown repeatedly to the same users.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-left text-sm font-medium transition-colors",
              style.button
            )}
          >
            <span className="flex flex-col leading-tight">
              <span>New</span>
              <span>Audience</span>
            </span>
            <Sparkles className={cn("size-4 shrink-0", style.buttonIcon)} />
          </button>
        </div>

        {/* Include / Exclude two-column */}
        <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Include */}
          <div className="min-w-0 space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium text-foreground">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <CheckCircle2 className="size-3.5" />
              </span>
              Include audiences
            </Label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Choose a saved audience to display your ads to.
            </p>
            <Select onValueChange={onIncludeSelect} value="">
              <SelectTrigger
                className="h-10 min-w-0 rounded-lg text-sm [&>span]:truncate"
                id="custom-audiences-include"
              >
                <SelectValue placeholder="Select audiences..." />
              </SelectTrigger>
              <SelectContent>
                {includeOptions.length === 0 ? (
                  <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                    All audiences selected
                  </div>
                ) : (
                  includeOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {includeIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {includeIds.map((id) => (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="cursor-pointer gap-1 rounded-md text-xs transition-opacity hover:opacity-80"
                    onClick={() =>
                      onIncludeIdsChange(includeIds.filter((x) => x !== id))
                    }
                  >
                    {MOCK_CUSTOM_AUDIENCES.find((a) => a.id === id)?.name}
                    <X className="size-2.5" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Exclude */}
          <div className="min-w-0 space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium text-foreground">
              <span className="flex size-6 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                <X className="size-3.5" />
              </span>
              Exclude audiences
            </Label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Choose a saved audience you do not want to show your ads to.
            </p>
            <Select onValueChange={onExcludeSelect} value="">
              <SelectTrigger
                className="h-10 min-w-0 rounded-lg text-sm [&>span]:truncate"
                id="custom-audiences-exclude"
              >
                <SelectValue placeholder="Select audiences to exclude..." />
              </SelectTrigger>
              <SelectContent>
                {excludeOptions.length === 0 ? (
                  <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                    All audiences selected
                  </div>
                ) : (
                  excludeOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {excludeIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {excludeIds.map((id) => (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="cursor-pointer gap-1 rounded-md text-xs transition-opacity hover:opacity-80"
                    onClick={() =>
                      onExcludeIdsChange(excludeIds.filter((x) => x !== id))
                    }
                  >
                    {MOCK_CUSTOM_AUDIENCES.find((a) => a.id === id)?.name}
                    <X className="size-2.5" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Audience: right-side slider with AI chat (prototype UI) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-l sm:max-w-md"
        >
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              New Audience
            </SheetTitle>
            <SheetDescription>
              Describe who you’d like to target and we’ll help you build an audience.
            </SheetDescription>
          </SheetHeader>

          {/* Mock chat messages */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div className="rounded-lg rounded-tl-none border bg-muted/50 px-3 py-2 text-sm text-foreground">
                Describe who you’d like to target (e.g. past purchasers, cart abandoners, or visitors who didn’t convert).
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="max-w-[85%] rounded-lg rounded-tr-none border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                People who bought in the last 30 days
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div className="rounded-lg rounded-tl-none border bg-muted/50 px-3 py-2 text-sm text-foreground">
                I’ll create an audience “Recent purchasers (30d)” based on that. You can refine it in the next step.
              </div>
            </div>
          </div>

          {/* Input (prototype – no submit) */}
          <div className="border-t pt-4">
            <div className="flex gap-2 rounded-lg border bg-muted/30 px-3 py-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                readOnly
                aria-label="Chat input (prototype)"
              />
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground opacity-70"
                disabled
                aria-label="Send (disabled in prototype)"
              >
                Send
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
