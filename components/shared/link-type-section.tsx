"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, X } from "lucide-react";
import { LinkPickerSheet } from "@/components/snapchat/creative/link-picker-sheet";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type LinkType = "store" | "product" | "category" | "landing_page" | "custom";

export interface CtaOption {
  value: string;
  label: string;
}

export interface LinkTypeSectionProps {
  /** Current URL value */
  url: string;
  /** Callback when URL changes */
  onUrlChange: (url: string) => void;
  /** Current CTA value */
  cta: string;
  /** Callback when CTA changes */
  onCtaChange: (cta: string) => void;
  /** CTA options split into recommended + other */
  recommendedCtas: CtaOption[];
  otherCtas: CtaOption[];
  /** Whether URL is optional (e.g. Video Views, Lead Gen) */
  optional?: boolean;
  /** Store URL to display in read-only mode */
  storeUrl?: string;
  /** Show CTA column (default: true) */
  showCta?: boolean;
  /** Show the URL / Link-Type pills column (default: true).
   *  Set to false for ad surfaces where the destination is locked
   *  upstream (e.g. TikTok Catalog Listing Ads pull product URLs
   *  from the catalog feed — there is no per-ad landing URL). */
  showUrl?: boolean;
  /** Extra description below Link type label */
  subtitle?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PILL_OPTIONS: { value: LinkType; label: string }[] = [
  { value: "store", label: "Store" },
  { value: "product", label: "Product" },
  { value: "category", label: "Category" },
  { value: "landing_page", label: "Landing page" },
  { value: "custom", label: "Custom URL" },
];

export function LinkTypeSection({
  url,
  onUrlChange,
  cta,
  onCtaChange,
  recommendedCtas,
  otherCtas,
  optional = false,
  storeUrl = "https://store.salla.sa",
  showCta = true,
  showUrl = true,
  subtitle,
}: LinkTypeSectionProps) {
  const [linkType, setLinkType] = useState<LinkType>(() => {
    if (!url || url === storeUrl) return "store";
    return "custom";
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"product" | "category" | "landing_page">("product");
  const [pickerLabel, setPickerLabel] = useState("");

  const handlePillClick = (type: LinkType) => {
    if (type === "product" || type === "category" || type === "landing_page") {
      setPickerMode(type);
      setPickerOpen(true);
    } else {
      setLinkType(type);
      setPickerLabel("");
      if (type === "store") onUrlChange("");
    }
  };

  const handlePickerSelect = (selectedUrl: string, label: string) => {
    onUrlChange(selectedUrl);
    setPickerLabel(label);
    setPickerOpen(false);
    // Set linkType based on which picker was open
    if (pickerMode === "product") setLinkType("product");
    else if (pickerMode === "category") setLinkType("category");
    else setLinkType("landing_page");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Link type pills — hidden when the destination is upstream-locked */}
      {showUrl && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">Link type</Label>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          <div className="flex flex-wrap gap-2">
            {PILL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handlePillClick(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition-colors",
                  linkType === opt.value
                    ? "border-primary/60 bg-primary/[0.06] text-primary"
                    : "border-border bg-white text-foreground hover:border-primary/30"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Link + CTA row */}
      <div className={cn("grid gap-4", showCta && showUrl ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
        {showUrl && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">Link</Label>
          {linkType === "store" ? (
            <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-muted/40 px-3">
              <span className="truncate text-sm text-muted-foreground">{storeUrl}</span>
              <button
                type="button"
                title="UTM parameters are auto-appended for tracking"
                className="group/utm flex shrink-0 items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 transition-colors hover:bg-emerald-200"
              >
                Auto UTM
                <Info className="size-2.5 text-emerald-500 transition-colors group-hover/utm:text-emerald-700" />
              </button>
            </div>
          ) : linkType === "product" || linkType === "category" || linkType === "landing_page" ? (
            <div
              onClick={() => { setPickerMode(linkType as "product" | "category" | "landing_page"); setPickerOpen(true); }}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-between rounded-lg border px-3 transition-colors hover:border-primary/40",
                url ? "border-primary/40 bg-primary/5" : "border-border bg-muted/40"
              )}
            >
              {url ? (
                <>
                  <span className="truncate text-sm text-foreground">{pickerLabel || url}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onUrlChange(""); setPickerLabel(""); }}
                    className="shrink-0 ml-2 rounded p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {linkType === "product" ? "Select a product..." : linkType === "category" ? "Select a category..." : "Select a page..."}
                </span>
              )}
            </div>
          ) : (
            <Input
              placeholder={optional ? "https://yourstore.salla.sa (optional)" : "https://yourstore.salla.sa/product"}
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              maxLength={1000}
              className={cn("h-10 text-sm", url && !url.startsWith("https://") && "border-red-400")}
            />
          )}
          {linkType === "custom" && url && !url.startsWith("https://") && (
            <p className="text-[10px] text-red-600">URL must start with https://</p>
          )}
        </div>
        )}

        {showCta && (
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground">
              CTA button <span className="text-destructive">*</span>
            </Label>
            <Select value={cta} onValueChange={onCtaChange}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select call to action" /></SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recommended</div>
                {recommendedCtas.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                <div className="my-1 border-t border-border" />
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">More Options</div>
                {otherCtas.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Picker sheet */}
      <LinkPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode={pickerMode}
        onSelect={handlePickerSelect}
      />
    </div>
  );
}
