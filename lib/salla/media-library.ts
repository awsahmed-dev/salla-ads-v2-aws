export type MediaUsage = "IMAGE" | "LOGO" | "VIDEO";
export type MediaAspect = "LANDSCAPE" | "SQUARE" | "PORTRAIT";

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  /** Optional usage hint for filtering (e.g., LOGO vs IMAGE). */
  usage?: MediaUsage;
  /** Optional aspect hint for filtering. */
  aspect?: MediaAspect;
  width: number;
  height: number;
  fileSize: number;
  duration?: number;
  uploadedAt: string;
  usedInCampaigns: number;
  tags: string[];
}

const MOCK_MEDIA: MediaItem[] = [
  {
    id: "m1",
    name: "Ramadan Sale Banner",
    url: "https://placehold.co/1080x1350/6C3FC5/FFFFFF?text=Ramadan+Sale",
    thumbnailUrl: "https://placehold.co/300x375/6C3FC5/FFFFFF?text=Ramadan+Sale",
    mediaType: "IMAGE",
    usage: "IMAGE",
    aspect: "PORTRAIT",
    width: 1080,
    height: 1350,
    fileSize: 245_000,
    uploadedAt: "2026-02-18T10:30:00Z",
    usedInCampaigns: 3,
    tags: ["ramadan", "sale", "banner"],
  },
  {
    id: "m2",
    name: "Product Showcase - Perfume",
    url: "https://placehold.co/1200x628/1A1A2E/FFFFFF?text=Perfume+Ad",
    thumbnailUrl: "https://placehold.co/300x157/1A1A2E/FFFFFF?text=Perfume+Ad",
    mediaType: "IMAGE",
    usage: "IMAGE",
    aspect: "LANDSCAPE",
    width: 1200,
    height: 628,
    fileSize: 312_000,
    uploadedAt: "2026-02-15T14:20:00Z",
    usedInCampaigns: 5,
    tags: ["product", "perfume", "luxury"],
  },
  {
    id: "m3",
    name: "Eid Collection Promo",
    url: "https://placehold.co/1080x1920/D4A574/1A1A2E?text=Eid+Collection",
    thumbnailUrl: "https://placehold.co/300x534/D4A574/1A1A2E?text=Eid+Collection",
    mediaType: "VIDEO",
    usage: "VIDEO",
    aspect: "PORTRAIT",
    width: 1080,
    height: 1920,
    fileSize: 8_500_000,
    duration: 15,
    uploadedAt: "2026-02-12T09:00:00Z",
    usedInCampaigns: 2,
    tags: ["eid", "collection", "seasonal"],
  },
  {
    id: "m4",
    name: "Flash Sale Countdown",
    url: "https://placehold.co/1920x1080/E74C3C/FFFFFF?text=Flash+Sale",
    thumbnailUrl: "https://placehold.co/300x169/E74C3C/FFFFFF?text=Flash+Sale",
    mediaType: "VIDEO",
    usage: "VIDEO",
    aspect: "LANDSCAPE",
    width: 1920,
    height: 1080,
    fileSize: 12_400_000,
    duration: 10,
    uploadedAt: "2026-02-10T16:45:00Z",
    usedInCampaigns: 7,
    tags: ["flash-sale", "countdown", "urgency"],
  },
  {
    id: "m5",
    name: "New Arrivals - Fashion",
    url: "https://placehold.co/1080x1080/2ECC71/FFFFFF?text=New+Arrivals",
    thumbnailUrl: "https://placehold.co/300x300/2ECC71/FFFFFF?text=New+Arrivals",
    mediaType: "IMAGE",
    usage: "IMAGE",
    aspect: "SQUARE",
    width: 1080,
    height: 1080,
    fileSize: 198_000,
    uploadedAt: "2026-02-08T11:15:00Z",
    usedInCampaigns: 1,
    tags: ["fashion", "new-arrivals", "product"],
  },
  {
    id: "m6",
    name: "Store Unboxing Video",
    url: "https://placehold.co/1080x1080/3498DB/FFFFFF?text=Unboxing",
    thumbnailUrl: "https://placehold.co/300x300/3498DB/FFFFFF?text=Unboxing",
    mediaType: "VIDEO",
    usage: "VIDEO",
    aspect: "SQUARE",
    width: 1080,
    height: 1080,
    fileSize: 18_200_000,
    duration: 25,
    uploadedAt: "2026-02-05T08:00:00Z",
    usedInCampaigns: 4,
    tags: ["unboxing", "lifestyle", "story"],
  },
  {
    id: "m7",
    name: "Free Shipping Offer",
    url: "https://placehold.co/1200x628/F39C12/1A1A2E?text=Free+Shipping",
    thumbnailUrl: "https://placehold.co/300x157/F39C12/1A1A2E?text=Free+Shipping",
    mediaType: "IMAGE",
    usage: "IMAGE",
    aspect: "LANDSCAPE",
    width: 1200,
    height: 628,
    fileSize: 175_000,
    uploadedAt: "2026-02-03T13:30:00Z",
    usedInCampaigns: 6,
    tags: ["shipping", "offer", "promotion"],
  },
  {
    id: "m8",
    name: "Customer Testimonial",
    url: "https://placehold.co/1080x1920/9B59B6/FFFFFF?text=Testimonial",
    thumbnailUrl: "https://placehold.co/300x534/9B59B6/FFFFFF?text=Testimonial",
    mediaType: "VIDEO",
    usage: "VIDEO",
    aspect: "PORTRAIT",
    width: 1080,
    height: 1920,
    fileSize: 14_000_000,
    duration: 20,
    uploadedAt: "2026-01-28T10:00:00Z",
    usedInCampaigns: 2,
    tags: ["testimonial", "social-proof", "story"],
  },
  {
    id: "m9",
    name: "Abaya Collection",
    url: "https://placehold.co/1080x1350/1A1A2E/D4A574?text=Abaya+Collection",
    thumbnailUrl: "https://placehold.co/300x375/1A1A2E/D4A574?text=Abaya+Collection",
    mediaType: "IMAGE",
    usage: "IMAGE",
    aspect: "PORTRAIT",
    width: 1080,
    height: 1350,
    fileSize: 280_000,
    uploadedAt: "2026-01-25T15:00:00Z",
    usedInCampaigns: 3,
    tags: ["abaya", "fashion", "product"],
  },
  {
    id: "m10",
    name: "National Day Special",
    url: "https://placehold.co/1080x1080/006C35/FFFFFF?text=National+Day",
    thumbnailUrl: "https://placehold.co/300x300/006C35/FFFFFF?text=National+Day",
    mediaType: "IMAGE",
    usage: "IMAGE",
    aspect: "SQUARE",
    width: 1080,
    height: 1080,
    fileSize: 220_000,
    uploadedAt: "2026-01-20T09:30:00Z",
    usedInCampaigns: 4,
    tags: ["national-day", "seasonal", "saudi"],
  },
  {
    id: "m11",
    name: "Product Demo - Skincare",
    url: "https://placehold.co/1920x1080/E91E63/FFFFFF?text=Skincare+Demo",
    thumbnailUrl: "https://placehold.co/300x169/E91E63/FFFFFF?text=Skincare+Demo",
    mediaType: "VIDEO",
    usage: "VIDEO",
    aspect: "LANDSCAPE",
    width: 1920,
    height: 1080,
    fileSize: 22_000_000,
    duration: 30,
    uploadedAt: "2026-01-18T12:00:00Z",
    usedInCampaigns: 1,
    tags: ["skincare", "demo", "product"],
  },
  {
    id: "m12",
    name: "Founder Story",
    url: "https://placehold.co/1080x1920/34495E/FFFFFF?text=Founder+Story",
    thumbnailUrl: "https://placehold.co/300x534/34495E/FFFFFF?text=Founder+Story",
    mediaType: "VIDEO",
    usage: "VIDEO",
    aspect: "PORTRAIT",
    width: 1080,
    height: 1920,
    fileSize: 28_000_000,
    duration: 45,
    uploadedAt: "2026-01-15T08:00:00Z",
    usedInCampaigns: 2,
    tags: ["brand", "story", "founder"],
  },
  {
    id: "m13",
    name: "Summer Sale 2026",
    url: "https://placehold.co/1080x1080/FF6B35/FFFFFF?text=Summer+Sale",
    thumbnailUrl: "https://placehold.co/300x300/FF6B35/FFFFFF?text=Summer+Sale",
    mediaType: "IMAGE",
    usage: "IMAGE",
    aspect: "SQUARE",
    width: 1080,
    height: 1080,
    fileSize: 195_000,
    uploadedAt: "2026-01-10T14:00:00Z",
    usedInCampaigns: 0,
    tags: ["summer", "sale", "seasonal"],
  },
  {
    id: "m14",
    name: "Behind the Scenes",
    url: "https://placehold.co/1080x1920/607D8B/FFFFFF?text=Behind+Scenes",
    thumbnailUrl: "https://placehold.co/300x534/607D8B/FFFFFF?text=Behind+Scenes",
    mediaType: "VIDEO",
    usage: "VIDEO",
    aspect: "PORTRAIT",
    width: 1080,
    height: 1920,
    fileSize: 16_500_000,
    duration: 22,
    uploadedAt: "2026-01-05T11:30:00Z",
    usedInCampaigns: 1,
    tags: ["bts", "brand", "lifestyle"],
  },
  {
    id: "m15",
    name: "Brand Logo - Square",
    url: "https://placehold.co/1200x1200/111827/FFFFFF?text=LOGO",
    thumbnailUrl: "https://placehold.co/300x300/111827/FFFFFF?text=LOGO",
    mediaType: "IMAGE",
    usage: "LOGO",
    aspect: "SQUARE",
    width: 1200,
    height: 1200,
    fileSize: 95_000,
    uploadedAt: "2026-01-03T10:00:00Z",
    usedInCampaigns: 8,
    tags: ["logo", "brand", "square"],
  },
  {
    id: "m16",
    name: "Brand Logo - Wide",
    url: "https://placehold.co/1200x300/111827/FFFFFF?text=LOGO",
    thumbnailUrl: "https://placehold.co/300x75/111827/FFFFFF?text=LOGO",
    mediaType: "IMAGE",
    usage: "LOGO",
    aspect: "LANDSCAPE",
    width: 1200,
    height: 300,
    fileSize: 88_000,
    uploadedAt: "2026-01-02T10:00:00Z",
    usedInCampaigns: 6,
    tags: ["logo", "brand", "wide"],
  },
  {
    id: "m17",
    name: "Studio Flatlay - Square",
    url: "https://placehold.co/1080x1080/0EA5E9/FFFFFF?text=Flatlay",
    thumbnailUrl: "https://placehold.co/300x300/0EA5E9/FFFFFF?text=Flatlay",
    mediaType: "IMAGE",
    usage: "IMAGE",
    aspect: "SQUARE",
    width: 1080,
    height: 1080,
    fileSize: 205_000,
    uploadedAt: "2025-12-28T11:00:00Z",
    usedInCampaigns: 2,
    tags: ["product", "flatlay", "square"],
  },
  {
    id: "m18",
    name: "Homepage Hero - Landscape",
    url: "https://placehold.co/1200x628/111827/FFFFFF?text=Hero+Banner",
    thumbnailUrl: "https://placehold.co/300x157/111827/FFFFFF?text=Hero+Banner",
    mediaType: "IMAGE",
    usage: "IMAGE",
    aspect: "LANDSCAPE",
    width: 1200,
    height: 628,
    fileSize: 260_000,
    uploadedAt: "2025-12-25T09:00:00Z",
    usedInCampaigns: 3,
    tags: ["hero", "banner", "landscape"],
  },
  {
    id: "m19",
    name: "Collection Poster - Portrait",
    url: "https://placehold.co/1080x1350/22C55E/FFFFFF?text=Collection",
    thumbnailUrl: "https://placehold.co/300x375/22C55E/FFFFFF?text=Collection",
    mediaType: "IMAGE",
    usage: "IMAGE",
    aspect: "PORTRAIT",
    width: 1080,
    height: 1350,
    fileSize: 230_000,
    uploadedAt: "2025-12-20T12:00:00Z",
    usedInCampaigns: 1,
    tags: ["collection", "portrait", "poster"],
  },
  {
    id: "m20",
    name: "Brand Mark - Square Light",
    url: "https://placehold.co/512x512/F8FAFC/0F172A?text=LOGO",
    thumbnailUrl: "https://placehold.co/256x256/F8FAFC/0F172A?text=LOGO",
    mediaType: "IMAGE",
    usage: "LOGO",
    aspect: "SQUARE",
    width: 512,
    height: 512,
    fileSize: 62_000,
    uploadedAt: "2025-12-18T08:00:00Z",
    usedInCampaigns: 5,
    tags: ["logo", "brand", "square", "light"],
  },
  {
    id: "m21",
    name: "Brand Mark - Wide Light",
    url: "https://placehold.co/512x128/F8FAFC/0F172A?text=LOGO",
    thumbnailUrl: "https://placehold.co/256x64/F8FAFC/0F172A?text=LOGO",
    mediaType: "IMAGE",
    usage: "LOGO",
    aspect: "LANDSCAPE",
    width: 512,
    height: 128,
    fileSize: 58_000,
    uploadedAt: "2025-12-16T08:00:00Z",
    usedInCampaigns: 4,
    tags: ["logo", "brand", "wide", "light"],
  },
  {
    id: "m22",
    name: "Promo Video - Square",
    url: "https://placehold.co/1080x1080/8B5CF6/FFFFFF?text=Promo+Video",
    thumbnailUrl: "https://placehold.co/300x300/8B5CF6/FFFFFF?text=Promo+Video",
    mediaType: "VIDEO",
    usage: "VIDEO",
    aspect: "SQUARE",
    width: 1080,
    height: 1080,
    fileSize: 10_500_000,
    duration: 12,
    uploadedAt: "2025-12-12T09:30:00Z",
    usedInCampaigns: 2,
    tags: ["promo", "video", "square"],
  },
];

let libraryItems = [...MOCK_MEDIA];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

export function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export type MediaFilter = "ALL" | "IMAGE" | "VIDEO";

export async function fetchMediaLibrary(filter: MediaFilter = "ALL"): Promise<MediaItem[]> {
  await new Promise((r) => setTimeout(r, 200));
  if (filter === "ALL") return [...libraryItems];
  return libraryItems.filter((m) => m.mediaType === filter);
}

export async function searchMedia(query: string, filter: MediaFilter = "ALL"): Promise<MediaItem[]> {
  const q = query.toLowerCase().trim();
  const items = filter === "ALL" ? libraryItems : libraryItems.filter((m) => m.mediaType === filter);
  if (!q) return [...items];
  return items.filter(
    (m) => m.name.toLowerCase().includes(q) || m.tags.some((t) => t.includes(q))
  );
}

export async function addMediaToLibrary(
  file: File,
  meta?: { usage?: MediaUsage; aspect?: MediaAspect }
): Promise<MediaItem> {
  await new Promise((r) => setTimeout(r, 300));
  const isVideo = file.type.startsWith("video/");
  const item: MediaItem = {
    id: `m_${Date.now()}`,
    name: file.name.replace(/\.[^.]+$/, ""),
    url: URL.createObjectURL(file),
    thumbnailUrl: URL.createObjectURL(file),
    mediaType: isVideo ? "VIDEO" : "IMAGE",
    usage: meta?.usage ?? (isVideo ? "VIDEO" : "IMAGE"),
    aspect: meta?.aspect,
    width: 1080,
    height: 1920,
    fileSize: file.size,
    duration: isVideo ? 15 : undefined,
    uploadedAt: new Date().toISOString(),
    usedInCampaigns: 0,
    tags: ["new-upload"],
  };
  libraryItems = [item, ...libraryItems];
  return item;
}
