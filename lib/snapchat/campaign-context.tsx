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
import { upsertDraftMeta, removeDraftMeta, getDraftKey, getDraftStepKey, generateDraftId } from "@/lib/draft-index";

// Legacy keys (for backward compat — migrate on first load)
const LEGACY_DRAFT_KEY = "salla_snap_campaign_draft";
const LEGACY_STEP_KEY = "salla_snap_campaign_step";

function getClientDates() {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 14);
  return {
    start: today.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function deduplicateIds(campaign: CampaignData): CampaignData {
  const seen = new Set<string>();
  const freshId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const creative = { ...campaign.creative };
  creative.ads = creative.ads.map((ad) => {
    const assets = ad.assets.map((a) => {
      if (!a.id || seen.has(a.id)) return { ...a, id: freshId("asset") };
      seen.add(a.id);
      return a;
    });
    const collectionTiles = ad.collectionTiles.map((t) => {
      if (!t.id || seen.has(t.id)) return { ...t, id: freshId("tile") };
      seen.add(t.id);
      return t;
    });
    if (!ad.id || seen.has(ad.id)) ad = { ...ad, id: freshId("ad") };
    seen.add(ad.id);
    return { ...ad, assets, collectionTiles };
  });
  return { ...campaign, creative };
}

function loadDraft(draftId: string): { campaign: CampaignData; step: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getDraftKey(draftId));
    const rawStep = localStorage.getItem(getDraftStepKey(draftId));
    if (raw) {
      return { campaign: deduplicateIds(JSON.parse(raw)), step: rawStep ? parseInt(rawStep, 10) : 0 };
    }
    // Try legacy keys for backward compat
    const legacyRaw = localStorage.getItem(LEGACY_DRAFT_KEY);
    const legacyStep = localStorage.getItem(LEGACY_STEP_KEY);
    if (legacyRaw) {
      // Migrate legacy draft to new system
      const campaign = deduplicateIds(JSON.parse(legacyRaw));
      const step = legacyStep ? parseInt(legacyStep, 10) : 0;
      localStorage.setItem(getDraftKey(draftId), legacyRaw);
      localStorage.setItem(getDraftStepKey(draftId), String(step));
      localStorage.removeItem(LEGACY_DRAFT_KEY);
      localStorage.removeItem(LEGACY_STEP_KEY);
      return { campaign, step };
    }
  } catch { /* ignore */ }
  return null;
}

interface CampaignContextValue {
  campaign: CampaignData;
  step: number;
  draftId: string;
  setStep: (s: number) => void;
  updateNested: <K extends keyof CampaignData>(
    key: K,
    partial: Partial<CampaignData[K]>
  ) => void;
  reset: () => void;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

export function CampaignProvider({ children, draftId: propDraftId }: { children: ReactNode; draftId?: string }) {
  const [draftId] = useState(() => propDraftId || generateDraftId());
  const [campaign, setCampaign] = useState<CampaignData>(defaultCampaign);
  const [step, setStep] = useState(0);
  const initialized = useRef(false);

  // Client-side initialization: restore draft or set default dates
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const draft = loadDraft(draftId);
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
  }, [draftId]);

  // Auto-save draft + update draft index on every change (debounced)
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!initialized.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(getDraftKey(draftId), JSON.stringify(campaign));
        localStorage.setItem(getDraftStepKey(draftId), String(step));
        // Update draft index
        upsertDraftMeta({
          id: draftId,
          platform: "snapchat",
          campaignName: campaign.objective.campaignName || "Untitled Campaign",
          objective: campaign.objective.objective || "",
          step,
          totalSteps: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch { /* storage full -- ignore */ }
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [campaign, step, draftId]);

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
      localStorage.removeItem(getDraftKey(draftId));
      localStorage.removeItem(getDraftStepKey(draftId));
      removeDraftMeta(draftId);
    } catch { /* ignore */ }
  }, [draftId]);

  return (
    <CampaignContext.Provider
      value={{ campaign, step, draftId, setStep, updateNested, reset }}
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
