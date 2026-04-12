"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react";

export interface ConfigRow {
  label: string;
  value: string;
}

export interface CheckItem {
  label: string;
  status: "ok" | "warning" | "error";
  text: string;
}

export interface BestPracticeTip {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ConfigCheckCardProps {
  configRows: ConfigRow[];
  checkItems?: CheckItem[];
  tips?: BestPracticeTip[];
}

const statusIcon = {
  ok: <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />,
  warning: <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />,
  error: <XCircle className="size-3.5 shrink-0 text-red-500" />,
};

export function ConfigCheckCard({
  configRows,
  checkItems,
  tips,
}: ConfigCheckCardProps) {
  return (
    <div className="rounded-lg bg-card p-4 sm:p-6">
      {/* Title + status */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-[#004d5a]">
          Configuration
        </h3>
        {checkItems && checkItems.length > 0 && (
          checkItems.every((c) => c.status === "ok") ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="size-2 rounded-full bg-emerald-500" />
              All good
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <span className="size-2 rounded-full bg-amber-500" />
              Needs attention
            </span>
          )
        )}
      </div>

      {/* Config rows */}
      {configRows.length > 0 && (
        <div className="flex flex-col gap-2">
          {configRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {row.label}
              </span>
              <span className="max-w-[55%] truncate text-right text-sm font-bold text-foreground">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Delivery Readiness */}
      {checkItems && checkItems.length > 0 && (
        <>
          <div className="my-4 h-px bg-border" />
          <p className="mb-3 text-sm font-medium text-foreground">
            Delivery Readiness
          </p>
          <div className="flex flex-col gap-2.5">
            {checkItems.map((item) => (
              <div key={item.label} className="flex items-start gap-2">
                {statusIcon[item.status]}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      item.status === "ok"
                        ? "text-emerald-600"
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
        </>
      )}

      {/* Best Practice Tips */}
      {tips && tips.length > 0 && (
        <>
          <div className="my-4 h-px bg-border" />
          <div className="flex flex-col gap-2">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-[#e6fff9]/50 px-3 py-2">
                <Sparkles className="mt-0.5 size-3 shrink-0 text-[#004956]" />
                <div className="flex-1">
                  <p className="text-[11px] leading-relaxed text-[#004956]/80">{tip.text}</p>
                  {tip.actionLabel && tip.onAction && (
                    <button
                      type="button"
                      onClick={tip.onAction}
                      className="mt-1 text-[11px] font-semibold text-[#004956] underline decoration-[#a4ffe5] underline-offset-2 hover:decoration-[#004956]"
                    >
                      {tip.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
