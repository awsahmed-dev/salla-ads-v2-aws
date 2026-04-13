"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageUp, Upload, Trash2, Download } from "lucide-react";
import { MediaLibrarySheet, type MediaLibraryContext } from "@/components/shared/media-library-sheet";

/**
 * Reusable media upload drop zone with preview support.
 * Used by both Snapchat and TikTok campaign wizards.
 *
 * When enableLibrary is true (default), clicking the empty state or
 * the replace button opens the Media Library Sheet instead of the
 * native file picker. Drag-and-drop still works directly.
 */
export function UploadZone({
  accept,
  label,
  sublabel,
  preview,
  previewMediaType,
  previewFile,
  onFile,
  onClear,
  compact,
  enableLibrary = true,
  libraryContext,
  multiSelect = false,
}: {
  accept: string;
  label: string;
  sublabel: string;
  preview?: string;
  previewMediaType?: "IMAGE" | "VIDEO";
  previewFile?: File;
  onFile: (file: File) => void;
  onClear?: () => void;
  compact?: boolean;
  enableLibrary?: boolean;
  libraryContext?: MediaLibraryContext;
  multiSelect?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      if (multiSelect) {
        Array.from(files).forEach((file) => onFile(file));
        return;
      }
      onFile(files[0]);
    },
    [onFile, multiSelect]
  );

  const handleMediaSelect = useCallback(
    (media: { url: string; mediaType: "IMAGE" | "VIDEO"; file?: File; name: string }) => {
      if (media.file) {
        onFile(media.file);
      } else {
        // Library item without a local file — synthesize a minimal update
        // The parent's onFile expects a File but for library items we have a URL.
        // We create a tiny placeholder blob so the parent can detect a change.
        fetch(media.url)
          .then((r) => r.blob())
          .then((blob) => {
            const ext = media.mediaType === "VIDEO" ? ".mp4" : ".jpg";
            const mime = media.mediaType === "VIDEO" ? "video/mp4" : "image/jpeg";
            const file = new File([blob], media.name + ext, { type: mime });
            onFile(file);
          })
          .catch(() => {
            // Fallback: create a zero-byte placeholder
            const ext = media.mediaType === "VIDEO" ? ".mp4" : ".jpg";
            const mime = media.mediaType === "VIDEO" ? "video/mp4" : "image/jpeg";
            const file = new File([], media.name + ext, { type: mime });
            onFile(file);
          });
      }
    },
    [onFile]
  );

  const openAction = enableLibrary
    ? () => setSheetOpen(true)
    : () => inputRef.current?.click();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ----- Preview state (media uploaded) -----
  if (preview) {
    if (compact) {
      return (
        <div className="relative h-20 overflow-hidden rounded-lg border border-border bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="size-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <Button size="sm" variant="secondary" className="h-6 px-2 text-xs" onClick={openAction}>Replace</Button>
            {onClear && <Button size="sm" variant="destructive" className="h-6 px-2 text-xs" onClick={onClear}>Remove</Button>}
          </div>
          <input ref={inputRef} type="file" accept={accept} multiple={multiSelect} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          {enableLibrary && (
            <MediaLibrarySheet
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              onSelect={handleMediaSelect}
              accept={accept}
              context={libraryContext}
              multiSelect={multiSelect}
            />
          )}
        </div>
      );
    }

    const fileName = previewFile?.name || (previewMediaType === "VIDEO" ? "video.mp4" : "image.jpg");
    const fileSize = previewFile?.size ? formatSize(previewFile.size) : "";
    const isVideo = previewMediaType === "VIDEO";

    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5">
        <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-black">
          {isVideo ? (
            <video src={preview} muted className="size-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="size-full object-cover" crossOrigin="anonymous" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium text-foreground">{fileName}</span>
          {fileSize && <span className="text-sm text-muted-foreground">{fileSize}</span>}
        </div>
        <button
          type="button"
          onClick={openAction}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Replace media"
        >
          <Upload className="size-3.5" />
        </button>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-md p-1.5 text-destructive/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Remove media"
          >
            <Trash2 className="size-4" />
          </button>
        )}
        <input ref={inputRef} type="file" accept={accept} multiple={multiSelect} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {enableLibrary && (
          <MediaLibrarySheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            onSelect={handleMediaSelect}
            accept={accept}
            context={libraryContext}
            multiSelect={multiSelect}
          />
        )}
      </div>
    );
  }

  // ----- Empty state (no media yet) -----
  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40",
          compact ? "gap-2 py-4" : "gap-4 p-6"
        )}
      >
        <ImageUp className={cn("text-muted-foreground", compact ? "size-5" : "size-8")} />
        <div className={cn("flex flex-col items-center text-center w-full", compact ? "gap-0.5" : "gap-1")}>
          <span className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>{label}</span>
          <span className={cn("text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>{sublabel}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={openAction}
        >
          Add
          <Download className="size-3.5" />
        </Button>
        <input ref={inputRef} type="file" accept={accept} multiple={multiSelect} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {enableLibrary && (
        <MediaLibrarySheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSelect={handleMediaSelect}
          accept={accept}
          context={libraryContext}
          multiSelect={multiSelect}
        />
      )}
    </>
  );
}
