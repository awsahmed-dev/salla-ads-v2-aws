"use client";

import { useEffect } from "react";
import { useDV360Campaign } from "@/lib/dv360/campaign-context";
import { DV360StepIndicator } from "./step-indicator";
import { DV360StepObjective } from "./step-objective";
import { DV360StepAudience } from "./step-audience";
import { DV360StepBudget } from "./step-budget";
import { DV360StepCreative } from "./step-creative";
import { DV360StepReview } from "./step-review";

export function DV360CampaignWizard({ onBackToPlatforms }: { onBackToPlatforms?: () => void }) {
  const { step } = useDV360Campaign();

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  return (
    <div className="min-h-screen bg-background">
      {step > 0 && (
        <header className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-6 py-3.5">
            <DV360StepIndicator current={step} />
          </div>
        </header>
      )}
      <main className={step === 0 ? "" : "mx-auto max-w-7xl px-6 py-8"}>
        {step === 0 && <DV360StepObjective onCancel={onBackToPlatforms} />}
        {step === 1 && <DV360StepAudience />}
        {step === 2 && <DV360StepBudget />}
        {step === 3 && <DV360StepCreative />}
        {step === 4 && <DV360StepReview />}
      </main>
    </div>
  );
}
