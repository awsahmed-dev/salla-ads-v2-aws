"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Settings2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export interface ConfigRow {
  label: string;
  value: string;
}

export interface CheckItem {
  label: string;
  status: "ok" | "warning" | "error";
  text: string;
}

interface ConfigCheckCardProps {
  configRows: ConfigRow[];
  checkItems?: CheckItem[];
}

const statusIcon = {
  ok: <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />,
  warning: <AlertTriangle className="size-3 shrink-0 text-amber-500" />,
  error: <XCircle className="size-3 shrink-0 text-red-500" />,
};

const statusDot = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
};

export function ConfigCheckCard({
  configRows,
  checkItems,
}: ConfigCheckCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Settings2 className="size-4 text-primary" />
        <Label className="text-sm font-semibold text-foreground">
          Configuration
        </Label>
        {checkItems && checkItems.length > 0 && (
          <div className="ml-auto flex items-center gap-1">
            {checkItems.every((c) => c.status === "ok") ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                <span className={cn("size-1.5 rounded-full", statusDot.ok)} />
                All good
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
                <span className={cn("size-1.5 rounded-full", statusDot.warning)} />
                Needs attention
              </span>
            )}
          </div>
        )}
      </div>

      {configRows.length > 0 && (
        <div className="flex flex-col gap-1.5 text-xs">
          {configRows.map((row) => (
            <div key={row.label} className="flex justify-between">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="max-w-[55%] truncate text-right font-medium text-foreground">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {checkItems && checkItems.length > 0 && (
        <>
          <div className="my-3 h-px bg-border" />
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">
              Delivery Readiness
            </Label>
            {checkItems.map((item) => (
              <div key={item.label} className="flex items-start gap-2">
                {statusIcon[item.status]}
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "text-[10px]",
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
    </div>
  );
}
