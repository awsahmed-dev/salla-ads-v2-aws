"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { SectionCard } from "@/components/shared/section-card";

export interface BrandSafetyLevel {
  value: string;
  label: string;
  desc: string;
  recommended?: boolean;
}

interface BrandSafetyCardProps {
  levels: BrandSafetyLevel[];
  selectedLevel: string;
  onLevelChange: (value: string) => void;
  title?: string;
  accent?: string;
  infoTipText?: string;
  apiBadge?: string;
}

export function BrandSafetyCard({
  levels,
  selectedLevel,
  onLevelChange,
  title = "Brand Safety",
  accent = "primary",
  infoTipText = "Controls which content categories your ads can appear alongside.",
  apiBadge,
}: BrandSafetyCardProps) {
  const custom = accent.startsWith("#");
  const accentStyle = custom ? { color: accent } : undefined;

  return (
    <SectionCard>
      <div className="mb-4 flex items-center gap-2">
        <Shield className={cn("size-4", !custom && "text-primary")} style={accentStyle} />
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
        {apiBadge && (
          <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px] font-normal">
            {apiBadge}
          </Badge>
        )}
        <InfoTip text={infoTipText} />
      </div>

      <div className="grid grid-cols-1 gap-2">
        {levels.map((l) => {
          const on = selectedLevel === l.value;
          return (
            <button
              key={l.value}
              type="button"
              onClick={() => onLevelChange(l.value)}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-all",
                on
                  ? custom
                    ? "border-2 shadow-sm"
                    : "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background hover:border-primary/40",
              )}
              style={
                on && custom
                  ? { borderColor: accent, backgroundColor: `${accent}08` }
                  : undefined
              }
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      on ? !custom && "text-primary" : "text-foreground",
                    )}
                    style={on && custom ? accentStyle : undefined}
                  >
                    {l.label}
                  </span>
                  {l.recommended && (
                    <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0 text-[8px] font-medium text-emerald-700">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{l.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
