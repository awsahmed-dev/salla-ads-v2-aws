"use client";

import { useTikTokCampaign } from "@/lib/tiktok/campaign-context";
import { TikTokStepIndicator } from "./step-indicator";
import { TikTokStepObjective } from "./step-objective";
import { TikTokStepAudience } from "./step-audience";
import { TikTokStepBudget } from "./step-budget";
import { TikTokStepCreative } from "./step-creative";
import { TikTokStepReview } from "./step-review";

export function TikTokCampaignWizard() {
  const { step } = useTikTokCampaign();

  return (
    <div className="min-h-screen bg-background">
      {step > 0 && (
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
              </svg>
              <span className="text-base font-bold text-foreground">Salla Ads</span>
            </div>
            <div className="w-full max-w-2xl px-8">
              <TikTokStepIndicator current={step} />
            </div>
            <span className="text-xs text-muted-foreground">
              Step {step} of 4
            </span>
          </div>
        </header>
      )}
      <main className={step === 0 ? "" : "mx-auto max-w-7xl px-6 py-8"}>
        {step === 0 && <TikTokStepObjective />}
        {step === 1 && <TikTokStepAudience />}
        {step === 2 && <TikTokStepBudget />}
        {step === 3 && <TikTokStepCreative />}
        {step === 4 && <TikTokStepReview />}
      </main>
    </div>
  );
}
