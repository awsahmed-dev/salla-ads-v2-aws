"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Platform } from "@/components/shared/platform-selection-page";

export interface ActiveCampaignState {
  platform: Platform;
  draftId?: string;
}

interface AppContextValue {
  active: ActiveCampaignState | null;
  setActive: (state: ActiveCampaignState | null) => void;
}

const AppContext = createContext<AppContextValue>({
  active: null,
  setActive: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveCampaignState | null>(null);
  return (
    <AppContext.Provider value={{ active, setActive }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
