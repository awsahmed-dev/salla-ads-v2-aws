"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_GENDERS,
  AGE_BANDS,
} from "@/lib/demographics";

export type DemographicsAccent = "primary" | "meta" | "dv360";

export interface DemographicsCardProps {
  languageCodes: string[];
  onLanguagesChange: (codes: string[]) => void;
  genderIds: string[];
  onGendersChange: (ids: string[]) => void;
  ageBandValues: string[];
  onAgeBandsChange: (values: string[]) => void;
  accent?: DemographicsAccent;
  languageRequired?: boolean;
  title?: string;
  headerTooltip?: string;
  className?: string;
}

export function DemographicsCard({
  languageCodes,
  onLanguagesChange,
  genderIds,
  onGendersChange,
  ageBandValues,
  onAgeBandsChange,
  languageRequired = false,
  className,
}: DemographicsCardProps) {
  const toggleLanguage = (code: string) => {
    if (languageCodes.includes(code)) {
      onLanguagesChange(languageCodes.filter((c) => c !== code));
    } else {
      onLanguagesChange([...languageCodes, code]);
    }
  };

  const toggleGender = (id: string) => {
    if (genderIds.includes(id)) {
      const next = genderIds.filter((g) => g !== id);
      if (next.length === 0) return;
      onGendersChange(next);
    } else {
      onGendersChange([...genderIds, id]);
    }
  };

  const toggleAgeBand = (value: string) => {
    if (ageBandValues.includes(value)) {
      const next = ageBandValues.filter((v) => v !== value);
      if (next.length === 0) return;
      onAgeBandsChange(next);
    } else {
      onAgeBandsChange([...ageBandValues, value]);
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      {/* Header */}
      <div className="px-6 py-5">
        <h3 className="text-base font-bold text-foreground">Audience</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Define who sees your ads by gender, age, and language.
        </p>
      </div>

      {/* Content — 3 columns */}
      <div className="flex items-start justify-between px-6 pb-6">
        {/* Age Range */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Age Range</p>
          <div className="flex flex-wrap gap-2">
            {AGE_BANDS.map((band) => {
              const sel = ageBandValues.includes(band.value);
              return (
                <button
                  key={band.value}
                  type="button"
                  onClick={() => toggleAgeBand(band.value)}
                  className={cn(
                    "w-[50px] rounded-full border px-2 py-1.5 text-xs font-medium transition-all",
                    sel
                      ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956] shadow-sm"
                      : "border-border bg-white text-foreground hover:border-border/80"
                  )}
                >
                  {band.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gender */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Target Audience Gender</p>
          <div className="flex gap-5 py-1.5">
            {SUPPORTED_GENDERS.map((g) => {
              const sel = genderIds.includes(g.id);
              return (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-2"
                  onClick={() => toggleGender(g.id)}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded",
                      sel
                        ? "bg-[#004956]"
                        : "border border-[#004956]"
                    )}
                  >
                    {sel && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-sm font-medium text-foreground">{g.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Device Language */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            Device Language
            {languageRequired && (
              <span className="ml-1 text-xs text-muted-foreground">(Required)</span>
            )}
          </p>
          <div className="flex gap-5 py-1.5">
            {SUPPORTED_LANGUAGES.map((l) => {
              const sel = languageCodes.includes(l.code);
              return (
                <label
                  key={l.code}
                  className="flex cursor-pointer items-center gap-2"
                  onClick={() => toggleLanguage(l.code)}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded",
                      sel
                        ? "bg-[#004956]"
                        : "border border-[#004956]"
                    )}
                  >
                    {sel && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-sm font-medium text-foreground">{l.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
