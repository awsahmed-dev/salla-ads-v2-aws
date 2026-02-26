"use client";

import { useMetaCampaign } from "@/lib/meta/campaign-context";
import { MetaStepIndicator } from "./step-indicator";
import { MetaStepObjective } from "./step-objective";
import { MetaStepAudience } from "./step-audience";
import { MetaStepBudget } from "./step-budget";
import { MetaStepCreative } from "./step-creative";
import { MetaStepReview } from "./step-review";

export function MetaCampaignWizard() {
  const { step } = useMetaCampaign();

  return (
    <div className="min-h-screen bg-background">
      {step > 0 && (
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-3xl px-6 py-3.5">
            <MetaStepIndicator current={step} />
          </div>
        </header>
      )}
      <main className={step === 0 ? "" : "mx-auto max-w-7xl px-6 py-8"}>
        {step === 0 && <MetaStepObjective />}
        {step === 1 && <MetaStepAudience />}
        {step === 2 && <MetaStepBudget />}
        {step === 3 && <MetaStepCreative />}
        {step === 4 && <MetaStepReview />}
      </main>
    </div>
  );
}
