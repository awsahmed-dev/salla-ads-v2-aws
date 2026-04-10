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
import { defaultGoogleCampaign, type GoogleCampaignData } from "@/lib/google/campaign-types";

const DRAFT_KEY = "salla_google_campaign_draft";
const DRAFT_STEP_KEY = "salla_google_campaign_step";
/** Bump this when adding new fields to force stale drafts to reset */
const DRAFT_VERSION = 9;
const DRAFT_VERSION_KEY = "salla_google_draft_version";

function getClientDates() {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 30);
  return {
    start: today.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function loadDraft(): { campaign: GoogleCampaignData; step: number } | null {
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

interface GoogleCampaignContextValue {
  campaign: GoogleCampaignData;
  step: number;
  setStep: (s: number) => void;
  updateNested: <K extends keyof GoogleCampaignData>(
    key: K,
    partial: Partial<GoogleCampaignData[K]>
  ) => void;
  reset: () => void;
}

const GoogleCampaignContext = createContext<GoogleCampaignContextValue | null>(null);

export function GoogleCampaignProvider({ children }: { children: ReactNode }) {
  const [campaign, setCampaign] = useState<GoogleCampaignData>(defaultGoogleCampaign);
  const [step, setStep] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const draft = loadDraft();
    if (draft?.campaign) {
      const dc = draft.campaign;
      const merged: GoogleCampaignData = {
        ...defaultGoogleCampaign,
        ...dc,
        objective: { ...defaultGoogleCampaign.objective, ...(dc.objective ?? {}) },
        audience: { ...defaultGoogleCampaign.audience, ...(dc.audience ?? {}) },
        budget: { ...defaultGoogleCampaign.budget, ...(dc.budget ?? {}) },
        creative: { ...defaultGoogleCampaign.creative, ...(dc.creative ?? {}) },
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
    <K extends keyof GoogleCampaignData>(key: K, partial: Partial<GoogleCampaignData[K]>) =>
      setCampaign((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...partial },
      })),
    []
  );

  const reset = useCallback(() => {
    setCampaign(defaultGoogleCampaign);
    setStep(0);
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_STEP_KEY);
    } catch { /* ignore */ }
  }, []);

  return (
    <GoogleCampaignContext.Provider
      value={{ campaign, step, setStep, updateNested, reset }}
    >
      {children}
    </GoogleCampaignContext.Provider>
  );
}

export function useGoogleCampaign() {
  const ctx = useContext(GoogleCampaignContext);
  if (!ctx) throw new Error("useGoogleCampaign must be inside GoogleCampaignProvider");
  return ctx;
}
