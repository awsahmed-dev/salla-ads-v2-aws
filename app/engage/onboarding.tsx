"use client";

import { useEffect, useState } from "react";
import { Inbox, ShoppingCart, Megaphone, MessagesSquare, Zap, X, ChevronDown } from "./icons";

const TEAL = "#004a57";
const TEAL_DEEP = "#083e45";
const MINT = "#a3ffe5";
const MINT_SOFT = "#e5fff9";
const GREEN = "#00ad6b";
const MUTED = "#737373";

type StepIcon = typeof Inbox;

interface Step {
  eyebrow: string;
  icon: StepIcon;
  title: string; // Arabic (matches Figma)
  desc: string; // Arabic
}

const STEPS: Step[] = [
  {
    eyebrow: "Welcome",
    icon: MessagesSquare,
    title: "مرحباً بك في سلة تفاعل",
    desc: "قناتك الموحّدة للتواصل مع عملائك عبر واتساب، وإدارة كل المحادثات والحملات من مكان واحد.",
  },
  {
    eyebrow: "Unified inbox",
    icon: Inbox,
    title: "تواصل مباشرة مع عملائك من مكان واحد",
    desc: "استقبل رسائل عملائك من واتساب وإنستغرام والويب، وردّ عليهم فوراً من صندوق وارد واحد.",
  },
  {
    eyebrow: "Abandoned cart",
    icon: ShoppingCart,
    title: "استرجع سلتك المتروكة تلقائياً",
    desc: "تُرسل سلة تفاعل رسائل تذكير تلقائية لعملائك لإتمام طلباتهم وزيادة مبيعاتك دون أي جهد.",
  },
  {
    eyebrow: "WhatsApp campaigns",
    icon: Megaphone,
    title: "سوق لعملائك بحملات واتساب",
    desc: "أطلق حملات وعروضاً مستهدفة لآلاف العملاء بضغطة واحدة، وتابع نتائجها لحظياً.",
  },
  {
    eyebrow: "Get started",
    icon: Zap,
    title: "جاهز للانطلاق؟",
    desc: "اربط رقم واتساب الأعمال الخاص بك وابدأ التواصل مع عملائك الآن.",
  },
];

export function Onboarding({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const last = i === STEPS.length - 1;
  const step = STEPS[i];
  const Icon = step.icon;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setI((v) => Math.min(v + 1, STEPS.length - 1));
      if (e.key === "ArrowRight") setI((v) => Math.max(v - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Visual header */}
        <div
          className="relative flex h-52 items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(140deg, ${MINT_SOFT} 0%, ${MINT} 100%)` }}
        >
          {/* decorative bubbles */}
          <span className="absolute -right-6 -top-6 size-28 rounded-full bg-white/25" />
          <span className="absolute -left-8 bottom-2 size-24 rounded-full bg-white/20" />
          <span className="absolute right-10 bottom-6 size-3 rounded-full bg-white/50" />
          <span className="absolute left-12 top-8 size-2 rounded-full bg-white/60" />

          {/* close */}
          <button
            onClick={onClose}
            aria-label="تخطي"
            className="absolute left-4 top-4 flex size-8 items-center justify-center rounded-full bg-white/60 text-[#0a3c48] transition-colors hover:bg-white"
          >
            <X className="size-[18px]" />
          </button>

          <div className="flex size-24 items-center justify-center rounded-3xl bg-white shadow-lg">
            <Icon className="size-11" style={{ color: TEAL }} />
          </div>
        </div>

        {/* Body */}
        <div className="px-7 pb-6 pt-6 text-right">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: GREEN }}>
            {step.eyebrow}
          </p>
          <h2 className="text-[21px] font-extrabold leading-snug" style={{ color: TEAL_DEEP }}>
            {step.title}
          </h2>
          <p className="mt-2.5 text-[14px] leading-7" style={{ color: MUTED }}>
            {step.desc}
          </p>

          {/* dots */}
          <div className="mt-6 flex items-center justify-center gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`الخطوة ${idx + 1}`}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: idx === i ? 22 : 6,
                  background: idx === i ? TEAL : "#d9e2e2",
                }}
              />
            ))}
          </div>

          {/* footer */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="text-[14px] font-semibold transition-colors hover:opacity-70"
              style={{ color: MUTED }}
            >
              تخطّي
            </button>

            <div className="flex items-center gap-2">
              {i > 0 && (
                <button
                  onClick={() => setI((v) => v - 1)}
                  className="flex h-10 items-center gap-1 rounded-xl border px-4 text-[14px] font-bold transition-colors hover:bg-[#f7f7f7]"
                  style={{ borderColor: "#ededed", color: TEAL }}
                >
                  السابق
                </button>
              )}
              <button
                onClick={() => (last ? onClose() : setI((v) => v + 1))}
                className="flex h-10 items-center gap-1.5 rounded-xl px-5 text-[14px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ background: last ? GREEN : TEAL }}
              >
                {last ? "ابدأ الآن" : "التالي"}
                {!last && <ChevronDown className="size-4 rotate-90" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
