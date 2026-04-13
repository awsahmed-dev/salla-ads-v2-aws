"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Compass,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Type,
  Sparkles,
  Eye,
} from "lucide-react";
import { type AdGroup, type DiscoverTile } from "@/lib/snapchat/campaign-types";
import { UploadZone } from "@/components/shared/upload-zone";

export function DiscoverTileSection({
  ad,
  onUpdate,
}: {
  ad: AdGroup;
  onUpdate: (next: AdGroup) => void;
}) {
  const tile = ad.discoverTile ?? {
    enabled: false,
    headline: "",
    backgroundImageUrl: "",
    logoImageUrl: "",
  };
  const isComplete = !!(tile.headline && tile.backgroundImageUrl);

  const updateTile = (patch: Partial<DiscoverTile>) => {
    onUpdate({
      ...ad,
      discoverTile: { ...tile, ...patch },
    });
  };

  const handleBackgroundFile = (file: File) => {
    const url = URL.createObjectURL(file);
    updateTile({ backgroundImageUrl: url, backgroundImageFile: file });
  };

  const handleLogoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    updateTile({ logoImageUrl: url, logoImageFile: file });
  };

  const [expanded, setExpanded] = useState(true);

  const headlineLength = tile.headline.length;
  const headlineNearLimit = headlineLength > 45;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/30"
      >
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
            isComplete ? "bg-emerald-100" : "bg-primary/10"
          )}
        >
          {isComplete ? (
            <CheckCircle2 className="size-4 text-emerald-600" />
          ) : (
            <Compass className="size-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              Discover Tile
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-700">
              Required
            </span>
            {isComplete && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                Ready
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
            Appears in the Discover Feed — this is what users see before tapping
            into your story
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* ── Expanded Content ── */}
      {expanded && (
        <div className="border-t border-border">
          {/* ── Headline Section ── */}
          <div className="px-5 py-4">
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Type className="size-3 text-muted-foreground" />
                Headline <span className="text-destructive">*</span>
              </Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  headlineNearLimit
                    ? "font-medium text-amber-600"
                    : "text-muted-foreground"
                )}
              >
                {headlineLength}/55
              </span>
            </div>
            <Input
              placeholder="e.g. Check out our latest collection"
              value={tile.headline}
              maxLength={55}
              onChange={(e) => updateTile({ headline: e.target.value })}
              className="h-9 text-sm"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              Keep it short, catchy, and actionable — this is the first thing
              users read.
            </p>
          </div>

          {/* ── Media Uploads ── */}
          <div className="border-t border-border px-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Background Image */}
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <ImageIcon className="size-3 text-muted-foreground" />
                  Background{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <UploadZone
                  accept="image/png,image/jpeg"
                  label="Add background"
                  sublabel="360×600, PNG or JPEG"
                  preview={tile.backgroundImageUrl || undefined}
                  onFile={handleBackgroundFile}
                  onClear={() =>
                    updateTile({
                      backgroundImageUrl: "",
                      backgroundImageFile: undefined,
                    })
                  }
                  enableLibrary={true}
                  libraryContext="IMAGE_PORTRAIT"
                />
                <div className="flex flex-wrap gap-1">
                  <span className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    3:5 ratio
                  </span>
                  <span className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    Max 2MB
                  </span>
                </div>
              </div>

              {/* Logo Image */}
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <ImageIcon className="size-3 text-muted-foreground" />
                  Logo{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    (Optional)
                  </span>
                </Label>
                <UploadZone
                  accept="image/png,image/jpeg"
                  label="Add logo"
                  sublabel="993×284, PNG or JPEG"
                  preview={tile.logoImageUrl || undefined}
                  onFile={handleLogoFile}
                  onClear={() =>
                    updateTile({
                      logoImageUrl: "",
                      logoImageFile: undefined,
                    })
                  }
                  enableLibrary={true}
                  libraryContext="LOGO_LANDSCAPE"
                />
                <div className="flex flex-wrap gap-1">
                  <span className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    Wide format
                  </span>
                  <span className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    Max 2MB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mini Preview ── */}
          {(tile.backgroundImageUrl || tile.headline) && (
            <div className="border-t border-border px-5 py-4">
              <div className="mb-2.5 flex items-center gap-1.5">
                <Eye className="size-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Discover Tile Preview
                </span>
              </div>
              <div className="mx-auto w-[140px]">
                <div className="relative overflow-hidden rounded-xl bg-zinc-900 shadow-lg">
                  {/* Background */}
                  <div className="aspect-[3/5]">
                    {tile.backgroundImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tile.backgroundImageUrl}
                        alt="Tile background"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                        <ImageIcon className="size-6 text-white/15" />
                      </div>
                    )}
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Logo */}
                  {tile.logoImageUrl && (
                    <div className="absolute left-2 top-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tile.logoImageUrl}
                        alt="Logo"
                        className="h-4 w-auto rounded-sm object-contain"
                      />
                    </div>
                  )}

                  {/* Headline */}
                  <div className="absolute inset-x-0 bottom-0 px-2.5 pb-3">
                    {tile.headline ? (
                      <p className="text-[9px] font-bold leading-tight text-white drop-shadow-sm">
                        {tile.headline}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <div className="h-2 w-4/5 rounded-full bg-white/20" />
                        <div className="h-2 w-3/5 rounded-full bg-white/15" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 text-center text-[9px] text-muted-foreground">
                  How it appears in Discover
                </p>
              </div>
            </div>
          )}

          {/* ── Status Banner ── */}
          <div className="border-t border-border px-5 py-3">
            {isComplete ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                <p className="text-xs text-emerald-700">
                  Discover Tile is ready — users who tap your tile will see your
                  story snaps.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-700">
                  {!tile.headline && !tile.backgroundImageUrl
                    ? "Add a headline and background image to complete the Discover Tile."
                    : !tile.headline
                      ? "Add a headline to complete the Discover Tile."
                      : "Upload a background image to complete the Discover Tile."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
