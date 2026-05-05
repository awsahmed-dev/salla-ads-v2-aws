/**
 * Saudi seasonal calendar — used to surface seasonal recommendations.
 * Dates are approximate (Hijri events shift each year). Update yearly.
 */

export interface SeasonalEvent {
  name: string;
  /** ISO date — approximate first day */
  date: string;
  /** Concrete suggestion that maps to a real audience action */
  prepWindowDays: number;
  suggestion: {
    listName: string;
    rationale: string;
  };
}

export const SAUDI_SEASONS: SeasonalEvent[] = [
  {
    name: "Eid al-Adha",
    date: "2026-05-26",
    prepWindowDays: 30,
    suggestion: {
      listName: "Eid al-Adha buyers",
      rationale: "Pre-build a list of customers who ordered during Eid al-Fitr — they're likely to convert again on Eid al-Adha.",
    },
  },
  {
    name: "Saudi National Day",
    date: "2026-09-23",
    prepWindowDays: 30,
    suggestion: {
      listName: "National Day shoppers",
      rationale: "Customers from Saudi Arabia who bought during last year's National Day window. Strong seasonal lookalike seed.",
    },
  },
  {
    name: "White Friday",
    date: "2026-11-27",
    prepWindowDays: 21,
    suggestion: {
      listName: "Discount-savvy shoppers",
      rationale: "Customers who used a coupon or bought during prior promotional periods. Convert highest during White Friday.",
    },
  },
  {
    name: "Ramadan 2027",
    date: "2027-02-07",
    prepWindowDays: 45,
    suggestion: {
      listName: "Ramadan-only buyers",
      rationale: "Activate your Ramadan-only segment ahead of time — pre-Ramadan campaigns have 1.4× lower CPA than reactive ones.",
    },
  },
];

export interface UpcomingSeason {
  event: SeasonalEvent;
  daysAway: number;
  /** True when we're inside the prep window — surface as actionable */
  isInPrepWindow: boolean;
}

export function getNextSeasons(now: Date = new Date()): UpcomingSeason[] {
  return SAUDI_SEASONS.map((event) => {
    const target = Date.parse(event.date);
    const days = Math.round((target - now.getTime()) / 86400000);
    return {
      event,
      daysAway: days,
      isInPrepWindow: days >= 0 && days <= event.prepWindowDays,
    };
  })
    .filter((s) => s.daysAway >= 0)
    .sort((a, b) => a.daysAway - b.daysAway);
}
