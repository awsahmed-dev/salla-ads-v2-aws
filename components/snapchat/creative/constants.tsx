import {
  Image as ImageIcon,
  LayoutGrid,
  Layers,
  Zap,
  Globe,
  Link2,
  Download,
  Eye,
  FileText,
  Users,
} from "lucide-react";
import type {
  SnapCreativeType,
  AdFormat,
  AdDestination,
  CampaignObjective,
  WebViewCTA,
  LeadGenCTA,
  AppInstallCTA,
  DeepLinkCTA,
  LeadFormFieldType,
  CropPosition,
} from "@/lib/snapchat/campaign-types";

/* ---------- Legacy key (kept for any remaining references) ---------- */
export type AdFormatKey = SnapCreativeType | "INFLUENCER";

/* ---------- 4 true ad formats ---------- */

export const FORMAT_OPTIONS: {
  value: AdFormat;
  label: string;
  desc: string;
  icon: React.ReactNode;
  maxAssets: number;
}[] = [
  {
    value: "SINGLE",
    label: "Single Image / Video",
    desc: "Full-screen snap ad. Upload up to 8 creative variations.",
    icon: <ImageIcon className="size-5" />,
    maxAssets: 8,
  },
  {
    value: "COLLECTION",
    label: "Collection Ad",
    desc: "Top snap + 2–4 product tiles from your store.",
    icon: <LayoutGrid className="size-5" />,
    maxAssets: 1,
  },
  {
    value: "STORY",
    label: "Story Ad",
    desc: "3–20 snaps played in sequence. Each snap has its own CTA.",
    icon: <Layers className="size-5" />,
    maxAssets: 20,
  },
  {
    value: "DYNAMIC",
    label: "Dynamic Product Ad",
    desc: "Auto-generated ads from your catalog based on user behavior.",
    icon: <Zap className="size-5" />,
    maxAssets: 1,
  },
  {
    value: "INFLUENCER",
    label: "Influencer Content",
    desc: "Use a creator's ad code to run their content as your ad.",
    icon: <Users className="size-5" />,
    maxAssets: 8,
  },
];

/* ---------- Destination options ---------- */

export const DESTINATION_OPTIONS: {
  value: AdDestination;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  { value: "WEBSITE",     label: "Website",          desc: "Swipe-up opens a web page",          icon: <Globe className="size-4" /> },
  { value: "DEEP_LINK",   label: "Deep Link",        desc: "Opens directly inside your app",     icon: <Link2 className="size-4" /> },
  { value: "APP_INSTALL", label: "App Install",       desc: "Directs to App Store / Google Play", icon: <Download className="size-4" /> },
  { value: "NO_CTA",      label: "No CTA (Awareness)", desc: "No swipe-up action — brand awareness only", icon: <Eye className="size-4" /> },
  { value: "LEAD_FORM",   label: "Lead Form",         desc: "Swipe-up opens a native lead form",  icon: <FileText className="size-4" /> },
];

/* ---------- Legacy: map old 9-card array for any remaining consumers ---------- */
export const AD_FORMAT_OPTIONS = FORMAT_OPTIONS.map((f) => ({
  value: f.value as unknown as AdFormatKey,
  label: f.label,
  desc: f.desc,
  icon: f.icon,
  maxAssets: f.maxAssets,
}));

/** All valid CTA values for WEB_VIEW and DEEP_LINK creatives per Snap API. */
export const CTA_OPTIONS: { value: WebViewCTA; label: string }[] = [
  { value: "SHOP_NOW",     label: "Shop Now" },
  { value: "ORDER_NOW",    label: "Order Now" },
  { value: "GET_NOW",      label: "Get Now" },
  { value: "BOOK_NOW",     label: "Book Now" },
  { value: "BUY_TICKETS",  label: "Buy Tickets" },
  { value: "SIGN_UP",      label: "Sign Up" },
  { value: "MORE",         label: "More" },
  { value: "VIEW",         label: "View" },
  { value: "APPLY_NOW",    label: "Apply Now" },
  { value: "DOWNLOAD",     label: "Download" },
  { value: "WATCH",        label: "Watch" },
  { value: "LISTEN",       label: "Listen" },
  { value: "READ",         label: "Read" },
  { value: "PLAY",         label: "Play" },
  { value: "TRY",          label: "Try" },
  { value: "DONATE",       label: "Donate" },
  { value: "RESPOND",      label: "Respond" },      // Valid Snap API CTA for WEB_VIEW
  { value: "SHOWTIMES",    label: "Showtimes" },    // Valid Snap API CTA for WEB_VIEW
  { value: "VIEW_MENU",    label: "View Menu" },
  { value: "SHOW",         label: "Show" },
  { value: "VOTE",         label: "Vote" },
  { value: "PRE_REGISTER", label: "Pre-Register" },
  { value: "PLAY_GAME",    label: "Play Game" },
];

export const LEAD_CTA_OPTIONS: { value: LeadGenCTA; label: string }[] = [
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "APPLY_NOW", label: "Apply Now" },
  { value: "MORE", label: "Learn More" },
  { value: "BOOK_NOW", label: "Book Now" },
  { value: "GET_NOW", label: "Get Now" },
  { value: "TEST_DRIVE", label: "Test Drive" },
  { value: "REQUEST_APPOINTMENT", label: "Request Appointment" },
  { value: "REQUEST_QUOTE", label: "Request Quote" },
  { value: "FREE_TRIAL", label: "Free Trial" },
  { value: "CLAIM_SAMPLE", label: "Claim Sample" },
  { value: "GET_COUPON", label: "Get Coupon" },
];

/**
 * Valid CTA values for APP_INSTALL creatives per Snap API.
 * Note: MORE is NOT valid for APP_INSTALL and has been removed.
 */
export const APP_INSTALL_CTA_OPTIONS: { value: AppInstallCTA; label: string }[] = [
  { value: "INSTALL_NOW", label: "Install Now" },
  { value: "DOWNLOAD",    label: "Download" },
  { value: "GET_NOW",     label: "Get Now" },
  { value: "TRY",         label: "Try" },
  { value: "PLAY",        label: "Play" },
  { value: "USE_APP",     label: "Use App" },
  { value: "ORDER_NOW",   label: "Order Now" },
  { value: "SHOP_NOW",    label: "Shop Now" },
  { value: "BOOK_NOW",    label: "Book Now" },
  { value: "DONATE",      label: "Donate" },
  { value: "SIGN_UP",     label: "Sign Up" },
  { value: "WATCH",       label: "Watch" },
  { value: "VOTE",        label: "Vote" },
  { value: "DIRECTIONS",  label: "Directions" },
  { value: "PLAY_GAME",   label: "Play Game" },
];

/**
 * Valid CTA values for DEEP_LINK creatives per Snap API.
 */
export const DEEP_LINK_CTA_OPTIONS: { value: DeepLinkCTA; label: string }[] = [
  { value: "OPEN_APP",      label: "Open App" },
  { value: "USE_APP",       label: "Use App" },
  { value: "SHOP_NOW",      label: "Shop Now" },
  { value: "PLAY",          label: "Play" },
  { value: "TRY",           label: "Try" },
  { value: "WATCH",         label: "Watch" },
  { value: "SIGN_UP",       label: "Sign Up" },
  { value: "MORE",          label: "More" },
  { value: "DOWNLOAD",      label: "Download" },
  { value: "DONATE",        label: "Donate" },
  { value: "VOTE",          label: "Vote" },
  { value: "VIEW_PROFILE",  label: "View Profile" },
  { value: "DIRECTIONS",    label: "Directions" },
  { value: "PRE_REGISTER",  label: "Pre-Register" },
  { value: "PLAY_GAME",     label: "Play Game" },
];

export const LEAD_FIELD_LABELS: Record<LeadFormFieldType, string> = {
  FIRST_NAME: "First Name",
  LAST_NAME: "Last Name",
  EMAIL: "Email",
  PHONE_NUMBER: "Phone Number",
  ADDRESS: "Address",
  POSTAL_CODE: "Postal Code",
  BIRTHDAY_DATE: "Birthday",
  JOB_TITLE: "Job Title",
  COMPANY_NAME: "Company Name",
  CUSTOM: "Custom Question",
};

export const STANDARD_FIELD_OPTIONS: LeadFormFieldType[] = [
  "FIRST_NAME", "LAST_NAME", "EMAIL", "PHONE_NUMBER",
  "ADDRESS", "POSTAL_CODE", "BIRTHDAY_DATE", "JOB_TITLE", "COMPANY_NAME",
];

export const CROP_OPTIONS: { value: CropPosition; label: string }[] = [
  { value: "OPTIMIZED", label: "Optimized (Auto)" },
  { value: "MIDDLE", label: "Middle" },
  { value: "TOP", label: "Top" },
  { value: "BOTTOM", label: "Bottom" },
];

export const SNAP_POSITIONS = [
  { id: "INTERSTITIAL_USER",       label: "Between User Stories",              desc: "Full-screen ads between friend stories",                                                                    fullOnly: true,  formats: "all" as const },
  { id: "INTERSTITIAL_CONTENT",    label: "Between Publisher / Creator Stories", desc: "Between content from publishers and creators",                                                           fullOnly: false, formats: "all" as const },
  { id: "INTERSTITIAL_SPOTLIGHT",  label: "Spotlight",                         desc: "Ads within Spotlight (TikTok-like feed)",                                                                   fullOnly: false, formats: "all" as const },
  { id: "FEED",                    label: "Discover Feed",                     desc: "Story Ads appear as tiles in the Discover feed",                                                            fullOnly: true,  formats: ["COMPOSITE"] as string[] },
  { id: "INSTREAM",                label: "Within Publisher Stories",          desc: "Mid-roll within premium publisher content",                                                                  fullOnly: true,  formats: "all" as const },
  { id: "PUBLIC_STORIES_INSTREAM", label: "Within Creator Stories",            desc: "Mid-roll within creator story content",                                                                     fullOnly: false, formats: "all" as const },
  { id: "CAMERA",                  label: "Camera",                            desc: "Ads shown in the Snapchat camera (AR Lenses)",                                                              fullOnly: false, formats: ["WEB_VIEW", "SNAP_AD"] as string[] },
  { id: "CHAT_FEED",               label: "Chat Feed",                         desc: "Full-screen ads in the Chat tab between conversations. Primary placement for Sponsored Chat ads.",          fullOnly: true,  formats: "all" as const },
  { id: "POST_CAPTURE_CAROUSEL",   label: "Post-Capture Carousel",             desc: "Ads shown in the tile carousel immediately after a user takes a Snap.",                                    fullOnly: false, formats: "all" as const },
];

export const MEDIA_SPECS = {
  IMAGE: { maxSize: 5 * 1024 * 1024, dimLabel: "1080 x 1920 px" },
  VIDEO: { maxSize: 32 * 1024 * 1024, dimLabel: "1080 x 1920 px" },
  TILE: { maxSize: 2 * 1024 * 1024, dimLabel: "Min 120 x 120 px" },
};

export interface ProductSet {
  id: string;
  name: string;
  productCount: number;
}

export const MOCK_PRODUCT_SETS: ProductSet[] = [
  { id: "ps1", name: "Best Sellers", productCount: 24 },
  { id: "ps2", name: "New Arrivals", productCount: 18 },
  { id: "ps3", name: "Summer Collection", productCount: 42 },
  { id: "ps4", name: "Sale Items", productCount: 16 },
  { id: "ps5", name: "All Products", productCount: 156 },
];
