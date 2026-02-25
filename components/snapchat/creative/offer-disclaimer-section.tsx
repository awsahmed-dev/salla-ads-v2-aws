"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileText, Check } from "lucide-react";
import { type OfferDisclaimer } from "@/lib/snapchat/campaign-types";
import { CharCounter } from "./creative-card";

const TEMPLATES = [
  { label: "Free Shipping", text: "Free shipping on orders over 200 SAR. Delivery within 3-5 business days. Offer valid for a limited time. Terms and conditions apply." },
  { label: "Discount Sale", text: "Discount applies to selected items only. Cannot be combined with other offers or promotions. Prices as marked. While supplies last." },
  { label: "Installments", text: "Buy now, pay later available via Tamara/Tabby. Subject to approval. Installment terms and conditions apply. See payment provider for details." },
  { label: "Limited Time", text: "Offer valid for a limited time only. Subject to availability. The advertiser reserves the right to modify or cancel this offer at any time." },
];

export function OfferDisclaimerSection({
  disclaimer,
  onUpdate,
}: {
  disclaimer: OfferDisclaimer;
  onUpdate: (next: OfferDisclaimer) => void;
}) {
  const isActive = disclaimer.enabled && disclaimer.disclaimerText.length > 0;
  const activeTemplate = TEMPLATES.find((t) => t.text === disclaimer.disclaimerText);

  return (
    <div className="flex flex-col gap-3">
      {/* Single row: icon + label + toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className={cn("size-3.5", disclaimer.enabled ? "text-primary" : "text-muted-foreground")} />
          <div>
            <Label className="text-xs font-semibold text-foreground">Offer Disclaimer</Label>
            <p className="text-[11px] text-muted-foreground">
              {isActive
                ? <span>Viewers see a <span className="rounded bg-foreground/10 px-1 py-px font-medium text-foreground">See Offer Details</span> pill on your ad</span>
                : "Show terms & conditions on the ad"}
            </p>
          </div>
        </div>
        <Switch
          checked={disclaimer.enabled}
          onCheckedChange={(v) => onUpdate({ ...disclaimer, enabled: v })}
        />
      </div>

      {disclaimer.enabled && (
        <>
          {/* Quick-pick templates */}
          {!disclaimer.disclaimerText && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-medium text-muted-foreground">Pick a template or write your own:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => onUpdate({
                      ...disclaimer,
                      disclaimerText: tpl.text,
                      name: tpl.label,
                    })}
                    className="rounded-lg border border-border px-3 py-2 text-left text-[11px] font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/[0.02]"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Textarea — always visible when enabled */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-muted-foreground">Disclaimer text</Label>
              <CharCounter current={disclaimer.disclaimerText.length} max={5000} />
            </div>
            <Textarea
              placeholder="Enter your offer terms, conditions, or details..."
              value={disclaimer.disclaimerText}
              onChange={(e) => {
                const match = TEMPLATES.find((t) => t.text === e.target.value);
                onUpdate({ ...disclaimer, disclaimerText: e.target.value, name: match?.label ?? disclaimer.name });
              }}
              maxLength={5000}
              rows={3}
              className="text-xs leading-relaxed resize-none"
            />
          </div>

          {/* Active template chip + swap option */}
          {disclaimer.disclaimerText && (
            <div className="flex items-center gap-1.5">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => onUpdate({ ...disclaimer, disclaimerText: tpl.text, name: tpl.label })}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                    activeTemplate?.label === tpl.label
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {activeTemplate?.label === tpl.label && <Check className="size-2.5" />}
                  {tpl.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
