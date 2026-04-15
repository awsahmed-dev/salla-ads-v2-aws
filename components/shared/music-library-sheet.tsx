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
  Music,
  CheckCircle2,
  Play,
  Pause,
  Library,
} from "lucide-react";
import {
  fetchMusicLibrary,
  searchMusic,
  formatDuration,
  type MusicTrack,
  type MusicGenre,
} from "@/lib/salla/media-library";

export interface MusicLibrarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (music: {
    url: string;
    file?: File;
    name: string;
    musicId?: string;
  }) => void;
  /** Optional — currently unused for filtering but reserved for future variants */
  required?: boolean;
}

type TabId = "browse" | "upload";

const GENRE_FILTERS: (MusicGenre | "ALL")[] = [
  "ALL",
  "Pop",
  "Electronic",
  "Ambient",
  "Corporate",
  "Upbeat",
  "Hip Hop",
  "Acoustic",
  "Cinematic",
];

const AUDIO_ACCEPT = "audio/mpeg,audio/wav,audio/x-m4a,audio/flac";
const MAX_MUSIC_MB = 10;

export function MusicLibrarySheet({
  open,
  onOpenChange,
  onSelect,
}: MusicLibrarySheetProps) {
  const [tab, setTab] = useState<TabId>("browse");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<MusicGenre | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    try {
      const results = query.trim() || genre !== "ALL"
        ? await searchMusic(query, genre)
        : await fetchMusicLibrary();
      setTracks(results);
    } finally {
      setLoading(false);
    }
  }, [query, genre]);

  useEffect(() => {
    if (open && tab === "browse") loadTracks();
  }, [open, tab, loadTracks]);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setPlayingId(null);
      setQuery("");
      setGenre("ALL");
      setTab("browse");
      setUploadError(null);
    }
  }, [open]);

  const selectedTrack = useMemo(
    () => tracks.find((t) => t.id === selectedId) ?? null,
    [tracks, selectedId]
  );

  const handleSelect = () => {
    if (!selectedTrack) return;
    onSelect({
      url: selectedTrack.url,
      name: selectedTrack.name,
      musicId: selectedTrack.musicId,
    });
    onOpenChange(false);
  };

  const handleUploadFile = useCallback(
    (file: File) => {
      setUploadError(null);
      if (file.size > MAX_MUSIC_MB * 1024 * 1024) {
        setUploadError(`File is too large. Max ${MAX_MUSIC_MB}MB.`);
        return;
      }
      const name = file.name.replace(/\.[^.]+$/, "");
      onSelect({
        url: URL.createObjectURL(file),
        file,
        name,
      });
      onOpenChange(false);
    },
    [onSelect, onOpenChange]
  );

  const handleUploadFiles = (files: FileList | null) => {
    if (!files?.length) return;
    handleUploadFile(files[0]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b border-border px-5 pb-3 pt-5">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Music className="size-4 text-primary" />
            Music Library
          </SheetTitle>
          <SheetDescription className="text-xs">
            Choose a track from the TikTok Commercial Music Library or upload your own
          </SheetDescription>
        </SheetHeader>

        {/* Tab bar */}
        <div className="flex shrink-0 border-b border-border">
          {(
            [
              { id: "browse" as TabId, label: "Browse", icon: Library },
              { id: "upload" as TabId, label: "Upload", icon: Upload },
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
          {tab === "browse" ? (
            <>
              {/* Search + genre pills */}
              <div className="flex shrink-0 flex-col gap-2 px-4 pt-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, artist or genre..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_FILTERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenre(g)}
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                        genre === g
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {g === "ALL" ? "All" : g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Track list */}
              <div className="flex-1 overflow-y-auto px-4 pb-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : tracks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <Music className="size-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No tracks found
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Try a different search or genre
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {tracks.map((track) => {
                      const isSelected = selectedId === track.id;
                      const isPlaying = playingId === track.id;
                      return (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() =>
                            setSelectedId(isSelected ? null : track.id)
                          }
                          className={cn(
                            "group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                            isSelected
                              ? "border-primary/50 bg-primary/[0.04] ring-1 ring-primary/20"
                              : "border-border hover:border-primary/30 hover:bg-muted/20"
                          )}
                        >
                          {/* Gradient thumb with play/pause */}
                          <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/25 to-primary/5">
                            <Music
                              className={cn(
                                "size-4 text-primary transition-opacity",
                                "group-hover:opacity-0"
                              )}
                            />
                            <span
                              role="button"
                              tabIndex={-1}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlayingId(isPlaying ? null : track.id);
                              }}
                              className="absolute inset-0 flex items-center justify-center bg-primary/15 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              {isPlaying ? (
                                <Pause className="size-4 text-primary" />
                              ) : (
                                <Play className="size-4 text-primary" />
                              )}
                            </span>
                          </div>

                          {/* Track info */}
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium text-foreground">
                              {track.name}
                            </span>
                            <span className="truncate text-[11px] text-muted-foreground">
                              {track.artist} · {track.genre}
                            </span>
                          </div>

                          {/* Duration + selection */}
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-[11px] tabular-nums text-muted-foreground">
                              {formatDuration(track.duration)}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="size-4 text-primary" />
                            )}
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
                  disabled={!selectedTrack}
                  onClick={handleSelect}
                >
                  <CheckCircle2 className="size-3.5" />
                  {selectedTrack
                    ? `Use "${selectedTrack.name.length > 24 ? selectedTrack.name.slice(0, 24) + "…" : selectedTrack.name}"`
                    : "Select a track"}
                </Button>
              </div>
            </>
          ) : (
            /* Upload tab */
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
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-16 transition-colors",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/10 hover:border-primary/40 hover:bg-muted/20"
                )}
              >
                <Upload className="size-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Drop audio file here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    MP3, WAV, M4A or FLAC · min 2s · max {MAX_MUSIC_MB}MB
                  </p>
                </div>
              </button>
              {uploadError && (
                <p className="text-xs text-destructive">{uploadError}</p>
              )}
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                Uploaded music is used for this ad only. For Pangle placements,
                uploaded audio is required.
              </p>
              <input
                ref={uploadInputRef}
                type="file"
                accept={AUDIO_ACCEPT}
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
