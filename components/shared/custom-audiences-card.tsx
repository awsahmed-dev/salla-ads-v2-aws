"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  MOCK_CUSTOM_AUDIENCES,
  SOURCE_META,
  formatAudienceSize,
  type CustomAudienceOption,
} from "@/lib/custom-audiences";
import {
  Users,
  Info,
  Search,
  X,
  Plus,
  Check,
  Minus,
  Upload,
  Globe,
  ShoppingCart,
  Mail,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CustomAudiencesAccent = "primary" | "meta";

export interface CustomAudiencesCardProps {
  includeIds: string[];
  onIncludeIdsChange: (ids: string[]) => void;
  excludeIds: string[];
  onExcludeIdsChange: (ids: string[]) => void;
  accent?: CustomAudiencesAccent;
  infoTipText?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Accent                                                             */
/* ------------------------------------------------------------------ */

const ACCENT = {
  primary: {
    icon: "text-primary",
    iconBg: "bg-primary/10",
    include: "bg-emerald-50 border-emerald-200 text-emerald-700",
    exclude: "bg-red-50 border-red-200 text-red-600",
    chip: "bg-primary/10 text-primary border-primary/20",
    chipExclude: "bg-red-50 text-red-600 border-red-200",
  },
  meta: {
    icon: "text-[#1877F2]",
    iconBg: "bg-[#1877F2]/10",
    include: "bg-blue-50 border-blue-200 text-blue-700",
    exclude: "bg-red-50 border-red-200 text-red-600",
    chip: "bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20",
    chipExclude: "bg-red-50 text-red-600 border-red-200",
  },
} as const;

/* ------------------------------------------------------------------ */
/*  New Audience Sheet templates                                       */
/* ------------------------------------------------------------------ */

const AUDIENCE_TEMPLATES = [
  { icon: Globe, label: "Website Visitors", desc: "People who visited your store", source: "pixel" as const },
  { icon: ShoppingCart, label: "Past Purchasers", desc: "Customers who completed orders", source: "pixel" as const },
  { icon: Mail, label: "Email / Phone List", desc: "Upload a customer list", source: "email" as const },
  { icon: Users, label: "Lookalike Audience", desc: "Find people similar to your best customers", source: "lookalike" as const },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CustomAudiencesCard({
  includeIds,
  onIncludeIdsChange,
  excludeIds,
  onExcludeIdsChange,
  accent = "primary",
  infoTipText = "Include or exclude specific groups like website visitors, past purchasers, or email subscribers to refine who sees your ads.",
  className,
}: CustomAudiencesCardProps) {
  const s = ACCENT[accent];
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const totalSelected = includeIds.length + excludeIds.length;

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_CUSTOM_AUDIENCES;
    const q = search.toLowerCase();
    return MOCK_CUSTOM_AUDIENCES.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        SOURCE_META[a.source].label.toLowerCase().includes(q)
    );
  }, [search]);

  const getStatus = (id: string): "include" | "exclude" | "none" => {
    if (includeIds.includes(id)) return "include";
    if (excludeIds.includes(id)) return "exclude";
    return "none";
  };

  const cycleStatus = (id: string) => {
    const current = getStatus(id);
    if (current === "none") {
      onIncludeIdsChange([...includeIds, id]);
    } else if (current === "include") {
      onIncludeIdsChange(includeIds.filter((x) => x !== id));
      onExcludeIdsChange([...excludeIds, id]);
    } else {
      onExcludeIdsChange(excludeIds.filter((x) => x !== id));
    }
  };

  const removeAudience = (id: string) => {
    onIncludeIdsChange(includeIds.filter((x) => x !== id));
    onExcludeIdsChange(excludeIds.filter((x) => x !== id));
  };

  const getName = (id: string) =>
    MOCK_CUSTOM_AUDIENCES.find((a) => a.id === id)?.name ?? id;

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/5",
          className
        )}
        role="region"
        aria-labelledby="custom-audiences-title"
      >
        {/* ── Header ── */}
        <div className="mb-1 flex items-center gap-2">
          <div className={cn("flex size-9 items-center justify-center rounded-lg", s.iconBg)}>
            <Users className={cn("size-4", s.icon)} />
          </div>
          <div className="flex-1">
            <Label id="custom-audiences-title" className="text-sm font-semibold text-foreground">
              Custom Audiences
            </Label>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Retarget or exclude specific audience segments
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{infoTipText}</TooltipContent>
          </Tooltip>
        </div>

        {/* ── How it works hint ── */}
        <div className="mb-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-flex size-3.5 items-center justify-center rounded border border-emerald-300 bg-emerald-50 text-emerald-600"><Check className="size-2" /></span>
            Include
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-flex size-3.5 items-center justify-center rounded border border-red-300 bg-red-50 text-red-500"><Minus className="size-2" /></span>
            Exclude
          </span>
          <span className="text-muted-foreground/60">— Click to toggle</span>
        </div>

        {/* ── Selected chips ── */}
        {totalSelected > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {includeIds.map((id) => (
              <span key={id} className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", s.chip)}>
                <Check className="size-2.5" />
                {getName(id)}
                <button type="button" onClick={() => removeAudience(id)} className="hover:opacity-70"><X className="size-2.5" /></button>
              </span>
            ))}
            {excludeIds.map((id) => (
              <span key={id} className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", s.chipExclude)}>
                <Minus className="size-2.5" />
                {getName(id)}
                <button type="button" onClick={() => removeAudience(id)} className="hover:opacity-70"><X className="size-2.5" /></button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => { onIncludeIdsChange([]); onExcludeIdsChange([]); }}
              className="text-[10px] font-medium text-muted-foreground underline hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Search ── */}
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search audiences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground">
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* ── Audience list ── */}
        <div className="max-h-[280px] overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No audiences match your search</p>
          ) : (
            filtered.map((aud) => {
              const status = getStatus(aud.id);
              const meta = SOURCE_META[aud.source];

              return (
                <div
                  key={aud.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 transition-colors",
                    status === "include" && "bg-emerald-50/50",
                    status === "exclude" && "bg-red-50/50"
                  )}
                >
                  {/* Toggle button */}
                  <button
                    type="button"
                    onClick={() => cycleStatus(aud.id)}
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                      status === "none" && "border-muted-foreground/30 hover:border-emerald-400 hover:bg-emerald-50",
                      status === "include" && "border-emerald-400 bg-emerald-500 text-white",
                      status === "exclude" && "border-red-400 bg-red-500 text-white"
                    )}
                    title={
                      status === "none" ? "Click to include" :
                      status === "include" ? "Click to exclude" :
                      "Click to remove"
                    }
                  >
                    {status === "include" && <Check className="size-3" />}
                    {status === "exclude" && <Minus className="size-3" />}
                  </button>

                  {/* Audience info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-medium truncate",
                      status === "include" && "text-emerald-800",
                      status === "exclude" && "text-red-700",
                      status === "none" && "text-foreground"
                    )}>
                      {aud.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("inline-flex items-center gap-0.5 rounded px-1 py-px text-[9px] font-medium", meta.color)}>
                        {meta.icon} {meta.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {formatAudienceSize(aud.size)} users
                      </span>
                      {aud.updatedDaysAgo <= 2 && (
                        <span className="text-[9px] text-emerald-600 font-medium">Fresh</span>
                      )}
                    </div>
                  </div>

                  {/* Status label */}
                  {status !== "none" && (
                    <span className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                      status === "include" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                    )}>
                      {status === "include" ? "Included" : "Excluded"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Create New Audience CTA ── */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground hover:bg-muted/30"
        >
          <Plus className="size-3.5" />
          Create New Audience
        </button>

        {/* ── Summary ── */}
        {totalSelected > 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            <strong className="text-foreground">{includeIds.length}</strong> included
            {excludeIds.length > 0 && (
              <>, <strong className="text-red-600">{excludeIds.length}</strong> excluded</>
            )}
          </p>
        )}
      </div>

      {/* ── New Audience Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="flex w-full flex-col border-l sm:max-w-md">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Plus className="size-4 text-primary" />
              Create New Audience
            </SheetTitle>
            <SheetDescription className="text-xs">
              Choose a template to get started. Salla will sync the audience automatically with Snapchat.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {/* Templates */}
            <p className="text-xs font-semibold text-foreground px-1">Choose a template</p>
            <div className="grid grid-cols-1 gap-2">
              {AUDIENCE_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <t.icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                  </div>
                  <span className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium",
                    SOURCE_META[t.source].color
                  )}>
                    {SOURCE_META[t.source].label}
                  </span>
                </button>
              ))}
            </div>

            {/* Upload option */}
            <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-center">
              <Upload className="mx-auto mb-2 size-5 text-muted-foreground/40" />
              <p className="text-xs font-medium text-foreground">Upload Customer List</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                CSV or TXT — emails, phone numbers, or mobile ad IDs
              </p>
              <button
                type="button"
                className="mt-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                Upload File
              </button>
            </div>

            {/* Naming */}
            <div className="mt-4 space-y-2 px-1">
              <Label className="text-xs font-semibold text-foreground">Audience Name</Label>
              <Input placeholder="e.g. High-value cart abandoners" className="h-9 text-xs" />
            </div>

            {/* Lookback window */}
            <div className="mt-3 space-y-2 px-1">
              <Label className="text-xs font-semibold text-foreground">Lookback Window</Label>
              <div className="flex gap-2">
                {["7 days", "30 days", "90 days", "180 days"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground first:border-primary first:bg-primary/5 first:text-primary"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex gap-2 border-t pt-4">
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create Audience
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
