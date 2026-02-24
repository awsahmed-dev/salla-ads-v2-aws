"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { defaultCampaign, type CampaignData } from "@/lib/snapchat/campaign-types";

const DRAFT_KEY = "salla_snap_campaign_draft";
const DRAFT_STEP_KEY = "salla_snap_campaign_step";

/** Safely get default dates (client-only) */
function getClientDates() {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 14);
  return {
    start: today.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

/** Ensure every asset/tile in the draft has a unique id */
function deduplicateIds(campaign: CampaignData): CampaignData {
  const seen = new Set<string>();
  const freshId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const creative = { ...campaign.creative };
  creative.ads = creative.ads.map((ad) => {
    const assets = ad.assets.map((a) => {
      if (!a.id || seen.has(a.id)) {
        return { ...a, id: freshId("asset") };
      }
      seen.add(a.id);
      return a;
    });
    const collectionTiles = ad.collectionTiles.map((t) => {
      if (!t.id || seen.has(t.id)) {
        return { ...t, id: freshId("tile") };
      }
      seen.add(t.id);
      return t;
    });
    if (!ad.id || seen.has(ad.id)) {
      ad = { ...ad, id: freshId("ad") };
    }
    seen.add(ad.id);
    return { ...ad, assets, collectionTiles };
  });
  return { ...campaign, creative };
}

/** Try to restore draft from localStorage */
function loadDraft(): { campaign: CampaignData; step: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const rawStep = localStorage.getItem(DRAFT_STEP_KEY);
    if (raw) {
      return { campaign: deduplicateIds(JSON.parse(raw)), step: rawStep ? parseInt(rawStep, 10) : 0 };
    }
  } catch { /* ignore */ }
  return null;
}

interface CampaignContextValue {
  campaign: CampaignData;
  step: number;
  setStep: (s: number) => void;
  updateNested: <K extends keyof CampaignData>(
    key: K,
    partial: Partial<CampaignData[K]>
  ) => void;
  reset: () => void;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaign, setCampaign] = useState<CampaignData>(defaultCampaign);
  const [step, setStep] = useState(0);
  const initialized = useRef(false);

  // Client-side initialization: restore draft or set default dates
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const draft = loadDraft();
    if (draft) {
      setCampaign(draft.campaign);
      setStep(draft.step);
    } else {
      const dates = getClientDates();
      setCampaign((prev) => ({
        ...prev,
        budget: { ...prev.budget, startDate: dates.start, endDate: dates.end },
      }));
    }
  }, []);

  // Auto-save draft to localStorage on every change (debounced)
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!initialized.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(campaign));
        localStorage.setItem(DRAFT_STEP_KEY, String(step));
      } catch { /* storage full -- ignore */ }
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [campaign, step]);

  const updateNested = useCallback(
    <K extends keyof CampaignData>(key: K, partial: Partial<CampaignData[K]>) =>
      setCampaign((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...partial },
      })),
    []
  );

  const reset = useCallback(() => {
    setCampaign(defaultCampaign);
    setStep(0);
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_STEP_KEY);
    } catch { /* ignore */ }
  }, []);

  return (
    <CampaignContext.Provider
      value={{ campaign, step, setStep, updateNested, reset }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error("useCampaign must be inside CampaignProvider");
  return ctx;
}
