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
import { defaultMetaCampaign, type MetaCampaignData } from "@/lib/meta/campaign-types";

const DRAFT_KEY = "salla_meta_campaign_draft";
const DRAFT_STEP_KEY = "salla_meta_campaign_step";
const DRAFT_VERSION = 1;
const DRAFT_VERSION_KEY = "salla_meta_draft_version";

function getClientDates() {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 14);
  return {
    start: today.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function loadDraft(): { campaign: MetaCampaignData; step: number } | null {
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

interface MetaCampaignContextValue {
  campaign: MetaCampaignData;
  step: number;
  setStep: (s: number) => void;
  updateNested: <K extends keyof MetaCampaignData>(
    key: K,
    partial: Partial<MetaCampaignData[K]>
  ) => void;
  reset: () => void;
}

const MetaCampaignContext = createContext<MetaCampaignContextValue | null>(null);

export function MetaCampaignProvider({ children }: { children: ReactNode }) {
  const [campaign, setCampaign] = useState<MetaCampaignData>(defaultMetaCampaign);
  const [step, setStep] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const draft = loadDraft();
    if (draft?.campaign) {
      const dc = draft.campaign;
      const merged: MetaCampaignData = {
        ...defaultMetaCampaign,
        ...dc,
        objective: { ...defaultMetaCampaign.objective, ...(dc.objective ?? {}) },
        audience: { ...defaultMetaCampaign.audience, ...(dc.audience ?? {}) },
        budget: { ...defaultMetaCampaign.budget, ...(dc.budget ?? {}) },
        creative: { ...defaultMetaCampaign.creative, ...(dc.creative ?? {}) },
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
    <K extends keyof MetaCampaignData>(key: K, partial: Partial<MetaCampaignData[K]>) =>
      setCampaign((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...partial },
      })),
    []
  );

  const reset = useCallback(() => {
    setCampaign(defaultMetaCampaign);
    setStep(0);
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_STEP_KEY);
    } catch { /* ignore */ }
  }, []);

  return (
    <MetaCampaignContext.Provider value={{ campaign, step, setStep, updateNested, reset }}>
      {children}
    </MetaCampaignContext.Provider>
  );
}

export function useMetaCampaign() {
  const ctx = useContext(MetaCampaignContext);
  if (!ctx) throw new Error("useMetaCampaign must be inside MetaCampaignProvider");
  return ctx;
}
