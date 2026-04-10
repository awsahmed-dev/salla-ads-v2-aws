"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { SectionCard } from "@/components/shared/section-card";

export interface ConversionEventOption {
  value: string;
  label: string;
  desc: string;
  icon?: React.ReactNode;
  funnelStage?: string;
  recommended?: boolean;
}

interface RoasConfig {
  value: number | undefined;
  onChange: (v: number) => void;
  label?: string;
  apiBadge?: string;
}

interface ConversionEventCardProps {
  title?: string;
  events: ConversionEventOption[];
  selectedEvent: string;
  onEventChange: (value: string) => void;
  roas?: RoasConfig;
  accent?: string;
  apiBadge?: string;
  infoTipText?: string;
  tip?: string;
  children?: React.ReactNode;
}

export function ConversionEventCard({
  title = "Conversion Event",
  events,
  selectedEvent,
  onEventChange,
  roas,
  accent = "primary",
  apiBadge,
  infoTipText = "The specific action the platform will optimize for.",
  tip,
  children,
}: ConversionEventCardProps) {
  const isCustomAccent = accent.startsWith("#");
  const accentStyle = isCustomAccent ? { color: accent } : undefined;
  const selectedBorder = isCustomAccent
    ? { borderColor: accent }
    : undefined;
  const selectedBg = isCustomAccent
    ? { backgroundColor: `${accent}08` }
    : undefined;
  const iconBg = isCustomAccent
    ? { backgroundColor: accent, color: "#fff" }
    : undefined;

  return (
    <SectionCard>
      <div className="mb-4 flex items-center gap-2">
        <Zap
          className={cn("size-4", !isCustomAccent && "text-primary")}
          style={accentStyle}
        />
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
        {apiBadge && (
          <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">
            {apiBadge}
          </Badge>
        )}
        <InfoTip text={infoTipText} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {events.map((ev) => {
          const selected = selectedEvent === ev.value;
          return (
            <button
              key={ev.value}
              type="button"
              onClick={() => onEventChange(ev.value)}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
                selected
                  ? isCustomAccent
                    ? "border-2 shadow-sm"
                    : "border-primary bg-primary/5 shadow-sm"
                  : isCustomAccent
                    ? "border-2 border-border bg-background hover:border-primary/40"
                    : "border-border bg-background hover:border-primary/40"
              )}
              style={selected ? { ...selectedBorder, ...selectedBg } : undefined}
            >
              {ev.icon && (
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    selected
                      ? !isCustomAccent && "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                  style={selected && isCustomAccent ? iconBg : undefined}
                >
                  {ev.icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    {ev.label}
                  </span>
                  {ev.recommended && (
                    <Badge className="rounded-full border-0 bg-emerald-100 px-1 py-0 text-[11px] font-medium text-emerald-700">
                      Best
                    </Badge>
                  )}
                  {ev.funnelStage && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {ev.funnelStage}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {ev.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {tip && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
          <p className="text-[11px] leading-relaxed text-emerald-700">
            <span className="font-semibold">Salla Tip:</span> {tip}
          </p>
        </div>
      )}

      {roas && (
        <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Label className="text-xs font-semibold text-foreground">
              {roas.label ?? "Minimum ROAS Target"}
            </Label>
            {roas.apiBadge && (
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">
                {roas.apiBadge}
              </Badge>
            )}
          </div>
          <p className="mb-3 text-[11px] text-muted-foreground">
            Set the minimum return on ad spend you want. The platform will
            optimize delivery to meet this target.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                type="number"
                min={0.01}
                max={1000}
                step={0.1}
                value={roas.value ?? ""}
                onChange={(e) => roas.onChange(Number(e.target.value))}
                className="h-10 text-base font-semibold"
                placeholder="e.g. 3.0"
              />
            </div>
            <div className="shrink-0 text-center">
              <p className="text-xs text-muted-foreground">
                SAR 1 spent → SAR {(roas.value || 0).toFixed(1)}
              </p>
              <p className="text-xs font-medium text-emerald-600">
                Recommended: 2.0x - 5.0x
              </p>
            </div>
          </div>
        </div>
      )}

      {children}
    </SectionCard>
  );
}
