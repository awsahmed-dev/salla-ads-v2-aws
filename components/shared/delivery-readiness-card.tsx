"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export interface ReadinessItem {
  label: string;
  status: "ok" | "warning" | "error";
  text: string;
}

interface DeliveryReadinessCardProps {
  items: ReadinessItem[];
  className?: string;
}

const statusIcon = {
  ok: <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />,
  warning: <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />,
  error: <XCircle className="size-3.5 shrink-0 text-red-500" />,
};

export function DeliveryReadinessCard({ items, className }: DeliveryReadinessCardProps) {
  const allOk = items.every((i) => i.status === "ok");
  const hasErrors = items.some((i) => i.status === "error");

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <ShieldCheck className={cn("size-4", allOk ? "text-emerald-500" : hasErrors ? "text-red-500" : "text-amber-500")} />
        <Label className="text-sm font-semibold text-foreground">Delivery Readiness</Label>
        <span
          className={cn(
            "ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
            allOk
              ? "bg-emerald-50 text-emerald-600"
              : hasErrors
                ? "bg-red-50 text-red-600"
                : "bg-amber-50 text-amber-600"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              allOk ? "bg-emerald-500" : hasErrors ? "bg-red-500" : "bg-amber-500"
            )}
          />
          {allOk ? "Ready to launch" : hasErrors ? "Issues found" : "Needs attention"}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 px-4 pb-4 pt-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50">
            {statusIcon[item.status]}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-medium text-foreground leading-tight">{item.label}</span>
              <span
                className={cn(
                  "text-[10px] leading-snug",
                  item.status === "ok"
                    ? "text-muted-foreground"
                    : item.status === "warning"
                      ? "text-amber-600"
                      : "text-red-600"
                )}
              >
                {item.text}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
