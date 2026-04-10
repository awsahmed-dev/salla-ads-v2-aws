"use client";

import { useState } from "react";
import { PlatformSelectionPage, type Platform } from "@/components/shared/platform-selection-page";
import { CampaignProvider } from "@/lib/snapchat/campaign-context";
import { CampaignWizard } from "@/components/snapchat/campaign-wizard";
import { TikTokCampaignProvider } from "@/lib/tiktok/campaign-context";
import { TikTokCampaignWizard } from "@/components/tiktok/campaign-wizard";
import { GoogleCampaignProvider } from "@/lib/google/campaign-context";
import { GoogleCampaignWizard } from "@/components/google/campaign-wizard";
import { DV360CampaignProvider } from "@/lib/dv360/campaign-context";
import { DV360CampaignWizard } from "@/components/dv360/campaign-wizard";
import { MetaCampaignProvider } from "@/lib/meta/campaign-context";
import { MetaCampaignWizard } from "@/components/meta/campaign-wizard";

interface ActiveState {
  platform: Platform;
  draftId?: string;
}

export function PlatformSwitcher() {
  const [active, setActive] = useState<ActiveState | null>(null);

  const handleBack = () => setActive(null);
  const handleSelect = (platform: Platform) => setActive({ platform });
  const handleResumeDraft = (platform: Platform, draftId: string) => setActive({ platform, draftId });
  const handleTemplate = (platform: Platform) => setActive({ platform });

  if (!active) {
    return (
      <PlatformSelectionPage
        onSelect={handleSelect}
        onResumeDraft={handleResumeDraft}
        onTemplate={handleTemplate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {active.platform === "snapchat" && (
        <CampaignProvider draftId={active.draftId}>
          <CampaignWizard onBackToPlatforms={handleBack} />
        </CampaignProvider>
      )}
      {active.platform === "tiktok" && (
        <TikTokCampaignProvider>
          <TikTokCampaignWizard onBackToPlatforms={handleBack} />
        </TikTokCampaignProvider>
      )}
      {active.platform === "google" && (
        <GoogleCampaignProvider>
          <GoogleCampaignWizard onBackToPlatforms={handleBack} />
        </GoogleCampaignProvider>
      )}
      {active.platform === "dv360" && (
        <DV360CampaignProvider>
          <DV360CampaignWizard onBackToPlatforms={handleBack} />
        </DV360CampaignProvider>
      )}
      {active.platform === "meta" && (
        <MetaCampaignProvider>
          <MetaCampaignWizard onBackToPlatforms={handleBack} />
        </MetaCampaignProvider>
      )}
    </div>
  );
}
