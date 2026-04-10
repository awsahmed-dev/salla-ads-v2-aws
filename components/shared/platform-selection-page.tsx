"use client";

import { cn } from "@/lib/utils";

export type Platform = "snapchat" | "tiktok" | "google" | "dv360" | "meta";

const PLATFORMS: {
  id: Platform;
  name: string;
  desc: string;
  logo: React.ReactNode;
  color: string;
}[] = [
  {
    id: "snapchat",
    name: "Snapchat",
    desc: "Reach a young, engaged audience",
    color: "#FFFC00",
    logo: (
      <svg viewBox="0 0 24 24" className="size-8" fill="currentColor">
        <path d="M12.166 3c.796 0 3.495.223 4.769 3.073.476 1.066.362 2.861.27 4.269l-.012.193c-.023.38-.044.714-.044.98a.6.6 0 0 0 .282.09c.249 0 .556-.156.912-.463a.58.58 0 0 1 .376-.141.544.544 0 0 1 .378.166c.243.253.175.561.082.712-.284.456-.126.72.016.937.193.295.193.549-.005.797-.274.346-.84.594-1.631.716a2.79 2.79 0 0 0-.264.049c-.074.023-.157.069-.198.312-.047.278-.29.474-.606.488-.34.014-.673.187-1.059.381-.545.274-1.22.614-2.244.614-.036 0-.073-.001-.11-.003-.038.002-.076.003-.114.003-1.024 0-1.698-.34-2.243-.614-.387-.194-.72-.367-1.06-.381-.316-.014-.559-.21-.605-.488-.041-.243-.125-.29-.198-.312a2.765 2.765 0 0 0-.265-.049c-.79-.122-1.357-.37-1.631-.716-.198-.248-.198-.502-.005-.797.142-.217.3-.481.016-.937-.093-.151-.161-.459.082-.712a.544.544 0 0 1 .378-.166.58.58 0 0 1 .376.14c.356.308.663.464.912.464a.6.6 0 0 0 .282-.09c0-.267-.021-.6-.044-.98l-.012-.194c-.092-1.408-.206-3.203.27-4.269C8.505 3.223 11.204 3 12 3h.166Z" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    name: "TikTok",
    desc: "Short-form video ads that convert",
    color: "#000000",
    logo: (
      <svg viewBox="0 0 24 24" className="size-8" fill="currentColor">
        <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
      </svg>
    ),
  },
  {
    id: "google",
    name: "Google Ads",
    desc: "Search and display advertising",
    color: "#4285F4",
    logo: (
      <svg viewBox="0 0 24 24" className="size-8" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48Z" />
      </svg>
    ),
  },
  {
    id: "dv360",
    name: "YouTube (DV360)",
    desc: "Video ads on YouTube",
    color: "#FF0000",
    logo: (
      <svg viewBox="0 0 24 24" className="size-8 text-red-600" fill="currentColor">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.76 31.76 0 0 0 0 12a31.76 31.76 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.76 31.76 0 0 0 24 12a31.76 31.76 0 0 0-.5-5.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
      </svg>
    ),
  },
  {
    id: "meta",
    name: "Meta",
    desc: "Ads on Facebook and Instagram",
    color: "#1877F2",
    logo: (
      <svg viewBox="0 0 24 24" className="size-8 text-[#1877F2]" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
      </svg>
    ),
  },
];

interface PlatformSelectionPageProps {
  onSelect: (platform: Platform) => void;
}

export function PlatformSelectionPage({ onSelect }: PlatformSelectionPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Create Campaign
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a platform to get started
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-8 text-center transition-all",
                "hover:border-[#a4ffe5] hover:bg-[#e6fff9] hover:shadow-md"
              )}
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
                {p.logo}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{p.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
