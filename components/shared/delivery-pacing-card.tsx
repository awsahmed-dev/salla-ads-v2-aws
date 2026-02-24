"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { SectionCard } from "@/components/shared/section-card";

export interface PacingOption {
  value: string;
  label: string;
  desc: string;
  icon?: React.ReactNode;
  recommended?: boolean;
}

interface DeliveryPacingCardProps {
  title?: string;
  options: PacingOption[];
  selectedPacing: string;
  onPacingChange: (value: string) => void;
  layout?: "buttons" | "cards" | "radio";
  accent?: string;
  apiBadge?: string;
  infoTipText?: string;
  warnings?: React.ReactNode;
  children?: React.ReactNode;
}

export function DeliveryPacingCard({
  title = "Delivery Pacing",
  options,
  selectedPacing,
  onPacingChange,
  layout = "cards",
  accent = "primary",
  apiBadge,
  infoTipText = "Controls how fast your budget is spent.",
  warnings,
  children,
}: DeliveryPacingCardProps) {
  const isCustomAccent = accent.startsWith("#");
  const accentStyle = isCustomAccent ? { color: accent } : undefined;

  return (
    <SectionCard>
      <div className="mb-4 flex items-center gap-2">
        <Gauge
          className={cn("size-4", !isCustomAccent && "text-primary")}
          style={accentStyle}
        />
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
        {apiBadge && (
          <Badge
            variant="secondary"
            className="rounded-full px-1.5 py-0 text-[10px] font-normal"
          >
            {apiBadge}
          </Badge>
        )}
        <InfoTip text={infoTipText} />
      </div>

      {layout === "buttons" && (
        <div className="flex gap-2">
          {options.map((p) => {
            const selected = selectedPacing === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => onPacingChange(p.value)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/40"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    selected ? "text-primary" : "text-foreground"
                  )}
                >
                  {p.label}
                </span>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {layout === "cards" && (
        <div
          className={cn(
            "grid gap-2",
            options.length <= 2 ? "grid-cols-2" : "grid-cols-1"
          )}
        >
          {options.map((p) => {
            const selected = selectedPacing === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => onPacingChange(p.value)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-all",
                  selected
                    ? isCustomAccent
                      ? "border-2 shadow-sm"
                      : "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/40"
                )}
                style={
                  selected && isCustomAccent
                    ? {
                        borderColor: accent,
                        backgroundColor: `${accent}08`,
                      }
                    : undefined
                }
              >
                {p.icon && (
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      selected
                        ? !isCustomAccent &&
                            "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                    style={
                      selected && isCustomAccent
                        ? { backgroundColor: accent, color: "#fff" }
                        : undefined
                    }
                  >
                    {p.icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        selected
                          ? !isCustomAccent && "text-primary"
                          : "text-foreground"
                      )}
                      style={selected && isCustomAccent ? accentStyle : undefined}
                    >
                      {p.label}
                    </span>
                    {p.recommended && (
                      <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0 text-[8px] font-medium text-emerald-700">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {p.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {layout === "radio" && (
        <div className="flex flex-col gap-2">
          {options.map((p) => {
            const selected = selectedPacing === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => onPacingChange(p.value)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                  selected
                    ? isCustomAccent
                      ? "border-2 shadow-sm"
                      : "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/40"
                )}
                style={
                  selected && isCustomAccent
                    ? {
                        borderColor: accent,
                        backgroundColor: `${accent}08`,
                      }
                    : undefined
                }
              >
                <div
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                    selected ? "border-primary" : "border-muted-foreground/30"
                  )}
                  style={
                    selected && isCustomAccent
                      ? { borderColor: accent }
                      : undefined
                  }
                >
                  {selected && (
                    <div
                      className={cn(
                        "size-2 rounded-full",
                        !isCustomAccent && "bg-primary"
                      )}
                      style={
                        isCustomAccent
                          ? { backgroundColor: accent }
                          : undefined
                      }
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {p.label}
                    </span>
                    {p.recommended && (
                      <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0 text-[8px] font-medium text-emerald-700">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {warnings}
      {children}
    </SectionCard>
  );
}
