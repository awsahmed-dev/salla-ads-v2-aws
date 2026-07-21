"use client";

// Salla design-system icons = Hugeicons (hgi-stroke-rounded) webfont.
// These wrappers expose the SAME component names as the lucide icons they
// replace, so call sites don't change. Tailwind `size-*` classes on the icon
// are translated into a matching font-size (icon fonts scale by font-size),
// and any text-color class / style is passed through (font glyphs inherit
// `color`). The font CSS is loaded once from page.tsx.

import type { CSSProperties } from "react";

interface IconProps {
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
  [key: string]: unknown;
}

function sizeToFont(className: string): { fontSize?: string; rest: string } {
  let fontSize: string | undefined;
  let rest = className.replace(/\bsize-\[(\d+(?:\.\d+)?)px\]/g, (_m, px) => {
    fontSize = `${px}px`;
    return "";
  });
  rest = rest.replace(/\bsize-(\d+(?:\.\d+)?)\b/g, (_m, n) => {
    fontSize = `${parseFloat(n) * 0.25}rem`;
    return "";
  });
  return { fontSize, rest: rest.replace(/\s+/g, " ").trim() };
}

function makeIcon(name: string) {
  function Icon({ className = "", style, strokeWidth: _sw, ...rest }: IconProps) {
    const { fontSize, rest: cls } = sizeToFont(className);
    return (
      <i
        aria-hidden="true"
        className={`hgi-stroke hgi-${name} ${cls}`.trim()}
        style={{ fontSize: fontSize ?? "1em", lineHeight: 1, display: "inline-block", verticalAlign: "middle", ...style }}
        {...rest}
      />
    );
  }
  Icon.displayName = `Hgi(${name})`;
  return Icon;
}

/* A filled status dot (lucide <Circle> was used filled). */
export function Circle({ className = "", style }: IconProps) {
  const color = className.match(/(?:fill|text)-\[([^\]]+)\]/)?.[1] ?? "currentColor";
  const bracket = className.match(/size-\[(\d+)px\]/)?.[1];
  const scale = className.match(/size-(\d+(?:\.\d+)?)\b/)?.[1];
  const px = bracket ? `${bracket}px` : scale ? `${parseFloat(scale) * 4}px` : "8px";
  return <span className="inline-block rounded-full align-middle" style={{ width: px, height: px, background: color, ...style }} />;
}

/* ── Nav / chrome ── */
export const Inbox = makeIcon("inbox");
export const Megaphone = makeIcon("megaphone-02");
export const FileText = makeIcon("note-01");
export const Users = makeIcon("user-circle");
export const BarChart3 = makeIcon("analytics-01");
export const Wallet = makeIcon("wallet-01");
export const Settings = makeIcon("settings-01");
export const MessagesSquare = makeIcon("message-multiple-01");
export const MessageSquarePlus = makeIcon("bubble-chat-add");
export const MessageCircle = makeIcon("bubble-chat");

/* ── Inbox controls ── */
export const Search = makeIcon("search-01");
export const Filter = makeIcon("filter");
export const ArrowDownWideNarrow = makeIcon("sort-by-down-01");
export const ChevronDown = makeIcon("arrow-down-01");
export const Send = makeIcon("sent");
export const Paperclip = makeIcon("attachment-01");
export const Smile = makeIcon("smile");
export const Phone = makeIcon("call");
export const MoreVertical = makeIcon("more-vertical");
export const Check = makeIcon("tick-02");
export const CheckCheck = makeIcon("tick-double-02");
export const Info = makeIcon("information-circle");
export const Sparkles = makeIcon("sparkles");
export const X = makeIcon("cancel-01");

/* ── Engage view ── */
export const FilePen = makeIcon("note-edit");
export const Plus = makeIcon("add-01");
export const SignalHigh = makeIcon("signal-full-02");
export const Calendar = makeIcon("calendar-03");
export const RotateCw = makeIcon("refresh");
export const Zap = makeIcon("flash");
export const ReceiptText = makeIcon("invoice-01");
export const Play = makeIcon("play");
export const DollarSign = makeIcon("dollar-circle");
export const ArrowUpRight = makeIcon("arrow-up-right-01");
export const ShoppingCart = makeIcon("shopping-cart-02");
export const Gift = makeIcon("gift");
export const Star = makeIcon("star");
export const Package = makeIcon("package");
export const Truck = makeIcon("truck");
export const Pause = makeIcon("pause");
export const Eye = makeIcon("view");

/* ── Journey / getting-started ── */
export const Rocket = makeIcon("rocket-01");
export const Whatsapp = makeIcon("whatsapp-business");
export const UserAdd = makeIcon("user-add-01");
export const CheckCircle = makeIcon("checkmark-circle-02");
export const ArrowRight = makeIcon("arrow-right-01");
