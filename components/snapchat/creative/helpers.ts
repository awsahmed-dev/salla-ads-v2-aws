import { cn } from "@/lib/utils";
import type {
  SnapCreativeType,
  AdFormat,
  AdDestination,
  WebViewCTA,
  CreativeAsset,
  CollectionTile,
  AdGroup,
} from "@/lib/snapchat/campaign-types";
import { OBJECTIVE_CONFIGS, makeDefaultDynamicTemplate, deriveCreativeType } from "@/lib/snapchat/campaign-types";
import type { CampaignObjective } from "@/lib/snapchat/campaign-types";
import { FORMAT_OPTIONS, DESTINATION_OPTIONS, type AdFormatKey } from "./constants";

export function CharCounter({ current, max }: { current: number; max: number }) {
  const over = current > max;
  return `${current}/${max}`;
}

export function CharCounterSpan({ current, max }: { current: number; max: number }) {
  const over = current > max;
  const className = cn("text-xs tabular-nums", over ? "font-medium text-destructive" : "text-muted-foreground");
  return { className, text: `${current}/${max}`, over };
}

let _assetSeq = 0;

export function makeAsset(partial?: Partial<CreativeAsset>): CreativeAsset {
  const id = `asset_${Date.now()}_${++_assetSeq}_${Math.random().toString(36).slice(2, 6)}`;
  const { id: _ignoreId, ...rest } = partial ?? {};
  const seq = _assetSeq;
  return {
    id,
    name: partial?.name ?? `Creative ${seq}`,
    mediaSource: "upload",
    mediaType: "IMAGE",
    url: "",
    brandName: "",
    headline: "",
    cta: "SHOP_NOW",
    cropPosition: "OPTIMIZED",
    websiteUrl: "",
    shareable: true,
    ...rest,
  };
}

export function autoCreativeName(campaignName: string, formatLabel: string, adIndex: number, assetIndex: number): string {
  const name = campaignName || "Campaign";
  const fmt = formatLabel || "Ad";
  return `${name} - ${fmt} ${adIndex + 1} - Creative ${assetIndex + 1}`.slice(0, 375);
}

export function makeTile(): CollectionTile {
  return {
    id: `tile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    imageUrl: "",
    title: "",
  };
}

/** Create a new ad from format + destination */
export function makeAdGroup(format: AdFormat, index: number, destination?: AdDestination, catalogEnabled?: boolean): AdGroup {
  const dest = destination ?? "WEBSITE";
  const adType = deriveCreativeType(format, dest);

  const formatLabel = FORMAT_OPTIONS.find((f) => f.value === format)?.label ?? format;
  const adName = `Ad ${index + 1} — ${formatLabel}`;

  const defaultAssetForDestination = (): Partial<CreativeAsset> => {
    switch (dest) {
      case "DEEP_LINK":
        return {
          cta: "OPEN_APP" as WebViewCTA,
          deepLinkProperties: { deepLinkUri: "", appName: "", iconMediaId: "", appPlatform: "BOTH", fallbackUrl: "", fallbackType: "WEB_VIEW_FALLBACK" },
        };
      case "APP_INSTALL":
        return { cta: "INSTALL_NOW" as WebViewCTA };
      case "LEAD_FORM":
        return { cta: "SIGN_UP" as WebViewCTA };
      case "NO_CTA":
        return { shareable: false };
      default:
        return {};
    }
  };

  const isInfluencer = format === "INFLUENCER";
  /** Catalog COLLECTION/STORY: default to STATIC (merchant uploads hero) for COLLECTION, DYNAMIC for STORY */
  const isCatalogCollection = catalogEnabled && format === "COLLECTION";
  const isCatalogStory = catalogEnabled && format === "STORY";

  const assets: CreativeAsset[] =
    format === "DYNAMIC" || isCatalogStory
      ? []
      : [makeAsset({
          ...(isInfluencer ? { mediaSource: "ad_code" as const } : defaultAssetForDestination()),
          name: `${adName} - Creative 1`,
        })];

  return {
    id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: adName,
    adType,
    adFormat: format,
    adDestination: dest,
    isInfluencer,
    assets,
    collectionTiles: [],
    offerDisclaimer: { enabled: false, name: "", disclaimerText: "" },
    dynamicTemplateConfig: (format === "DYNAMIC" || isCatalogCollection || isCatalogStory) ? makeDefaultDynamicTemplate() : undefined,
    dynamicCollectionEnabled: isCatalogCollection ? true : false,
    catalogRenderType: isCatalogCollection ? "STATIC" : isCatalogStory ? "DYNAMIC" : undefined,
    discoverTile: format === "STORY" ? { enabled: true, headline: "", backgroundImageUrl: "", logoImageUrl: "", ...(isCatalogStory ? { renderType: "DYNAMIC" as const } : {}) } : undefined,
  };
}

/** Legacy overload: create ad from old format key */
export function makeAdGroupLegacy(format: AdFormatKey, index: number): AdGroup {
  switch (format) {
    case "WEB_VIEW":      return makeAdGroup("SINGLE", index, "WEBSITE");
    case "DEEP_LINK":     return makeAdGroup("SINGLE", index, "DEEP_LINK");
    case "APP_INSTALL":   return makeAdGroup("SINGLE", index, "APP_INSTALL");
    case "SNAP_AD":       return makeAdGroup("SINGLE", index, "NO_CTA");
    case "LEAD_GENERATION": return makeAdGroup("SINGLE", index, "LEAD_FORM");
    case "COLLECTION":    return makeAdGroup("COLLECTION", index, "WEBSITE");
    case "COMPOSITE":     return makeAdGroup("STORY", index, "WEBSITE");
    case "DYNAMIC":       return makeAdGroup("DYNAMIC", index, "WEBSITE");
    case "INFLUENCER":
      return makeAdGroup("INFLUENCER", index, "WEBSITE");
    default: return makeAdGroup("SINGLE", index, "WEBSITE");
  }
}

export function getMaxAssets(format: AdFormat): number {
  return FORMAT_OPTIONS.find((o) => o.value === format)?.maxAssets ?? 8;
}

export function getFormatLabel(format: AdFormat): string {
  return FORMAT_OPTIONS.find((o) => o.value === format)?.label ?? format;
}

export function getDestinationLabel(dest: AdDestination): string {
  return DESTINATION_OPTIONS.find((o) => o.value === dest)?.label ?? dest;
}

export function isInfluencerAd(ad: AdGroup): boolean {
  if (ad.adFormat === "INFLUENCER") return true;
  if (ad.isInfluencer) return true;
  return ad.assets.length > 0 && ad.assets[0].mediaSource === "ad_code";
}

export function getDefaultCTA(objective: CampaignObjective): WebViewCTA {
  return OBJECTIVE_CONFIGS[objective]?.defaultCTA as WebViewCTA ?? "SHOP_NOW";
}
