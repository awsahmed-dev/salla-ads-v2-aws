/**
 * Meta Ad Creative Constants
 * ----------------------------
 * Official specs from Meta Business Help Center & Marketing API v24 docs.
 * Extracted for scalability -- used by step-creative and preview components.
 */

import type { MetaAdFormat, MetaCTA } from "./campaign-types";

/* ------------------------------------------------------------------ */
/*  Placement types & specs                                            */
/* ------------------------------------------------------------------ */

export type PreviewPlacement =
  | "FACEBOOK_FEED"
  | "INSTAGRAM_FEED"
  | "FACEBOOK_REELS"
  | "INSTAGRAM_REELS"
  | "INSTAGRAM_STORY"
  | "FACEBOOK_STORY";

export interface PlacementSpec {
  label: string;
  platform: "facebook" | "instagram";
  apiFormat: string;
  aspectRatio: string;
  resolution: string;
  imageMax: string;
  videoMax: string;
  videoDuration: string;
  videoFormats: string;
  imageFormats: string;
  primaryText: string;
  headline: string;
  description: string;
  notes: string[];
}

/** Official Meta Business Help Center & Marketing API v24 placement specs */
export const PLACEMENT_SPECS: Record<PreviewPlacement, PlacementSpec> = {
  FACEBOOK_FEED: {
    label: "Facebook Feed",
    platform: "facebook",
    apiFormat: "DESKTOP_FEED_STANDARD / MOBILE_FEED_STANDARD",
    aspectRatio: "1:1 or 4:5",
    resolution: "1:1 = 1440 x 1440 px  |  4:5 = 1440 x 1800 px",
    imageMax: "30 MB",
    videoMax: "4 GB",
    videoDuration: "1 sec -- 241 min",
    videoFormats: "MP4, MOV, GIF",
    imageFormats: "JPG, PNG",
    primaryText: "50--150 chars recommended",
    headline: "27 chars recommended",
    description: "Optional (desktop only)",
    notes: [
      "H.264 compression, square pixels, fixed frame rate",
      "Stereo AAC audio at 128kbps+",
      "Min width: 600 px (image) / 120 px (video)",
    ],
  },
  INSTAGRAM_FEED: {
    label: "Instagram Feed",
    platform: "instagram",
    apiFormat: "INSTAGRAM_STANDARD",
    aspectRatio: "1:1 or 4:5",
    resolution: "1:1 = 1080 x 1080 px min  |  4:5 = 1080 x 1350 px min",
    imageMax: "30 MB",
    videoMax: "4 GB",
    videoDuration: "1 sec -- 241 min",
    videoFormats: "MP4, MOV, GIF",
    imageFormats: "JPG, PNG",
    primaryText: "50--150 chars",
    headline: "Not shown in feed",
    description: "Not shown in feed",
    notes: [
      "Caption shown below media with account name",
      "CTA appears as a bar below the image/video",
    ],
  },
  FACEBOOK_REELS: {
    label: "Facebook Reels",
    platform: "facebook",
    apiFormat: "FACEBOOK_REELS_MOBILE",
    aspectRatio: "9:16 (full-screen vertical)",
    resolution: "1080 x 1920 px recommended",
    imageMax: "30 MB",
    videoMax: "4 GB",
    videoDuration: "1 sec -- 90 sec recommended",
    videoFormats: "MP4, MOV",
    imageFormats: "JPG, PNG (auto-converted to video)",
    primaryText: "72 chars (visible without expand)",
    headline: "Not shown",
    description: "Not shown",
    notes: [
      "Keep bottom 35% free of text/logos (safe zone)",
      "Sound on recommended -- audio drives engagement",
      "Vertical 9:16 strongly preferred",
    ],
  },
  INSTAGRAM_REELS: {
    label: "Instagram Reels",
    platform: "instagram",
    apiFormat: "INSTAGRAM_REELS",
    aspectRatio: "9:16 (full-screen vertical)",
    resolution: "1080 x 1920 px recommended",
    imageMax: "30 MB",
    videoMax: "4 GB",
    videoDuration: "1 sec -- 90 sec recommended",
    videoFormats: "MP4, MOV",
    imageFormats: "JPG, PNG (auto-converted)",
    primaryText: "72 chars (visible without expand)",
    headline: "Not shown",
    description: "Not shown",
    notes: [
      "Keep bottom 35% free of text/logos (safe zone)",
      "Sound on -- music/voiceover/SFX key for engagement",
      "No copyrighted music, GIFs, interactive stickers, or camera filters",
    ],
  },
  INSTAGRAM_STORY: {
    label: "Instagram Stories",
    platform: "instagram",
    apiFormat: "INSTAGRAM_STORY",
    aspectRatio: "9:16 (full-screen vertical)",
    resolution: "1080 x 1920 px recommended (min 1080 x 1080)",
    imageMax: "30 MB",
    videoMax: "4 GB",
    videoDuration: "1 sec -- 120 sec",
    videoFormats: "MP4, MOV",
    imageFormats: "JPG, PNG",
    primaryText: "Not shown (use text overlay)",
    headline: "Not shown",
    description: "Not shown",
    notes: [
      "Auto-plays full screen between organic stories",
      "Swipe-up CTA for link destination",
      "Keep top/bottom 14% clear for UI chrome",
    ],
  },
  FACEBOOK_STORY: {
    label: "Facebook Stories",
    platform: "facebook",
    apiFormat: "FACEBOOK_STORY_MOBILE",
    aspectRatio: "9:16 (full-screen vertical)",
    resolution: "1080 x 1920 px recommended (min 1080 x 1080)",
    imageMax: "30 MB",
    videoMax: "4 GB",
    videoDuration: "1 sec -- 120 sec",
    videoFormats: "MP4, MOV",
    imageFormats: "JPG, PNG",
    primaryText: "Not shown",
    headline: "Not shown",
    description: "Not shown",
    notes: [
      "Full-screen between organic stories",
      "Keep top/bottom 14% clear for UI chrome",
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Ad format options                                                  */
/* ------------------------------------------------------------------ */

export interface AdFormatOption {
  value: MetaAdFormat;
  label: string;
  desc: string;
  recommended?: boolean;
  apiNote: string;
  supportedPlacements: PreviewPlacement[];
}

export const AD_FORMAT_OPTIONS: AdFormatOption[] = [
  {
    value: "SINGLE_IMAGE",
    label: "Single Image",
    desc: "Static image ad. 1:1 (1440x1440) or 4:5 (1440x1800) recommended.",
    recommended: true,
    apiNote: "object_story_spec.link_data with image_hash",
    supportedPlacements: [
      "FACEBOOK_FEED",
      "INSTAGRAM_FEED",
      "FACEBOOK_REELS",
      "INSTAGRAM_REELS",
      "INSTAGRAM_STORY",
      "FACEBOOK_STORY",
    ],
  },
  {
    value: "SINGLE_VIDEO",
    label: "Single Video",
    desc: "Video ad. 1:1/4:5 for Feed, 9:16 for Reels & Stories. Up to 241 min.",
    apiNote: "object_story_spec.video_data with video_id",
    supportedPlacements: [
      "FACEBOOK_FEED",
      "INSTAGRAM_FEED",
      "FACEBOOK_REELS",
      "INSTAGRAM_REELS",
      "INSTAGRAM_STORY",
      "FACEBOOK_STORY",
    ],
  },
  {
    value: "CAROUSEL",
    label: "Carousel",
    desc: "2--10 scrollable image/video cards. Each card can have its own link.",
    apiNote: "object_story_spec.link_data with child_attachments[]",
    supportedPlacements: [
      "FACEBOOK_FEED",
      "INSTAGRAM_FEED",
      "INSTAGRAM_STORY",
    ],
  },
  {
    value: "COLLECTION",
    label: "Collection",
    desc: "Cover image/video with product grid. Opens fullscreen Instant Experience.",
    apiNote: "Requires product_catalog_id + canvas (Instant Experience)",
    supportedPlacements: ["FACEBOOK_FEED", "INSTAGRAM_FEED"],
  },
  {
    value: "DYNAMIC",
    label: "Catalog Ads",
    desc: "Auto-generated from your Salla products. Meta picks Carousel or Collection per viewer.",
    apiNote:
      "asset_feed_spec.optimization_type = FORMAT_AUTOMATION, product_set_id required",
    supportedPlacements: [
      "FACEBOOK_FEED",
      "INSTAGRAM_FEED",
      "FACEBOOK_REELS",
      "INSTAGRAM_REELS",
      "INSTAGRAM_STORY",
      "FACEBOOK_STORY",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  CTA options from official Meta API call_to_action.type enum        */
/* ------------------------------------------------------------------ */

export interface CTAOption {
  value: MetaCTA;
  label: string;
  salesRelevant?: boolean;
}

export const CTA_OPTIONS: CTAOption[] = [
  { value: "SHOP_NOW", label: "Shop Now", salesRelevant: true },
  { value: "ORDER_NOW", label: "Order Now", salesRelevant: true },
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "GET_OFFER", label: "Get Offer", salesRelevant: true },
  { value: "BOOK_NOW", label: "Book Now" },
  { value: "CONTACT_US", label: "Contact Us" },
  { value: "SUBSCRIBE", label: "Subscribe" },
  { value: "SEND_MESSAGE", label: "Send Message" },
  { value: "WHATSAPP_MESSAGE", label: "WhatsApp Message" },
  { value: "CALL_NOW", label: "Call Now" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "WATCH_MORE", label: "Watch More" },
  { value: "GET_QUOTE", label: "Get Quote" },
  { value: "GET_DIRECTIONS", label: "Get Directions" },
  { value: "NO_BUTTON", label: "No Button" },
];

/* ------------------------------------------------------------------ */
/*  Per-format text char limits (from official Meta specs)             */
/* ------------------------------------------------------------------ */

export interface FormatTextLimits {
  primaryMin: number;
  primaryMax: number;
  headline: number;
  description: number;
  headlineNote: string;
}

export const FORMAT_TEXT_LIMITS: Record<MetaAdFormat, FormatTextLimits> = {
  SINGLE_IMAGE: {
    primaryMin: 50,
    primaryMax: 150,
    headline: 27,
    description: 30,
    headlineNote: "Shown below image in link preview",
  },
  SINGLE_VIDEO: {
    primaryMin: 50,
    primaryMax: 150,
    headline: 27,
    description: 30,
    headlineNote: "Shown below video in link preview",
  },
  CAROUSEL: {
    primaryMin: 50,
    primaryMax: 80,
    headline: 45,
    description: 18,
    headlineNote: "Per-card headline below card image",
  },
  COLLECTION: {
    primaryMin: 50,
    primaryMax: 125,
    headline: 40,
    description: 0,
    headlineNote: "Shown above product grid",
  },
  DYNAMIC: {
    primaryMin: 50,
    primaryMax: 125,
    headline: 40,
    description: 30,
    headlineNote: "Dynamic from catalog via template_data.name",
  },
};

/* ------------------------------------------------------------------ */
/*  Catalog template tags (from Meta Advantage+ Catalog Ads docs)      */
/* ------------------------------------------------------------------ */

export interface TemplateTag {
  tag: string;
  label: string;
  field: string;
  description: string;
}

export const CATALOG_TEMPLATE_TAGS: TemplateTag[] = [
  {
    tag: "{{product.name}}",
    label: "Product Name",
    field: "name",
    description: "The product title from your catalog",
  },
  {
    tag: "{{product.current_price}}",
    label: "Current Price",
    field: "current_price",
    description: "The current selling price (formatted with currency)",
  },
  {
    tag: "{{product.price}}",
    label: "Original Price",
    field: "price",
    description: "The original list price from your catalog",
  },
  {
    tag: "{{product.description}}",
    label: "Description",
    field: "description",
    description: "Full product description from catalog",
  },
  {
    tag: "{{product.short_description}}",
    label: "Short Description",
    field: "short_description",
    description: "Abbreviated product description",
  },
  {
    tag: "{{product.brand}}",
    label: "Brand",
    field: "brand",
    description: "Product brand name from catalog",
  },
];

/** Tags that cannot be used together (per Meta docs) */
export const CONFLICTING_TAGS: string[][] = [
  ["{{product.price}}", "{{product.current_price}}"],
  ["{{product.description}}", "{{product.short_description}}"],
];

/* ------------------------------------------------------------------ */
/*  Advantage+ Creative for Catalog features                           */
/* ------------------------------------------------------------------ */

export interface CatalogCreativeFeature {
  key: string;
  label: string;
  apiField: string;
  description: string;
  defaultEnrolled: boolean;
}

export const CATALOG_CREATIVE_FEATURES: CatalogCreativeFeature[] = [
  {
    key: "adapt_to_placement",
    label: "Adapt to Placement (9:16)",
    apiField: "creative_features_spec.adapt_to_placement",
    description:
      "Use 9:16 catalog images for Reels/Stories placements. Opt-in to show full-screen product images where supported.",
    defaultEnrolled: false,
  },
  {
    key: "media_type_automation",
    label: "Dynamic Media (Videos)",
    apiField: "creative_features_spec.media_type_automation",
    description:
      "Automatically deliver product videos from your catalog when available. Starting Sep 2025, this is opt-in by default.",
    defaultEnrolled: true,
  },
  {
    key: "add_text_overlay",
    label: "Dynamic Overlays",
    apiField: "creative_features_spec.add_text_overlay",
    description:
      "Add price, discount, or free shipping overlays on product images. Rendered dynamically from catalog data.",
    defaultEnrolled: false,
  },
  {
    key: "product_extensions",
    label: "Product Extensions",
    apiField: "creative_features_spec.product_extensions",
    description:
      "Show additional catalog products below your static single-media ads to improve performance. Requires SALES or TRAFFIC objective.",
    defaultEnrolled: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Collection cover media options (from Meta API docs)                */
/* ------------------------------------------------------------------ */

export type CollectionCoverType =
  | "ADVANTAGE_CATALOG_VIDEO"
  | "CUSTOM_IMAGE"
  | "CUSTOM_VIDEO";

export interface CollectionCoverOption {
  value: CollectionCoverType;
  label: string;
  description: string;
  isDefault?: boolean;
}

export const COLLECTION_COVER_OPTIONS: CollectionCoverOption[] = [
  {
    value: "ADVANTAGE_CATALOG_VIDEO",
    label: "Advantage Catalog Video",
    description:
      "Meta auto-generates a personalized video from your catalog products for each viewer.",
    isDefault: true,
  },
  {
    value: "CUSTOM_IMAGE",
    label: "Custom Image",
    description:
      "Upload your own hero image. Mapped via asset_feed_spec.images[].hash.",
  },
  {
    value: "CUSTOM_VIDEO",
    label: "Custom Video",
    description:
      "Upload your own hero video. Mapped via asset_feed_spec.videos[].video_id.",
  },
];
