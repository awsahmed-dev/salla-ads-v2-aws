"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tv, ShieldCheck, Layers, AlertCircle } from "lucide-react";
import { type AdGroup } from "@/lib/snapchat/campaign-types";

export function CommercialSection({
  ad,
  onUpdate,
  isInfluencer,
}: {
  ad: AdGroup;
  onUpdate: (next: AdGroup) => void;
  isInfluencer?: boolean;
}) {
  const isEligibleFormat = ad.adFormat === "SINGLE" && (ad.adDestination === "WEBSITE" || ad.adDestination === "DEEP_LINK");
  const hasVideo = ad.assets.some((a) => a.mediaType === "VIDEO");
  if (!isEligibleFormat || !hasVideo) return null;

  const commercialMode = ad.commercialConfig?.enabled
    ? (ad.commercialConfig?.forcedViewEligibility === "FULL_DURATION" ? "FULL_DURATION" : "SIX_SECONDS")
    : "off";

  // Auto-determine forced_view_eligibility based on video.
  // In production we'd read actual duration from the file. For the MVP we
  // default to SIX_SECONDS (covers 7s+ videos, which is the vast majority).
  // If the merchant uploads a 3-6s clip we'd auto-switch to FULL_DURATION.
  // Content bundle always defaults to ALL_SHOWS for maximum reach.
  const handleCommercialChange = (mode: "off" | "SIX_SECONDS" | "FULL_DURATION") => {
    if (mode === "off") {
      onUpdate({
        ...ad,
        commercialConfig: {
          enabled: false,
          forcedViewEligibility: "SIX_SECONDS",
          premiumContentBundle: "ALL_SHOWS",
        },
      });
    } else {
      onUpdate({
        ...ad,
        commercialConfig: {
          enabled: true,
          forcedViewEligibility: mode,
          premiumContentBundle: "ALL_SHOWS",
        },
      });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-violet-100">
            <Tv className="size-3.5 text-violet-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-foreground">Commercial</span>
            <p className="text-xs text-muted-foreground">Non-skippable video in Discover Shows</p>
          </div>
        </div>
        <Select value={commercialMode} onValueChange={(v) => handleCommercialChange(v as "off" | "SIX_SECONDS" | "FULL_DURATION")}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Off</SelectItem>
            <SelectItem value="SIX_SECONDS">6s</SelectItem>
            <SelectItem value="FULL_DURATION">Full Duration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {commercialMode !== "off" && (
        <div className="border-t border-border px-3 pb-2.5 pt-2">
          <div className="flex items-start gap-2 rounded-lg bg-violet-50 px-2.5 py-2">
            <ShieldCheck className="mt-px size-3.5 shrink-0 text-violet-600" />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-medium text-violet-900">
                {commercialMode === "FULL_DURATION"
                  ? "Entire video is non-skippable"
                  : "First 6 seconds are non-skippable"}
              </p>
              <p className="text-xs leading-relaxed text-violet-600">
                {commercialMode === "FULL_DURATION"
                  ? "Your video ad will play inside Snapchat Discover Shows. Viewers must watch the entire video (3-6 seconds) before they can skip. This guarantees complete brand exposure."
                  : "Your video ad will play inside Snapchat Discover Shows. Viewers must watch the first 6 seconds before they can skip. This guarantees meaningful brand exposure."}
              </p>
            </div>
          </div>

          {isInfluencer && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
              <AlertCircle className="mt-px size-3.5 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-700">
                This ad uses influencer content — you cannot control the video duration. Ensure the creator&apos;s video meets Commercial requirements ({commercialMode === "FULL_DURATION" ? "3–6 seconds" : "7+ seconds"}) before enabling.
              </p>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3 text-muted-foreground" />
              <span className="text-[11px] font-medium text-foreground">Content Bundle</span>
            </div>
            <Select
              value={ad.commercialConfig?.premiumContentBundle ?? "ALL_SHOWS"}
              onValueChange={(v) => onUpdate({
                ...ad,
                commercialConfig: {
                  ...ad.commercialConfig!,
                  premiumContentBundle: v as "ALL_SHOWS" | "LIFESTYLE_SPORTS",
                },
              })}
            >
              <SelectTrigger className="h-7 w-36 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_SHOWS">All Shows (max reach)</SelectItem>
                <SelectItem value="LIFESTYLE_SPORTS">Lifestyle & Sports</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
