"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, CheckCircle2, Plus, Percent, Sparkles, Gift, Clock, X, ArrowRight } from "lucide-react";

export interface AvailableCoupon {
  code: string;
  title: string;
  description: string;
  discountAmount?: number;
  discountPercent?: number;
}

export interface Voucher {
  id: string;
  title: string;
  description: string;
  discountAmount?: number;
  minSpend?: number;
  expiresAt?: string;
}

interface CouponCodeCardProps {
  onApply: (code: string) => void;
  onRemove?: () => void;
  appliedCode?: string | null;
  appliedDiscount?: number;
  availableCoupons?: AvailableCoupon[];
  vouchers?: Voucher[];
  onApplyVoucher?: (id: string) => void;
  appliedVoucherId?: string | null;
  onRemoveVoucher?: () => void;
  cashbackRate?: number;
  cashbackAmount?: number;
  className?: string;
}

const DEFAULT_COUPONS: AvailableCoupon[] = [
  {
    code: "SALLA30",
    title: "30% Off Salla Ads",
    description: "Valid for prepay campaigns only. Max 3 redemptions per user.",
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
  availableCoupons = DEFAULT_COUPONS,
  vouchers,
  onApplyVoucher,
  appliedVoucherId,
  onRemoveVoucher,
  cashbackRate,
  cashbackAmount,
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
  const appliedCoupon = availableCoupons.find(
    (c) => c.code.toUpperCase() === appliedCode?.toUpperCase()
  );

  const unusedVouchers = vouchers?.filter((v) => v.id !== appliedVoucherId) ?? [];
  const appliedVoucher = vouchers?.find((v) => v.id === appliedVoucherId);

  return (
    <div className={cn("space-y-3", className)}>
      {/* ---- Coupon Code Input ---- */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter" && !isApplied) handleApply(code); }}
            className="h-10 pl-9 text-xs uppercase tracking-wider"
            disabled={isApplied}
          />
        </div>
        {isApplied ? (
          <button
            type="button"
            onClick={handleRemove}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <CheckCircle2 className="size-3.5" />
            Applied
          </button>
        ) : (
          <button
            type="button"
            disabled={!code.trim()}
            onClick={() => handleApply(code)}
            className={cn(
              "flex h-10 items-center rounded-lg px-4 text-xs font-semibold transition-colors",
              code.trim()
                ? "bg-[#004956] text-white hover:bg-[#003a44]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Apply
          </button>
        )}
      </div>

      {/* Applied coupon confirmation */}
      {isApplied && appliedDiscount != null && appliedDiscount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Percent className="size-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800">
                {appliedCoupon?.discountPercent
                  ? `${appliedCoupon.discountPercent}% off applied`
                  : `${appliedDiscount.toLocaleString()} SAR off applied`}
              </p>
              <p className="text-[11px] text-emerald-600">You save {appliedDiscount.toLocaleString()} SAR on this campaign</p>
            </div>
          </div>
          <button type="button" onClick={handleRemove} className="rounded-md p-1 text-emerald-400 transition-colors hover:bg-emerald-100 hover:text-red-500">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Applied voucher confirmation */}
      {appliedVoucher && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Gift className="size-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800">{appliedVoucher.title}</p>
              <p className="text-[11px] text-emerald-600">
                {appliedVoucher.discountAmount
                  ? `You save ${appliedVoucher.discountAmount.toLocaleString()} SAR`
                  : "Voucher applied"}
              </p>
            </div>
          </div>
          {onRemoveVoucher && (
            <button type="button" onClick={onRemoveVoucher} className="rounded-md p-1 text-emerald-400 transition-colors hover:bg-emerald-100 hover:text-red-500">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Available coupons */}
      {unusedCoupons.length > 0 && !isApplied && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Tag className="size-3 text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Coupons</p>
          </div>
          {unusedCoupons.map((c) => (
            <div
              key={c.code}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6fff9]">
                <Tag className="size-4 text-[#004956]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-foreground">{c.title}</p>
                  {c.discountPercent && (
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{c.discountPercent}% OFF</span>
                  )}
                  {c.discountAmount && !c.discountPercent && (
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">-{c.discountAmount} SAR</span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{c.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleApply(c.code)}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-[#004956] px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#003a44]"
              >
                {c.code} <ArrowRight className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---- Vouchers ---- */}
      {unusedVouchers.length > 0 && !appliedVoucherId && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Gift className="size-3 text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vouchers</p>
          </div>
          {unusedVouchers.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <Gift className="size-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-foreground">{v.title}</p>
                  {v.discountAmount && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">-{v.discountAmount} SAR</span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{v.description}</p>
                {v.expiresAt && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="size-2.5" />
                    Expires {v.expiresAt}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onApplyVoucher?.(v.id)}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-colors hover:bg-amber-100"
              >
                Apply <ArrowRight className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---- Cashback Banner ---- */}
      {cashbackRate != null && cashbackRate > 0 && (
        <div className="rounded-xl border border-[#a4ffe5]/50 bg-gradient-to-r from-[#e6fff9] to-[#f0fdf4] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#004956]/10">
              <Sparkles className="size-4 text-[#004956]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#004956]">
                {Math.round(cashbackRate * 100)}% cashback on this campaign
              </p>
              <p className="mt-0.5 text-[11px] text-[#004956]/60">
                {cashbackAmount != null && cashbackAmount > 0
                  ? `Earn up to ${cashbackAmount.toLocaleString()} SAR back to your wallet`
                  : "Cashback credited after campaign ends"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
