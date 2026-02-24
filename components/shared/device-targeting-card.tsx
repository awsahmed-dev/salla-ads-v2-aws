"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEVICE_OS_OPTIONS } from "@/lib/device-targeting";
import { Smartphone, Info, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type DeviceTargetingAccent = "primary" | "meta";

const ACCENT = {
  primary: {
    icon: "text-emerald-700 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    selected:
      "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200",
    unselected:
      "border-border bg-background text-muted-foreground hover:border-emerald-400 dark:hover:border-emerald-600",
  },
  meta: {
    icon: "text-[#1877F2]",
    iconBg: "bg-[#1877F2]/10",
    selected:
      "border-[#1877F2] bg-[#1877F2]/5 text-[#1877F2] dark:border-[#1877F2] dark:bg-[#1877F2]/10 dark:text-[#1877F2]",
    unselected:
      "border-border bg-background text-muted-foreground hover:border-[#1877F2]/40 dark:hover:border-[#1877F2]/50",
  },
} as const;

const DEFAULT_INFO_TIP =
  "Choose which devices to target. Both selected is recommended for maximum reach.";

export interface DeviceTargetingCardProps {
  /** Selected OS IDs (e.g. ["iOS", "ANDROID"]) */
  value: string[];
  /** Called when selection changes */
  onChange: (ids: string[]) => void;
  /** Visual accent */
  accent?: DeviceTargetingAccent;
  /** Override tooltip text */
  infoTipText?: string;
  /** Optional API badge (e.g. "user_os" for Meta) */
  apiBadge?: string;
  /** Optional footer (e.g. TikTok App Install note) */
  footer?: React.ReactNode;
  className?: string;
}

function toggleInArray(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export function DeviceTargetingCard({
  value,
  onChange,
  accent = "primary",
  infoTipText = DEFAULT_INFO_TIP,
  apiBadge,
  footer,
  className,
}: DeviceTargetingCardProps) {
  const style = ACCENT[accent];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/5",
        className
      )}
      role="region"
      aria-labelledby="device-targeting-title"
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            style.iconBg
          )}
        >
          <Smartphone className={cn("size-4", style.icon)} />
        </div>
        <Label
          id="device-targeting-title"
          className="text-sm font-semibold text-foreground"
        >
          Device Targeting
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

      <div className="flex gap-2">
        {DEVICE_OS_OPTIONS.map((d) => {
          const selected = value.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onChange(toggleInArray(value, d.id))}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                selected ? style.selected : style.unselected
              )}
            >
              {d.label}
              {selected && (
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full",
                    style.iconBg
                  )}
                >
                  <CheckCircle2 className={cn("size-3", style.icon)} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {footer && (
        <div className="mt-3 flex flex-col gap-0">{footer}</div>
      )}
    </div>
  );
}
