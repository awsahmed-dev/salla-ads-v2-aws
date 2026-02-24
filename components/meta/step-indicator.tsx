"use client";

import { StepIndicator as SharedStepIndicator, UNIFIED_WIZARD_STEPS } from "@/components/shared/step-indicator";

interface StepIndicatorProps {
  current: number;
}

export function MetaStepIndicator({ current }: StepIndicatorProps) {
  return (
    <SharedStepIndicator steps={UNIFIED_WIZARD_STEPS} current={current} accent="meta" />
  );
}
