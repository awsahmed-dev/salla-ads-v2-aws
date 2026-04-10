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

export function PlatformSwitcher() {
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);

  const handleBack = () => setActivePlatform(null);

  if (!activePlatform) {
    return <PlatformSelectionPage onSelect={setActivePlatform} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {activePlatform === "snapchat" && (
        <CampaignProvider>
          <CampaignWizard onBackToPlatforms={handleBack} />
        </CampaignProvider>
      )}
      {activePlatform === "tiktok" && (
        <TikTokCampaignProvider>
          <TikTokCampaignWizard onBackToPlatforms={handleBack} />
        </TikTokCampaignProvider>
      )}
      {activePlatform === "google" && (
        <GoogleCampaignProvider>
          <GoogleCampaignWizard onBackToPlatforms={handleBack} />
        </GoogleCampaignProvider>
      )}
      {activePlatform === "dv360" && (
        <DV360CampaignProvider>
          <DV360CampaignWizard onBackToPlatforms={handleBack} />
        </DV360CampaignProvider>
      )}
      {activePlatform === "meta" && (
        <MetaCampaignProvider>
          <MetaCampaignWizard onBackToPlatforms={handleBack} />
        </MetaCampaignProvider>
      )}
    </div>
  );
}
