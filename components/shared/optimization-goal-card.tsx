"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { SectionCard } from "@/components/shared/section-card";

export interface GoalOption {
  value: string;
  label: string;
  desc: string;
  icon?: React.ReactNode;
  recommended?: boolean;
  billingLabel?: string;
  bestFor?: string;
  costHint?: string;
  requiresPixel?: boolean;
  requiresMMP?: boolean;
  locked?: boolean;
}

interface OptimizationGoalCardProps {
  goals: GoalOption[];
  selectedGoal: string;
  onGoalChange: (value: string) => void;
  layout?: "grid" | "list";
  subtitle?: string;
  accent?: string;
  apiBadge?: string;
  warnings?: React.ReactNode;
  infoTipText?: string;
  children?: React.ReactNode;
}

export function OptimizationGoalCard({
  goals,
  selectedGoal,
  onGoalChange,
  layout = "list",
  subtitle,
  accent = "primary",
  apiBadge,
  warnings,
  infoTipText = "Choose what action you want to optimize for.",
  children,
}: OptimizationGoalCardProps) {
  const accentBorder = accent.startsWith("#")
    ? { borderColor: accent }
    : undefined;
  const accentBg = accent.startsWith("#")
    ? { backgroundColor: `${accent}08` }
    : undefined;
  const accentText = accent.startsWith("#") ? { color: accent } : undefined;

  const selectedClass = accent.startsWith("#")
    ? "shadow-sm border-2"
    : "border-primary bg-primary/5 shadow-sm";
  const iconSelectedClass = accent.startsWith("#")
    ? ""
    : "bg-primary text-primary-foreground";
  const labelSelectedClass = accent.startsWith("#")
    ? ""
    : "text-primary";
  const bestForClass = accent.startsWith("#")
    ? ""
    : "text-primary/80";

  return (
    <SectionCard>
      <div className="mb-4 flex items-center gap-2">
        <Target
          className={cn("size-4", !accent.startsWith("#") && "text-primary")}
          style={accentText}
        />
        <Label className="text-sm font-semibold text-foreground">
          Optimization Goal
        </Label>
        {apiBadge && (
          <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px] font-normal">
            {apiBadge}
          </Badge>
        )}
        <InfoTip text={infoTipText} />
      </div>

      {subtitle && (
        <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>
      )}

      <div
        className={cn(
          "grid gap-2.5",
          layout === "grid" &&
            (goals.length <= 3
              ? "grid-cols-3"
              : "grid-cols-2 sm:grid-cols-3")
        )}
      >
        {goals.map((g) => {
          const selected = selectedGoal === g.value;
          const isLocked = g.locked;

          return layout === "grid" ? (
            <button
              key={g.value}
              type="button"
              disabled={isLocked}
              onClick={() => !isLocked && onGoalChange(g.value)}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background hover:border-primary/40",
                isLocked && "cursor-not-allowed opacity-50"
              )}
            >
              {g.icon && (
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : isLocked
                        ? "bg-muted/60 text-muted-foreground/50"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {g.icon}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-1">
                <span className={cn("text-xs font-semibold", isLocked ? "text-muted-foreground" : "text-foreground")}>
                  {g.label}
                </span>
                {g.recommended && !isLocked && (
                  <Badge className="rounded-full border-0 bg-emerald-100 px-1 py-0 text-[8px] font-medium text-emerald-700">
                    Best
                  </Badge>
                )}
                {g.requiresPixel && !isLocked && (
                  <Badge variant="outline" className="rounded-full px-1 py-0 text-[8px]">
                    Pixel
                  </Badge>
                )}
                {isLocked && g.requiresPixel && (
                  <Badge variant="outline" className="rounded-full border-amber-300 bg-amber-50 px-1 py-0 text-[8px] text-amber-600">
                    Pixel needed
                  </Badge>
                )}
                {isLocked && g.requiresMMP && (
                  <Badge variant="outline" className="rounded-full border-orange-300 bg-orange-50 px-1 py-0 text-[8px] text-orange-600">
                    MMP needed
                  </Badge>
                )}
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground">
                {isLocked && g.requiresPixel
                  ? "Set up your Snap Pixel first to unlock this goal."
                  : g.desc}
              </p>
              {selected && g.costHint && (
                <span className="mt-0.5 text-[9px] font-medium text-primary/70">{g.costHint}</span>
              )}
            </button>
          ) : (
            <button
              key={g.value}
              type="button"
              disabled={isLocked}
              onClick={() => !isLocked && onGoalChange(g.value)}
              className={cn(
                "relative flex items-start gap-3.5 rounded-xl border px-4 py-4 text-left transition-all",
                selected ? selectedClass : "border-border bg-background hover:border-primary/40",
                isLocked && "cursor-not-allowed opacity-50"
              )}
              style={selected ? { ...accentBorder, ...accentBg } : undefined}
            >
              {g.icon && (
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    selected
                      ? iconSelectedClass
                      : isLocked
                        ? "bg-muted/60 text-muted-foreground/50"
                        : "bg-muted text-muted-foreground"
                  )}
                  style={selected && accent.startsWith("#") ? { backgroundColor: accent, color: "#fff" } : undefined}
                >
                  {g.icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      selected ? labelSelectedClass : isLocked ? "text-muted-foreground" : "text-foreground"
                    )}
                    style={selected ? accentText : undefined}
                  >
                    {g.label}
                  </span>
                  {g.recommended && !isLocked && (
                    <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0 text-[10px] font-medium text-emerald-700">
                      Recommended
                    </Badge>
                  )}
                  {g.billingLabel && (
                    <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px] font-normal">
                      {g.billingLabel}
                    </Badge>
                  )}
                  {isLocked && g.requiresPixel && (
                    <Badge variant="outline" className="rounded-full border-amber-300 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-600">
                      Pixel needed
                    </Badge>
                  )}
                  {isLocked && g.requiresMMP && (
                    <Badge variant="outline" className="rounded-full border-orange-300 bg-orange-50 px-1.5 py-0 text-[10px] text-orange-600">
                      MMP needed
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isLocked && g.requiresPixel
                    ? "Set up your Snap Pixel in the Objective step to unlock this goal."
                    : g.desc}
                </p>
                {selected && g.bestFor && (
                  <p
                    className={cn("mt-1 text-xs font-medium", bestForClass)}
                    style={accent.startsWith("#") ? accentText : undefined}
                  >
                    {g.bestFor}
                  </p>
                )}
                {selected && g.costHint && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                    {g.costHint}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {warnings}
      {children}
    </SectionCard>
  );
}
