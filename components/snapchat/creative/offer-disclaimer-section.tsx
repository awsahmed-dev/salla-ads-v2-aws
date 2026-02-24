"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight, Info } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { type AdGroup, type OfferDisclaimer } from "@/lib/snapchat/campaign-types";
import { CharCounter } from "./creative-card";

export function OfferDisclaimerSection({
  disclaimer,
  onUpdate,
}: {
  disclaimer: OfferDisclaimer;
  onUpdate: (next: OfferDisclaimer) => void;
}) {
  const [open, setOpen] = useState(disclaimer.enabled);

  return (
    <div className="rounded-lg border border-border">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <FileText className="size-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Offer Disclaimer</span>
            <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">Optional</Badge>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Add terms, conditions, or offer details. Shown as a "See Details" pill on the ad.
          </p>
        </div>
        <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-border px-4 py-3">
          {/* Enable toggle */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium text-foreground">Enable offer disclaimer</Label>
              <InfoTip text="Adds a 'See Offer Details' pill to your ad. When tapped, the full disclaimer text is shown." />
            </div>
            <Switch
              checked={disclaimer.enabled}
              onCheckedChange={(v) => onUpdate({ ...disclaimer, enabled: v })}
            />
          </div>

          {disclaimer.enabled && (
            <div className="flex flex-col gap-3">
              {/* Disclaimer name (internal) */}
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  Disclaimer Name (internal)
                </Label>
                <Input
                  placeholder="e.g. Ramadan Sale T&Cs"
                  value={disclaimer.name}
                  onChange={(e) => onUpdate({ ...disclaimer, name: e.target.value })}
                  className="h-8 text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  For your reference only. Not shown to users.
                </p>
              </div>

              {/* Disclaimer text */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Disclaimer Text
                  </Label>
                  <CharCounter current={disclaimer.disclaimerText.length} max={5000} />
                </div>
                <Textarea
                  placeholder="e.g. Offer valid from March 1-31, 2026. Free shipping applies to orders over 200 SAR. Cannot be combined with other promotions. T&Cs apply."
                  value={disclaimer.disclaimerText}
                  onChange={(e) => onUpdate({ ...disclaimer, disclaimerText: e.target.value })}
                  maxLength={5000}
                  rows={4}
                  className="text-xs leading-relaxed"
                />
              </div>

              {/* Preview hint */}
              <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2.5">
                <Info className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <div className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">How it appears:</span> A small
                  {" "}<span className="inline-flex items-center gap-0.5 rounded bg-foreground/10 px-1.5 py-0.5 font-medium text-foreground">See Offer Details</span>{" "}
                  pill will appear at the bottom of your ad. Users can tap it to read the full disclaimer.
                </div>
              </div>

              {/* Common templates */}
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Quick templates:</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Free Shipping", text: "Free shipping on orders over 200 SAR. Delivery within 3-5 business days. Offer valid for a limited time. Terms and conditions apply." },
                    { label: "Discount Sale", text: "Discount applies to selected items only. Cannot be combined with other offers or promotions. Prices as marked. While supplies last." },
                    { label: "Installments", text: "Buy now, pay later available via Tamara/Tabby. Subject to approval. Installment terms and conditions apply. See payment provider for details." },
                    { label: "Limited Time", text: "Offer valid for a limited time only. Subject to availability. The advertiser reserves the right to modify or cancel this offer at any time." },
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => onUpdate({
                        ...disclaimer,
                        disclaimerText: tpl.text,
                        name: disclaimer.name || tpl.label,
                      })}
                      className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
