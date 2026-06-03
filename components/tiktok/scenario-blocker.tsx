"use client";

/**
 * Scenario D blocker — surfaces in all three Sales steps (Audience,
 * Budget, Design) when the merchant has BOTH the Catalog toggle and
 * the Search-Ads toggle enabled. TikTok does not deliver dynamic
 * catalog carousels inside Search inventory, so this combination is
 * unbuildable. The blocker is non-dismissible — it disables Next and
 * tells the merchant which toggle to flip back.
 */

import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTikTokCampaign } from "@/lib/tiktok/campaign-context";
import { getSalesScenario } from "@/lib/tiktok/scenario";
import { cn } from "@/lib/utils";

interface Props {
  /** Optional className for layout wrappers. */
  className?: string;
}

export function ScenarioDBlocker({ className }: Props) {
  const { campaign, setStep, updateNested } = useTikTokCampaign();
  const scenario = getSalesScenario(campaign);

  if (!scenario.isBlocked) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-4 rounded-2xl border-2 border-destructive bg-destructive/5 p-5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
          <AlertOctagon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            Catalog Ads and Search Ads cannot be combined
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {scenario.blockReason}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Why:</span> Catalog
            campaigns use the dynamic Smart+ feed-driven carousel surface;
            Search campaigns deliver into TikTok&apos;s search-result inventory
            with manually-typed keywords. TikTok does not render product feeds
            inside Search results — the two surfaces are mutually exclusive.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            updateNested("objective", { searchAdsEnabled: false });
            setStep(0);
          }}
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          Keep Catalog → turn Search off
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            updateNested("objective", { catalogEnabled: false });
            setStep(0);
          }}
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          Keep Search → turn Catalog off
        </Button>
      </div>
    </div>
  );
}
