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
          <div className="mx-auto max-w-3xl px-6 py-3.5">
            <TikTokStepIndicator current={step} />
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
