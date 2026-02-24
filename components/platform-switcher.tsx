"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
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

type Platform = "snapchat" | "tiktok" | "google" | "dv360" | "meta";

const PLATFORMS: {
  id: Platform;
  name: string;
  logo: React.ReactNode;
  active: boolean;
}[] = [
  {
    id: "snapchat",
    name: "Snapchat",
    active: true,
    logo: (
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
        <path d="M12.166 3c.796 0 3.495.223 4.769 3.073.476 1.066.362 2.861.27 4.269l-.012.193c-.023.38-.044.714-.044.98a.6.6 0 0 0 .282.09c.249 0 .556-.156.912-.463a.58.58 0 0 1 .376-.141.544.544 0 0 1 .378.166c.243.253.175.561.082.712-.284.456-.126.72.016.937.193.295.193.549-.005.797-.274.346-.84.594-1.631.716a2.79 2.79 0 0 0-.264.049c-.074.023-.157.069-.198.312-.047.278-.29.474-.606.488-.34.014-.673.187-1.059.381-.545.274-1.22.614-2.244.614-.036 0-.073-.001-.11-.003-.038.002-.076.003-.114.003-1.024 0-1.698-.34-2.243-.614-.387-.194-.72-.367-1.06-.381-.316-.014-.559-.21-.605-.488-.041-.243-.125-.29-.198-.312a2.765 2.765 0 0 0-.265-.049c-.79-.122-1.357-.37-1.631-.716-.198-.248-.198-.502-.005-.797.142-.217.3-.481.016-.937-.093-.151-.161-.459.082-.712a.544.544 0 0 1 .378-.166.58.58 0 0 1 .376.14c.356.308.663.464.912.464a.6.6 0 0 0 .282-.09c0-.267-.021-.6-.044-.98l-.012-.194c-.092-1.408-.206-3.203.27-4.269C8.505 3.223 11.204 3 12 3h.166Z" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    name: "TikTok",
    active: true,
    logo: (
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
        <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
      </svg>
    ),
  },
  {
    id: "google",
    name: "Google Ads",
    active: true,
    logo: (
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48Z" />
      </svg>
    ),
  },
  {
    id: "dv360",
    name: "YouTube (DV360)",
    active: true,
    logo: (
      <svg viewBox="0 0 24 24" className="size-4 text-red-600" fill="currentColor">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.76 31.76 0 0 0 0 12a31.76 31.76 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.76 31.76 0 0 0 24 12a31.76 31.76 0 0 0-.5-5.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
      </svg>
    ),
  },
  {
    id: "meta",
    name: "Meta",
    active: true,
    logo: (
      <svg viewBox="0 0 24 24" className="size-4 text-[#1877F2]" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
      </svg>
    ),
  },
];

export function PlatformSwitcher() {
  const [activePlatform, setActivePlatform] = useState<Platform>("tiktok");

  return (
    <div className="min-h-screen bg-background">
      {/* Platform switcher — single source of truth for ad platform */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-3">
          <span className="mr-2 text-sm font-medium text-muted-foreground">Ad platform</span>
          <div className="flex flex-wrap items-center gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={!p.active}
                onClick={() => p.active && setActivePlatform(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  !p.active
                    ? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground opacity-60"
                    : activePlatform === p.id
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {p.logo}
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active platform wizard */}
      {activePlatform === "snapchat" && (
        <CampaignProvider>
          <CampaignWizard />
        </CampaignProvider>
      )}
      {activePlatform === "tiktok" && (
        <TikTokCampaignProvider>
          <TikTokCampaignWizard />
        </TikTokCampaignProvider>
      )}
      {activePlatform === "google" && (
        <GoogleCampaignProvider>
          <GoogleCampaignWizard />
        </GoogleCampaignProvider>
      )}
      {activePlatform === "dv360" && (
        <DV360CampaignProvider>
          <DV360CampaignWizard />
        </DV360CampaignProvider>
      )}
      {activePlatform === "meta" && (
        <MetaCampaignProvider>
          <MetaCampaignWizard />
        </MetaCampaignProvider>
      )}
    </div>
  );
}
