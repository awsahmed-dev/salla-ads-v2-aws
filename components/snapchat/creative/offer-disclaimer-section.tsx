"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { type OfferDisclaimer } from "@/lib/snapchat/campaign-types";

const TEMPLATES = [
  { label: "Free Shipping", text: "Free shipping on orders over 200 SAR. Delivery within 3-5 business days. Limited time offer. T&Cs apply." },
  { label: "Discounts", text: "Discount applies to selected items only. Cannot be combined with other offers or promotions. Prices as marked. While supplies last." },
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
  const activeTemplate = TEMPLATES.find((t) => t.text === disclaimer.disclaimerText);

  return (
    <div className="flex flex-col">
      {/* Header: title + subtitle + toggle */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-foreground">Disclaimer</span>
          <span className="text-xs text-muted-foreground">Show Terms &amp; Conditions on ad</span>
        </div>
        <Switch
          checked={disclaimer.enabled}
          onCheckedChange={(v) => onUpdate({ ...disclaimer, enabled: v })}
        />
      </div>

      {disclaimer.enabled && (
        <div className="flex flex-col gap-2 px-6 pb-6">
          {/* Disclaimer Text label */}
          <Label className="text-sm font-medium text-foreground">Disclaimer Text</Label>

          {/* Textarea */}
          <Textarea
            placeholder="Free shipping on orders over 200 SAR. Delivery within 3-5 business days. Limited time offer. T&Cs apply."
            value={disclaimer.disclaimerText}
            onChange={(e) => {
              const match = TEMPLATES.find((t) => t.text === e.target.value);
              onUpdate({ ...disclaimer, disclaimerText: e.target.value, name: match?.label ?? disclaimer.name });
            }}
            maxLength={5000}
            rows={3}
            className="text-sm leading-relaxed resize-none"
          />

          {/* Template quick-pick pills */}
          <div className="flex flex-wrap items-center gap-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => onUpdate({ ...disclaimer, disclaimerText: tpl.text, name: tpl.label })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTemplate?.label === tpl.label
                    ? "border-primary/60 bg-primary/[0.06] text-primary"
                    : "border-border bg-white text-foreground hover:border-primary/30"
                )}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
