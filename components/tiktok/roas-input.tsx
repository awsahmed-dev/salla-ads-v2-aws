"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/shared/info-tip";

interface RoasInputProps {
  roasBid: number | undefined | null;
  onChange: (value: number) => void;
}

export function RoasInput({ roasBid, onChange }: RoasInputProps) {
  const rv: number = typeof roasBid === "number" && Number.isFinite(roasBid) ? roasBid : 1;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2">
        <BarChart3 className="size-3.5 text-muted-foreground" />
        <Label className="text-xs font-medium text-foreground">Minimum ROAS Target</Label>
        <InfoTip text="The minimum Return on Ad Spend you want to achieve. TikTok will optimize delivery to meet or exceed this target. Maps to API roas_bid with deep_bid_type: VO_MIN_ROAS." />
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="relative">
          <Input
            type="number"
            min={0.01}
            max={1000}
            step={0.1}
            value={rv}
            onChange={(e) => onChange(Math.max(0.01, Number(e.target.value) || 1))}
            className="h-9 pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">x</span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {`A ROAS of ${rv}x means for every SAR 1 spent, you expect at least SAR ${rv.toFixed(2)} in revenue. Suggested: 2.0x - 5.0x for e-commerce.`}
        </p>
      </div>
    </div>
  );
}
