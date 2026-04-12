"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Star } from "lucide-react";

export interface ReadinessCheck {
  label: string;
  done: boolean;
}

interface CampaignReadinessCardProps {
  checks: ReadinessCheck[];
  className?: string;
}

export function CampaignReadinessCard({
  checks,
  className,
}: CampaignReadinessCardProps) {
  const completed = checks.filter((c) => c.done).length;
  const total = checks.length;

  return (
    <div className={cn("rounded-xl bg-card p-4 sm:p-6", className)}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-4">
        {/* Progress ring */}
        <div className="relative flex size-10 sm:size-11 items-center justify-center">
          <svg className="size-10 sm:size-11 -rotate-90" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="#eee" strokeWidth="3" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke="#004956"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(completed / total) * 113} 113`}
            />
          </svg>
          <Star className="absolute size-3.5 text-[#004956]" />
        </div>

        <div className="flex flex-1 items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">Campaign Readiness</p>
            <p className="text-xs font-medium text-muted-foreground">
              Suggestions to improve audience targeting
            </p>
          </div>
          <p className="text-sm font-bold text-[#004956]">
            {completed}/{total}
          </p>
        </div>
      </div>

      {/* Check items */}
      <div className="flex flex-col gap-4">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-3 px-3">
            <CheckCircle2
              className={cn(
                "size-5 shrink-0",
                check.done ? "text-[#004956]" : "text-[#004956] opacity-30"
              )}
            />
            <p className="text-xs font-bold text-muted-foreground">
              {check.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
