/**
 * Draft index system — tracks all campaign drafts across platforms.
 * Stored in localStorage as a lightweight index for the Campaign Dashboard.
 */

export interface DraftMeta {
  id: string;
  platform: "snapchat" | "tiktok" | "google" | "dv360" | "meta";
  campaignName: string;
  objective: string;
  step: number;
  totalSteps: number;
  createdAt: string;
  updatedAt: string;
}

const INDEX_KEY = "salla_campaign_drafts_index";

export function getDraftIndex(): DraftMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function upsertDraftMeta(draft: DraftMeta): void {
  if (typeof window === "undefined") return;
  try {
    const index = getDraftIndex();
    const existing = index.findIndex((d) => d.id === draft.id);
    if (existing >= 0) {
      index[existing] = { ...draft, updatedAt: new Date().toISOString() };
    } else {
      index.push({ ...draft, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // quota exceeded — silently ignore
  }
}

export function removeDraftMeta(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const index = getDraftIndex().filter((d) => d.id !== id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    // Also remove the draft data
    localStorage.removeItem(`salla_draft_${id}`);
    localStorage.removeItem(`salla_draft_${id}_step`);
  } catch {
    // ignore
  }
}

/** Generate a unique draft ID */
export function generateDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Get the localStorage key for a draft's campaign data */
export function getDraftKey(id: string): string {
  return `salla_draft_${id}`;
}

/** Get the localStorage key for a draft's step */
export function getDraftStepKey(id: string): string {
  return `salla_draft_${id}_step`;
}

/** Format relative time (e.g. "2 hours ago", "Yesterday") */
export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Step label mapping */
const STEP_LABELS = ["Objective", "Audience", "Budget", "Ad Design", "Review"];
export function getStepLabel(step: number): string {
  return STEP_LABELS[step] ?? `Step ${step}`;
}
