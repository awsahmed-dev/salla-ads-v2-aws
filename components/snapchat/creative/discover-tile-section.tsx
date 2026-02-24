"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Compass,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Info,
  ImageIcon,
  Type,
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
  const isEnabled = tile.enabled;
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

  const [expanded, setExpanded] = useState(isEnabled);

  const headlineLength = tile.headline.length;
  const headlineNearLimit = headlineLength > 45;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2.5 text-left"
        >
          <div className={cn(
            "flex size-8 items-center justify-center rounded-lg transition-colors",
            isEnabled && isComplete ? "bg-emerald-100" : "bg-blue-100"
          )}>
            {isEnabled && isComplete ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <Compass className="size-4 text-blue-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Discover Tile</span>
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">
                Recommended
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Show your Story Ad in the Discover Feed for more reach
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => {
              updateTile({ enabled: checked });
              if (checked) setExpanded(true);
            }}
          />
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* ── Expanded Content ── */}
      {expanded && (
        <div className="border-t border-border">
          {!isEnabled ? (
            <div className="px-4 py-4">
              <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Enable this to show your Story Ad as a tile in the Discover Feed.
                  Without it, your ad only plays between user stories which limits reach.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-0">

              {/* ── Headline Section ── */}
              <div className="px-4 py-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Type className="size-3 text-muted-foreground" />
                    Headline <span className="text-destructive">*</span>
                  </Label>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      headlineNearLimit ? "font-medium text-amber-600" : "text-muted-foreground"
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
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Shown on your tile in the Discover Feed. Keep it short, catchy, and actionable.
                </p>
              </div>

              {/* ── Media Uploads ── */}
              <div className="border-t border-border px-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Background Image */}
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <ImageIcon className="size-3 text-muted-foreground" />
                      Background <span className="text-destructive">*</span>
                    </Label>
                    <UploadZone
                      accept="image/png"
                      label="Add background"
                      sublabel="360×600, PNG, max 2MB"
                      preview={tile.backgroundImageUrl || undefined}
                      onFile={handleBackgroundFile}
                      onClear={() =>
                        updateTile({
                          backgroundImageUrl: "",
                          backgroundImageFile: undefined,
                        })
                      }
                      enableLibrary={false}
                    />
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Badge variant="outline" className="rounded px-1.5 py-0 text-[9px] font-normal text-muted-foreground">
                        3:5 ratio
                      </Badge>
                      <Badge variant="outline" className="rounded px-1.5 py-0 text-[9px] font-normal text-muted-foreground">
                        PNG only
                      </Badge>
                    </div>
                  </div>

                  {/* Logo Image */}
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <ImageIcon className="size-3 text-muted-foreground" />
                      Logo
                      <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span>
                    </Label>
                    <UploadZone
                      accept="image/png"
                      label="Add logo"
                      sublabel="993×284, PNG, max 2MB"
                      preview={tile.logoImageUrl || undefined}
                      onFile={handleLogoFile}
                      onClear={() =>
                        updateTile({
                          logoImageUrl: "",
                          logoImageFile: undefined,
                        })
                      }
                      enableLibrary={false}
                    />
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Badge variant="outline" className="rounded px-1.5 py-0 text-[9px] font-normal text-muted-foreground">
                        Wide format
                      </Badge>
                      <Badge variant="outline" className="rounded px-1.5 py-0 text-[9px] font-normal text-muted-foreground">
                        PNG only
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Mini Preview ── */}
              {(tile.backgroundImageUrl || tile.headline) && (
                <div className="border-t border-border px-4 py-4">
                  <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Compass className="size-3" />
                    Discover Tile Preview
                  </Label>
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
              <div className="border-t border-border px-4 py-3">
                {isComplete ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                    <p className="text-xs text-emerald-700">
                      Discover Tile is ready. Users who tap your tile will see your story snaps.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-700">
                      {!tile.headline && !tile.backgroundImageUrl
                        ? "Add a headline and background image to enable Discover placement."
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
      )}
    </div>
  );
}
