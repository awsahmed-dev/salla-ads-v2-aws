"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutGrid } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { SectionCard } from "@/components/shared/section-card";

export interface PlacementOption {
  value: string; label: string; desc: string;
  icon?: React.ReactNode; disabled?: boolean; disabledReason?: string;
}

export interface PlacementGroup {
  label: string; icon?: React.ReactNode;
  options: PlacementOption[]; selectedValues: string[];
  onToggle: (value: string) => void;
}

export interface PlacementConfigCardProps {
  mode?: "auto" | "manual";
  onModeChange?: (mode: "auto" | "manual") => void;
  autoLabel?: string; autoDesc?: string;
  manualLabel?: string; manualDesc?: string;
  groups?: PlacementGroup[];
  options?: PlacementOption[];
  selectedValues?: string[];
  onToggle?: (value: string) => void;
  accent?: string; title?: string; infoTipText?: string;
  alwaysShowOptions?: boolean;
}

export function PlacementConfigCard({
  mode, onModeChange,
  autoLabel = "Automatic Placements",
  autoDesc = "Let the platform optimize where your ads appear.",
  manualLabel = "Manual Placements",
  manualDesc = "Choose exactly where your ads are shown.",
  groups, options, selectedValues = [], onToggle,
  accent = "primary", title = "Placement",
  infoTipText = "Control where your ads appear across the platform.",
  alwaysShowOptions = false,
}: PlacementConfigCardProps) {
  const isHex = accent.startsWith("#");
  const accentStyle = isHex ? { color: accent } : undefined;
  const showOptions = alwaysShowOptions || mode === "manual";

  return (
    <SectionCard>
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <LayoutGrid className={cn("size-4", !isHex && "text-primary")} style={accentStyle} />
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
        <InfoTip text={infoTipText} />
      </div>

      {/* Mode toggle (auto / manual) */}
      {mode && onModeChange && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(["auto", "manual"] as const).map((m) => {
            const sel = mode === m;
            const lbl = m === "auto" ? autoLabel : manualLabel;
            const dsc = m === "auto" ? autoDesc : manualDesc;
            return (
              <button
                key={m} type="button" onClick={() => onModeChange(m)}
                className={cn(
                  "rounded-xl border px-3.5 py-3.5 text-left transition-all",
                  sel
                    ? isHex ? "border-2 shadow-sm" : "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/40",
                )}
                style={sel && isHex ? { borderColor: accent, backgroundColor: `${accent}08` } : undefined}
              >
                <span
                  className={cn("text-xs font-semibold", sel ? !isHex && "text-primary" : "text-foreground")}
                  style={sel && isHex ? accentStyle : undefined}
                >{lbl}</span>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{dsc}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Options area */}
      {showOptions && (
        <div className="flex flex-col gap-3">
          {groups?.map((g) => (
            <div key={g.label}>
              <div className="mb-2 flex items-center gap-2">
                {g.icon && <span className="text-muted-foreground">{g.icon}</span>}
                <span className="text-xs font-semibold text-foreground">{g.label}</span>
                <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">
                  {g.selectedValues.length}/{g.options.length}
                </Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                {g.options.map((o) => (
                  <OptionRow key={o.value} opt={o} on={g.selectedValues.includes(o.value)}
                    toggle={() => g.onToggle(o.value)} accent={accent} isHex={isHex} />
                ))}
              </div>
            </div>
          ))}

          {!groups && options && (
            <div className="flex flex-col gap-1.5">
              {options.map((o) => (
                <OptionRow key={o.value} opt={o} on={selectedValues.includes(o.value)}
                  toggle={() => onToggle?.(o.value)} accent={accent} isHex={isHex} />
              ))}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */

function OptionRow({ opt, on, toggle, accent, isHex }: {
  opt: PlacementOption; on: boolean; toggle: () => void; accent: string; isHex: boolean;
}) {
  const row = (
    <button
      type="button" disabled={opt.disabled} onClick={toggle}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
        opt.disabled ? "cursor-not-allowed border-border bg-muted/50 opacity-60"
          : on ? (isHex ? "border-2 shadow-sm" : "border-primary/40 bg-primary/5")
          : "border-border bg-background hover:border-primary/30",
      )}
      style={on && !opt.disabled && isHex ? { borderColor: accent, backgroundColor: `${accent}08` } : undefined}
    >
      {opt.icon && (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {opt.icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-foreground">{opt.label}</span>
        <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
      </div>
      <Switch
        checked={on} disabled={opt.disabled}
        onCheckedChange={toggle} onClick={(e) => e.stopPropagation()}
        className={cn(isHex && on && "[&[data-state=checked]]:bg-[var(--sw-accent)]")}
        style={isHex ? ({ "--sw-accent": accent } as React.CSSProperties) : undefined}
      />
    </button>
  );

  if (opt.disabled && opt.disabledReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{opt.disabledReason}</TooltipContent>
      </Tooltip>
    );
  }
  return row;
}
