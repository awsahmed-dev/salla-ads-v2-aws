"use client";

import { cn } from "@/lib/utils";
import { DEVICE_OS_OPTIONS } from "@/lib/device-targeting";

export type DeviceTargetingAccent = "primary" | "meta";

export interface DeviceTargetingCardProps {
  value: string[];
  onChange: (ids: string[]) => void;
  accent?: DeviceTargetingAccent;
  infoTipText?: string;
  apiBadge?: string;
  footer?: React.ReactNode;
  className?: string;
}

function toggleInArray(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export function DeviceTargetingCard({
  value,
  onChange,
  footer,
  className,
}: DeviceTargetingCardProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl bg-card", className)}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-5">
        <h3 className="text-base font-bold text-foreground">
          Device Operating System
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Select target devices. Selecting both is recommended for maximum reach.
        </p>
      </div>

      {/* OS pills */}
      <div className="flex gap-2 px-4 sm:px-6 pb-5">
        {DEVICE_OS_OPTIONS.map((d) => {
          const selected = value.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onChange(toggleInArray(value, d.id))}
              className={cn(
                "rounded-full border px-3 py-2 sm:py-1.5 text-xs font-medium shadow-sm transition-colors",
                selected
                  ? "border-[#dbfff6] bg-[#e6fff9] text-[#004956]"
                  : "border-border bg-white text-foreground hover:border-border/80"
              )}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {footer && <div className="px-4 sm:px-6 pb-5">{footer}</div>}
    </div>
  );
}
