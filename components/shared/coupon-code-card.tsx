"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, CheckCircle2, Plus, Percent } from "lucide-react";

export interface AvailableCoupon {
  code: string;
  title: string;
  description: string;
  discountAmount?: number;
  discountPercent?: number;
}

interface CouponCodeCardProps {
  onApply: (code: string) => void;
  onRemove?: () => void;
  appliedCode?: string | null;
  appliedDiscount?: number;
  availableCoupons?: AvailableCoupon[];
  className?: string;
}

const MOCK_COUPONS: AvailableCoupon[] = [
  {
    code: "SALLA30",
    title: "30% Off Salla Ads",
    description: "Valid for prepay campaigns only. Each user can redeem up to 3 times.",
    discountPercent: 30,
  },
  {
    code: "WELCOME50",
    title: "50 SAR Off First Campaign",
    description: "New advertiser welcome discount. One-time use.",
    discountAmount: 50,
  },
];

export function CouponCodeCard({
  onApply,
  onRemove,
  appliedCode,
  appliedDiscount,
  availableCoupons = MOCK_COUPONS,
  className,
}: CouponCodeCardProps) {
  const [code, setCode] = useState(appliedCode ?? "");
  const isApplied = !!appliedCode;

  function handleApply(couponCode: string) {
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) return;
    setCode(trimmed);
    onApply(trimmed);
  }

  function handleRemove() {
    setCode("");
    onRemove?.();
  }

  const unusedCoupons = availableCoupons.filter(
    (c) => c.code.toUpperCase() !== appliedCode?.toUpperCase()
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter" && !isApplied) handleApply(code); }}
            className="h-9 pl-8 text-xs uppercase tracking-wide"
            disabled={isApplied}
          />
        </div>
        {isApplied ? (
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-emerald-200 bg-emerald-50 text-xs text-emerald-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            onClick={handleRemove}
          >
            <CheckCircle2 className="mr-1 size-3.5" />
            Applied
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            disabled={!code.trim()}
            onClick={() => handleApply(code)}
          >
            Apply
          </Button>
        )}
      </div>

      {/* Applied confirmation */}
      {isApplied && appliedDiscount != null && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
          <Percent className="size-3.5 text-emerald-600" />
          <span className="text-[11px] font-medium text-emerald-700">
            Discount applied: -{appliedDiscount.toLocaleString()} SAR
          </span>
        </div>
      )}

      {/* Available coupons */}
      {unusedCoupons.length > 0 && !isApplied && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground">Available coupons</p>
          {unusedCoupons.map((c) => (
            <div
              key={c.code}
              className="flex items-center gap-3 rounded-xl border border-dashed border-primary/25 bg-primary/[0.02] px-3 py-2.5"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Tag className="size-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{c.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{c.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleApply(c.code)}
                className="flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                {c.code} <Plus className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
