"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Info, Maximize2 } from "lucide-react";
import { SEGMENTS, type MarimekkoData, type SegmentKey } from "@/lib/audience/rfdm";
import { SallaTip } from "@/components/audience/salla-tip";

interface Props {
  data: MarimekkoData;
  /** Click handler — segment cell clicked */
  onCellClick?: (segment: SegmentKey, count: number) => void;
  /** Optional fixed total for percentage calc (so figures match merchant scale, not just sample) */
  scaleTotal?: number;
  /** Compact = smaller chart */
  height?: number;
  /**
   * "default" — uses the per-segment colors from SEGMENTS map
   * "teal"    — Salla monochrome teal palette (priority drives darkness),
   *             matches the Figma design.
   */
  palette?: "default" | "teal";
}

/* Salla teal monochrome palette — keyed by segment.
   Lower priority number (more valuable / more urgent) → darker teal. */
const TEAL_PALETTE: Record<SegmentKey, string> = {
  champions:        "#003a47",
  loyal:            "#0d6e7b",
  active:           "#2d8a96",
  previously_loyal: "#3a7d89",
  explorers:        "#4ba0ac",
  needs_attention:  "#5a98a4",
  new:              "#6ba8b3",
  almost_lost:      "#7eb1bb",
  promising:        "#8db8c0",
  at_risk:          "#a3c1c7",
  dormant:          "#c5d6da",
  never_purchased:  "#b8c5c8",
};

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

/**
 * Marimekko-style customer segments chart matching the dev team's
 * `Customer Segments (R × FMD Score)` plot — but interactive.
 *
 *   - 5 columns by R-score; column widths proportional to R-band totals
 *   - Within each column, 5 rows by FM-score; row heights proportional
 *   - Each cell colored by its segment label
 *   - "Never Purchased" sits as a separate strip at the bottom-left
 *   - Hover reveals exact count + % of total customer base
 *   - Click drills into the segment
 */
export function SegmentMarimekko({ data, onCellClick, scaleTotal, height = 460, palette = "default" }: Props) {
  const [hover, setHover] = useState<{ r: number; fm: number; count: number; segment: SegmentKey } | null>(null);
  const colorFor = (key: SegmentKey) => (palette === "teal" ? TEAL_PALETTE[key] : SEGMENTS[key].color);

  const total = scaleTotal ?? data.total;
  const buyers = total - (scaleTotal
    ? Math.round((data.neverPurchased / Math.max(data.total, 1)) * scaleTotal)
    : data.neverPurchased);
  const neverPurchased = total - buyers;

  // Per-column totals (only over buying customers)
  const colTotals = [1, 2, 3, 4, 5].map((r) =>
    data.cells.filter((c) => c.r === r).reduce((a, c) => a + c.count, 0)
  );
  const buyersInChart = colTotals.reduce((a, b) => a + b, 0);

  // Track unique segments present for legend
  const legendSegments = Array.from(new Set(data.cells.map((c) => c.segment)));
  // Always include never_purchased at the end of the legend
  if (!legendSegments.includes("never_purchased")) legendSegments.push("never_purchased");

  // Scale a sample count to the merchant total
  const scale = (n: number) => Math.round((n / Math.max(buyersInChart, 1)) * buyers);

  // Min weights so empty cells stay visible enough to read labels
  const MIN_COL_WEIGHT = 0.04; // 4%
  const MIN_ROW_WEIGHT = 0.05; // 5%

  const colWeights = colTotals.map((t) => Math.max(t / Math.max(buyersInChart, 1), MIN_COL_WEIGHT));
  const colSum = colWeights.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Customer Segments — R × FMD Score</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each block sized by customer count. Recency on the X axis, Frequency + Monetary on the Y axis. Hover for detail · click to open segment.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/20 px-2 py-1">
          <Info className="size-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">
            {formatNum(total)} customers · {formatNum(neverPurchased)} never purchased
          </span>
        </div>
      </div>

      <div className="flex gap-3" style={{ height }}>
        {/* Y-axis label */}
        <div className="flex w-6 flex-col items-center justify-center pb-7">
          <span
            className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Frequency + Monetary (FMD)
          </span>
        </div>

        {/* Y-axis ticks */}
        <div className="flex flex-col justify-between pb-7 pt-0 text-right">
          {[5, 4, 3, 2, 1].map((n) => (
            <span key={n} className="text-[10px] font-semibold tabular-nums text-muted-foreground">
              {n}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 gap-[2px]">
            {[1, 2, 3, 4, 5].map((r, ri) => {
              const cells = data.cells
                .filter((c) => c.r === r)
                .sort((a, b) => b.fm - a.fm); // FM=5 on top
              const colTotal = Math.max(colTotals[ri], 1);
              const colWeight = colWeights[ri] / colSum;

              return (
                <div
                  key={r}
                  className="flex flex-col gap-[2px]"
                  style={{ flex: colWeight }}
                >
                  {cells.map((cell) => {
                    const meta = SEGMENTS[cell.segment];
                    const rowWeight = Math.max(cell.count / colTotal, MIN_ROW_WEIGHT);
                    const scaled = scale(cell.count);
                    const pct = total > 0 ? ((scaled / total) * 100).toFixed(1) : "0.0";
                    const isHover = hover?.r === cell.r && hover?.fm === cell.fm;
                    return (
                      <button
                        type="button"
                        key={`${cell.r}-${cell.fm}`}
                        title={`${meta.name} — ${meta.tagline}\n\nR-score: ${cell.r}/5 · F+M: ${cell.fm}/5\nCustomers: ${formatNum(scaled)} (${pct}%)`}
                        onMouseEnter={() => setHover({ r: cell.r, fm: cell.fm, count: scaled, segment: cell.segment })}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => onCellClick?.(cell.segment, scaled)}
                        className={cn(
                          "group relative flex flex-col items-center justify-center overflow-hidden rounded-md p-1 text-center transition-all",
                          "hover:z-10 hover:scale-[1.02] hover:shadow-md",
                          cell.count === 0 && "opacity-50"
                        )}
                        style={{
                          flex: rowWeight,
                          backgroundColor: colorFor(cell.segment),
                          outline: isHover ? `2px solid ${colorFor(cell.segment)}` : undefined,
                          outlineOffset: isHover ? 2 : 0,
                        }}
                      >
                        <span className="line-clamp-1 text-[10px] font-bold leading-tight text-white drop-shadow-sm sm:text-xs">
                          {meta.name}
                        </span>
                        <span className="text-[9px] font-medium tabular-nums text-white/90">
                          {formatNum(scaled)} ({pct}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {/* X-axis ticks */}
          <div className="mt-1 flex gap-[2px]">
            {[1, 2, 3, 4, 5].map((n, ni) => (
              <div
                key={n}
                className="flex justify-center"
                style={{ flex: colWeights[ni] / colSum }}
              >
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{n}</span>
              </div>
            ))}
          </div>
          {/* X-axis label */}
          <div className="mt-0.5 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Recency (R Score)
          </div>
        </div>

        {/* Never Purchased side strip */}
        <div className="flex w-12 flex-col items-stretch pb-7">
          <button
            type="button"
            onClick={() => onCellClick?.("never_purchased", neverPurchased)}
            onMouseEnter={() => setHover({ r: 0, fm: 0, count: neverPurchased, segment: "never_purchased" })}
            onMouseLeave={() => setHover(null)}
            className="group flex flex-1 flex-col items-center justify-end overflow-hidden rounded-md p-1 transition-all hover:scale-[1.02] hover:shadow-md"
            style={{ backgroundColor: colorFor("never_purchased") }}
            title={`Never Purchased: ${formatNum(neverPurchased)}`}
          >
            <span
              className={cn(
                "whitespace-nowrap text-[9px] font-bold leading-tight",
                palette === "teal" ? "text-white" : "text-slate-700"
              )}
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Never Purchased
            </span>
            <span className={cn("mt-1 text-[9px] font-semibold tabular-nums", palette === "teal" ? "text-white" : "text-slate-700")}>
              {formatNum(neverPurchased)}
            </span>
            <span className="text-[9px] tabular-nums text-slate-500">
              {((neverPurchased / total) * 100).toFixed(1)}%
            </span>
          </button>
        </div>

        {/* Legend */}
        <div className="hidden w-48 shrink-0 flex-col gap-1 overflow-y-auto pr-1 pb-7 lg:flex">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Segments</p>
          {legendSegments.map((key) => {
            const meta = SEGMENTS[key];
            const segCount = key === "never_purchased"
              ? neverPurchased
              : scale(data.cells.filter((c) => c.segment === key).reduce((a, c) => a + c.count, 0));
            const segPct = total > 0 ? ((segCount / total) * 100).toFixed(1) : "0.0";
            const isHover = hover?.segment === key;
            return (
              <button
                key={key}
                type="button"
                title={`${meta.name} — ${meta.tagline}`}
                onClick={() => onCellClick?.(key, segCount)}
                onMouseEnter={() => setHover({ r: 0, fm: 0, count: segCount, segment: key })}
                onMouseLeave={() => setHover(null)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors",
                  isHover ? "bg-muted/40" : "hover:bg-muted/30"
                )}
              >
                <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: colorFor(key) }} />
                <span className="flex-1 truncate text-[11px] font-medium text-foreground">{meta.name}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {formatNum(segCount)} <span className="opacity-60">·</span> {segPct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hovered-segment description — replaces guesswork on names like "Dormant" */}
      {hover?.segment && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-muted/20 p-2.5">
          <span className="mt-0.5 size-3 shrink-0 rounded-sm" style={{ backgroundColor: SEGMENTS[hover.segment].color }} />
          <div className="flex-1">
            <p className="text-xs font-bold text-foreground">{SEGMENTS[hover.segment].name}</p>
            <p className="text-[11px] leading-snug text-muted-foreground">{SEGMENTS[hover.segment].tagline}</p>
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-foreground">
            {formatNum(hover.count)}
          </span>
        </div>
      )}

      {/* Reading guide — small but high-impact for non-specialists */}
      <SallaTip className="mt-3">
        Read this chart left-to-right and bottom-to-top.{" "}
        <strong>Right side</strong> = customers who bought recently.{" "}
        <strong>Top</strong> = customers who buy often and spend more. Hover any block for the full description.
      </SallaTip>
    </div>
  );
}
