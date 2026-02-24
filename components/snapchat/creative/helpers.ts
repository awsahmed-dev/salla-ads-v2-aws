import { cn } from "@/lib/utils";
import type {
  SnapCreativeType,
  WebViewCTA,
  CreativeAsset,
  CollectionTile,
  AdGroup,
} from "@/lib/snapchat/campaign-types";
import { OBJECTIVE_CONFIGS, makeDefaultDynamicTemplate } from "@/lib/snapchat/campaign-types";
import type { CampaignObjective } from "@/lib/snapchat/campaign-types";
import { AD_FORMAT_OPTIONS, type AdFormatKey } from "./constants";

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
  return {
    id,
    name: `Creative_${id}`,
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

export function makeAdGroup(format: AdFormatKey, index: number): AdGroup {
  const isInfluencer = format === "INFLUENCER";
  const isLeadGen = format === "LEAD_GENERATION";
  const isDynamic = format === "DYNAMIC";
  const isAppInstall = format === "APP_INSTALL";
  const isSnapAd = format === "SNAP_AD";
  const isDeepLink = format === "DEEP_LINK";
  const adType: SnapCreativeType = isInfluencer ? "WEB_VIEW" : format;
  const namePrefix = isInfluencer
    ? "Influencer Ad"
    : isLeadGen
      ? "Lead Gen Ad"
      : isDynamic
        ? "Dynamic Ad"
        : isAppInstall
          ? "App Install Ad"
          : isSnapAd
            ? "Snap Ad"
            : isDeepLink
              ? "Deep Link Ad"
              : "Ad";
  const adName = `${namePrefix} ${index + 1}`;
  return {
    id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: adName,
    adType,
    isInfluencer,
    assets: isDynamic
      ? []
      : isInfluencer
        ? [makeAsset({ mediaSource: "ad_code", name: `${adName} - Creative 1` })]
        : isLeadGen
          ? [makeAsset({ cta: "SIGN_UP" as WebViewCTA, name: `${adName} - Creative 1` })]
          : isAppInstall
            ? [makeAsset({ cta: "INSTALL_NOW" as WebViewCTA, name: `${adName} - Creative 1` })]
            : isSnapAd
              ? [makeAsset({ shareable: false, name: `${adName} - Creative 1` })]
              : isDeepLink
                ? [makeAsset({
                    deepLinkProperties: {
                      deepLinkUri: "",
                      fallbackUrl: "",
                      fallbackType: "WEB_VIEW_FALLBACK",
                    },
                    name: `${adName} - Creative 1`,
                  })]
                : [makeAsset({ name: `${adName} - Creative 1` })],
    collectionTiles: adType === "COLLECTION" ? [makeTile(), makeTile(), makeTile(), makeTile()] : [],
    offerDisclaimer: { enabled: false, name: "", disclaimerText: "" },
    dynamicTemplateConfig: isDynamic ? makeDefaultDynamicTemplate() : undefined,
    dynamicCollectionEnabled: false,
    discoverTile: format === "COMPOSITE" ? { enabled: false, headline: "", backgroundImageUrl: "", logoImageUrl: "" } : undefined,
  };
}

export function getMaxAssets(adType: SnapCreativeType | AdFormatKey): number {
  return AD_FORMAT_OPTIONS.find((o) => o.value === adType)?.maxAssets ?? 8;
}

export function getFormatLabel(adType: SnapCreativeType | AdFormatKey): string {
  return AD_FORMAT_OPTIONS.find((o) => o.value === adType)?.label ?? adType;
}

export function isInfluencerAd(ad: AdGroup): boolean {
  if (ad.isInfluencer) return true;
  return ad.adType === "WEB_VIEW" && ad.assets.length > 0 && ad.assets[0].mediaSource === "ad_code";
}

export function getDefaultCTA(objective: CampaignObjective): WebViewCTA {
  return OBJECTIVE_CONFIGS[objective]?.defaultCTA as WebViewCTA ?? "SHOP_NOW";
}
