"use client";

/**
 * DemographicsCard — audience-step demographics editor.
 *
 * UX audit fixes (July 2026):
 *   - "Device Language" → "Language" (the API field maps to user
 *     language preference, not device OS language).
 *   - Gender picker adds an explicit "All" chip so the merchant can
 *     see the current state at a glance (previously ambiguous
 *     "both selected" checkboxes).
 *   - Age / Gender / Language now all use consistent chip styling
 *     (previously age was chips, gender + language were checkboxes).
 *   - Age chip width tightened + section dividers added between the
 *     three sub-cards for scannability.
 *   - Section headers get small icon labels so the eye can anchor
 *     when scanning the card top-to-bottom.
 */

import { cn } from "@/lib/utils";
import { Users, Cake, Languages } from "lucide-react";
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

const ALL_GENDER_IDS = SUPPORTED_GENDERS.map((g) => g.id);

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

  // Gender: "All" is the state when every SUPPORTED_GENDER is selected.
  // Clicking "All" flips between all-selected and nothing-selected;
  // clicking a specific gender narrows to that gender.
  const genderIsAll = genderIds.length === ALL_GENDER_IDS.length;
  const setGenderAll = () => {
    onGendersChange(genderIsAll ? [] : [...ALL_GENDER_IDS]);
  };
  const setGenderSpecific = (id: string) => {
    // Clicking a specific gender snaps to just that one (mutually
    // exclusive with the other options unless the merchant re-adds).
    if (genderIds.length === 1 && genderIds[0] === id) return;
    onGendersChange([id]);
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
      {/* Card header */}
      <div className="px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
        <h3 className="text-base font-bold text-foreground">Audience</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Define who sees your ads by age, gender, and language.
        </p>
      </div>

      {/* ── Age Range ── */}
      <div className="border-t border-border px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-2 flex items-center gap-1.5">
          <Cake className="size-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Age Range
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {AGE_BANDS.map((band) => {
            const sel = ageBandValues.includes(band.value);
            return (
              <button
                key={band.value}
                type="button"
                onClick={() => toggleAgeBand(band.value)}
                className={cn(
                  "min-w-[58px] rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  sel
                    ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956] shadow-sm"
                    : "border-border bg-white text-foreground hover:border-[#a4ffe5]/60"
                )}
              >
                {band.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Gender ── */}
      <div className="border-t border-border px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-2 flex items-center gap-1.5">
          <Users className="size-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Gender
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {/* Explicit "All" chip — resolves the "which state is 'target
              everyone'?" ambiguity that came up in the audit. */}
          <button
            type="button"
            onClick={setGenderAll}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
              genderIsAll
                ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956] shadow-sm"
                : "border-border bg-white text-foreground hover:border-[#a4ffe5]/60"
            )}
          >
            All
          </button>
          {SUPPORTED_GENDERS.map((g) => {
            const isOnlyThisSelected = genderIds.length === 1 && genderIds[0] === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setGenderSpecific(g.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                  isOnlyThisSelected
                    ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956] shadow-sm"
                    : "border-border bg-white text-foreground hover:border-[#a4ffe5]/60"
                )}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Language ── (renamed from "Device Language") */}
      <div className="border-t border-border px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-2 flex items-center gap-1.5">
          <Languages className="size-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Language
            {languageRequired && (
              <span className="ml-1 text-[10px] normal-case text-muted-foreground">
                (required for multi-country)
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORTED_LANGUAGES.map((l) => {
            const sel = languageCodes.includes(l.code);
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => toggleLanguage(l.code)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                  sel
                    ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956] shadow-sm"
                    : "border-border bg-white text-foreground hover:border-[#a4ffe5]/60"
                )}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
