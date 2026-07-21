"use client";

import { useMemo, useState } from "react";
import {
  FilePen,
  Plus,
  SignalHigh,
  Calendar,
  RotateCw,
  Zap,
  ReceiptText,
  Megaphone,
  Play,
  Send,
  Wallet,
  DollarSign,
  ArrowUpRight,
  Search,
  ShoppingCart,
  Gift,
  Star,
  Package,
  Truck,
  Phone,
  Pause,
  Eye,
} from "./icons";
import { JourneySteps } from "./journey";

/* ── Palette (Salla design system tokens) ─────────────────────── */
const TEAL = "#004a57"; // --primary
const TEAL_DEEP = "#004a57"; // --primary
const GREEN = "#00ad6b"; // --success
const GREEN_SOFT = "#effbf6"; // --success-100
const AMBER = "#d28f37"; // --warning-600
const MINT_SOFT = "#e5fff9"; // --secondary-200
const HAIR = "#ededed"; // --gray-400
const MUTED = "#737373"; // --dark-100

/* ── Data ──────────────────────────────────────────────────────── */
type Status = "Active" | "Paused" | "Draft";
type Segment = "engagements" | "utilities" | "broadcasts";
type IconKey =
  | "cart"
  | "rotate"
  | "gift"
  | "zap"
  | "star"
  | "package"
  | "truck"
  | "phone"
  | "megaphone";

interface Automation {
  id: string;
  name: string;
  subtitle: string;
  segment: Segment;
  status: Status;
  sent: number;
  conversions: number;
  spend: number;
  revenue: number;
  icon: IconKey;
}

const AUTOMATIONS: Automation[] = [
  { id: "a1", name: "Abandoned Cart Recovery – 17 Jun 2026", subtitle: "Abandoned Cart Recovery", segment: "engagements", status: "Active", sent: 0, conversions: 0, spend: 0, revenue: 0, icon: "cart" },
  { id: "a2", name: "Winback – Lapsed 30 days", subtitle: "Re-engagement", segment: "engagements", status: "Active", sent: 1240, conversions: 86, spend: 210.5, revenue: 4302, icon: "rotate" },
  { id: "a3", name: "Birthday Treat", subtitle: "Loyalty reward", segment: "engagements", status: "Active", sent: 512, conversions: 40, spend: 88, revenue: 1610, icon: "gift" },
  { id: "a4", name: "Welcome Series", subtitle: "New subscriber flow", segment: "engagements", status: "Paused", sent: 3120, conversions: 240, spend: 156, revenue: 6800, icon: "zap" },
  { id: "a5", name: "Post-Purchase Review", subtitle: "Review request", segment: "engagements", status: "Draft", sent: 0, conversions: 0, spend: 0, revenue: 0, icon: "star" },

  { id: "u1", name: "Order Confirmation", subtitle: "Transactional", segment: "utilities", status: "Active", sent: 8420, conversions: 0, spend: 84.2, revenue: 0, icon: "package" },
  { id: "u2", name: "Shipping Update", subtitle: "Transactional", segment: "utilities", status: "Active", sent: 6210, conversions: 0, spend: 62.1, revenue: 0, icon: "truck" },
  { id: "u3", name: "COD Order Confirmation", subtitle: "Transactional", segment: "utilities", status: "Active", sent: 1980, conversions: 0, spend: 19.8, revenue: 0, icon: "phone" },

  { id: "b1", name: "Eid Mega Sale", subtitle: "One-time campaign", segment: "broadcasts", status: "Draft", sent: 0, conversions: 0, spend: 0, revenue: 0, icon: "megaphone" },
  { id: "b2", name: "Summer Collection Launch", subtitle: "One-time campaign", segment: "broadcasts", status: "Paused", sent: 15200, conversions: 940, spend: 1520, revenue: 38400, icon: "megaphone" },
];

const ICONS: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  cart: ShoppingCart,
  rotate: RotateCw,
  gift: Gift,
  zap: Zap,
  star: Star,
  package: Package,
  truck: Truck,
  phone: Phone,
  megaphone: Megaphone,
};

const SEGMENTS: { key: Segment; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "engagements", label: "Engagements", icon: Zap },
  { key: "utilities", label: "Utilities", icon: ReceiptText },
  { key: "broadcasts", label: "Broadcasts", icon: Megaphone },
];

const FILTERS: ("All" | Status)[] = ["All", "Active", "Paused", "Draft"];

function fmt(n: number) {
  return n.toLocaleString("en-US");
}
function money(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── View ──────────────────────────────────────────────────────── */
export function EngageView({ onOpenInbox }: { onOpenInbox?: () => void }) {
  const [segment, setSegment] = useState<Segment>("engagements");
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  const status = (a: Automation): Status => statuses[a.id] ?? a.status;

  const inSegment = useMemo(() => AUTOMATIONS.filter((a) => a.segment === segment), [segment]);

  const rows = useMemo(() => {
    let list = inSegment;
    if (filter !== "All") list = list.filter((a) => status(a) === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inSegment, filter, query, statuses]);

  const stats = useMemo(() => {
    const active = inSegment.filter((a) => status(a) === "Active").length;
    const sent = inSegment.reduce((s, a) => s + a.sent, 0);
    const spend = inSegment.reduce((s, a) => s + a.spend, 0);
    const revenue = inSegment.reduce((s, a) => s + a.revenue, 0);
    const roas = spend > 0 ? revenue / spend : null;
    return { active, sent, spend, revenue, roas };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inSegment, statuses]);

  function toggleStatus(a: Automation) {
    const cur = status(a);
    if (cur === "Draft") return;
    setStatuses((prev) => ({ ...prev, [a.id]: cur === "Active" ? "Paused" : "Active" }));
  }

  const noun = segment === "engagements" ? "engagement" : segment === "utilities" ? "utility" : "broadcast";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto max-w-[1240px] px-6 py-5">
        {/* Getting-started journey */}
        <JourneySteps onOpenInbox={onOpenInbox} onGoBroadcasts={() => setSegment("broadcasts")} />

        {/* Title row */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: TEAL_DEEP }}>
              Engage
            </h1>
            <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>
              {inSegment.length} {noun}
              {inSegment.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 rounded-lg border bg-white px-3.5 py-2 text-[13px] font-bold transition-colors hover:bg-[#f7f7f7]"
              style={{ borderColor: HAIR, color: TEAL }}
            >
              <FilePen className="size-4" />
              Drafts (2)
            </button>
            <button
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ background: GREEN }}
            >
              <Plus className="size-4" />
              Create New
            </button>
          </div>
        </div>

        {/* Tier bar */}
        <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl border bg-white px-4 py-3 text-[13px]" style={{ borderColor: HAIR }}>
          <div className="flex items-center gap-1.5" style={{ color: MUTED }}>
            <SignalHigh className="size-4" style={{ color: TEAL }} />
            Messaging Tier <span className="font-bold" style={{ color: TEAL_DEEP }}>Unknown: 1,000/day</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: MUTED }}>
            <span className="size-2 rounded-full bg-[#bababa]" />
            Quality <span className="font-bold" style={{ color: TEAL_DEEP }}>Unknown</span>
          </div>
          <div className="flex flex-1 items-center gap-2.5" style={{ color: MUTED }}>
            Today <span className="font-bold" style={{ color: TEAL_DEEP }}>{fmt(stats.sent % 1000)}/1,000</span>
            <div className="h-1.5 w-36 overflow-hidden rounded-full bg-[#ededed]">
              <div className="h-full rounded-full" style={{ width: `${((stats.sent % 1000) / 1000) * 100}%`, background: TEAL }} />
            </div>
          </div>
        </div>

        {/* Segmented control */}
        <div className="mt-4 flex gap-1 rounded-xl p-1" style={{ background: "#f5f5f5" }}>
          {SEGMENTS.map((s) => {
            const active = segment === s.key;
            return (
              <button
                key={s.key}
                onClick={() => {
                  setSegment(s.key);
                  setFilter("All");
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold transition-all"
                style={active ? { background: "#fff", color: TEAL, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : { color: MUTED }}
              >
                <s.icon className="size-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Scheduled automations banner (engagements only) */}
        {segment === "engagements" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3.5" style={{ borderColor: "#cdece0", background: MINT_SOFT }}>
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/70">
                <Calendar className="size-[18px]" style={{ color: TEAL }} />
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: TEAL_DEEP }}>
                  Scheduled automations
                </p>
                <p className="mt-0.5 max-w-3xl text-[13px]" style={{ color: MUTED }}>
                  Winback &amp; birthday automations are evaluated automatically every day at 9:00 against your Salla
                  customers. Run them now to evaluate immediately.
                </p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-[13px] font-bold hover:bg-[#f7f7f7]" style={{ borderColor: HAIR, color: TEAL }}>
              <RotateCw className="size-4" />
              Run now
            </button>
          </div>
        )}

        {/* Stat cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <StatCard icon={Play} tint={GREEN} bg={GREEN_SOFT} label="Active" value={String(stats.active)} />
          <StatCard icon={Send} tint="#737373" bg="#f5f5f5" label="Total Sent" value={fmt(stats.sent)} />
          <StatCard icon={Wallet} tint={AMBER} bg="#fff6eb" label="Total Spend" value={`${money(stats.spend)} SAR`} />
          <StatCard icon={DollarSign} tint={GREEN} bg={GREEN_SOFT} label="Revenue" value={`${fmt(Math.round(stats.revenue))} SAR`} />
          <StatCard icon={ArrowUpRight} tint="#737373" bg="#f5f5f5" label="ROAS" value={stats.roas ? `${stats.roas.toFixed(1)}x` : "—"} />
        </div>

        {/* Filters + search */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
                  style={active ? { background: TEAL_DEEP, color: "#fff" } : { color: MUTED }}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 rounded-full border px-3.5 py-2 focus-within:border-[color:var(--a)]" style={{ borderColor: HAIR, ["--a" as string]: TEAL }}>
            <Search className="size-4" style={{ color: MUTED }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search automations..."
              className="w-52 bg-transparent text-[13px] text-[#333333] placeholder:text-[#999999] focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: HAIR }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider" style={{ background: "#f7f7f7", color: MUTED }}>
                <th className="py-3 pl-5 pr-4">Automation</th>
                <th className="px-4 text-center">Status</th>
                <th className="px-4 text-center">Sent</th>
                <th className="px-4 text-center">Conversions</th>
                <th className="px-4 text-center">Spend</th>
                <th className="px-4 text-center">Revenue</th>
                <th className="px-4 text-center">ROAS</th>
                <th className="px-4" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-sm" style={{ color: MUTED }}>
                    No automations match your filters.
                  </td>
                </tr>
              ) : (
                rows.map((a) => {
                  const st = status(a);
                  const Icon = ICONS[a.icon];
                  const roas = a.spend > 0 ? `${(a.revenue / a.spend).toFixed(1)}x` : "—";
                  return (
                    <tr key={a.id} className="border-t transition-colors hover:bg-[#fafafa]" style={{ borderColor: HAIR }}>
                      <td className="py-3 pl-5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "#f5f5f5" }}>
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold" style={{ color: TEAL_DEEP }}>
                              {a.name}
                            </p>
                            <p className="truncate text-xs" style={{ color: MUTED }}>
                              {a.subtitle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-center">
                        <StatusPill status={st} />
                      </td>
                      <td className="px-4 text-center font-semibold" style={{ color: TEAL_DEEP }}>
                        {fmt(a.sent)}
                      </td>
                      <td className="px-4 text-center font-semibold" style={{ color: GREEN }}>
                        {fmt(a.conversions)}
                      </td>
                      <td className="px-4 text-center font-semibold" style={{ color: AMBER }}>
                        {money(a.spend)}
                      </td>
                      <td className="px-4 text-center font-semibold" style={{ color: GREEN }}>
                        {fmt(Math.round(a.revenue))} SAR
                      </td>
                      <td className="px-4 text-center font-semibold" style={{ color: TEAL }}>
                        {roas}
                      </td>
                      <td className="px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleStatus(a)}
                            title={st === "Active" ? "Pause" : "Resume"}
                            disabled={st === "Draft"}
                            className="flex size-7 items-center justify-center rounded-md border transition-colors disabled:opacity-40"
                            style={{ borderColor: st === "Active" ? "#f5e0c0" : "#b3ecd4", color: st === "Active" ? AMBER : GREEN }}
                          >
                            {st === "Active" ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                          </button>
                          <button className="flex size-7 items-center justify-center rounded-md border hover:bg-[#f7f7f7]" style={{ borderColor: HAIR, color: MUTED }}>
                            <Eye className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  tint,
  bg,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  bg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-3.5" style={{ borderColor: HAIR }}>
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg" style={{ background: bg }}>
          <Icon className="size-4" style={{ color: tint }} />
        </div>
        <span className="text-[13px] font-medium" style={{ color: MUTED }}>
          {label}
        </span>
      </div>
      <p className="mt-2 text-[22px] font-extrabold tracking-tight" style={{ color: TEAL_DEEP }}>
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; color: string; border: string }> = {
    Active: { bg: "#effbf6", color: GREEN, border: "#b3ecd4" },
    Paused: { bg: "#fff6eb", color: AMBER, border: "#f5e0c0" },
    Draft: { bg: "#f5f5f5", color: "#737373", border: "#dedede" },
  };
  const s = map[status];
  return (
    <span className="inline-block rounded-full border px-3 py-1 text-xs font-bold" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
      {status}
    </span>
  );
}
