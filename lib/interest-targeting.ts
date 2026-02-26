/**
 * Shared types and Snap Lifestyle Category (SLC) data for Interest Targeting.
 *
 * In production the SLC list would be fetched per-country from:
 *   GET /v1/targeting/v1/interests/scls?country_code=sa
 *
 * For the prototype we maintain a curated list of real SLC IDs that cover
 * the most relevant categories for MENA / GCC e-commerce advertisers.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface InterestOption {
  id: string;
  label: string;
  /** Parent group ID (SLC_0 = root). Used for tree grouping. */
  parentId?: string;
}

export interface InterestGroup {
  id: string;
  label: string;
  icon: string;
  children: InterestOption[];
  /** Surface as "Recommended for Sales" in the UI */
  recommended?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Snap Lifestyle Categories (SLC) — curated for MENA e-commerce     */
/*                                                                     */
/*  IDs match the real Snap API. Names are taken from the API docs.    */
/*  Grouped by top-level parent for easy navigation.                   */
/* ------------------------------------------------------------------ */

export const SNAP_INTEREST_GROUPS: InterestGroup[] = [
  {
    id: "grp_shopping",
    label: "Shoppers & Buyers",
    icon: "🛒",
    recommended: true,
    children: [
      { id: "SLC_62", label: "Shopaholics" },
      { id: "SLC_63", label: "Value Shoppers" },
      { id: "SLC_124", label: "Luxury Shoppers" },
      { id: "SLC_125", label: "Online Shoppers" },
    ],
  },
  {
    id: "grp_fashion",
    label: "Fashion & Beauty",
    icon: "👗",
    recommended: true,
    children: [
      { id: "SLC_7", label: "Fashion & Style Gurus" },
      { id: "SLC_3", label: "Beauty Mavens" },
      { id: "SLC_126", label: "Sneakerheads" },
      { id: "SLC_76", label: "Luxury Lifestyle" },
    ],
  },
  {
    id: "grp_tech",
    label: "Tech & Electronics",
    icon: "📱",
    recommended: true,
    children: [
      { id: "SLC_69", label: "Tech Enthusiasts" },
      { id: "SLC_70", label: "Early Adopters" },
      { id: "SLC_24", label: "Gadget Gurus" },
      { id: "SLC_25", label: "Mobile Enthusiasts" },
    ],
  },
  {
    id: "grp_food",
    label: "Food & Dining",
    icon: "🍽️",
    children: [
      { id: "SLC_14", label: "Foodies" },
      { id: "SLC_15", label: "Coffee & Tea Lovers" },
      { id: "SLC_79", label: "Healthy Eaters" },
      { id: "SLC_80", label: "Home Chefs" },
    ],
  },
  {
    id: "grp_fitness",
    label: "Health & Fitness",
    icon: "💪",
    children: [
      { id: "SLC_8", label: "Fitness Enthusiasts" },
      { id: "SLC_36", label: "Gym & Weightlifting" },
      { id: "SLC_37", label: "Yoga & Pilates" },
      { id: "SLC_81", label: "Runners" },
    ],
  },
  {
    id: "grp_sports",
    label: "Sports Fans",
    icon: "⚽",
    children: [
      { id: "SLC_67", label: "Sports Fans" },
      { id: "SLC_92", label: "Football / Soccer Fans" },
      { id: "SLC_97", label: "Cricket Fans" },
      { id: "SLC_93", label: "Basketball Fans" },
      { id: "SLC_127", label: "Motorsport Fans" },
    ],
  },
  {
    id: "grp_gaming",
    label: "Gamers",
    icon: "🎮",
    children: [
      { id: "SLC_22", label: "Gamers" },
      { id: "SLC_83", label: "Mobile Gamers" },
      { id: "SLC_84", label: "Console Gamers" },
      { id: "SLC_85", label: "PC Gamers" },
    ],
  },
  {
    id: "grp_film",
    label: "Film & TV",
    icon: "🎬",
    children: [
      { id: "SLC_12", label: "Film & TV Fans" },
      { id: "SLC_98", label: "Crime & Mystery Fans" },
      { id: "SLC_99", label: "Indie & Foreign Film Fans" },
      { id: "SLC_86", label: "Anime Fans" },
      { id: "SLC_87", label: "Cordcutters" },
    ],
  },
  {
    id: "grp_travel",
    label: "Travel & Adventure",
    icon: "✈️",
    children: [
      { id: "SLC_1", label: "Adventure Seekers" },
      { id: "SLC_71", label: "Travel Enthusiasts" },
      { id: "SLC_72", label: "Beach Lovers" },
      { id: "SLC_73", label: "Road Trippers" },
    ],
  },
  {
    id: "grp_home",
    label: "Home & Family",
    icon: "🏠",
    children: [
      { id: "SLC_10", label: "Do-It-Yourselfers" },
      { id: "SLC_28", label: "Home Decor Enthusiasts" },
      { id: "SLC_56", label: "Parents" },
      { id: "SLC_57", label: "New Parents" },
      { id: "SLC_58", label: "Pet Owners" },
    ],
  },
  {
    id: "grp_auto",
    label: "Automotive",
    icon: "🚗",
    children: [
      { id: "SLC_2", label: "Auto Enthusiasts" },
      { id: "SLC_88", label: "Luxury Car Enthusiasts" },
      { id: "SLC_89", label: "EV Enthusiasts" },
    ],
  },
  {
    id: "grp_music",
    label: "Music & Entertainment",
    icon: "🎵",
    children: [
      { id: "SLC_48", label: "Music Fans" },
      { id: "SLC_90", label: "Hip-Hop / Rap Fans" },
      { id: "SLC_91", label: "Pop Music Fans" },
      { id: "SLC_128", label: "Concert Goers" },
    ],
  },
  {
    id: "grp_finance",
    label: "Finance & Business",
    icon: "💼",
    children: [
      { id: "SLC_20", label: "Finance & Investment" },
      { id: "SLC_21", label: "Entrepreneurs" },
      { id: "SLC_94", label: "Crypto Enthusiasts" },
    ],
  },
  {
    id: "grp_edu",
    label: "Education & Careers",
    icon: "🎓",
    children: [
      { id: "SLC_11", label: "Education Enthusiasts" },
      { id: "SLC_95", label: "College & University Students" },
      { id: "SLC_96", label: "Career Focused" },
    ],
  },
];

/** Flat array of all interest options (for search and lookup). */
export const ALL_SNAP_INTERESTS: InterestOption[] = SNAP_INTEREST_GROUPS.flatMap(
  (g) => g.children
);

/** Lookup an interest by ID. */
export function getInterestById(id: string): InterestOption | undefined {
  return ALL_SNAP_INTERESTS.find((i) => i.id === id);
}

/** Lookup the group that contains a given interest ID. */
export function getGroupForInterest(id: string): InterestGroup | undefined {
  return SNAP_INTEREST_GROUPS.find((g) => g.children.some((c) => c.id === id));
}

/** IDs of interests recommended for e-commerce / Sales objectives. */
export const RECOMMENDED_INTEREST_IDS: string[] = SNAP_INTEREST_GROUPS
  .filter((g) => g.recommended)
  .flatMap((g) => g.children.map((c) => c.id));
