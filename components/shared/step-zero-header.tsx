"use client";

import { Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StepZeroPlatform = "snapchat" | "tiktok" | "google" | "dv360" | "meta";

const PLATFORM_CONFIG: Record<
  StepZeroPlatform,
  { iconBg: string; iconColor?: string; dotColor: string; saveColor: string; logo: React.ReactNode }
> = {
  snapchat: {
    iconBg: "bg-[#FFFC00]",
    iconColor: "text-black",
    dotColor: "bg-[#FFFC00]",
    saveColor: "text-foreground",
    logo: (
      <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.032.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .299.063.396.124.164.104.255.245.344.419.055.11.098.226.098.373 0 .345-.224.645-.526.837-.361.228-.736.396-.918.498-.044.03-.088.06-.132.09-.166.12-.302.238-.361.398-.039.12-.039.223-.03.3.09.602-.18.87-.39 1.01-.27.18-.659.298-1.115.405-.27.06-.54.12-.765.18-.045.015-.104.06-.134.12-.045.09-.061.165-.073.27-.06.39-.355.592-.7.592-.164 0-.343-.045-.533-.091a4.47 4.47 0 0 0-.556-.106 8.849 8.849 0 0 0-1.315-.09c-.392 0-.8.03-1.204.09a4.47 4.47 0 0 0-.5.101c-.186.045-.374.09-.54.09-.345 0-.655-.18-.715-.57-.011-.105-.027-.18-.073-.27-.03-.06-.089-.105-.134-.12-.224-.06-.494-.12-.764-.18-.457-.106-.846-.225-1.115-.405-.21-.14-.48-.408-.39-1.01.01-.077.01-.18-.03-.3-.06-.16-.195-.278-.36-.398-.045-.03-.09-.06-.133-.09-.18-.102-.556-.27-.918-.498-.302-.192-.525-.492-.525-.837 0-.147.043-.263.098-.373.09-.174.18-.315.345-.42.097-.06.214-.123.396-.123.12 0 .3.016.464.104.374.18.732.285 1.033.3.198 0 .326-.044.4-.09a5.85 5.85 0 0 1-.032-.509l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.867 1.069 11.216.793 12.206.793Z" />
      </svg>
    ),
  },
  tiktok: {
    iconBg: "bg-foreground",
    iconColor: "text-background",
    dotColor: "bg-foreground",
    saveColor: "text-foreground",
    logo: (
      <svg viewBox="0 0 256 256" className="size-5" fill="currentColor">
        <path d="M224 72.2a65.7 65.7 0 0 1-39.6-13.2 65.8 65.8 0 0 1-24.1-40.4A66 66 0 0 1 160 12h-40v140a32 32 0 1 1-22.3-30.5V80a73 73 0 0 0-9.7-.6 72 72 0 1 0 72 72V95.6A105.3 105.3 0 0 0 224 112V72.2Z" />
      </svg>
    ),
  },
  google: {
    iconBg: "bg-white dark:bg-white",
    iconColor: "",
    dotColor: "bg-[#4285F4]",
    saveColor: "text-[#4285F4]",
    logo: (
      <svg viewBox="0 0 24 24" className="size-5">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  dv360: {
    iconBg: "bg-[#FF0000]",
    iconColor: "text-white",
    dotColor: "bg-[#FF0000]",
    saveColor: "text-[#FF0000]",
    logo: (
      <svg viewBox="0 0 256 180" className="size-5" fill="currentColor">
        <path d="M250.35 28.21A32.16 32.16 0 0 0 227.72 5.6C207.76 0 128 0 128 0S48.24 0 28.28 5.6A32.16 32.16 0 0 0 5.65 28.21C0 48.13 0 89.69 0 89.69s0 41.56 5.65 61.48a32.16 32.16 0 0 0 22.63 22.62C48.24 179.39 128 179.39 128 179.39s79.76 0 99.72-5.6a32.16 32.16 0 0 0 22.63-22.62C256 131.25 256 89.69 256 89.69s0-41.56-5.65-61.48ZM102.4 128V51.39L168.88 89.7 102.4 128Z" />
      </svg>
    ),
  },
  meta: {
    iconBg: "bg-[#0081FB]",
    iconColor: "text-white",
    dotColor: "bg-[#0081FB]",
    saveColor: "text-[#0081FB]",
    logo: (
      <svg viewBox="0 0 80 48" className="size-6" fill="none">
        <path d="M20 4C11 4 5.6 13.2 0 24c0 0 0 0 0 0v0C5.6 34.8 11 44 20 44c10 0 15-10 20-20C35 14 30 4 20 4Zm0 32c-5.6 0-10-5.4-10-12s4.4-12 10-12 10 5.4 10 12-4.4 12-10 12Z" fill="white" />
        <path d="M60 4c-10 0-15 10-20 20 5 10 10 20 20 20 9 0 14.4-9.2 20-20C74.4 13.2 69 4 60 4Zm0 32c-5.6 0-10-5.4-10-12s4.4-12 10-12 10 5.4 10 12-4.4 12-10 12Z" fill="white" />
      </svg>
    ),
  },
};

export type StepZeroSaveState = "idle" | "saving" | "saved";

interface StepZeroHeaderProps {
  platform: StepZeroPlatform;
  title: string;
  subtitle: string;
  saveState: StepZeroSaveState;
}

/**
 * Unified Step 0 (Objective) header for all ad platforms.
 * Aligns with the platform switcher and provides consistent campaign-creation UX.
 */
export function StepZeroHeader({ platform, title, subtitle, saveState }: StepZeroHeaderProps) {
  const config = PLATFORM_CONFIG[platform];

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm",
              config.iconBg,
              config.iconColor
            )}
          >
            {config.logo}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 gap-1.5 rounded-full border-border px-3 py-1.5 text-xs font-medium"
        >
          {saveState === "saving" ? (
            <>
              <span className="size-2 animate-pulse rounded-full bg-amber-500" />
              Saving…
            </>
          ) : saveState === "saved" ? (
            <>
              <Save className={cn("size-3.5", config.saveColor)} />
              Draft saved
            </>
          ) : (
            <>
              <span className={cn("size-2 rounded-full", config.dotColor)} />
              Draft
            </>
          )}
        </Badge>
      </div>
    </header>
  );
}
