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
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48Z" />
              </svg>
              <span className="text-base font-bold text-foreground">Salla Ads</span>
            </div>
            <div className="w-full max-w-2xl px-8">
              <GoogleStepIndicator current={step} />
            </div>
            <span className="text-xs text-muted-foreground">
              Step {step} of 4
            </span>
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
