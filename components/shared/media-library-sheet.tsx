"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Upload,
  ImageIcon,
  Film,
  CheckCircle2,
  Library,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  fetchMediaLibrary,
  searchMedia,
  addMediaToLibrary,
  formatFileSize,
  formatDuration,
  relativeDate,
  type MediaItem,
  type MediaFilter,
  type MediaUsage,
  type MediaAspect,
} from "@/lib/salla/media-library";

export interface MediaLibrarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: {
    url: string;
    mediaType: "IMAGE" | "VIDEO";
    file?: File;
    name: string;
  }) => void;
  accept?: string;
  context?: MediaLibraryContext;
  multiSelect?: boolean;
}

type TabId = "library" | "upload";

export type MediaLibraryContext =
  | "IMAGE"
  | "VIDEO"
  | "LOGO"
  | "IMAGE_LANDSCAPE"
  | "IMAGE_SQUARE"
  | "IMAGE_PORTRAIT"
  | "LOGO_SQUARE"
  | "LOGO_LANDSCAPE";

const CONTEXT_CONFIG: Record<MediaLibraryContext, { filter: MediaFilter; usage?: MediaUsage; aspect?: MediaAspect }> = {
  IMAGE: { filter: "IMAGE", usage: "IMAGE" },
  VIDEO: { filter: "VIDEO", usage: "VIDEO" },
  LOGO: { filter: "IMAGE", usage: "LOGO" },
  IMAGE_LANDSCAPE: { filter: "IMAGE", usage: "IMAGE", aspect: "LANDSCAPE" },
  IMAGE_SQUARE: { filter: "IMAGE", usage: "IMAGE", aspect: "SQUARE" },
  IMAGE_PORTRAIT: { filter: "IMAGE", usage: "IMAGE", aspect: "PORTRAIT" },
  LOGO_SQUARE: { filter: "IMAGE", usage: "LOGO", aspect: "SQUARE" },
  LOGO_LANDSCAPE: { filter: "IMAGE", usage: "LOGO", aspect: "LANDSCAPE" },
};

export function MediaLibrarySheet({
  open,
  onOpenChange,
  onSelect,
  accept = "image/png,image/jpeg,video/mp4,video/quicktime",
  context,
  multiSelect = false,
}: MediaLibrarySheetProps) {
  const [tab, setTab] = useState<TabId>("library");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MediaFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isMulti = multiSelect;

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const FILTER_OPTIONS: { value: MediaFilter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "IMAGE", label: "Images" },
    { value: "VIDEO", label: "Videos" },
  ];

  const inferFilterFromAccept = useCallback((value: string): MediaFilter => {
    const hasImage = /image\//i.test(value);
    const hasVideo = /video\//i.test(value);
    if (hasImage && hasVideo) return "ALL";
    if (hasImage) return "IMAGE";
    if (hasVideo) return "VIDEO";
    return "ALL";
  }, []);

  const contextConfig = context ? CONTEXT_CONFIG[context] : undefined;
  const acceptFilter = inferFilterFromAccept(accept);
  const baseFilter = contextConfig?.filter ?? acceptFilter;
  const allowedFilters = useMemo(
    () => FILTER_OPTIONS.filter((opt) => baseFilter === "ALL" || opt.value === baseFilter),
    [baseFilter]
  );

  const applyContextFilter = useCallback(
    (list: MediaItem[]) => {
      if (!contextConfig) return list;
      return list.filter((item) => {
        if (contextConfig.filter !== "ALL" && item.mediaType !== contextConfig.filter) return false;
        if (contextConfig.usage) {
          if (item.usage !== contextConfig.usage) return false;
        } else if (item.usage === "LOGO") {
          return false;
        }
        if (contextConfig.aspect && item.aspect !== contextConfig.aspect) return false;
        return true;
      });
    },
    [contextConfig]
  );

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const results = query.trim()
        ? await searchMedia(query, filter)
        : await fetchMediaLibrary(filter);
      setItems(applyContextFilter(results));
    } finally {
      setLoading(false);
    }
  }, [query, filter, applyContextFilter]);

  useEffect(() => {
    if (open && tab === "library") loadItems();
  }, [open, tab, loadItems]);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setSelectedIds([]);
      setQuery("");
      setFilter(baseFilter);
      setTab("library");
    }
  }, [open, baseFilter]);

  const handleSelect = () => {
    if (isMulti) {
      const selectedItems = items.filter((m) => selectedIds.includes(m.id));
      if (selectedItems.length === 0) return;
      selectedItems.forEach((item) => {
        onSelect({
          url: item.url,
          mediaType: item.mediaType,
          name: item.name,
        });
      });
      onOpenChange(false);
      return;
    }
    const item = items.find((m) => m.id === selectedId);
    if (!item) return;
    onSelect({
      url: item.url,
      mediaType: item.mediaType,
      name: item.name,
    });
    onOpenChange(false);
  };

  const handleUploadFile = useCallback(
    async (file: File, closeAfter = true) => {
      setUploading(true);
      try {
        const item = await addMediaToLibrary(file, {
          usage: contextConfig?.usage,
          aspect: contextConfig?.aspect,
        });
        onSelect({
          url: item.url,
          mediaType: item.mediaType,
          file,
          name: item.name,
        });
        if (closeAfter) onOpenChange(false);
      } finally {
        setUploading(false);
      }
    },
    [onSelect, onOpenChange, contextConfig]
  );

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (isMulti) {
      for (const file of Array.from(files)) {
        await handleUploadFile(file, false);
      }
      onOpenChange(false);
      return;
    }
    handleUploadFile(files[0]);
  };

  const selectedItems = isMulti ? items.filter((m) => selectedIds.includes(m.id)) : [];
  const selected = items.find((m) => m.id === selectedId);
  const selectedCount = isMulti ? selectedItems.length : selected ? 1 : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b border-border px-5 pb-3 pt-5">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Library className="size-4 text-primary" />
            Media Library
          </SheetTitle>
          <SheetDescription className="text-xs">
            Select from previously uploaded media or upload new assets
          </SheetDescription>
        </SheetHeader>

        {/* Tab bar */}
        <div className="flex shrink-0 border-b border-border">
          {(
            [
              { id: "library" as TabId, label: "Library", icon: Library },
              { id: "upload" as TabId, label: "Upload New", icon: Upload },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
                tab === t.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {tab === "library" ? (
            <>
              {/* Search + filter */}
              <div className="flex shrink-0 flex-col gap-2 px-4 pt-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or tag..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                {allowedFilters.length > 1 && (
                  <div className="flex gap-1.5">
                    {allowedFilters.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFilter(f.value)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          filter === f.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto px-4 pb-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <Library className="size-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No media found
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {query
                        ? "Try a different search"
                        : "Upload your first media asset"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {items.map((item) => {
                      const isSelected = isMulti
                        ? selectedIds.includes(item.id)
                        : selectedId === item.id;
                      const aspectRatio =
                        item.width && item.height
                          ? `${item.width} / ${item.height}`
                          : "9 / 16";
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (isMulti) {
                              setSelectedIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              );
                              return;
                            }
                            setSelectedId(isSelected ? null : item.id);
                          }}
                          className={cn(
                            "group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all",
                            isSelected
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-primary/40"
                          )}
                        >
                          {/* Thumbnail */}
                          <div
                            className="relative w-full overflow-hidden bg-muted/20"
                            style={{ aspectRatio }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.thumbnailUrl}
                              alt={item.name}
                              className="size-full object-cover"
                              crossOrigin="anonymous"
                            />
                            {item.mediaType === "VIDEO" && (
                              <div className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 text-[11px] font-medium text-white">
                                <Film className="size-2" />
                                {item.duration
                                  ? formatDuration(item.duration)
                                  : "Video"}
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                                <CheckCircle2 className="size-6 text-primary drop-shadow-sm" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex flex-col gap-0.5 px-2 py-1.5">
                            <span className="truncate text-xs font-medium text-foreground">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              {item.mediaType === "VIDEO" ? (
                                <Film className="size-2.5" />
                              ) : (
                                <ImageIcon className="size-2.5" />
                              )}
                              <span>{formatFileSize(item.fileSize)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Clock className="size-2.5" />
                              <span>{relativeDate(item.uploadedAt)}</span>
                              {item.usedInCampaigns > 0 && (
                                <>
                                  <span className="text-border">·</span>
                                  <BarChart3 className="size-2.5" />
                                  <span>
                                    {item.usedInCampaigns} campaign
                                    {item.usedInCampaigns !== 1 ? "s" : ""}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-border px-4 py-3">
                <Button
                  className="w-full gap-1.5"
                  disabled={selectedCount === 0}
                  onClick={handleSelect}
                >
                  <CheckCircle2 className="size-3.5" />
                  {isMulti
                    ? selectedCount > 0
                      ? `Add ${selectedCount} item${selectedCount !== 1 ? "s" : ""}`
                      : "Select media"
                    : selected
                      ? `Use "${selected.name.length > 20 ? selected.name.slice(0, 20) + "…" : selected.name}"`
                      : "Select a media asset"}
                </Button>
              </div>
            </>
          ) : (
            /* Upload New tab */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8">
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleUploadFiles(e.dataTransfer.files);
                }}
                disabled={uploading}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-16 transition-colors",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/10 hover:border-primary/40 hover:bg-muted/20",
                  uploading && "pointer-events-none opacity-60"
                )}
              >
                {uploading ? (
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Upload className="size-8 text-muted-foreground" />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {uploading
                      ? "Uploading..."
                      : "Drop file here or click to browse"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Image: PNG/JPG, max 5MB | Video: MP4/MOV, max 32MB
                  </p>
                </div>
              </button>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                Uploaded media is saved to your library for reuse across all
                campaigns.
              </p>
              <input
                ref={uploadInputRef}
                type="file"
                accept={accept}
                multiple={isMulti}
                className="hidden"
                onChange={(e) => handleUploadFiles(e.target.files)}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
