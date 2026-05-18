"use client";

/**
 * Dayparting / ad scheduling for TikTok ad groups.
 *
 * Maps to two API fields on the ad group:
 *   - schedule_type  : SCHEDULE_FROM_NOW (all-day) / SCHEDULE_CUSTOMIZE (custom)
 *   - dayparting     : 168-char binary mask ("1" = active, "0" = paused).
 *                      Hours 0-23 = Monday, 24-47 = Tuesday, ... 144-167 = Sunday.
 *
 * Snapchat surfaces the same concept on its budget step; we mirror that
 * pattern here so merchants get a familiar grid UX across platforms.
 */

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, RotateCcw } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";

interface Props {
  scheduleType: "ALL_DAY" | "CUSTOM";
  /** 168-character binary mask. Empty string treated as all-on. */
  dayparting: string;
  onScheduleTypeChange: (t: "ALL_DAY" | "CUSTOM") => void;
  onDaypartingChange: (mask: string) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Build a 168-char string of all "1"s (every hour active). */
function allOnMask(): string {
  return "1".repeat(168);
}

/** Get bit at (dayIdx 0-6, hour 0-23) from the mask. Default to 1 when empty. */
function getBit(mask: string, dayIdx: number, hour: number): boolean {
  if (!mask) return true;
  const idx = dayIdx * 24 + hour;
  return mask[idx] === "1";
}

/** Flip the bit at (dayIdx, hour) and return the new mask. */
function flipBit(mask: string, dayIdx: number, hour: number): string {
  const base = mask || allOnMask();
  const idx = dayIdx * 24 + hour;
  const next = base.slice(0, idx) + (base[idx] === "1" ? "0" : "1") + base.slice(idx + 1);
  return next;
}

/** Set an entire day row to the given state. */
function setDay(mask: string, dayIdx: number, on: boolean): string {
  const base = mask || allOnMask();
  const start = dayIdx * 24;
  const next = base.slice(0, start) + (on ? "1" : "0").repeat(24) + base.slice(start + 24);
  return next;
}

/** Set an entire hour column across all 7 days. */
function setHour(mask: string, hour: number, on: boolean): string {
  let next = mask || allOnMask();
  for (let d = 0; d < 7; d++) {
    next = next.slice(0, d * 24 + hour) + (on ? "1" : "0") + next.slice(d * 24 + hour + 1);
  }
  return next;
}

export function DaypartingCard({
  scheduleType,
  dayparting,
  onScheduleTypeChange,
  onDaypartingChange,
}: Props) {
  const mask = dayparting || allOnMask();
  const activeCount = mask.split("").filter((c) => c === "1").length;

  // Quick presets that match common Salla-merchant patterns.
  const PRESETS: Array<{ id: string; label: string; build: () => string }> = [
    {
      id: "all_day",
      label: "All day, every day",
      build: () => allOnMask(),
    },
    {
      id: "business_hours",
      label: "Business hours (9am–6pm)",
      build: () => {
        let m = "0".repeat(168);
        for (let d = 0; d < 7; d++) {
          for (let h = 9; h < 18; h++) {
            m = m.slice(0, d * 24 + h) + "1" + m.slice(d * 24 + h + 1);
          }
        }
        return m;
      },
    },
    {
      id: "evening_peak",
      label: "Evening peak (6pm–midnight)",
      build: () => {
        let m = "0".repeat(168);
        for (let d = 0; d < 7; d++) {
          for (let h = 18; h < 24; h++) {
            m = m.slice(0, d * 24 + h) + "1" + m.slice(d * 24 + h + 1);
          }
        }
        return m;
      },
    },
    {
      id: "weekends",
      label: "Weekends only (Fri–Sat)",
      build: () => {
        // Map KSA weekend: Friday (idx 4) + Saturday (idx 5)
        let m = "0".repeat(168);
        for (const d of [4, 5]) {
          for (let h = 0; h < 24; h++) {
            m = m.slice(0, d * 24 + h) + "1" + m.slice(d * 24 + h + 1);
          }
        }
        return m;
      },
    },
  ];

  return (
    <SectionCard>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="size-4 text-primary" />
              Ad schedule
              <InfoTip text="Choose when your ads can deliver. Maps to TikTok's schedule_type + dayparting fields on the ad group." />
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Run continuously or limit delivery to specific hours of the week.
            </p>
          </div>
          {scheduleType === "CUSTOM" && (
            <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px] font-medium">
              {activeCount} / 168 hours active
            </Badge>
          )}
        </div>

        {/* Mode radio */}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/10 p-3 sm:flex-row">
          {(["ALL_DAY", "CUSTOM"] as const).map((mode) => {
            const selected = scheduleType === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onScheduleTypeChange(mode)}
                className={cn(
                  "flex flex-1 flex-col items-start gap-1 rounded-lg border-2 px-4 py-3 text-left transition-all",
                  selected
                    ? "border-[#a4ffe5] bg-[#e6fff9]"
                    : "border-border bg-white hover:border-[#a4ffe5]/60"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex size-4 items-center justify-center rounded-full border-2",
                    selected ? "border-[#004956] bg-[#004956]" : "border-muted-foreground/30"
                  )}>
                    {selected && <div className="size-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {mode === "ALL_DAY" ? "All day, every day" : "Custom hours"}
                  </span>
                </div>
                <p className="ml-6 text-[11px] text-muted-foreground">
                  {mode === "ALL_DAY"
                    ? "TikTok delivers your ad whenever budget and audience allow."
                    : "Pick the exact hours you want your ad to run."}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom hour grid */}
        {scheduleType === "CUSTOM" && (
          <>
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onDaypartingChange(p.build())}
                  className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-[#a4ffe5] hover:text-foreground"
                >
                  {p.label}
                </button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onDaypartingChange(allOnMask())}
                className="h-7 gap-1 text-[11px] text-muted-foreground"
              >
                <RotateCcw className="size-3" />
                Reset
              </Button>
            </div>

            {/* The grid */}
            <div className="overflow-x-auto rounded-xl border border-border bg-white p-2">
              <table className="w-full min-w-[640px] border-separate border-spacing-0.5 text-[10px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 w-12 bg-white text-left font-semibold text-muted-foreground"></th>
                    {Array.from({ length: 24 }, (_, h) => (
                      <th key={h} className="px-0.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            // Toggle whole column: if any active, turn all off; else turn all on
                            const anyOn = Array.from({ length: 7 }, (_, d) => getBit(mask, d, h)).some(Boolean);
                            onDaypartingChange(setHour(mask, h, !anyOn));
                          }}
                          className="w-full font-medium text-muted-foreground hover:text-foreground"
                        >
                          {h.toString().padStart(2, "0")}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day, d) => {
                    const dayAllOn = Array.from({ length: 24 }, (_, h) => getBit(mask, d, h)).every(Boolean);
                    return (
                      <tr key={day}>
                        <td className="sticky left-0 bg-white pr-2 text-left font-semibold">
                          <button
                            type="button"
                            onClick={() => onDaypartingChange(setDay(mask, d, !dayAllOn))}
                            className="w-full text-left text-[11px] text-foreground hover:text-[#004956]"
                          >
                            {day}
                          </button>
                        </td>
                        {Array.from({ length: 24 }, (_, h) => {
                          const on = getBit(mask, d, h);
                          return (
                            <td key={h} className="p-0">
                              <button
                                type="button"
                                onClick={() => onDaypartingChange(flipBit(mask, d, h))}
                                aria-label={`${day} ${h}:00`}
                                className={cn(
                                  "size-5 cursor-pointer rounded-sm transition-colors",
                                  on
                                    ? "bg-[#004956] hover:bg-[#003a44]"
                                    : "bg-muted/40 hover:bg-muted"
                                )}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] italic text-muted-foreground">
              Click individual cells, day labels (whole row), or hour numbers (whole column). Saudi merchants often perform best 8pm–1am — TikTok engagement peaks in the evening.
            </p>
          </>
        )}
      </div>
    </SectionCard>
  );
}
