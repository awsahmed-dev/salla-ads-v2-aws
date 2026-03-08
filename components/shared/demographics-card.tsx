"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_GENDERS,
  AGE_BANDS,
  type AgeBandValue,
} from "@/lib/demographics";
import { Users, CheckCircle2 } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";

export type DemographicsAccent = "primary" | "meta" | "dv360";

const ACCENT_STYLES: Record<
  DemographicsAccent,
  { border: string; bg: string; text: string; check: string }
> = {
  primary: {
    border: "border-primary",
    bg: "bg-primary/5",
    text: "text-primary",
    check: "text-primary",
  },
  meta: {
    border: "border-[#1877F2]",
    bg: "bg-[#1877F2]/5",
    text: "text-[#1877F2]",
    check: "text-[#1877F2]",
  },
  dv360: {
    border: "border-red-600",
    bg: "bg-red-600/10",
    text: "text-red-600",
    check: "text-red-600",
  },
};

export interface DemographicsCardProps {
  /** Selected language codes (en, ar only). */
  languageCodes: string[];
  onLanguagesChange: (codes: string[]) => void;
  /** Selected gender ids (MALE, FEMALE). At least one required on most platforms. */
  genderIds: string[];
  onGendersChange: (ids: string[]) => void;
  /** Selected age band values (18_24, 25_34, ...). Same UX on all platforms. */
  ageBandValues: string[];
  onAgeBandsChange: (values: string[]) => void;
  /** Visual accent. */
  accent?: DemographicsAccent;
  /** Show "Required" next to Device Language. */
  languageRequired?: boolean;
  /** Optional card title. */
  title?: string;
  /** Optional tooltip for the card header. */
  headerTooltip?: string;
  /** Optional className for wrapper. */
  className?: string;
}

/**
 * Unified demographics card: English/Arabic only, Male/Female only, same age-band experience.
 * Use on all platforms; map to/from platform state (ageMin/ageMax, API genders, etc.) in the parent.
 */
export function DemographicsCard({
  languageCodes,
  onLanguagesChange,
  genderIds,
  onGendersChange,
  ageBandValues,
  onAgeBandsChange,
  accent = "primary",
  languageRequired = false,
  title = "Demographics",
  headerTooltip = "Define who sees your ads by gender, age, and language.",
  className,
}: DemographicsCardProps) {
  const styles = ACCENT_STYLES[accent];

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
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="mb-4 flex items-center gap-2">
        <Users className={cn("size-4", styles.text)} />
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
        <InfoTip text={headerTooltip} />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {/* Gender — Male / Female only */}
        <div>
          <Label className="mb-2 flex items-center gap-1 text-xs font-semibold text-foreground">
            Gender
            <InfoTip text="Select at least one. Both selected = all genders." />
          </Label>
          <div className="flex gap-2">
            {SUPPORTED_GENDERS.map((g) => {
              const sel = genderIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGender(g.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    sel
                      ? `${styles.border} ${styles.bg} ${styles.text}`
                      : "border-border bg-background text-foreground hover:opacity-80"
                  )}
                >
                  {g.label}
                  {sel && <CheckCircle2 className={cn("size-3", styles.check)} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Age — bands (same experience everywhere) */}
        <div>
          <Label className="mb-2 flex items-center gap-1 text-xs font-semibold text-foreground">
            Age Range
            <InfoTip text="Select the age groups you want to reach. Minimum age is 18." />
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {AGE_BANDS.map((band) => {
              const sel = ageBandValues.includes(band.value);
              return (
                <button
                  key={band.value}
                  type="button"
                  onClick={() => toggleAgeBand(band.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                    sel
                      ? `${styles.border} ${styles.bg} ${styles.text}`
                      : "border-border bg-background text-foreground hover:border-muted-foreground/40"
                  )}
                >
                  {band.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Device Language — English / Arabic only */}
        <div>
          <Label className="mb-2 flex items-center gap-1 text-xs font-semibold text-foreground">
            Device Language
            {languageRequired && (
              <span className="rounded bg-muted px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
                Required
              </span>
            )}
            <InfoTip text="Target users by device language. Required when targeting multiple countries." />
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {SUPPORTED_LANGUAGES.map((l) => (
              <label
                key={l.code}
                className="flex cursor-pointer items-center gap-1.5"
              >
                <Checkbox
                  checked={languageCodes.includes(l.code)}
                  onCheckedChange={() => toggleLanguage(l.code)}
                  className={cn(
                    "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
                    accent === "meta" && "data-[state=checked]:border-[#1877F2] data-[state=checked]:bg-[#1877F2]",
                    accent === "dv360" && "data-[state=checked]:border-red-600 data-[state=checked]:bg-red-600"
                  )}
                />
                <span className="text-xs text-foreground">{l.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
