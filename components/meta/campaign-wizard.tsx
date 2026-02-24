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
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-2">
              {/* Meta logo */}
              <svg viewBox="0 0 24 24" className="size-5 text-[#1877F2]" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
              </svg>
              <span className="text-base font-bold text-foreground">Salla Ads</span>
            </div>
            <div className="w-full max-w-2xl px-8">
              <MetaStepIndicator current={step} />
            </div>
            <span className="text-xs text-muted-foreground">
              Step {step} of 4
            </span>
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
