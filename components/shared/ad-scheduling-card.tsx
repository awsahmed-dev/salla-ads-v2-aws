"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { CalendarClock, Sparkles } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DAYS_OF_WEEK = [
  { key: "sunday", label: "Sun", short: "Su", emoji: "\u{1F324}" },
  { key: "monday", label: "Mon", short: "Mo", emoji: "\u{1F4C5}" },
  { key: "tuesday", label: "Tue", short: "Tu", emoji: "\u{1F4C5}" },
  { key: "wednesday", label: "Wed", short: "We", emoji: "\u{1F4C5}" },
  { key: "thursday", label: "Thu", short: "Th", emoji: "\u{1F4C5}" },
  { key: "friday", label: "Fri", short: "Fr", emoji: "\u{1F54C}" },
  { key: "saturday", label: "Sat", short: "Sa", emoji: "\u{1F6D2}" },
] as const;

const HOUR_PRESETS = [
  { label: "Morning", time: "6AM-12PM", hours: [6, 7, 8, 9, 10, 11], icon: "\u{1F305}" },
  { label: "Afternoon", time: "12PM-6PM", hours: [12, 13, 14, 15, 16, 17], icon: "\u2600\uFE0F" },
  { label: "Evening", time: "6PM-12AM", hours: [18, 19, 20, 21, 22, 23], icon: "\u{1F306}" },
  { label: "Night", time: "12AM-6AM", hours: [0, 1, 2, 3, 4, 5], icon: "\u{1F319}" },
];

const PEAK_HOURS = new Set([16, 17, 18, 19, 20, 21, 22, 23]);

const fmtHour = (h: number) => {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
};

/* ------------------------------------------------------------------ */
/*  Grid sub-component                                                 */
/* ------------------------------------------------------------------ */

function SchedulingGrid() {
  const [activeHours, setActiveHours] = useState<Record<string, Set<number>>>(() => {
    const initial: Record<string, Set<number>> = {};
    DAYS_OF_WEEK.forEach((d) => {
      initial[d.key] = new Set([16, 17, 18, 19, 20, 21, 22, 23]);
    });
    return initial;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove">("add");

  const setHour = useCallback((day: string, hour: number, active: boolean) => {
    setActiveHours((prev) => {
      const next = { ...prev };
      const set = new Set(prev[day]);
      if (active) set.add(hour); else set.delete(hour);
      next[day] = set;
      return next;
    });
  }, []);

  const applyPreset = (hours: number[]) => {
    setActiveHours(() => {
      const next: Record<string, Set<number>> = {};
      DAYS_OF_WEEK.forEach((d) => { next[d.key] = new Set(hours); });
      return next;
    });
  };

  const toggleRow = (dayKey: string) => {
    setActiveHours((prev) => {
      const current = prev[dayKey] ?? new Set();
      const next = { ...prev };
      next[dayKey] = current.size === 24 ? new Set() : new Set(Array.from({ length: 24 }, (_, i) => i));
      return next;
    });
  };

  const toggleColumn = (hour: number) => {
    setActiveHours((prev) => {
      const allActive = DAYS_OF_WEEK.every((d) => prev[d.key]?.has(hour));
      const next: Record<string, Set<number>> = {};
      DAYS_OF_WEEK.forEach((d) => {
        const set = new Set(prev[d.key]);
        if (allActive) set.delete(hour); else set.add(hour);
        next[d.key] = set;
      });
      return next;
    });
  };

  const selectAll = () => {
    setActiveHours(() => {
      const next: Record<string, Set<number>> = {};
      DAYS_OF_WEEK.forEach((d) => { next[d.key] = new Set(Array.from({ length: 24 }, (_, i) => i)); });
      return next;
    });
  };

  const clearAll = () => {
    setActiveHours(() => {
      const next: Record<string, Set<number>> = {};
      DAYS_OF_WEEK.forEach((d) => { next[d.key] = new Set(); });
      return next;
    });
  };

  const totalActive = DAYS_OF_WEEK.reduce((sum, d) => sum + (activeHours[d.key]?.size ?? 0), 0);
  const totalSlots = 7 * 24;
  const pct = Math.round((totalActive / totalSlots) * 100);

  const handlePointerDown = (day: string, hour: number) => {
    const isActive = activeHours[day]?.has(hour) ?? false;
    setIsDragging(true);
    setDragMode(isActive ? "remove" : "add");
    setHour(day, hour, !isActive);
  };

  const handlePointerEnter = (day: string, hour: number) => {
    if (!isDragging) return;
    setHour(day, hour, dragMode === "add");
  };

  const handlePointerUp = () => setIsDragging(false);

  return (
    <div className="mt-5 space-y-4" onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      {/* Presets row */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Presets</Label>
          <span className="text-[10px] text-muted-foreground">Saudi Time (UTC+3)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {HOUR_PRESETS.map((preset) => {
            const allMatch = DAYS_OF_WEEK.every((d) =>
              preset.hours.every((h) => activeHours[d.key]?.has(h))
            );
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.hours)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  allMatch
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="text-sm leading-none">{preset.icon}</span>
                <span>{preset.label}</span>
                <span className="text-[10px] opacity-70">{preset.time}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => applyPreset([...PEAK_HOURS])}
            className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10"
          >
            <Sparkles className="size-3" />
            <span>Peak Shopping</span>
            <span className="text-[10px] font-normal opacity-70">4PM-11PM</span>
          </button>
        </div>
      </div>

      {/* Coverage summary */}
      <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-2.5">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-foreground">Coverage</span>
            <span className={cn(
              "text-xs font-bold tabular-nums",
              pct >= 80 ? "text-emerald-600" : pct >= 40 ? "text-yellow-600" : pct > 0 ? "text-orange-600" : "text-muted-foreground"
            )}>{pct}%</span>
          </div>
          <div className="flex h-1.5 gap-px overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "rounded-full transition-all",
                pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-yellow-500" : pct > 0 ? "bg-orange-500" : "bg-muted"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {totalActive} of {totalSlots} slots active &middot; {pct >= 80 ? "Broad reach" : pct >= 40 ? "Balanced" : pct > 0 ? "Focused" : "No hours selected"}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={selectAll} className="rounded-md bg-background px-2 py-1 text-[10px] font-medium text-foreground shadow-sm transition-colors hover:bg-primary/5">All</button>
          <button type="button" onClick={clearAll} className="rounded-md bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-red-50 hover:text-red-600">Clear</button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="overflow-x-auto select-none" style={{ touchAction: "none" }}>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="w-14" />
                <th colSpan={12} className="border-r border-border/30 py-1 text-center font-semibold text-muted-foreground/60 uppercase tracking-widest">AM</th>
                <th colSpan={12} className="py-1 text-center font-semibold text-muted-foreground/60 uppercase tracking-widest">PM</th>
              </tr>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="w-14 px-2 py-1.5 text-left font-medium text-muted-foreground">Day</th>
                {Array.from({ length: 24 }, (_, h) => (
                  <th
                    key={h}
                    className={cn(
                      "min-w-[22px] cursor-pointer px-0 py-1.5 text-center font-medium transition-colors hover:text-primary",
                      PEAK_HOURS.has(h) ? "text-primary/70" : "text-muted-foreground",
                      h === 12 && "border-l border-border/30"
                    )}
                    onClick={() => toggleColumn(h)}
                    title={`Toggle all days at ${fmtHour(h)}`}
                  >
                    {fmtHour(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_OF_WEEK.map((day) => {
                const rowCount = activeHours[day.key]?.size ?? 0;
                const isWeekend = day.key === "friday" || day.key === "saturday";
                return (
                  <tr
                    key={day.key}
                    className={cn(
                      "border-b border-border/40 last:border-0 transition-colors",
                      isWeekend && "bg-primary/[0.02]"
                    )}
                  >
                    <td className="px-2 py-1">
                      <button
                        type="button"
                        onClick={() => toggleRow(day.key)}
                        className="group flex items-center gap-1 text-left"
                        title={`Toggle all hours for ${day.label}`}
                      >
                        <span className={cn(
                          "text-xs font-semibold transition-colors group-hover:text-primary",
                          isWeekend ? "text-primary/80" : "text-foreground"
                        )}>
                          {day.short}
                        </span>
                        <span className={cn(
                          "size-4 flex items-center justify-center rounded text-[8px] font-bold tabular-nums",
                          rowCount === 24 ? "bg-primary/10 text-primary" : rowCount > 0 ? "bg-muted text-muted-foreground" : "text-transparent"
                        )}>
                          {rowCount}
                        </span>
                      </button>
                    </td>
                    {Array.from({ length: 24 }, (_, h) => {
                      const isActive = activeHours[day.key]?.has(h) ?? false;
                      const isPeak = PEAK_HOURS.has(h);
                      return (
                        <td
                          key={h}
                          className={cn("px-0 py-[3px] text-center", h === 12 && "border-l border-border/20")}
                        >
                          <button
                            type="button"
                            onPointerDown={(e) => { e.preventDefault(); handlePointerDown(day.key, h); }}
                            onPointerEnter={() => handlePointerEnter(day.key, h)}
                            className={cn(
                              "mx-auto block size-[14px] cursor-pointer rounded-[3px] transition-all",
                              isActive
                                ? isPeak
                                  ? "bg-primary shadow-sm shadow-primary/30 hover:bg-primary/80"
                                  : "bg-primary/60 hover:bg-primary/80"
                                : isPeak
                                  ? "bg-primary/10 hover:bg-primary/25"
                                  : "bg-muted/80 hover:bg-primary/20"
                            )}
                            aria-label={`${day.label} ${fmtHour(h)}`}
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
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-sm bg-primary" /> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-sm bg-primary/60" /> Active (off-peak)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-sm bg-primary/10" /> Peak hour
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-sm bg-muted/80" /> Inactive
          </span>
        </div>
        <span>Drag to paint &middot; Click headers to toggle</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export: AdSchedulingCard                                      */
/* ------------------------------------------------------------------ */

interface AdSchedulingCardProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  infoTipText?: string;
}

export function AdSchedulingCard({
  enabled,
  onToggle,
  infoTipText = "Choose specific days and hours to show your ads. Times are in Saudi Arabia time (AST, UTC+3).",
}: AdSchedulingCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 transition-colors",
        enabled
          ? "border-primary/30 bg-primary/5"
          : "border-border/60 bg-background"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            enabled ? "bg-primary/10" : "bg-muted/60"
          )}>
            <CalendarClock className={cn("size-4", enabled ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-foreground">Custom Schedule</p>
              <InfoTip text={infoTipText} />
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {enabled
                ? "Run ads only during specific hours. Best for targeting peak shopping times."
                : "Ads run 24/7 throughout the campaign duration."}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </div>
      {enabled && <SchedulingGrid />}
    </div>
  );
}
