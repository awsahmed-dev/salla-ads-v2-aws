// Mock data + types for the Salla Engage chat prototype.
// Everything here is client-side only — no backend. It's designed so the inbox
// feels alive: seeded conversations, canned customer replies, and a pool of
// brand-new inbound conversations that can be injected on demand.

export type Sender = "customer" | "agent";

export type MessageStatus = "sent" | "delivered" | "read";

export interface ChatMessage {
  id: string;
  from: Sender;
  text: string;
  /** epoch millis */
  time: number;
  status?: MessageStatus;
}

export type Channel = "whatsapp" | "instagram" | "web";

export interface Conversation {
  id: string;
  name: string;
  handle: string; // phone / @username
  channel: Channel;
  avatarColor: string;
  online: boolean;
  unread: number;
  status: "open" | "closed";
  tags?: string[];
  messages: ChatMessage[];
}

const AVATAR_COLORS = [
  "#0d9488", // teal
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#ef4444", // red
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f97316", // orange
];

export function pickColor(seed: number) {
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MIN = 60_000;

// ── Seed conversations ────────────────────────────────────────────────
// Times are relative to load so the inbox always looks fresh.
export function seedConversations(now: number): Conversation[] {
  return [
    {
      id: "c1",
      name: "نورة العتيبي",
      handle: "+966 55 123 4567",
      channel: "whatsapp",
      avatarColor: pickColor(2),
      online: true,
      unread: 2,
      status: "open",
      tags: ["New order"],
      messages: [
        { id: "m1", from: "customer", text: "السلام عليكم، حابة أستفسر عن طلبي رقم ‎#48213", time: now - 22 * MIN },
        { id: "m2", from: "agent", text: "وعليكم السلام نورة 🌸 أهلاً فيكِ! لحظات وأتحقق من حالة طلبك.", time: now - 20 * MIN, status: "read" },
        { id: "m3", from: "customer", text: "متى بيوصلني؟ صار له ٣ أيام", time: now - 6 * MIN },
        { id: "m4", from: "customer", text: "ضروري قبل نهاية الأسبوع لو سمحتوا", time: now - 5 * MIN },
      ],
    },
    {
      id: "c2",
      name: "Omar Al-Harbi",
      handle: "+966 50 998 7766",
      channel: "whatsapp",
      avatarColor: pickColor(0),
      online: false,
      unread: 0,
      status: "open",
      tags: ["Payment"],
      messages: [
        { id: "m1", from: "customer", text: "Hi, my payment failed but the amount was deducted 😟", time: now - 90 * MIN },
        { id: "m2", from: "agent", text: "Hello Omar, sorry to hear that! Failed payments are auto-refunded within 3 business days. Could you share the last 4 digits of the card?", time: now - 88 * MIN, status: "read" },
        { id: "m3", from: "customer", text: "Sure, it's 4421", time: now - 80 * MIN },
        { id: "m4", from: "agent", text: "Thanks! I can see the refund is already being processed. You'll get an SMS once it lands. 👍", time: now - 79 * MIN, status: "delivered" },
      ],
    },
    {
      id: "c3",
      name: "سارة الدوسري",
      handle: "@sarah.style",
      channel: "instagram",
      avatarColor: pickColor(3),
      online: true,
      unread: 1,
      status: "open",
      tags: ["Product"],
      messages: [
        { id: "m1", from: "customer", text: "هل الفستان الأسود متوفر مقاس M؟", time: now - 34 * MIN },
        { id: "m2", from: "agent", text: "أهلاً سارة! نعم متوفر مقاس M، وباقي منه قطعتين فقط 😍", time: now - 33 * MIN, status: "read" },
        { id: "m3", from: "customer", text: "تمام أبيه! كيف أطلب؟", time: now - 2 * MIN },
      ],
    },
    {
      id: "c4",
      name: "Khalid Nasser",
      handle: "+966 53 445 1200",
      channel: "whatsapp",
      avatarColor: pickColor(7),
      online: false,
      unread: 0,
      status: "open",
      messages: [
        { id: "m1", from: "customer", text: "Do you ship to Dammam? And how much is delivery?", time: now - 3 * 60 * MIN },
        { id: "m2", from: "agent", text: "Yes we do! Delivery to Dammam is 20 SAR and takes 2–4 days. 🚚", time: now - 3 * 60 * MIN + 2 * MIN, status: "read" },
        { id: "m3", from: "customer", text: "Perfect, thank you!", time: now - 3 * 60 * MIN + 5 * MIN },
      ],
    },
    {
      id: "c5",
      name: "منى القحطاني",
      handle: "+966 56 300 8899",
      channel: "whatsapp",
      avatarColor: pickColor(4),
      online: false,
      unread: 3,
      status: "open",
      tags: ["Return"],
      messages: [
        { id: "m1", from: "customer", text: "المنتج وصل مكسور 💔", time: now - 50 * MIN },
        { id: "m2", from: "customer", text: "أبي أرجعه وأخذ فلوسي", time: now - 49 * MIN },
        { id: "m3", from: "customer", text: "في أحد؟؟", time: now - 12 * MIN },
      ],
    },
    {
      id: "c6",
      name: "James Carter",
      handle: "@james.c",
      channel: "web",
      avatarColor: pickColor(5),
      online: false,
      unread: 0,
      status: "closed",
      messages: [
        { id: "m1", from: "customer", text: "Is there a discount code for first orders?", time: now - 26 * 60 * MIN },
        { id: "m2", from: "agent", text: "Welcome! Use WELCOME10 for 10% off your first order 🎉", time: now - 26 * 60 * MIN + 1 * MIN, status: "read" },
        { id: "m3", from: "customer", text: "Awesome, worked. Thanks!", time: now - 25 * 60 * MIN },
      ],
    },
  ];
}

// ── Pool of brand-new inbound conversations for the "simulate" button ──
const INBOUND_POOL: { name: string; handle: string; channel: Channel; text: string }[] = [
  { name: "فيصل الشمري", handle: "+966 59 220 1145", channel: "whatsapp", text: "مرحبا، عندكم عرض على الشحن المجاني؟" },
  { name: "Layla Ahmed", handle: "@layla.a", channel: "instagram", text: "Loved the new collection! Do you restock the beige tote? 👜" },
  { name: "عبدالله الغامدي", handle: "+966 54 771 6633", channel: "whatsapp", text: "طلبي متأخر، ممكن رقم الشحنة؟" },
  { name: "Reem S.", handle: "+966 58 909 3321", channel: "whatsapp", text: "Can I change the delivery address on order #50921?" },
  { name: "Yousef Ali", handle: "@yousef", channel: "web", text: "Hey! Is cash on delivery available in Riyadh?" },
  { name: "هند المطيري", handle: "+966 55 664 2200", channel: "whatsapp", text: "أبغى أعرف المقاسات المتوفرة للحذاء البني" },
  { name: "Mariam K.", handle: "@mariam.k", channel: "instagram", text: "Do you have gift wrapping? It's for a birthday 🎁" },
];

let inboundIdx = 0;
let idCounter = 1000;
export function nextId() {
  return `x${idCounter++}`;
}

export function makeInboundConversation(now: number): Conversation {
  const pool = INBOUND_POOL[inboundIdx % INBOUND_POOL.length];
  inboundIdx++;
  return {
    id: nextId(),
    name: pool.name,
    handle: pool.handle,
    channel: pool.channel,
    avatarColor: pickColor(inboundIdx + 1),
    online: true,
    unread: 1,
    status: "open",
    tags: ["New"],
    messages: [{ id: nextId(), from: "customer", text: pool.text, time: now }],
  };
}

// ── Canned customer replies (for when the agent sends a message) ───────
const CANNED_REPLIES = [
  "تمام، شكراً جزيلاً! 🙏",
  "Great, that works for me 👍",
  "أوكي بانتظار ردكم",
  "Perfect, appreciate the quick reply!",
  "طيب كم يستغرق التوصيل؟",
  "Could you send me the payment link?",
  "ممتاز، بطلب الحين 🛍️",
  "Thank you so much! 😊",
];

export function randomReply() {
  return CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function relativeTime(ts: number, now: number) {
  const diff = Math.max(0, now - ts);
  const mins = Math.floor(diff / MIN);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function dayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yst = new Date(today);
  yst.setDate(today.getDate() - 1);
  const isYesterday = d.toDateString() === yst.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
