"use client";

import { useCampaign } from "@/lib/snapchat/campaign-context";
import { StepIndicator } from "./step-indicator";
import { StepObjective } from "./step-objective";
import { StepAudience } from "./step-audience";
import { StepBudget } from "./step-budget";
import { StepCreative } from "./step-creative";
import { StepReview } from "./step-review";

export function CampaignWizard({ onBackToPlatforms }: { onBackToPlatforms?: () => void }) {
  const { step } = useCampaign();

  return (
    <div className="min-h-screen bg-background">
      {/* Hide the top step bar on step 0 (objective) -- full-page layout */}
      {step > 0 && (
        <header className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-6 py-3.5">
            <StepIndicator current={step} />
          </div>
        </header>
      )}
      <main className={step === 0 ? "" : "mx-auto max-w-7xl px-6 py-8"}>
        {step === 0 && <StepObjective onCancel={onBackToPlatforms} />}
        {step === 1 && <StepAudience />}
        {step === 2 && <StepBudget />}
        {step === 3 && <StepCreative />}
        {step === 4 && <StepReview />}
      </main>
    </div>
  );
}
