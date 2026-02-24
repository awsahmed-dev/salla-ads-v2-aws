"use client";

import { useDV360Campaign } from "@/lib/dv360/campaign-context";
import { DV360StepIndicator } from "./step-indicator";
import { DV360StepObjective } from "./step-objective";
import { DV360StepAudience } from "./step-audience";
import { DV360StepBudget } from "./step-budget";
import { DV360StepCreative } from "./step-creative";
import { DV360StepReview } from "./step-review";

export function DV360CampaignWizard() {
  const { step } = useDV360Campaign();

  return (
    <div className="min-h-screen bg-background">
      {step > 0 && (
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-2">
              {/* YouTube / DV360 logo */}
              <svg viewBox="0 0 24 24" className="size-5 text-red-600" fill="currentColor">
                <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.76 31.76 0 0 0 0 12a31.76 31.76 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.76 31.76 0 0 0 24 12a31.76 31.76 0 0 0-.5-5.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
              </svg>
              <span className="text-base font-bold text-foreground">Salla Ads -- YouTube</span>
            </div>
            <div className="w-full max-w-2xl px-8">
              <DV360StepIndicator current={step} />
            </div>
            <span className="text-xs text-muted-foreground">
              Step {step} of 4
            </span>
          </div>
        </header>
      )}
      <main className={step === 0 ? "" : "mx-auto max-w-7xl px-6 py-8"}>
        {step === 0 && <DV360StepObjective />}
        {step === 1 && <DV360StepAudience />}
        {step === 2 && <DV360StepBudget />}
        {step === 3 && <DV360StepCreative />}
        {step === 4 && <DV360StepReview />}
      </main>
    </div>
  );
}
