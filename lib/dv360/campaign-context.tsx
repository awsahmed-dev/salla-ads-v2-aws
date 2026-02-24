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
import { defaultDV360Campaign, createVideoAd, type DV360CampaignData } from "@/lib/dv360/campaign-types";

const DRAFT_KEY = "salla_dv360_campaign_draft";
const DRAFT_STEP_KEY = "salla_dv360_campaign_step";
const DRAFT_VERSION = 1;
const DRAFT_VERSION_KEY = "salla_dv360_draft_version";

function getClientDates() {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 30);
  return {
    start: today.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function loadDraft(): { campaign: DV360CampaignData; step: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const savedVersion = parseInt(localStorage.getItem(DRAFT_VERSION_KEY) || "0", 10);
    if (savedVersion < DRAFT_VERSION) {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_STEP_KEY);
      localStorage.setItem(DRAFT_VERSION_KEY, String(DRAFT_VERSION));
      return null;
    }
    const raw = localStorage.getItem(DRAFT_KEY);
    const rawStep = localStorage.getItem(DRAFT_STEP_KEY);
    if (raw) {
      return { campaign: JSON.parse(raw), step: rawStep ? parseInt(rawStep, 10) : 0 };
    }
  } catch { /* ignore */ }
  return null;
}

interface DV360CampaignContextValue {
  campaign: DV360CampaignData;
  step: number;
  setStep: (s: number) => void;
  updateNested: <K extends keyof DV360CampaignData>(
    key: K,
    partial: Partial<DV360CampaignData[K]>
  ) => void;
  reset: () => void;
}

const DV360CampaignContext = createContext<DV360CampaignContextValue | null>(null);

export function DV360CampaignProvider({ children }: { children: ReactNode }) {
  const [campaign, setCampaign] = useState<DV360CampaignData>(defaultDV360Campaign);
  const [step, setStep] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const draft = loadDraft();
    if (draft?.campaign) {
      const dc = draft.campaign;
      const merged: DV360CampaignData = {
        ...defaultDV360Campaign,
        ...dc,
        objective: { ...defaultDV360Campaign.objective, ...(dc.objective ?? {}) },
        audience: { ...defaultDV360Campaign.audience, ...(dc.audience ?? {}) },
        budget: { ...defaultDV360Campaign.budget, ...(dc.budget ?? {}) },
        creative: { ...defaultDV360Campaign.creative, ...(dc.creative ?? {}) },
      };
      // Ensure at least one video ad
      if (!merged.creative.videoAds?.length) {
        merged.creative.videoAds = [createVideoAd(merged.objective.objective)];
      }
      setCampaign(merged);
      setStep(draft.step ?? 0);
    } else {
      const dates = getClientDates();
      setCampaign((prev) => ({
        ...prev,
        budget: { ...prev.budget, startDate: dates.start, endDate: dates.end },
        creative: {
          ...prev.creative,
          videoAds: prev.creative.videoAds.length ? prev.creative.videoAds : [createVideoAd(prev.objective.objective)],
        },
      }));
    }
  }, []);

  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!initialized.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(campaign));
        localStorage.setItem(DRAFT_STEP_KEY, String(step));
        localStorage.setItem(DRAFT_VERSION_KEY, String(DRAFT_VERSION));
      } catch { /* storage full */ }
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [campaign, step]);

  const updateNested = useCallback(
    <K extends keyof DV360CampaignData>(key: K, partial: Partial<DV360CampaignData[K]>) =>
      setCampaign((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...partial },
      })),
    []
  );

  const reset = useCallback(() => {
    const dates = getClientDates();
    const fresh = {
      ...defaultDV360Campaign,
      budget: { ...defaultDV360Campaign.budget, startDate: dates.start, endDate: dates.end },
      creative: { ...defaultDV360Campaign.creative, videoAds: [createVideoAd("AWARENESS")] },
    };
    setCampaign(fresh);
    setStep(0);
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_STEP_KEY);
    } catch { /* ignore */ }
  }, []);

  return (
    <DV360CampaignContext.Provider value={{ campaign, step, setStep, updateNested, reset }}>
      {children}
    </DV360CampaignContext.Provider>
  );
}

export function useDV360Campaign() {
  const ctx = useContext(DV360CampaignContext);
  if (!ctx) throw new Error("useDV360Campaign must be inside DV360CampaignProvider");
  return ctx;
}
