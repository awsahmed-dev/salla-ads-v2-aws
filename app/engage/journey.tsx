"use client";

import { useEffect, useState } from "react";
import {
  Rocket,
  Whatsapp,
  UserAdd,
  Zap,
  Megaphone,
  Inbox,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  X,
} from "./icons";

const TEAL = "#004a57";
const TEAL_DEEP = "#083e45";
const GREEN = "#00ad6b";
const GREEN_SOFT = "#effbf6";
const MINT_SOFT = "#e5fff9";
const HAIR = "#ededed";
const MUTED = "#737373";

const STORE_KEY = "engage_journey_v1";
const DISMISS_KEY = "engage_journey_dismissed_v1";

type Action = "connect" | "contacts" | "automation" | "campaign" | "reply";

interface JourneyStep {
  id: Action;
  icon: typeof Inbox;
  tint: string;
  bg: string;
  title: string;
  desc: string;
  cta: string;
}

const STEPS: JourneyStep[] = [
  { id: "connect", icon: Whatsapp, tint: GREEN, bg: GREEN_SOFT, title: "Connect WhatsApp", desc: "Link your Business number to start receiving messages.", cta: "Connect" },
  { id: "contacts", icon: UserAdd, tint: "#5399f3", bg: "#ecf3fe", title: "Import contacts", desc: "Bring your customers in from your Salla store.", cta: "Import" },
  { id: "automation", icon: Zap, tint: TEAL, bg: MINT_SOFT, title: "Enable cart recovery", desc: "Automatically win back abandoned carts.", cta: "Enable" },
  { id: "campaign", icon: Megaphone, tint: "#d28f37", bg: "#fff6eb", title: "Create a campaign", desc: "Broadcast an offer to your audience.", cta: "Create" },
  { id: "reply", icon: Inbox, tint: "#8b5cf6", bg: "#f3f0ff", title: "Reply to a chat", desc: "Answer your first customer conversation.", cta: "Open inbox" },
];

export function JourneySteps({
  onOpenInbox,
  onGoBroadcasts,
}: {
  onOpenInbox?: () => void;
  onGoBroadcasts?: () => void;
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(STORE_KEY) || "{}"));
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    setReady(true);
  }, []);

  function persist(next: Record<string, boolean>) {
    setDone(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function complete(id: Action) {
    persist({ ...done, [id]: true });
    if (id === "campaign") onGoBroadcasts?.();
    if (id === "reply") onOpenInbox?.();
  }

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function reset() {
    persist({});
  }

  if (!ready || dismissed) return null;

  const total = STEPS.length;
  const completed = STEPS.filter((s) => done[s.id]).length;
  const pct = Math.round((completed / total) * 100);
  const allDone = completed === total;
  const nextIdx = STEPS.findIndex((s) => !done[s.id]);

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border" style={{ borderColor: HAIR }}>
      {/* Header */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-4"
        style={{ background: `linear-gradient(135deg, ${MINT_SOFT} 0%, #ffffff 60%)` }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: allDone ? GREEN_SOFT : "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {allDone ? <CheckCircle className="size-6" style={{ color: GREEN }} /> : <Rocket className="size-6" style={{ color: TEAL }} />}
          </div>
          <div>
            <p className="text-[15px] font-extrabold" style={{ color: TEAL_DEEP }}>
              {allDone ? "You're all set! 🎉" : "Get started with Salla Engage"}
            </p>
            <p className="text-[13px]" style={{ color: MUTED }}>
              {allDone ? "You've completed every step. Happy engaging!" : "Complete these steps to start engaging your customers."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* progress */}
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#e6ecec]">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: GREEN }} />
            </div>
            <span className="text-[13px] font-bold tabular-nums" style={{ color: TEAL }}>
              {completed}/{total}
            </span>
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex size-8 items-center justify-center rounded-lg text-[#737373] hover:bg-black/5"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronDown className={`size-[18px] transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          </button>
          <button
            onClick={dismiss}
            className="flex size-8 items-center justify-center rounded-lg text-[#737373] hover:bg-black/5"
            title="Dismiss"
          >
            <X className="size-[18px]" />
          </button>
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="grid grid-cols-1 gap-px bg-[#f2f2f2] sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, idx) => {
            const isDone = !!done[s.id];
            const isNext = idx === nextIdx;
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="relative flex flex-col bg-white p-4"
                style={isNext ? { boxShadow: `inset 0 2px 0 ${TEAL}` } : undefined}
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <div
                    className="flex size-9 items-center justify-center rounded-lg"
                    style={{ background: isDone ? GREEN_SOFT : s.bg }}
                  >
                    {isDone ? (
                      <CheckCircle className="size-[20px]" style={{ color: GREEN }} />
                    ) : (
                      <Icon className="size-[19px]" style={{ color: s.tint }} />
                    )}
                  </div>
                  <span
                    className="flex size-5 items-center justify-center rounded-full text-[11px] font-bold"
                    style={
                      isDone
                        ? { background: GREEN, color: "#fff" }
                        : { border: `1.5px solid ${isNext ? TEAL : "#dedede"}`, color: isNext ? TEAL : "#a3a3a3" }
                    }
                  >
                    {isDone ? "✓" : idx + 1}
                  </span>
                </div>

                <p className={`text-[13.5px] font-bold ${isDone ? "text-[#9aa5a5] line-through" : ""}`} style={isDone ? undefined : { color: TEAL_DEEP }}>
                  {s.title}
                </p>
                <p className="mt-1 flex-1 text-[12px] leading-5" style={{ color: MUTED }}>
                  {s.desc}
                </p>

                <div className="mt-3">
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: GREEN }}>
                      <CheckCircle className="size-4" /> Done
                    </span>
                  ) : (
                    <button
                      onClick={() => complete(s.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-white transition-opacity hover:opacity-90"
                      style={{ background: TEAL }}
                    >
                      {s.cta}
                      <ArrowRight className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer actions */}
      {!collapsed && (
        <div className="flex items-center justify-between border-t px-5 py-2.5" style={{ borderColor: HAIR }}>
          <span className="text-[12px]" style={{ color: MUTED }}>
            {allDone ? "Great job completing your setup." : `${total - completed} step${total - completed === 1 ? "" : "s"} left to finish setup.`}
          </span>
          <div className="flex items-center gap-3">
            {completed > 0 && (
              <button onClick={reset} className="text-[12px] font-semibold hover:opacity-70" style={{ color: MUTED }}>
                Reset
              </button>
            )}
            <button onClick={dismiss} className="text-[12px] font-semibold hover:opacity-70" style={{ color: TEAL }}>
              {allDone ? "Dismiss" : "Skip for now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
