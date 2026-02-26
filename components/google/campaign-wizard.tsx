"use client";

import { useGoogleCampaign } from "@/lib/google/campaign-context";
import { GoogleStepIndicator } from "./step-indicator";
import { GoogleStepObjective } from "./step-objective";
import { GoogleStepBudget } from "./step-budget";
import { GoogleStepAudience } from "./step-audience";
import { GoogleStepCreative } from "./step-creative";
import { GoogleStepReview } from "./step-review";

export function GoogleCampaignWizard() {
  const { step } = useGoogleCampaign();

  return (
    <div className="min-h-screen bg-background">
      {step > 0 && (
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-3xl px-6 py-3.5">
            <GoogleStepIndicator current={step} />
          </div>
        </header>
      )}
      <main className={step === 0 ? "" : "mx-auto max-w-7xl px-6 py-8"}>
        {step === 0 && <GoogleStepObjective />}
        {step === 1 && <GoogleStepAudience />}
        {step === 2 && <GoogleStepBudget />}
        {step === 3 && <GoogleStepCreative />}
        {step === 4 && <GoogleStepReview />}
      </main>
    </div>
  );
}
