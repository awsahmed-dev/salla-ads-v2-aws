"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Inbox,
  Megaphone,
  FileText,
  Users,
  BarChart3,
  Wallet,
  Settings,
  MessagesSquare,
  MessageSquarePlus,
  Search,
  Filter,
  ArrowDownWideNarrow,
  ChevronDown,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Info,
  Sparkles,
  X,
  Circle,
} from "./icons";
import {
  seedConversations,
  makeInboundConversation,
  randomReply,
  formatTime,
  relativeTime,
  dayLabel,
  initials,
  nextId,
  type Conversation,
  type ChatMessage,
  type Channel,
} from "./data";
import { EngageView } from "./engage-view";
import { Onboarding } from "./onboarding";

const ONBOARD_KEY = "engage_onboarded_v1";

/* ── Palette (Salla design system tokens) ─────────────────────── */
const TEAL = "#004a57"; // --primary: brand text, logo, active nav, agent bubble
const TEAL_DEEP = "#004a57"; // --primary: headings
const MINT = "#a3ffe5"; // --secondary: logo bg, wallet mint
const MINT_SOFT = "#e5fff9"; // --secondary-200: active nav highlight
const ACCENT = "#00ad6b"; // --success: unread badge, online
const SUBTLE = "#737373"; // --dark-100: inactive nav / muted
const HAIR = "#ededed"; // --gray-400: hairline borders

/* ── Channel badge ─────────────────────────────────────────────── */
function ChannelIcon({ channel, className = "" }: { channel: Channel; className?: string }) {
  if (channel === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="#25D366" aria-label="WhatsApp">
        <path d="M17.5 14.4c-.3-.15-1.7-.83-1.96-.93-.26-.1-.45-.15-.64.15-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.72-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.19 2.02 3.08 4.9 4.32.68.29 1.22.47 1.63.6.69.22 1.31.19 1.8.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM12.05 21.5h-.01a9.44 9.44 0 01-4.8-1.32l-.35-.2-3.56.93.95-3.47-.23-.36a9.4 9.4 0 01-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 016.68 2.77 9.38 9.38 0 012.76 6.68c0 5.2-4.24 9.44-9.45 9.44zM20.5 3.5A11.4 11.4 0 0012.05 0C5.6 0 .35 5.25.35 11.7c0 2.06.54 4.07 1.56 5.85L.25 24l6.6-1.73a11.7 11.7 0 005.2 1.32h.01c6.45 0 11.7-5.25 11.7-11.7a11.6 11.6 0 00-3.26-8.39z" />
      </svg>
    );
  }
  if (channel === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-label="Instagram">
        <defs>
          <radialGradient id="ig" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect x="1" y="1" width="22" height="22" rx="6" fill="url(#ig)" />
        <rect x="5" y="5" width="14" height="14" rx="4.5" fill="none" stroke="#fff" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3.4" fill="none" stroke="#fff" strokeWidth="1.6" />
        <circle cx="16.4" cy="7.6" r="1.1" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="Web chat">
      <circle cx="12" cy="12" r="11" fill={TEAL} />
      <path d="M7 10.5h10M7 14h6" stroke={MINT} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const NAV = [
  { label: "Inbox", icon: Inbox },
  { label: "Engage", icon: Megaphone },
  { label: "Templates", icon: FileText },
  { label: "Contacts", icon: Users },
  { label: "Analytics", icon: BarChart3 },
  { label: "Wallet", icon: Wallet },
  { label: "Settings", icon: Settings },
];

export default function EngagePage() {
  const [now, setNow] = useState(() => Date.now());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [typingIn, setTypingIn] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("Inbox");

  // Filters
  const [folder, setFolder] = useState<"open" | "closed" | "all">("open");
  const [folderOpen, setFolderOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sortRecent, setSortRecent] = useState(true);
  const [query, setQuery] = useState("");
  const [autoDemo, setAutoDemo] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = Date.now();
    setNow(t);
    setConversations(seedConversations(t));
    // First-run onboarding
    try {
      if (!localStorage.getItem(ONBOARD_KEY)) setShowOnboarding(true);
    } catch {
      setShowOnboarding(true);
    }
  }, []);

  function finishOnboarding() {
    try {
      localStorage.setItem(ONBOARD_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowOnboarding(false);
    setActiveNav("Inbox");
  }

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!autoDemo) return;
    const id = setInterval(() => injectInbound(), 4500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDemo]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [selected?.messages.length, typingIn, selectedId]);

  function lastMessage(c: Conversation): ChatMessage | undefined {
    return c.messages[c.messages.length - 1];
  }

  const visible = useMemo(() => {
    let list = conversations.filter((c) => (folder === "all" ? true : c.status === folder));
    if (unreadOnly) list = list.filter((c) => c.unread > 0);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.handle.toLowerCase().includes(q) ||
          (lastMessage(c)?.text.toLowerCase().includes(q) ?? false),
      );
    }
    list = [...list].sort((a, b) => {
      const ta = lastMessage(a)?.time ?? 0;
      const tb = lastMessage(b)?.time ?? 0;
      return sortRecent ? tb - ta : ta - tb;
    });
    return list;
  }, [conversations, folder, unreadOnly, query, sortRecent]);

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  function openConversation(id: string) {
    setSelectedId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  }

  function sendMessage() {
    const text = draft.trim();
    if (!text || !selected) return;
    const id = selected.id;
    const msg: ChatMessage = { id: nextId(), from: "agent", text, time: Date.now(), status: "sent" };
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, messages: [...c.messages, msg] } : c)));
    setDraft("");

    setTimeout(() => updateStatus(id, msg.id, "delivered"), 700);
    setTimeout(() => updateStatus(id, msg.id, "read"), 1600);

    setTimeout(() => setTypingIn(id), 1900);
    setTimeout(() => {
      setTypingIn((t) => (t === id ? null : t));
      const reply: ChatMessage = { id: nextId(), from: "customer", text: randomReply(), time: Date.now() };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, messages: [...c.messages, reply], unread: c.id === selectedId ? 0 : c.unread + 1 }
            : c,
        ),
      );
    }, 3600);
  }

  function updateStatus(convId: string, msgId: string, status: ChatMessage["status"]) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, status } : m)) }
          : c,
      ),
    );
  }

  function injectInbound() {
    const conv = makeInboundConversation(Date.now());
    setConversations((prev) => [conv, ...prev]);
  }

  function injectReplyToRandom() {
    setConversations((prev) => {
      const open = prev.filter((c) => c.status === "open");
      if (open.length === 0) return prev;
      const target = open[Math.floor(Math.random() * open.length)];
      const reply: ChatMessage = { id: nextId(), from: "customer", text: randomReply(), time: Date.now() };
      return prev.map((c) =>
        c.id === target.id
          ? { ...c, messages: [...c.messages, reply], unread: c.id === selectedId ? 0 : c.unread + 1, online: true }
          : c,
      );
    });
  }

  function resetInbox() {
    const t = Date.now();
    setConversations(seedConversations(t));
    setSelectedId(null);
    setAutoDemo(false);
  }

  function clearInbox() {
    setConversations([]);
    setSelectedId(null);
    setAutoDemo(false);
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white text-[#333333]">
      {/* Salla design-system icon font (Hugeicons stroke-rounded) */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://cdn.salla.network/fonts/hugeicons-font.min.css" precedence="default" />
      {/* ── Top nav (two rows) ──────────────────────────────────── */}
      <header className="shrink-0 border-b bg-white" style={{ borderColor: HAIR }}>
        {/* Row 1: logo + name .......... wallet */}
        <div className="flex h-[52px] items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl" style={{ background: MINT }}>
              <MessagesSquare className="size-[18px]" style={{ color: TEAL }} strokeWidth={2.2} />
            </div>
            <span className="text-[18px] font-extrabold tracking-tight" style={{ color: TEAL_DEEP }}>
              Salla Engage
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-bold"
            style={{ borderColor: MINT, background: "#f0fffb", color: TEAL }}
          >
            <Wallet className="size-4" />
            SAR 0.00
          </div>
        </div>

        {/* Row 2: nav tabs, left-aligned */}
        <nav className="flex items-stretch gap-0.5 px-5">
          {NAV.map((item) => {
            const active = activeNav === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActiveNav(item.label)}
                className="relative flex items-stretch"
              >
                <span
                  className="flex items-center gap-1.5 rounded-t-lg px-3 py-2.5 text-[13px] font-semibold transition-colors"
                  style={active ? { background: MINT_SOFT, color: TEAL } : { color: SUBTLE }}
                >
                  <item.icon className="size-[17px]" strokeWidth={active ? 2.2 : 1.9} />
                  {item.label}
                  {item.label === "Inbox" && totalUnread > 0 && (
                    <span
                      className="ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: ACCENT }}
                    >
                      {totalUnread}
                    </span>
                  )}
                </span>
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full" style={{ background: TEAL }} />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ── Body ────────────────────────────────────────────────── */}
      {activeNav === "Engage" && <EngageView onOpenInbox={() => setActiveNav("Inbox")} />}
      {activeNav !== "Inbox" && activeNav !== "Engage" && <ComingSoon label={activeNav} />}
      <div className={`min-h-0 flex-1 ${activeNav === "Inbox" ? "flex" : "hidden"}`}>
        {/* Conversation list */}
        <aside className="flex w-[312px] shrink-0 flex-col border-r" style={{ borderColor: HAIR }}>
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold" style={{ color: TEAL_DEEP }}>
                Conversations
              </h2>
              <span className="flex size-5 items-center justify-center rounded-full bg-[#f5f5f5] text-[11px] font-semibold text-[#737373]">
                {visible.length}
              </span>
            </div>
            <button
              onClick={injectInbound}
              title="Simulate a new incoming chat"
              className="flex size-8 items-center justify-center rounded-lg text-[#737373] hover:bg-[#f7f7f7]"
              style={{ color: SUBTLE }}
            >
              <MessageSquarePlus className="size-[18px]" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 px-4 pb-2.5">
            <div className="relative">
              <button
                onClick={() => setFolderOpen((v) => !v)}
                className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold hover:bg-[#f7f7f7]"
                style={{ borderColor: "#dedede", color: TEAL }}
              >
                {folder === "open" ? "Open Chats" : folder === "closed" ? "Closed" : "All Chats"}
                <ChevronDown className="size-3.5" />
              </button>
              {folderOpen && (
                <div className="absolute left-0 top-11 z-20 w-36 overflow-hidden rounded-lg border bg-white shadow-lg" style={{ borderColor: HAIR }}>
                  {(["open", "closed", "all"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setFolder(f);
                        setFolderOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-xs font-medium hover:bg-[#f7f7f7]"
                      style={{ color: folder === f ? ACCENT : "#333333" }}
                    >
                      {f === "open" ? "Open Chats" : f === "closed" ? "Closed" : "All Chats"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setUnreadOnly((v) => !v)}
              className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors"
              style={
                unreadOnly
                  ? { borderColor: ACCENT, background: MINT_SOFT, color: ACCENT }
                  : { borderColor: "#dedede", color: TEAL }
              }
            >
              Unread
            </button>

            <button
              onClick={() => setSortRecent((v) => !v)}
              title={sortRecent ? "Newest first" : "Oldest first"}
              className="ml-auto flex size-8 items-center justify-center rounded-lg border hover:bg-[#f7f7f7]"
              style={{ borderColor: "#dedede", color: SUBTLE }}
            >
              <ArrowDownWideNarrow className={`size-4 ${sortRecent ? "" : "rotate-180"}`} />
            </button>
            <button
              className="flex size-8 items-center justify-center rounded-lg border hover:bg-[#f7f7f7]"
              style={{ borderColor: "#dedede", color: SUBTLE }}
            >
              <Filter className="size-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-2.5">
            <div className="flex items-center gap-2 rounded-lg border px-2.5 py-2 focus-within:border-[color:var(--accent)]" style={{ borderColor: "#dedede", ["--accent" as string]: ACCENT }}>
              <Search className="size-4 text-[#999999]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-transparent text-sm text-[#333333] placeholder:text-[#999999] focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-[#999999] hover:text-[#333333]">
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="h-px" style={{ background: HAIR }} />

          {/* List */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visible.length === 0 ? (
              <EmptyList onSimulate={injectInbound} />
            ) : (
              visible.map((c) => {
                const last = lastMessage(c);
                const isSel = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={`flex w-full items-start gap-2.5 border-b px-4 py-2.5 text-left transition-colors ${
                      isSel ? "bg-[#f0fffb]" : "hover:bg-[#fafafa]"
                    }`}
                    style={{ borderColor: "#f7f7f7" }}
                  >
                    <div className="relative shrink-0">
                      <div
                        className="flex size-10 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: c.avatarColor }}
                      >
                        {initials(c.name)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5">
                        <ChannelIcon channel={c.channel} className="size-3.5 rounded-full" />
                      </span>
                      {c.online && (
                        <span className="absolute right-0 top-0 size-2.5 rounded-full border-2 border-white bg-[#00ad6b]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-sm ${c.unread > 0 ? "font-bold text-[#333333]" : "font-semibold text-[#333333]"}`}
                          dir="auto"
                        >
                          {c.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-[#999999]">
                          {last ? relativeTime(last.time, now) : ""}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-xs ${c.unread > 0 ? "font-medium text-[#545454]" : "text-[#999999]"}`}
                          dir="auto"
                        >
                          {last?.from === "agent" && <span className="text-[#999999]">You: </span>}
                          {last?.text}
                        </span>
                        {c.unread > 0 && (
                          <span
                            className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ background: ACCENT }}
                          >
                            {c.unread}
                          </span>
                        )}
                      </div>
                      {c.tags && c.tags.length > 0 && (
                        <div className="mt-1.5 flex gap-1">
                          {c.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-[#f5f5f5] px-1.5 py-0.5 text-[10px] font-semibold text-[#737373]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <section className="flex min-w-0 flex-1 flex-col bg-[#f7f7f7]">
          {!selected ? (
            <EmptyChat />
          ) : (
            <>
              {/* Chat header */}
              <div className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4" style={{ borderColor: HAIR }}>
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div
                      className="flex size-9 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: selected.avatarColor }}
                    >
                      {initials(selected.name)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5">
                      <ChannelIcon channel={selected.channel} className="size-3.5 rounded-full" />
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#333333]" dir="auto">
                      {selected.name}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-[#999999]">
                      {selected.online ? (
                        <>
                          <Circle className="size-2 fill-[#00ad6b] text-[#00ad6b]" /> Online
                        </>
                      ) : (
                        selected.handle
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <IconBtn>
                    <Phone className="size-[18px]" />
                  </IconBtn>
                  <IconBtn>
                    <Info className="size-[18px]" />
                  </IconBtn>
                  <IconBtn>
                    <MoreVertical className="size-[18px]" />
                  </IconBtn>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-6 py-5">
                {selected.messages.map((m, i) => {
                  const prev = selected.messages[i - 1];
                  const showDay = !prev || dayLabel(prev.time) !== dayLabel(m.time);
                  return (
                    <div key={m.id}>
                      {showDay && (
                        <div className="my-4 flex justify-center">
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#999999] shadow-sm">
                            {dayLabel(m.time)}
                          </span>
                        </div>
                      )}
                      <MessageBubble message={m} />
                    </div>
                  );
                })}
                {typingIn === selected.id && <TypingBubble />}
              </div>

              {/* Composer */}
              <div className="shrink-0 border-t bg-white px-4 py-3" style={{ borderColor: HAIR }}>
                <div className="flex items-end gap-1.5 rounded-xl border bg-white px-3 py-1.5 focus-within:border-[color:var(--accent)]" style={{ borderColor: "#dedede", ["--accent" as string]: ACCENT }}>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message..."
                    dir="auto"
                    className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm text-[#333333] placeholder:text-[#999999] focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: TEAL }}
                  >
                    <Sparkles className="size-[18px]" />
                  </button>
                </div>
                <p className="mt-1.5 px-2 text-[11px] text-[#999999]">
                  Press <kbd className="rounded bg-[#f5f5f5] px-1">Enter</kbd> to send — the customer will auto-reply.
                </p>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Floating buttons ────────────────────────────────────── */}
      {activeNav === "Inbox" && (
      <>
      {/* Bottom-right: prototype demo controls */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
        {demoOpen && (
          <div className="w-64 rounded-2xl border bg-white p-3 shadow-2xl" style={{ borderColor: HAIR }}>
            <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold" style={{ color: TEAL_DEEP }}>
              <Sparkles className="size-4" style={{ color: ACCENT }} /> Prototype controls
            </div>
            <div className="flex flex-col gap-1.5">
              <DemoRow onClick={injectInbound}>+ New customer chat</DemoRow>
              <DemoRow onClick={injectReplyToRandom}>+ Incoming reply</DemoRow>
              <button
                onClick={() => setAutoDemo((v) => !v)}
                className="rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition-colors"
                style={
                  autoDemo
                    ? { background: ACCENT, color: "#fff" }
                    : { background: MINT_SOFT, color: TEAL }
                }
              >
                {autoDemo ? "● Live stream: ON" : "▶ Start live stream"}
              </button>
              <div className="my-1 h-px" style={{ background: HAIR }} />
              <DemoRow onClick={() => setShowOnboarding(true)}>▶ Replay onboarding</DemoRow>
              <DemoRow onClick={resetInbox}>↺ Reset inbox</DemoRow>
              <DemoRow onClick={clearInbox}>Empty inbox</DemoRow>
            </div>
          </div>
        )}
        <button
          onClick={() => setDemoOpen((v) => !v)}
          className="flex size-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
          style={{ background: TEAL }}
          title="Prototype controls"
        >
          {demoOpen ? <X className="size-6 text-white" /> : <Sparkles className="size-6" style={{ color: MINT }} />}
        </button>
      </div>
      </>
      )}

      {/* First-run onboarding carousel */}
      {showOnboarding && <Onboarding onClose={finishOnboarding} />}
    </div>
  );
}

/* Placeholder for the not-yet-built tabs */
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-white text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl" style={{ background: MINT_SOFT }}>
        <Sparkles className="size-9" style={{ color: TEAL }} strokeWidth={1.9} />
      </div>
      <p className="mt-4 text-xl font-bold" style={{ color: TEAL_DEEP }}>
        {label}
      </p>
      <p className="mt-1 max-w-xs text-sm text-[#999999]">
        This section is part of the prototype and isn&apos;t built out yet.
      </p>
    </div>
  );
}

/* ── Small components ──────────────────────────────────────────── */
function DemoRow({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-[#333333] transition-colors hover:bg-[#f7f7f7]"
    >
      {children}
    </button>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex size-8 items-center justify-center rounded-lg text-[#737373] hover:bg-[#f7f7f7]">
      {children}
    </button>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAgent = message.from === "agent";
  return (
    <div className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
          isAgent ? "rounded-br-md text-white" : "rounded-bl-md bg-white text-[#333333]"
        }`}
        style={isAgent ? { background: TEAL } : undefined}
      >
        <p className="whitespace-pre-wrap break-words" dir="auto">
          {message.text}
        </p>
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            isAgent ? "text-white/70" : "text-[#999999]"
          }`}
        >
          {formatTime(message.time)}
          {isAgent &&
            (message.status === "read" ? (
              <CheckCheck className="size-3.5" style={{ color: MINT }} />
            ) : message.status === "delivered" ? (
              <CheckCheck className="size-3.5" />
            ) : (
              <Check className="size-3.5" />
            ))}
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-2 animate-bounce rounded-full bg-[#bababa]"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  );
}

function EmptyList({ onSimulate }: { onSimulate: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 pt-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl" style={{ background: MINT_SOFT }}>
        <Inbox className="size-7" style={{ color: TEAL }} strokeWidth={1.9} />
      </div>
      <p className="mt-3.5 text-[15px] font-bold" style={{ color: TEAL_DEEP }}>
        No conversations yet
      </p>
      <p className="mt-1 text-sm text-[#999999]">
        When customers message you, conversations will appear here.
      </p>
      <button
        onClick={onSimulate}
        className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
        style={{ background: TEAL }}
      >
        Simulate a customer message
      </button>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl" style={{ background: MINT_SOFT }}>
        <MessagesSquare className="size-8" style={{ color: TEAL }} strokeWidth={1.9} />
      </div>
      <p className="mt-3.5 text-lg font-bold" style={{ color: TEAL_DEEP }}>
        Select a conversation
      </p>
      <p className="mt-1 max-w-xs text-sm text-[#999999]">
        Choose a conversation from the list to start replying.
      </p>
    </div>
  );
}
