"use client";

// Guided Activation — implements the "Engage Guided Activation" PRD.
// Phase 1 focus: Connect WhatsApp → Create first template → (arm + go live).
// Resumable: every stage is persisted, so "Save & exit" + "finish setup" works.

import { useEffect, useState } from "react";
import {
  MessagesSquare,
  Whatsapp,
  WhatsappPlain,
  Unlink,
  Idea,
  Lock,
  Badge,
  AlertCircle,
  PlayCircle,
  Video,
  Clock,
  Hourglass,
  MagicWand,
  CancelCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  ShoppingCart,
  Sparkles,
  Wallet,
  Inbox,
  BarChart3,
  Megaphone,
  Zap,
  X,
  Check,
  PenEdit,
} from "./icons";
import { IlloSwitch, IlloAccount, IlloNew, IlloReady, IlloAI, IlloWrite } from "./illustrations";

/* ── Tokens ──────────────────────────────────────────────────── */
const TEAL = "#004a57";
const MINT = "#a3ffe5";
const MINT_SOFT = "#e5fff9";
const GREEN = "#00ad6b";
const AMBER = "#d28f37";
const AMBER_SOFT = "#fff6eb";
const DANGER = "#f55157";
const HAIR = "#ededed";
const MUTED = "#737373";

export const ACTIVATION_KEY = "engage_activation_v2";

export type Stage =
  | "welcome"
  | "connect-choose"
  | "connect-switch"
  | "connect-signin"
  | "connect-new"
  | "template-choose"
  | "template-review"
  | "template-pending"
  | "template-rejected"
  | "golive"
  | "success";

export interface ActivationState {
  stage: Stage;
  connected: boolean;
  templateChoice: "ready" | "ai" | "own" | null;
  submitted: boolean;
  live: boolean;
  done: boolean;
}

export const INITIAL: ActivationState = {
  stage: "welcome",
  connected: false,
  templateChoice: null,
  submitted: false,
  live: false,
  done: false,
};

export function loadActivation(): ActivationState {
  try {
    const raw = localStorage.getItem(ACTIVATION_KEY);
    if (raw) return { ...INITIAL, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return INITIAL;
}

function save(s: ActivationState) {
  try {
    localStorage.setItem(ACTIVATION_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const STEPS = ["Connect WhatsApp", "Create Template", "First Engagement", "Go Live"];
const STEP_OF: Record<Stage, number> = {
  welcome: 0,
  "connect-choose": 0,
  "connect-switch": 0,
  "connect-signin": 0,
  "connect-new": 0,
  "template-choose": 1,
  "template-review": 1,
  "template-pending": 1,
  "template-rejected": 1,
  golive: 2,
  success: 3,
};

const WA_MANAGER = "https://business.facebook.com/latest/whatsapp_manager/phone_numbers";

const READY_TEMPLATE =
  "Hi {{customer_name}} 👋\n\nYou left {{item_count}} item(s) in your cart at {{store_name}} — total {{cart_total}}.\n\nYour cart is still saved. Complete your order before it's gone!";

/* ── Shared bits ─────────────────────────────────────────────── */
function Shell({
  state,
  onExit,
  onBack,
  children,
}: {
  state: ActivationState;
  onExit: () => void;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const step = STEP_OF[state.stage];
  return (
    <div className="fixed inset-0 z-[120] flex flex-col overflow-y-auto bg-[#f7faf9]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 shrink-0 border-b bg-white" style={{ borderColor: HAIR }}>
        <div className="mx-auto flex h-[60px] max-w-[1080px] items-center gap-4 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl" style={{ background: MINT }}>
              <MessagesSquare className="size-[18px]" style={{ color: TEAL }} />
            </div>
            <span className="text-[16px] font-extrabold" style={{ color: TEAL }}>
              Salla Engage
            </span>
            <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: MINT_SOFT, color: TEAL }}>
              Setup
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={onExit}
              className="rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-[#f5f5f5]"
              style={{ color: MUTED }}
            >
              Save &amp; exit
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="mx-auto flex max-w-[1080px] items-center gap-2 px-6 pb-3">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={
                      done
                        ? { background: GREEN, color: "#fff" }
                        : active
                          ? { background: TEAL, color: "#fff" }
                          : { border: `1.5px solid #dedede`, color: "#a3a3a3" }
                    }
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span
                    className="hidden text-[12.5px] font-semibold sm:block"
                    style={{ color: done || active ? TEAL : "#a3a3a3" }}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-0.5 flex-1 rounded-full" style={{ background: done ? GREEN : "#e8ecec" }} />
                )}
              </div>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1080px] flex-1 px-6 py-8">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold transition-colors hover:opacity-70"
            style={{ color: MUTED }}
          >
            <ArrowLeft className="size-4" /> Back
          </button>
        )}
        {children}
      </main>
    </div>
  );
}

function Card({
  children,
  className = "",
  pad = "p-7",
}: {
  children: React.ReactNode;
  className?: string;
  pad?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-white ${pad} ${className}`} style={{ borderColor: HAIR }}>
      {children}
    </div>
  );
}

function Primary({
  children,
  onClick,
  disabled,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${full ? "w-full" : ""}`}
      style={{ background: TEAL }}
    >
      {children}
    </button>
  );
}

function Ghost({
  children,
  onClick,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-11 items-center justify-center gap-2 rounded-xl border bg-white px-5 text-[14px] font-bold transition-colors hover:bg-[#f7f7f7] ${full ? "w-full" : ""}`}
      style={{ borderColor: "#dde5e4", color: TEAL }}
    >
      {children}
    </button>
  );
}

/** Actions live below the card, not inside it. */
function Actions({
  children,
  align = "end",
}: {
  children: React.ReactNode;
  align?: "end" | "center";
}) {
  return (
    <div className={`mt-6 flex flex-wrap items-center gap-3 ${align === "center" ? "justify-center" : "justify-end"}`}>
      {children}
    </div>
  );
}

function TrustLine() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: MINT_SOFT }}>
      <Lock className="mt-0.5 size-[15px] shrink-0" style={{ color: TEAL }} />
      <p className="text-[12.5px] leading-5" style={{ color: TEAL }}>
        You sign in on <strong>Meta&apos;s own page</strong>. Engage never sees your password — we only receive the
        connection result.
      </p>
    </div>
  );
}

function Numbered({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3.5">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
        style={{ background: MINT_SOFT, color: TEAL }}
      >
        {n}
      </span>
      <div className="pb-1">
        <p className="text-[14px] font-bold" style={{ color: TEAL }}>
          {title}
        </p>
        {children && (
          <div className="mt-1 text-[13px] leading-6" style={{ color: MUTED }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export function GuidedActivation({
  onExit,
  onFinish,
}: {
  onExit: () => void;
  onFinish: () => void;
}) {
  const [s, setS] = useState<ActivationState>(INITIAL);
  const [metaPopup, setMetaPopup] = useState<null | "loading" | "done">(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [released, setReleased] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [body, setBody] = useState(READY_TEMPLATE);
  const [topUp, setTopUp] = useState(false);

  useEffect(() => {
    setS(loadActivation());
  }, []);

  const go = (stage: Stage, patch: Partial<ActivationState> = {}) => {
    const next = { ...s, ...patch, stage };
    setS(next);
    save(next);
    window.scrollTo(0, 0);
  };

  const exit = () => {
    save(s);
    onExit();
  };

  const finish = () => {
    const next = { ...s, done: true, live: true, stage: "success" as Stage };
    save(next);
    onFinish();
  };

  /* Meta embedded-signup simulation */
  function openMeta() {
    setMetaPopup("loading");
    setTimeout(() => setMetaPopup("done"), 1800);
  }

  const back = (to: Stage) => () => go(to);

  return (
    <Shell
      state={s}
      onExit={exit}
      onBack={
        s.stage === "connect-switch" || s.stage === "connect-signin" || s.stage === "connect-new"
          ? back("connect-choose")
          : s.stage === "template-review"
            ? back("template-choose")
            : undefined
      }
    >
      {/* ── Welcome ── */}
      {s.stage === "welcome" && (
        <div className="mx-auto max-w-[720px]">
          <div className="mb-7 text-center">
            <div
              className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl"
              style={{ background: MINT_SOFT }}
            >
              <Zap className="size-8" style={{ color: TEAL }} />
            </div>
            <h1 className="text-[26px] font-extrabold" style={{ color: TEAL }}>
              Let&apos;s get your first automation live
            </h1>
            <p className="mx-auto mt-2 max-w-[520px] text-[14.5px] leading-7" style={{ color: MUTED }}>
              Three steps to recover abandoned carts on WhatsApp automatically. We&apos;ll save your progress at every
              step, so you can stop and come back anytime.
            </p>
          </div>

          <Card>
            <div className="flex flex-col gap-5">
              <Numbered n={1} title="Connect your WhatsApp number">
                About 2 minutes if you already have a Meta Business account. We&apos;ll guide you if you don&apos;t.
              </Numbered>
              <Numbered n={2} title="Create your first message template">
                Start from our ready-made cart-recovery message, or let AI write one for you.
              </Numbered>
              <Numbered n={3} title="Go live">
                Your Abandoned Cart Recovery automation turns on and starts recovering orders.
              </Numbered>
            </div>

            <div className="mt-6 flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: AMBER_SOFT }}>
              <Clock className="mt-0.5 size-[15px] shrink-0" style={{ color: AMBER }} />
              <p className="text-[12.5px] leading-5" style={{ color: "#8a5a1c" }}>
                <strong>One wait to expect:</strong>{" "}
                Meta reviews your first template — usually within 24 hours. You don&apos;t have to stay on this once
                submitted. We&apos;ll notify you.
              </p>
            </div>

            <div className="mt-6">
              <Primary onClick={() => go("connect-choose")} full>
                Start setup <ArrowRight className="size-4" />
              </Primary>
            </div>
          </Card>
        </div>
      )}

      {/* ── Connect: choose your situation ── */}
      {s.stage === "connect-choose" && (
        <div className="mx-auto max-w-[860px]">
          <h1 className="text-[24px] font-extrabold" style={{ color: TEAL }}>
            Connect your WhatsApp number
          </h1>
          <p className="mt-2 max-w-[620px] text-[14px] leading-7" style={{ color: MUTED }}>
            Engage connects <strong>your own</strong> WhatsApp Business number to <strong>your own</strong>{" "}
            Meta account — so the number, the customers, and the chat history stay yours. Pick what matches you and
            we&apos;ll only show the steps you actually need.
          </p>

          <div className="mt-5">
            <TrustLine />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                key: "connect-switch" as Stage,
                Illo: IlloSwitch,
                title: "My number is used by another app",
                desc: "Using Wati, 360dialog, or a similar tool? You'll release the number there first — we'll show you exactly where.",
                meta: "~5 minutes",
              },
              {
                key: "connect-signin" as Stage,
                Illo: IlloAccount,
                title: "I have a Meta Business account",
                desc: "Sign in with Meta and pick your number. You never leave this flow.",
                meta: "~2 minutes",
                recommended: true,
              },
              {
                key: "connect-new" as Stage,
                Illo: IlloNew,
                title: "I'm new to WhatsApp Business",
                desc: "No Meta account yet? We'll walk you through creating and verifying one, step by step.",
                meta: "Guide + video",
              },
            ].map((o) => (
              <button
                key={o.key}
                onClick={() => go(o.key)}
                className="relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: o.recommended ? "#b3ecd4" : HAIR }}
              >
                {o.recommended && (
                  <span
                    className="absolute right-4 top-4 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: "#effbf6", color: GREEN }}
                  >
                    Fastest
                  </span>
                )}
                <div className="mb-4">
                  <o.Illo className="w-full" />
                </div>
                <p className="text-[15px] font-bold" style={{ color: TEAL }}>
                  {o.title}
                </p>
                <p className="mt-1.5 flex-1 text-[13px] leading-6" style={{ color: MUTED }}>
                  {o.desc}
                </p>
                <span className="mt-3 flex items-center gap-1.5 text-[12px] font-bold" style={{ color: TEAL }}>
                  {o.meta} <ArrowRight className="size-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Path A: release from another app ── */}
      {s.stage === "connect-switch" && (
        <div className="mx-auto max-w-[720px]">
          <h1 className="text-[24px] font-extrabold" style={{ color: TEAL }}>
            Release your number from your current app
          </h1>
          <p className="mt-2 text-[14px] leading-7" style={{ color: MUTED }}>
            A WhatsApp number can only be connected to one provider at a time. Your current app is holding it, so
            you&apos;ll release it there first — then connect it here.
          </p>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: MINT_SOFT }}>
            <CheckCircle className="mt-0.5 size-[15px] shrink-0" style={{ color: GREEN }} />
            <p className="text-[12.5px] leading-5" style={{ color: TEAL }}>
              <strong>You keep your number and your customers.</strong>{" "}
              Nothing is deleted on WhatsApp — you&apos;re only changing which app is allowed to send from it.
            </p>
          </div>

          <Card className="mt-5">
            <div className="flex flex-col gap-5">
              <Numbered n={1} title="Open Meta's WhatsApp Manager">
                <div className="mt-2.5">
                  <a href={WA_MANAGER} target="_blank" rel="noreferrer" className="inline-block">
                    <Ghost>
                      <ExternalLink className="size-4" /> Open WhatsApp Manager
                    </Ghost>
                  </a>
                </div>
              </Numbered>
              <Numbered n={2} title="Find your number and remove the current app">
                Under <strong>Phone numbers</strong>, open your number and remove it from the app that&apos;s connected
                today.
              </Numbered>
              <Numbered n={3} title="Come back here and connect">
                Once the number shows as available, you can link it to Engage.
              </Numbered>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: "#f7f7f7" }}>
              <AlertCircle className="mt-0.5 size-[15px] shrink-0" style={{ color: MUTED }} />
              <p className="text-[12.5px] leading-5" style={{ color: MUTED }}>
                This link works if you&apos;re an <strong>admin</strong> on the Meta Business account that owns the
                number. If your old provider created the account for you, ask them for admin access first.
              </p>
            </div>

            <label className="mt-5 flex cursor-pointer items-center gap-3">
              <span
                onClick={() => setReleased((v) => !v)}
                className="flex size-5 items-center justify-center rounded-md border transition-colors"
                style={{
                  borderColor: released ? GREEN : "#c9d4d3",
                  background: released ? GREEN : "#fff",
                }}
              >
                {released && <Check className="size-3.5 text-white" />}
              </span>
              <span className="text-[13.5px] font-semibold" style={{ color: TEAL }}>
                I&apos;ve released my number from the other app
              </span>
            </label>

          </Card>

          <Actions>
            <Primary onClick={() => go("connect-signin")} disabled={!released}>
              Continue to connect <ArrowRight className="size-4" />
            </Primary>
          </Actions>
        </div>
      )}

      {/* ── Path B: embedded sign-in ── */}
      {s.stage === "connect-signin" && (
        <div className="mx-auto max-w-[640px]">
          <h1 className="text-[24px] font-extrabold" style={{ color: TEAL }}>
            Sign in with Meta
          </h1>
          <p className="mt-2 text-[14px] leading-7" style={{ color: MUTED }}>
            A Meta window will open. You&apos;ll do three things there, then come straight back.
          </p>

          <Card className="mt-5">
            <div className="flex flex-col gap-4">
              {["Choose your business", "Pick your WhatsApp number (or add one)", "Approve Engage's permissions"].map(
                (t, i) => (
                  <div key={t} className="flex items-center gap-3">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ background: MINT_SOFT, color: TEAL }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[13.5px]" style={{ color: TEAL }}>
                      {t}
                    </span>
                  </div>
                ),
              )}
            </div>

            <div className="mt-5">
              <TrustLine />
            </div>

          </Card>

          <Actions>
            <button
              onClick={() => go("connect-switch")}
              className="text-[12.5px] font-semibold underline-offset-2 hover:underline"
              style={{ color: MUTED }}
            >
              My number is already used by another app
            </button>
            <Primary onClick={openMeta}>
              <WhatsappPlain className="size-[18px]" /> Continue with Meta
            </Primary>
          </Actions>
        </div>
      )}

      {/* ── Path C: brand new ── */}
      {s.stage === "connect-new" && (
        <div className="mx-auto max-w-[820px]">
          <h1 className="text-[24px] font-extrabold" style={{ color: TEAL }}>
            Create your WhatsApp Business account
          </h1>
          <p className="mt-2 max-w-[620px] text-[14px] leading-7" style={{ color: MUTED }}>
            This is a one-time setup with Meta. Watch the 3-minute guide, then follow the four steps — we&apos;ll keep
            your place while you do it.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-[1fr_300px]">
            <Card pad="p-6">
              <div className="flex flex-col gap-4.5">
                <Numbered n={1} title="Create a Meta Business account">
                  Free, with your store email. This is the account that will own your number.
                </Numbered>
                <Numbered n={2} title="Verify your business">
                  Meta checks your commercial registration.{" "}
                  <strong style={{ color: AMBER }}>This can take 2–7 days.</strong>
                </Numbered>
                <Numbered n={3} title="Add and verify your phone number">
                  Use a number that is <strong>not</strong> already on the WhatsApp app.
                </Numbered>
                <Numbered n={4} title="Choose your display name">
                  The name customers see. Meta must approve it — use your store name.
                </Numbered>
              </div>
            </Card>

            {/* video */}
            <button
              onClick={() => setVideoOpen(true)}
              className="group relative flex h-full min-h-[190px] flex-col items-center justify-center overflow-hidden rounded-2xl"
              style={{ background: "linear-gradient(140deg,#0f3d47,#2b6b78)" }}
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-white/95 transition-transform group-hover:scale-110">
                <PlayCircle className="size-8" style={{ color: TEAL }} />
              </span>
              <span className="mt-3 text-[13.5px] font-bold text-white">Watch the setup guide</span>
              <span className="mt-0.5 text-[11.5px]" style={{ color: "#a5d0cb" }}>
                From zero to a verified number · 3:12
              </span>
            </button>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: AMBER_SOFT }}>
            <Clock className="mt-0.5 size-[15px] shrink-0" style={{ color: AMBER }} />
            <p className="text-[12.5px] leading-5" style={{ color: "#8a5a1c" }}>
              Business verification is Meta&apos;s step, not ours, and it can take <strong>2–7 days</strong>. Your
              progress here is saved — close Engage and come back when Meta approves you.
            </p>
          </div>

          <Actions>
            <a href="https://business.facebook.com/" target="_blank" rel="noreferrer">
              <Ghost>
                <ExternalLink className="size-4" /> Open Meta Business
              </Ghost>
            </a>
            <Primary onClick={() => go("connect-signin")}>
              I&apos;ve finished on Meta — continue <ArrowRight className="size-4" />
            </Primary>
          </Actions>
        </div>
      )}

      {/* ── Template: choose source ── */}
      {s.stage === "template-choose" && (
        <div className="mx-auto max-w-[860px]">
          <div className="mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: "#effbf6" }}>
            <CheckCircle className="size-[17px] shrink-0" style={{ color: GREEN }} />
            <p className="text-[13px] font-semibold" style={{ color: TEAL }}>
              WhatsApp connected — +966 5X XXX XXXX is ready to send.
            </p>
          </div>

          <h1 className="text-[24px] font-extrabold" style={{ color: TEAL }}>
            Create your first message template
          </h1>
          <p className="mt-2 max-w-[640px] text-[14px] leading-7" style={{ color: MUTED }}>
            To message a customer who hasn&apos;t written to you first, WhatsApp requires an approved template.
            We&apos;ll start with the one that pays for itself on day one — abandoned cart recovery.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                key: "ready" as const,
                Illo: IlloReady,
                title: "Use the ready template",
                desc: "Our Abandoned Cart Recovery message, already written to pass Meta's review.",
                badge: "Recommended",
              },
              {
                key: "ai" as const,
                Illo: IlloAI,
                title: "Draft it with AI",
                desc: "Describe your offer in your own words and we'll write a compliant template.",
              },
              {
                key: "own" as const,
                Illo: IlloWrite,
                title: "Write my own",
                desc: "Full control over the wording, with variables and preview.",
              },
            ].map((o) => (
              <button
                key={o.key}
                onClick={() => {
                  setBody(o.key === "ai" ? "" : READY_TEMPLATE);
                  go("template-review", { templateChoice: o.key });
                }}
                className="relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: o.badge ? "#b3ecd4" : HAIR }}
              >
                {o.badge && (
                  <span
                    className="absolute right-4 top-4 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: "#effbf6", color: GREEN }}
                  >
                    {o.badge}
                  </span>
                )}
                <div className="mb-4">
                  <o.Illo className="w-full" />
                </div>
                <p className="text-[15px] font-bold" style={{ color: TEAL }}>
                  {o.title}
                </p>
                <p className="mt-1.5 flex-1 text-[13px] leading-6" style={{ color: MUTED }}>
                  {o.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Template: review & submit ── */}
      {s.stage === "template-review" && (
        <div className="mx-auto max-w-[960px]">
          <h1 className="text-[24px] font-extrabold" style={{ color: TEAL }}>
            {s.templateChoice === "ai" ? "Draft your template with AI" : "Review your template"}
          </h1>
          <p className="mt-2 text-[14px] leading-7" style={{ color: MUTED }}>
            Variables are filled from your Salla store automatically — no code needed.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
            <Card pad="p-6">
              {s.templateChoice === "ai" && (
                <div className="mb-5">
                  <label className="mb-2 block text-[13px] font-bold" style={{ color: TEAL }}>
                    What should this message say?
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                    placeholder="e.g. Remind them about their cart and offer 10% off if they finish today"
                    className="w-full resize-none rounded-xl border px-3.5 py-3 text-[13.5px] focus:outline-none"
                    style={{ borderColor: "#dde5e4", color: TEAL }}
                  />
                  <button
                    onClick={() =>
                      setBody(
                        `Hi {{customer_name}} 👋\n\nYour cart at {{store_name}} is still waiting — {{item_count}} item(s), {{cart_total}}.\n\n${
                          aiPrompt.trim() ? `${aiPrompt.trim()}\n\n` : ""
                        }Tap below to finish your order.`,
                      )
                    }
                    className="mt-3 flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-bold text-white"
                    style={{ background: TEAL }}
                  >
                    <Sparkles className="size-4" style={{ color: MINT }} /> Generate draft
                  </button>
                </div>
              )}

              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold" style={{ color: MUTED }}>
                    Template name
                  </label>
                  <div
                    className="rounded-xl border px-3.5 py-2.5 text-[13.5px] font-semibold"
                    style={{ borderColor: "#dde5e4", color: TEAL }}
                  >
                    abandoned_cart_recovery
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold" style={{ color: MUTED }}>
                    Category
                  </label>
                  <div
                    className="rounded-xl border px-3.5 py-2.5 text-[13.5px] font-semibold"
                    style={{ borderColor: "#dde5e4", color: TEAL }}
                  >
                    Marketing
                  </div>
                </div>
              </div>

              <label className="mb-1.5 block text-[12px] font-bold" style={{ color: MUTED }}>
                Message body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
                className="w-full resize-none rounded-xl border px-3.5 py-3 text-[13.5px] leading-6 focus:outline-none"
                style={{ borderColor: "#dde5e4", color: TEAL }}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {["customer_name", "store_name", "item_count", "cart_total"].map((v) => (
                  <span
                    key={v}
                    className="rounded-lg px-2.5 py-1 text-[11.5px] font-semibold"
                    style={{ background: MINT_SOFT, color: TEAL }}
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: AMBER_SOFT }}>
                <Clock className="mt-0.5 size-[15px] shrink-0" style={{ color: AMBER }} />
                <p className="text-[12.5px] leading-5" style={{ color: "#8a5a1c" }}>
                  Meta reviews marketing templates before they can be sent — usually within 24 hours. You can keep
                  using Engage while you wait.
                </p>
              </div>

            </Card>

            {/* WhatsApp preview */}
            <div>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                Live preview
              </p>
              <div className="rounded-2xl p-4" style={{ background: "#e9e2db" }}>
                <div className="rounded-xl rounded-tl-sm bg-white p-3 shadow-sm">
                  <p className="whitespace-pre-wrap text-[12.5px] leading-6" style={{ color: "#111" }}>
                    {(body || "Your message will appear here…")
                      .replace(/\{\{customer_name\}\}/g, "Noura")
                      .replace(/\{\{store_name\}\}/g, "Your Store")
                      .replace(/\{\{item_count\}\}/g, "2")
                      .replace(/\{\{cart_total\}\}/g, "SAR 349")}
                  </p>
                  <div className="mt-2.5 border-t pt-2 text-center" style={{ borderColor: "#eee" }}>
                    <span className="text-[12.5px] font-semibold" style={{ color: "#0a7cff" }}>
                      Complete purchase
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Actions align="center">
            <Primary onClick={() => go("template-pending", { submitted: true })} disabled={!body.trim()}>
              Submit for Meta approval <ArrowRight className="size-4" />
            </Primary>
          </Actions>
        </div>
      )}

      {/* ── Pending Meta approval ── */}
      {s.stage === "template-pending" && (
        <div className="mx-auto max-w-[620px]">
          <Card className="text-center">
            <div
              className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl"
              style={{ background: AMBER_SOFT }}
            >
              <Hourglass className="size-8" style={{ color: AMBER }} />
            </div>
            <h1 className="text-[22px] font-extrabold" style={{ color: TEAL }}>
              Your template is with Meta
            </h1>
            <p className="mx-auto mt-2 max-w-[440px] text-[14px] leading-7" style={{ color: MUTED }}>
              Meta usually approves marketing templates within 24 hours. We&apos;ll notify you the moment it&apos;s
              done — you don&apos;t need to wait here.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2.5 rounded-xl px-4 py-3" style={{ background: MINT_SOFT }}>
              <CheckCircle className="size-[15px]" style={{ color: GREEN }} />
              <p className="text-[12.5px] font-semibold" style={{ color: TEAL }}>
                Your progress is saved. Pick up right here when you return.
              </p>
            </div>

            <div className="mt-6 border-t pt-4" style={{ borderColor: HAIR }}>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#a3a3a3" }}>
                Prototype — simulate Meta&apos;s reply
              </p>
              <div className="flex justify-center gap-3">
                <Ghost onClick={() => go("golive")}>
                  <CheckCircle className="size-4" style={{ color: GREEN }} /> Approved
                </Ghost>
                <Ghost onClick={() => go("template-rejected")}>
                  <CancelCircle className="size-4" style={{ color: DANGER }} /> Rejected
                </Ghost>
              </div>
            </div>
          </Card>

          <Actions align="center">
            <Primary onClick={exit}>
              Explore Engage while you wait <ArrowRight className="size-4" />
            </Primary>
          </Actions>
        </div>
      )}

      {/* ── Rejected ── */}
      {s.stage === "template-rejected" && (
        <div className="mx-auto max-w-[620px]">
          <Card>
            <div className="flex items-start gap-4">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "#feecec" }}
              >
                <CancelCircle className="size-6" style={{ color: DANGER }} />
              </div>
              <div>
                <h1 className="text-[20px] font-extrabold" style={{ color: TEAL }}>
                  Meta didn&apos;t approve this template
                </h1>
                <p className="mt-1.5 text-[13.5px] leading-6" style={{ color: MUTED }}>
                  This happens often on a first submission — it&apos;s usually a small wording fix.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border px-4 py-3.5" style={{ borderColor: "#f7d4d4", background: "#fffafa" }}>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: DANGER }}>
                Meta&apos;s reason
              </p>
              <p className="mt-1.5 text-[13.5px] leading-6" style={{ color: TEAL }}>
                Promotional content without a clear opt-out. Add a way for the customer to stop receiving these
                messages.
              </p>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: MINT_SOFT }}>
              <Idea className="mt-0.5 size-[15px] shrink-0" style={{ color: TEAL }} />
              <p className="text-[12.5px] leading-5" style={{ color: TEAL }}>
                <strong>Suggested fix:</strong> add “Reply STOP to unsubscribe.” to the end of your message.
              </p>
            </div>

          </Card>

          <Actions align="center">
            <Primary
              onClick={() => {
                setBody((b) => (b.includes("STOP") ? b : `${b}\n\nReply STOP to unsubscribe.`));
                go("template-review");
              }}
            >
              Fix &amp; re-submit <ArrowRight className="size-4" />
            </Primary>
            <Ghost onClick={() => go("template-review")}>Edit manually</Ghost>
          </Actions>
        </div>
      )}

      {/* ── Go live ── */}
      {s.stage === "golive" && (
        <div className="mx-auto max-w-[720px]">
          <div className="mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: "#effbf6" }}>
            <Badge className="size-[17px] shrink-0" style={{ color: GREEN }} />
            <p className="text-[13px] font-semibold" style={{ color: TEAL }}>
              Template approved by Meta — you can send it now.
            </p>
          </div>

          <h1 className="text-[24px] font-extrabold" style={{ color: TEAL }}>
            Turn on Abandoned Cart Recovery
          </h1>
          <p className="mt-2 text-[14px] leading-7" style={{ color: MUTED }}>
            We&apos;ve pre-configured it for you. Turn it on and it starts working on your next abandoned cart.
          </p>

          <Card className="mt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Trigger", "Customer abandons a cart"],
                ["Wait", "1 hour"],
                ["Message", "abandoned_cart_recovery"],
                ["Audience", "All customers with WhatsApp"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl px-4 py-3" style={{ background: "#f7faf9" }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                    {k}
                  </p>
                  <p className="mt-1 text-[13.5px] font-bold" style={{ color: TEAL }}>
                    {v}
                  </p>
                </div>
              ))}
            </div>

            {/* Wallet — explicitly non-gating */}
            <div className="mt-5 rounded-xl border px-4 py-4" style={{ borderColor: "#f0e0c4", background: AMBER_SOFT }}>
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 size-[18px] shrink-0" style={{ color: AMBER }} />
                <div className="flex-1">
                  <p className="text-[13.5px] font-bold" style={{ color: "#8a5a1c" }}>
                    Add wallet balance so messages can actually send
                  </p>
                  <p className="mt-1 text-[12.5px] leading-5" style={{ color: "#8a5a1c" }}>
                    Balance is needed to <strong>send</strong>, not to turn this on. You can top up later — the
                    automation stays armed either way.
                  </p>
                  <div className="mt-3 flex gap-2.5">
                    <button
                      onClick={() => setTopUp(true)}
                      className="h-9 rounded-lg px-4 text-[12.5px] font-bold text-white"
                      style={{ background: AMBER }}
                    >
                      {topUp ? "Balance added ✓" : "Top up now"}
                    </button>
                    <button
                      onClick={() => setTopUp(false)}
                      className="h-9 rounded-lg border bg-white px-4 text-[12.5px] font-bold"
                      style={{ borderColor: "#e6d3b3", color: "#8a5a1c" }}
                    >
                      I&apos;ll do it later
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </Card>

          <Actions align="center">
            <Primary onClick={() => go("success", { live: true })}>
              <Zap className="size-4" style={{ color: MINT }} /> Turn on and go live
            </Primary>
          </Actions>
        </div>
      )}

      {/* ── Success ── */}
      {s.stage === "success" && (
        <div className="mx-auto max-w-[760px]">
          <div className="text-center">
            <div
              className="mx-auto mb-5 flex size-[68px] items-center justify-center rounded-3xl"
              style={{ background: "#effbf6" }}
            >
              <CheckCircle className="size-9" style={{ color: GREEN }} />
            </div>
            <h1 className="text-[26px] font-extrabold" style={{ color: TEAL }}>
              You&apos;re live
            </h1>
            <p className="mx-auto mt-2 max-w-[480px] text-[14.5px] leading-7" style={{ color: MUTED }}>
              Abandoned Cart Recovery is <strong style={{ color: GREEN }}>live and armed</strong>. The next customer
              who leaves a cart gets your message an hour later.
            </p>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Inbox, t: "Inbox", d: "Reply to customers in real time." },
              { icon: Megaphone, t: "Engage", d: "Add more automations and broadcasts." },
              { icon: BarChart3, t: "Analytics", d: "Track delivery, reads, and recovered revenue." },
              { icon: Wallet, t: "Wallet", d: "Top up and watch your spend." },
            ].map((c) => (
              <div key={c.t} className="flex items-start gap-3.5 rounded-2xl border bg-white p-4" style={{ borderColor: HAIR }}>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: MINT_SOFT }}>
                  <c.icon className="size-5" style={{ color: TEAL }} />
                </div>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: TEAL }}>
                    {c.t}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-5" style={{ color: MUTED }}>
                    {c.d}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7">
            <Primary onClick={finish} full>
              Go to my Engage workspace <ArrowRight className="size-4" />
            </Primary>
          </div>
        </div>
      )}

      {/* ── Meta popup (simulated embedded signup) ── */}
      {metaPopup && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[380px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: HAIR }}>
              <span className="text-[15px] font-extrabold" style={{ color: "#0866ff" }}>
                Meta
              </span>
              <button onClick={() => setMetaPopup(null)} style={{ color: MUTED }}>
                <X className="size-[18px]" />
              </button>
            </div>
            <div className="px-6 py-8 text-center">
              {metaPopup === "loading" ? (
                <>
                  <div
                    className="mx-auto mb-4 size-9 animate-spin rounded-full border-[3px] border-t-transparent"
                    style={{ borderColor: "#0866ff", borderTopColor: "transparent" }}
                  />
                  <p className="text-[13.5px] font-semibold" style={{ color: TEAL }}>
                    Connecting your WhatsApp Business account…
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                    This window is hosted by Meta.
                  </p>
                </>
              ) : (
                <>
                  <div
                    className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full"
                    style={{ background: "#effbf6" }}
                  >
                    <CheckCircle className="size-7" style={{ color: GREEN }} />
                  </div>
                  <p className="text-[15px] font-extrabold" style={{ color: TEAL }}>
                    Number connected
                  </p>
                  <p className="mt-1 text-[12.5px]" style={{ color: MUTED }}>
                    +966 5X XXX XXXX is now linked to Salla Engage.
                  </p>
                  <div className="mt-5">
                    <Primary
                      onClick={() => {
                        setMetaPopup(null);
                        go("template-choose", { connected: true });
                      }}
                      full
                    >
                      Continue
                    </Primary>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Video popup ── */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setVideoOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[720px] overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: HAIR }}>
              <p className="text-[15px] font-extrabold" style={{ color: TEAL }}>
                How to create a WhatsApp Business account
              </p>
              <button onClick={() => setVideoOpen(false)} style={{ color: MUTED }}>
                <X className="size-[18px]" />
              </button>
            </div>
            <div
              className="flex aspect-video items-center justify-center"
              style={{ background: "linear-gradient(140deg,#0f3d47,#2b6b78)" }}
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-white/95">
                <PlayCircle className="size-9" style={{ color: TEAL }} />
              </span>
            </div>
            <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
              {[
                "0:00 — Create your Meta Business account",
                "0:48 — Submit business verification",
                "1:55 — Add and verify your number",
                "2:40 — Pick a display name Meta will approve",
              ].map((t) => (
                <p key={t} className="text-[12.5px]" style={{ color: MUTED }}>
                  {t}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
