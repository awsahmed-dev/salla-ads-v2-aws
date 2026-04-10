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
import { defaultTikTokCampaign, type TikTokCampaignData } from "@/lib/tiktok/campaign-types";
import { getTikTokAdAccountStatus, type TikTokAdAccountStatus } from "@/lib/salla/store-api";

const DRAFT_KEY = "salla_tiktok_campaign_draft";
const DRAFT_STEP_KEY = "salla_tiktok_campaign_step";
/** Bump this when adding new fields to force stale drafts to reset */
const DRAFT_VERSION = 9;
const DRAFT_VERSION_KEY = "salla_tiktok_draft_version";

function getClientDates() {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 14);
  return {
    start: today.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function loadDraft(): { campaign: TikTokCampaignData; step: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const savedVersion = parseInt(localStorage.getItem(DRAFT_VERSION_KEY) || "0", 10);
    if (savedVersion < DRAFT_VERSION) {
      // Stale draft from before new fields were added -- discard it
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

interface TikTokCampaignContextValue {
  campaign: TikTokCampaignData;
  step: number;
  setStep: (s: number) => void;
  updateNested: <K extends keyof TikTokCampaignData>(
    key: K,
    partial: Partial<TikTokCampaignData[K]>
  ) => void;
  reset: () => void;
  /** TikTok ad account status -- null while loading */
  adAccountStatus: TikTokAdAccountStatus | null;
}

const TikTokCampaignContext = createContext<TikTokCampaignContextValue | null>(null);

export function TikTokCampaignProvider({ children }: { children: ReactNode }) {
  const [campaign, setCampaign] = useState<TikTokCampaignData>(defaultTikTokCampaign);
  const [step, setStep] = useState(0);
  const [adAccountStatus, setAdAccountStatus] = useState<TikTokAdAccountStatus | null>(null);
  const initialized = useRef(false);

  // Check ad account status on mount
  useEffect(() => {
    getTikTokAdAccountStatus().then(setAdAccountStatus);
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const draft = loadDraft();
    if (draft?.campaign) {
      const dc = draft.campaign;
      // Deep-merge with defaults so new fields added after draft was saved still exist
      const merged: TikTokCampaignData = {
        ...defaultTikTokCampaign,
        ...dc,
        objective: { ...defaultTikTokCampaign.objective, ...(dc.objective ?? {}) },
        audience: { ...defaultTikTokCampaign.audience, ...(dc.audience ?? {}) },
        budget: { ...defaultTikTokCampaign.budget, ...(dc.budget ?? {}) },
        creative: {
          ...defaultTikTokCampaign.creative,
          ...(dc.creative ?? {}),
          identity: { ...defaultTikTokCampaign.creative.identity, ...((dc.creative ?? {}).identity ?? {}) },
          contentControls: { ...defaultTikTokCampaign.creative.contentControls, ...((dc.creative ?? {}).contentControls ?? {}) },
        },
      };
      setCampaign(merged);
      setStep(draft.step ?? 0);
    } else {
      const dates = getClientDates();
      setCampaign((prev) => ({
        ...prev,
        budget: { ...prev.budget, startDate: dates.start, endDate: dates.end },
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
    <K extends keyof TikTokCampaignData>(key: K, partial: Partial<TikTokCampaignData[K]>) =>
      setCampaign((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...partial },
      })),
    []
  );

  const reset = useCallback(() => {
    setCampaign(defaultTikTokCampaign);
    setStep(0);
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_STEP_KEY);
    } catch { /* ignore */ }
  }, []);

  return (
    <TikTokCampaignContext.Provider
      value={{ campaign, step, setStep, updateNested, reset, adAccountStatus }}
    >
      {children}
    </TikTokCampaignContext.Provider>
  );
}

export function useTikTokCampaign() {
  const ctx = useContext(TikTokCampaignContext);
  if (!ctx) throw new Error("useTikTokCampaign must be inside TikTokCampaignProvider");
  return ctx;
}
