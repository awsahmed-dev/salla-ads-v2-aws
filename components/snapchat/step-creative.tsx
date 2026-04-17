"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/lib/snapchat/campaign-context";
import { getCatalogStatus, getSnapPublicProfile, type SallaCatalogStatus, type SnapPublicProfile } from "@/lib/salla/store-api";
import { SnapchatLogo } from "@/components/shared/snapchat-logo";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  AlertCircle,
  LayoutGrid,
  ShieldCheck,
  FileText,
  Sparkles,
  ImagePlus,
  Zap,
  Check,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Globe,
} from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { LearnMoreSheet, LearnMoreTrigger, SheetSection, SheetDecisionCard, useLearnMore } from "@/components/shared/learn-more-sheet";
import {
  OBJECTIVE_CONFIGS,
  makeDefaultLeadForm,
  type PlacementConfig,
  type AdGroup,
  type AdFormat,
  type AdDestination,
  type WebViewCTA,
} from "@/lib/snapchat/campaign-types";
import {
  SnapchatAdPreview,
  AdGroupPanel,
  LeadFormBuilder,
  CharCounter,
  LEAD_FIELD_ICONS,
  AD_FORMAT_OPTIONS,
  FORMAT_OPTIONS,
  SNAP_POSITIONS,
  LEAD_FIELD_LABELS,
  type AdFormatKey,
} from "./creative";
import { makeAdGroup, getDefaultCTA, isInfluencerAd } from "./creative/helpers";

export function StepCreative() {
  const { campaign, setStep, updateNested } = useCampaign();
  const creative = campaign.creative;
  const [activeAdIdx, setActiveAdIdx] = useState(0);
  const [previewAssetIdx, setPreviewAssetIdx] = useState(0);
  const [catalogStatus, setCatalogStatus] = useState<SallaCatalogStatus | null>(null);
  const [snapProfile, setSnapProfile] = useState<SnapPublicProfile | null>(null);
  const [showNewAdPicker, setShowNewAdPicker] = useState(false);
  const [placementExpanded, setPlacementExpanded] = useState(false);
  const placementLearnMore = useLearnMore();
  const safetyLearnMore = useLearnMore();
  const formatLearnMore = useLearnMore();

  const ads = creative.ads ?? [];
  const activeAd = ads[activeAdIdx] ?? ads[0] ?? null;
  const defaultCTA = getDefaultCTA(campaign.objective.objective);
  const objectiveConfig = OBJECTIVE_CONFIGS[campaign.objective.objective];

  const sponsoredAdConfig = {
    chatMessage: "",
    autoResponseMessage: "",
    responseInteractionSetting: "NO_USER_INPUT" as "NO_USER_INPUT" | "SEND_DEFAULT_UNLIMITED",
    wallpaperUrl: "",
    ...creative.sponsoredAdConfig,
  };
  const catalogEnabled = campaign.objective.catalogEnabled === true;

  // Load catalog status when catalog is enabled
  useEffect(() => {
    if (catalogEnabled) {
      getCatalogStatus().then(setCatalogStatus);
    }
  }, [catalogEnabled]);

  // Snap API: SPONSORED_CHAT must always include CHAT_FEED in placements.
  // Safety net — ensures data is correct even if user navigates directly to this step.
  useEffect(() => {
    if (campaign.objective.objective === "SPONSORED_CHAT") {
      const positions = creative.customPositions ?? [];
      if (creative.placement !== "CUSTOM" || !positions.includes("CHAT_FEED")) {
        updateNested("creative", {
          placement: "CUSTOM" as PlacementConfig,
          customPositions: positions.includes("CHAT_FEED")
            ? positions
            : ["CHAT_FEED", ...(positions.length > 0 ? positions : ["INTERSTITIAL_CONTENT"])],
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.objective.objective]);

  // Load Snap Public Profile from Salla
  useEffect(() => {
    getSnapPublicProfile().then((profile) => {
      setSnapProfile(profile);
      if (profile && !creative.publicProfileId) {
        updateNested("creative", { publicProfileId: profile.profileId });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-create first ad for LEADS objective (single-format: only SINGLE allowed).
  // Skips the redundant format picker and drops the advertiser straight into the creative editor.
  useEffect(() => {
    if (
      campaign.objective.objective === "LEADS" &&
      ads.length === 0
    ) {
      const dest = campaign.objective.conversionLocation === "WEB" ? "WEBSITE" as AdDestination : "LEAD_FORM" as AdDestination;
      const newAd = makeAdGroup("SINGLE", 0, dest, false);
      newAd.assets = newAd.assets.map((a) => ({ ...a, cta: defaultCTA }));
      updateNested("creative", { ads: [newAd] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.objective.objective, campaign.objective.conversionLocation]);
  const allowedFormats: AdFormat[] = catalogEnabled
    ? ["DYNAMIC", "COLLECTION", "STORY"]
    : (objectiveConfig.allowedFormats ?? ["SINGLE", "COLLECTION", "STORY", "INFLUENCER"]).filter((f) => f !== "DYNAMIC");

  // For LEADS, the allowed destinations depend on the conversion location:
  // LEAD_FORM → only LEAD_FORM destination; WEB → only WEBSITE destination.
  const allowedDestinations: AdDestination[] = (() => {
    if (campaign.objective.objective === "LEADS") {
      return campaign.objective.conversionLocation === "WEB" ? ["WEBSITE"] : ["LEAD_FORM"];
    }
    return objectiveConfig.allowedDestinations ?? ["WEBSITE"];
  })();

  const FILTERED_AD_FORMATS = FORMAT_OPTIONS.filter((o) => allowedFormats.includes(o.value));

  const freqCapEnabled = campaign.budget.frequencyCapEnabled === true;
  const freqCapLockedFormat: AdFormat | null =
    freqCapEnabled && ads.length > 0 ? (ads[0].adFormat ?? "SINGLE") : null;

  /* ---- Ad CRUD ---- */
  const addAd = (format: AdFormat = "SINGLE", destination?: AdDestination) => {
    const dest = destination ?? allowedDestinations[0] ?? "WEBSITE";
    const newAd = makeAdGroup(format, ads.length, dest, catalogEnabled);
    newAd.assets = newAd.assets.map((a) => ({ ...a, cta: defaultCTA }));
    const next = [...ads, newAd];
    updateNested("creative", { ads: next });
    setActiveAdIdx(next.length - 1);
  };

  const removeAd = (id: string) => {
    const next = ads.filter((a) => a.id !== id);
    updateNested("creative", { ads: next });
    if (activeAdIdx >= next.length) setActiveAdIdx(Math.max(0, next.length - 1));
  };

  const updateAd = (id: string, updated: AdGroup) => {
    updateNested("creative", { ads: ads.map((a) => (a.id === id ? updated : a)) });
  };

  const duplicateAd = (id: string) => {
    const src = ads.find((a) => a.id === id);
    if (!src) return;
    const dup: AdGroup = {
      ...src,
      id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${src.name} (copy)`,
      assets: src.assets.map((a, ai) => ({ ...a, id: `asset_${Date.now()}_${ai}_${Math.random().toString(36).slice(2, 6)}` })),
      collectionTiles: src.collectionTiles.map((t, ti) => ({ ...t, id: `tile_${Date.now()}_${ti}_${Math.random().toString(36).slice(2, 6)}` })),
    };
    const idx = ads.findIndex((a) => a.id === id);
    const next = [...ads];
    next.splice(idx + 1, 0, dup);
    updateNested("creative", { ads: next });
    setActiveAdIdx(idx + 1);
  };

  /* Sidebar preview */
  const clampedAssetIdx = Math.min(previewAssetIdx, (activeAd?.assets?.length ?? 1) - 1);
  const previewAsset = activeAd?.assets?.[clampedAssetIdx] ?? null;
  const totalCreatives = ads.reduce((sum, a) => sum + a.assets.length, 0);
  const activeAdType = activeAd?.adType ?? "WEB_VIEW";

  /* Validation */
  const allChecks: { label: string; ok: boolean }[] = [];
  const hasValidProfile = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(creative.publicProfileId ?? "");
  allChecks.push({ label: "Public Profile set", ok: hasValidProfile });
  const hasInfluencerAd = ads.some((a) => isInfluencerAd(a));
  if (hasInfluencerAd && !hasValidProfile) {
    allChecks.push({ label: "Brand Profile required for influencer ad code claiming", ok: false });
  }
  allChecks.push({ label: "At least 1 ad created", ok: ads.length > 0 });
  if (creative.placement === "CUSTOM") {
    const currentAdTypes = new Set(ads.map((a) => a.adType));
    const validPositions = (creative.customPositions ?? []).filter((p) => {
      const pos = SNAP_POSITIONS.find((s) => s.id === p);
      if (!pos) return false;
      if (creative.brandSafety === "LIMITED_INVENTORY" && pos.fullOnly) return false;
      if (pos.formats !== "all" && !(pos.formats as string[]).some((f) => currentAdTypes.has(f))) return false;
      return true;
    });
    allChecks.push({ label: "At least 1 valid placement selected", ok: validPositions.length > 0 });
  }
  const convLoc = campaign.objective.conversionLocation;
  const urlRequired = convLoc !== "NONE" && convLoc !== "LEAD_FORM" && convLoc !== "APP";

  if (campaign.objective.objective === "LEADS" && convLoc === "LEAD_FORM") {
    const lf = creative.leadForm;
    const lfTypes = (lf?.form_fields ?? []).map((f) => f.type);
    allChecks.push({ label: "Lead form title set", ok: !!(lf?.title?.trim()) });
    allChecks.push({ label: "Lead form: First Name field", ok: lfTypes.includes("FIRST_NAME") });
    allChecks.push({ label: "Lead form: Last Name field", ok: lfTypes.includes("LAST_NAME") });
    allChecks.push({ label: "Lead form: Email or Phone", ok: lfTypes.includes("EMAIL") || lfTypes.includes("PHONE_NUMBER") });
    allChecks.push({ label: "Lead form: no Address+Postal conflict", ok: !(lfTypes.includes("ADDRESS") && lfTypes.includes("POSTAL_CODE")) });
    allChecks.push({ label: "Lead form: privacy policy URL", ok: !!(lf?.privacy_policy_url?.startsWith("https://")) });
  }

  const destNeedsUrl = (dest: AdDestination) => dest === "WEBSITE" || dest === "DEEP_LINK";
  ads.forEach((ad, i) => {
    const isCatalogNoMedia =
      (ad.adFormat === "COLLECTION" && ad.dynamicCollectionEnabled && ad.catalogRenderType === "DYNAMIC") ||
      (ad.adFormat === "STORY" && ad.catalogRenderType === "DYNAMIC");
    if (ad.adFormat === "DYNAMIC" || isCatalogNoMedia) {
      allChecks.push({ label: `Ad ${i + 1}: product set selected`, ok: !!(ad.dynamicTemplateConfig?.productSetId) });
    } else {
      allChecks.push({ label: `Ad ${i + 1}: has creative`, ok: ad.assets.length > 0 });
      ad.assets.forEach((a, j) => {
        if (a.mediaSource === "ad_code") {
          if (a.adCode && a.claimStatus !== "READY") {
            allChecks.push({ label: `Ad ${i + 1} Creative ${j + 1}: ad code not claimed — click "Claim"`, ok: false });
          } else {
            allChecks.push({ label: `Ad ${i + 1} Creative ${j + 1}: influencer content claimed`, ok: a.claimStatus === "READY" });
          }
          if (a.creatorProfileId && a.creatorProfileId !== "creator_profile_placeholder") {
            const validCreatorUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.creatorProfileId);
            allChecks.push({ label: `Ad ${i + 1} Creative ${j + 1}: creator profile ID valid`, ok: validCreatorUUID });
          } else if (a.creatorProfileId === "creator_profile_placeholder") {
            allChecks.push({ label: `Ad ${i + 1} Creative ${j + 1}: creator profile ID missing`, ok: false });
          }
        } else {
          allChecks.push({ label: `Ad ${i + 1} Creative ${j + 1}: media`, ok: !!a.url || a.claimStatus === "READY" });
        }
        allChecks.push({ label: `Ad ${i + 1} Creative ${j + 1}: brand name`, ok: !!a.brandName.trim() });
        allChecks.push({ label: `Ad ${i + 1} Creative ${j + 1}: headline`, ok: !!a.headline.trim() });
        if (ad.adFormat !== "STORY") {
          const needsUrl = destNeedsUrl(ad.adDestination) || urlRequired;
          if (needsUrl) {
            allChecks.push({
              label: `Ad ${i + 1} Creative ${j + 1}: swipe-up URL`,
              ok: (() => {
                try { const u = new URL(a.websiteUrl); return u.protocol === "https:" && u.hostname.includes("."); } catch { return false; }
              })(),
            });
          } else if (a.websiteUrl) {
            allChecks.push({
              label: `Ad ${i + 1} Creative ${j + 1}: valid URL`,
              ok: (() => {
                try { const u = new URL(a.websiteUrl); return u.protocol === "https:" && u.hostname.includes("."); } catch { return false; }
              })(),
            });
          }
        }
        if (a.mediaType === "VIDEO" && a.url) {
          const dur = a.videoDuration ?? 0;
          if (dur > 0) {
            allChecks.push({ label: `Ad ${i + 1} Creative ${j + 1}: video 3-180s`, ok: dur >= 3 && dur <= 180 });
          }
          if (ad.commercialConfig?.enabled) {
            if (ad.commercialConfig.forcedViewEligibility === "FULL_DURATION") {
              allChecks.push({ label: `Ad ${i + 1} Creative ${j + 1}: commercial video 3-6s`, ok: dur > 0 ? dur >= 3 && dur <= 6 : true });
            } else {
              allChecks.push({ label: `Ad ${i + 1} Creative ${j + 1}: commercial video 7s+`, ok: dur > 0 ? dur >= 7 : true });
            }
          }
        }
        if (ad.adDestination === "DEEP_LINK") {
          const dlp = a.deepLinkProperties;
          const pre = `Ad ${i + 1} Creative ${j + 1}`;
          allChecks.push({ label: `${pre}: deep link URI`, ok: !!(dlp?.deepLinkUri?.trim()) });
          allChecks.push({ label: `${pre}: app name`, ok: !!(dlp?.appName?.trim()) });
          allChecks.push({ label: `${pre}: app icon`, ok: !!(dlp?.iconMediaId?.trim()) });
          const plat = dlp?.appPlatform ?? "BOTH";
          if (plat === "BOTH" || plat === "IOS") {
            allChecks.push({ label: `${pre}: iOS App ID`, ok: !!(dlp?.iosAppId?.trim()) });
          }
          if (plat === "BOTH" || plat === "ANDROID") {
            allChecks.push({ label: `${pre}: Android package`, ok: !!(dlp?.androidAppUrl?.trim()) });
          }
          if (dlp?.fallbackType === "WEB_VIEW_FALLBACK") {
            allChecks.push({
              label: `${pre}: fallback URL`,
              ok: (() => { try { return new URL(dlp?.fallbackUrl ?? "").protocol === "https:"; } catch { return false; } })(),
            });
          }
        }
      });
    }
    if (ad.adFormat === "COLLECTION") {
      if (ad.dynamicCollectionEnabled) {
        allChecks.push({ label: `Ad ${i + 1}: product set for dynamic tiles`, ok: !!(ad.dynamicTemplateConfig?.productSetId) });
      } else {
        allChecks.push({ label: `Ad ${i + 1}: min 2 tiles`, ok: ad.collectionTiles.length >= 2 });
        allChecks.push({ label: `Ad ${i + 1}: max 4 tiles`, ok: ad.collectionTiles.length <= 4 });
        const tilesWithMedia = ad.collectionTiles.filter((t) => t.imageUrl);
        allChecks.push({ label: `Ad ${i + 1}: tiles have image`, ok: tilesWithMedia.length >= 2 });
        const tilesWithUrl = ad.collectionTiles.filter((t) => t.url && t.url.startsWith("https://"));
        if (ad.collectionTiles.length >= 2) {
          allChecks.push({ label: `Ad ${i + 1}: tiles have URL`, ok: tilesWithUrl.length === ad.collectionTiles.length });
        }
      }
    }
    if (ad.adFormat === "STORY") {
      const isCatStory = ad.catalogRenderType === "DYNAMIC";
      if (!isCatStory) {
        allChecks.push({ label: `Ad ${i + 1}: min 3 snaps`, ok: ad.assets.length >= 3 });
      }
      const tile = ad.discoverTile;
      allChecks.push({ label: `Ad ${i + 1}: Discover Tile enabled`, ok: !!tile?.enabled });
      if (tile?.enabled) {
        allChecks.push({ label: `Ad ${i + 1}: Discover Tile headline`, ok: (tile.headline ?? "").trim().length > 0 });
        const tileNeedsBg = tile.renderType !== "DYNAMIC";
        if (tileNeedsBg) {
          allChecks.push({ label: `Ad ${i + 1}: Discover Tile background`, ok: !!tile.backgroundImageUrl });
        }
      }
      ad.assets.forEach((a, j) => {
        const hasUrl = (() => { try { const u = new URL(a.websiteUrl); return u.protocol === "https:" && u.hostname.includes("."); } catch { return false; } })();
        allChecks.push({ label: `Ad ${i + 1} Snap ${j + 1}: swipe-up URL`, ok: hasUrl });
      });
    }
    if (ad.offerDisclaimer?.enabled) {
      allChecks.push({ label: `Ad ${i + 1}: disclaimer text`, ok: ad.offerDisclaimer.disclaimerText.length > 0 });
    }
    if (ad.commercialConfig?.enabled) {
      const hasVideoAsset = ad.assets.some((a) => a.mediaType === "VIDEO");
      allChecks.push({ label: `Ad ${i + 1}: commercial needs video`, ok: hasVideoAsset });
    }
    if (ad.trackingUrls) {
      const isValidHttps = (url: string) => { try { return new URL(url).protocol === "https:"; } catch { return false; } };
      if (ad.trackingUrls.impressionUrl) {
        allChecks.push({ label: `Ad ${i + 1}: impression URL is HTTPS`, ok: isValidHttps(ad.trackingUrls.impressionUrl) });
      }
      if (ad.trackingUrls.swipeUpUrl) {
        allChecks.push({ label: `Ad ${i + 1}: swipe-up URL is HTTPS`, ok: isValidHttps(ad.trackingUrls.swipeUpUrl) });
      }
    }
  });
  const passingChecks = allChecks.filter((c) => c.ok).length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ============ LEFT COLUMN ============ */}
        <div className="flex flex-1 flex-col gap-5">
          {/* ---- Your public Snapchat account ---- */}
          <PublicProfileSelector
            currentProfileId={creative.publicProfileId ?? ""}
            snapProfile={snapProfile}
            onSelect={(id) => updateNested("creative", { publicProfileId: id })}
            onSetup={() => setStep(0)}
            hasValidProfile={hasValidProfile}
          />

          {/* ---- Catalog Active Banner ---- */}
          {catalogEnabled && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <div className="flex flex-1 items-center gap-2">
                  <span className="text-xs font-medium text-emerald-800">Catalog connected</span>
                  <span className="text-[11px] text-emerald-600">{campaign.objective.catalogSource || "Salla Store"}{catalogStatus ? ` · ${catalogStatus.totalProducts} products` : ""}</span>
                </div>
                {catalogStatus && (
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    catalogStatus.syncHealth === "healthy" ? "bg-emerald-100 text-emerald-700" :
                    catalogStatus.syncHealth === "warning" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {catalogStatus.syncHealth}
                  </span>
                )}
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
                <Info className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
                <p className="text-xs leading-relaxed text-blue-700">
                  Catalog campaigns support <span className="font-semibold">Dynamic Product Ads</span>, <span className="font-semibold">Collection Ads</span> (hero image/video + catalog tiles), and <span className="font-semibold">Story Ads</span> (product story from catalog). Choose the format that best fits your campaign.
                </p>
              </div>
            </div>
          )}


          {/* ---- Sponsored Ads (Chat Feed) Settings ---- */}
          {campaign.objective.objective === "SPONSORED_CHAT" && (
            <SectionCard>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Sponsored Ads Settings</Label>
                <Badge variant="secondary" className="rounded-full bg-emerald-100 px-1.5 py-0 text-xs text-emerald-700">Chat Feed</Badge>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
                <Info className="size-3.5 shrink-0 text-blue-600" />
                <p className="text-xs text-blue-700">
                  Sponsored Snaps appear in the Chat Feed and open full-screen when tapped. Placement is locked to Chat Feed. A Public Profile is required.
                </p>
              </div>

              <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                <div className="text-xs text-amber-700">
                  <p className="mb-0.5 font-semibold">Restrictions</p>
                  <ul className="ml-3 list-disc space-y-0.5">
                    <li>No offer-based ads (discounts, promotions) in Chat Feed</li>
                    <li>Not available in EU regions</li>
                    <li>No Health / Employment / Credit (HEC) ads</li>
                    <li>No competitive platform ads (social/messaging apps)</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-foreground">Chat Message</Label>
                    <CharCounter current={sponsoredAdConfig.chatMessage.length} max={500} />
                  </div>
                  <Textarea
                    placeholder="e.g. Discover our new collection -- shop the latest styles now!"
                    maxLength={500}
                    rows={2}
                    value={sponsoredAdConfig.chatMessage}
                    onChange={(e) => updateNested("creative", {
                      sponsoredAdConfig: { ...sponsoredAdConfig, chatMessage: e.target.value }
                    })}
                    className="resize-none text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    This message appears in the chat pane after the user opens and views your Snap. Keep it conversational and casual.
                  </p>
                </div>

                <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-foreground">Auto-Response</Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Automatically reply when a user sends a message to your Sponsored Snap.
                      </p>
                    </div>
                    <Switch
                      checked={sponsoredAdConfig.responseInteractionSetting === "SEND_DEFAULT_UNLIMITED"}
                      onCheckedChange={(checked) => updateNested("creative", {
                        sponsoredAdConfig: {
                          ...sponsoredAdConfig,
                          responseInteractionSetting: checked ? "SEND_DEFAULT_UNLIMITED" : "NO_USER_INPUT",
                          ...(!checked && { autoResponseMessage: "" }),
                        }
                      })}
                    />
                  </div>

                  {sponsoredAdConfig.responseInteractionSetting === "SEND_DEFAULT_UNLIMITED" && (
                    <div className="flex flex-col gap-1.5 border-t border-border pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-foreground">Response Text</Label>
                        <CharCounter current={sponsoredAdConfig.autoResponseMessage.length} max={500} />
                      </div>
                      <Textarea
                        placeholder="Thanks for reaching out! Visit our store for exclusive deals and new arrivals."
                        maxLength={500}
                        rows={2}
                        value={sponsoredAdConfig.autoResponseMessage}
                        onChange={(e) => updateNested("creative", {
                          sponsoredAdConfig: { ...sponsoredAdConfig, autoResponseMessage: e.target.value }
                        })}
                        className="resize-none text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Sent each time a user messages your brand. Max 500 characters.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-foreground">
                      Chat Background
                      <Badge variant="outline" className="ml-1.5 rounded-full px-1.5 py-0 text-[11px]">Optional</Badge>
                    </Label>
                  </div>
                  <div className={cn(
                    "flex items-center gap-3 rounded-lg border border-dashed p-3 transition-colors",
                    sponsoredAdConfig.wallpaperUrl ? "border-primary/40 bg-primary/[0.02]" : "border-border"
                  )}>
                    {sponsoredAdConfig.wallpaperUrl ? (
                      <>
                        <div className="size-10 overflow-hidden rounded-md bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sponsoredAdConfig.wallpaperUrl} alt="Chat wallpaper" className="size-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">Wallpaper uploaded</p>
                          <p className="text-xs text-muted-foreground">1080 x 1920 px</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => updateNested("creative", {
                            sponsoredAdConfig: { ...sponsoredAdConfig, wallpaperUrl: "" }
                          })}
                        >
                          Remove
                        </Button>
                      </>
                    ) : (
                      <div className="flex w-full flex-col items-center py-2">
                        <LayoutGrid className="mb-1 size-5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Branded chat background (1080 x 1920 px)</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Upload your branded wallpaper image</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-semibold text-foreground">Best Practices</p>
                  <ul className="ml-3 list-disc space-y-0.5 text-xs text-muted-foreground">
                    <li>Use UGC-style video under 10 seconds for your Snap creative</li>
                    <li>Keep the headline short (24-28 chars) and spark curiosity</li>
                    <li>Use a casual, conversational tone in chat messages</li>
                    <li>Complete and verify your Public Profile for better engagement</li>
                    <li>Consider adding a branded chat background for a premium feel</li>
                  </ul>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ---- Ad Placement & Brand Safety ---- */}
          <div className={cn("rounded-2xl transition-colors", placementExpanded ? "bg-muted/50 p-2" : "")}>
            <button
              type="button"
              onClick={() => setPlacementExpanded((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between px-6 pb-3 pt-5 text-left transition-colors rounded-2xl",
                !placementExpanded && "border border-border bg-card"
              )}
            >
              <div>
                <span className="text-base font-bold text-foreground">Ad Placement & Brand Safety</span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose your ad placements and surrounding content to ensure your brand identity remains protected.
                </p>
              </div>
              <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", placementExpanded && "rotate-180")} />
            </button>

            {placementExpanded && (
            <div className="mt-2 flex flex-col gap-4">

            {/* ── Content Safety ── */}
            <div className="rounded-xl bg-card px-6 py-5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Content Safety</h3>
                <LearnMoreTrigger {...safetyLearnMore.triggerProps} />
              </div>
              <p className="mt-1 mb-4 text-xs text-muted-foreground">
                Defines the type of content your ads appear next to. This doesn&apos;t change your ad—it controls its environment.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                {([
                  {
                    val: "FULL_INVENTORY" as const,
                    label: "Full Access",
                    desc: "Ads can appear next to all Snapchat content for maximum reach.",
                    tradeoff: "Lower brand safety, larger audience",
                  },
                  {
                    val: "LIMITED_INVENTORY" as const,
                    label: "Safe Access",
                    desc: "Ads only appear next to moderate, brand-safe content.",
                    tradeoff: "Greater safety, smaller audience",
                  },
                ]).map((opt) => {
                  const selected = creative.brandSafety === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        if (opt.val === "LIMITED_INVENTORY" && creative.placement === "CUSTOM") {
                          const fullOnlyIds = SNAP_POSITIONS.filter((p) => p.fullOnly).map((p) => p.id);
                          const cleaned = (creative.customPositions ?? []).filter((p) => !fullOnlyIds.includes(p));
                          updateNested("creative", { brandSafety: opt.val, customPositions: cleaned });
                        } else {
                          updateNested("creative", { brandSafety: opt.val });
                        }
                      }}
                      className={cn(
                        "flex flex-1 flex-col gap-2 rounded-xl border px-5 py-4 text-left transition-all",
                        selected
                          ? "border-[#a4ffe5] bg-[#e6fff9]"
                          : "border-border bg-card hover:border-[#a4ffe5]"
                      )}
                    >
                      <span className={cn("text-sm font-bold", selected ? "text-[#004956]" : "text-foreground")}>{opt.label}</span>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      <span className="text-xs text-muted-foreground">{opt.tradeoff}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Ad Placement ── */}

            <div className="rounded-xl bg-card px-6 py-5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Ad Placement</h3>
                <LearnMoreTrigger {...placementLearnMore.triggerProps} />
              </div>
              <p className="mt-1 mb-4 text-xs text-muted-foreground">
                Where your ads appear on Snapchat. Auto-placement finds the best locations for performance, while manual lets you choose.
              </p>

            {campaign.objective.objective === "SPONSORED_CHAT" ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100">
                  <Check className="size-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Chat Feed</p>
                  <p className="text-[11px] text-muted-foreground">Sponsored Ads are exclusively delivered in the Chat Feed</p>
                </div>
              </div>
            ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                {([
                  {
                    val: "AUTOMATIC" as PlacementConfig,
                    label: "Automatic",
                    desc: "Snapchat optimizes placements for top results across Stories, Spotlight, Discover, and more.",
                    recommended: true,
                  },
                  {
                    val: "CUSTOM" as PlacementConfig,
                    label: "Manual",
                    desc: "Select exactly where your ads appear. Useful if you know your audience is in a specific spot.",
                    recommended: false,
                  },
                ]).map((opt) => {
                  const selected = creative.placement === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => updateNested("creative", { placement: opt.val })}
                      className={cn(
                        "flex flex-1 flex-col gap-2 rounded-xl border px-5 py-4 text-left transition-all",
                        selected
                          ? "border-[#a4ffe5] bg-[#e6fff9]"
                          : "border-border bg-card hover:border-[#a4ffe5]"
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className={cn("text-sm font-bold", selected ? "text-[#004956]" : "text-foreground")}>{opt.label}</span>
                        {opt.recommended && (
                          <span className="rounded-full bg-[#a4ffe5] px-2 py-0.5 text-xs font-medium text-[#004956]">Recommended</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              {creative.placement === "AUTOMATIC" && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#e6fff9] px-4 py-3">
                  <Sparkles className="size-4 shrink-0 text-[#004956]" />
                  <p className="text-xs font-medium text-[#004956]">
                    Automatic placement typically delivers 20-40% more impressions than manual placement.
                  </p>
                </div>
              )}

              {/* Manual placements list */}
              {creative.placement === "CUSTOM" && (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="rounded-lg bg-blue-50 px-4 py-3">
                    <p className="text-xs text-blue-700">
                      Select your placements. Some are restricted based on safety or format settings. Grayed-out options are incompatible with your current configuration.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border">
                    {SNAP_POSITIONS.map((pos, posIdx) => {
                      const positions = creative.customPositions ?? [];
                      const checked = positions.includes(pos.id);
                      const disabledByBrandSafety = creative.brandSafety === "LIMITED_INVENTORY" && pos.fullOnly;
                      const hasFormatRestriction = pos.formats !== "all";
                      const requiredFormats = hasFormatRestriction ? (pos.formats as string[]) : [];
                      const currentAdTypes = new Set(ads.map((a) => a.adType));
                      const noMatchingAds = hasFormatRestriction && !requiredFormats.some((f) => currentAdTypes.has(f as string));
                      const isDisabled = disabledByBrandSafety || noMatchingAds;
                      const formatNote = hasFormatRestriction
                        ? requiredFormats.map((f) => {
                            const match = AD_FORMAT_OPTIONS.find((o) => String(o.value) === f);
                            return match?.label ?? f;
                          }).join(", ")
                        : undefined;
                      return (
                        <label
                          key={pos.id}
                          className={cn(
                            "flex items-center gap-3 px-3.5 py-2.5 transition-colors",
                            posIdx !== 0 && "border-t border-border",
                            isDisabled
                              ? "cursor-not-allowed opacity-40"
                              : checked
                                ? "cursor-pointer bg-primary/[0.03]"
                                : "cursor-pointer hover:bg-muted/30"
                          )}
                        >
                          <div className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                            isDisabled
                              ? "border-muted bg-muted/30"
                              : checked
                                ? "border-primary bg-primary"
                                : "border-border bg-background"
                          )}>
                            {checked && !isDisabled && <Check className="size-3 text-primary-foreground" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={isDisabled ? false : checked}
                            disabled={isDisabled}
                            onChange={(e) => {
                              if (isDisabled) return;
                              const next = e.target.checked
                                ? [...positions, pos.id]
                                : positions.filter((p) => p !== pos.id);
                              updateNested("creative", { customPositions: next });
                            }}
                            className="sr-only"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn("text-xs font-medium", checked && !isDisabled ? "text-foreground" : "text-foreground")}>{pos.label}</span>
                              {disabledByBrandSafety && (
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">Full Inventory only</span>
                              )}
                              {noMatchingAds && !disabledByBrandSafety && (
                                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-500">No {formatNote} ads</span>
                              )}
                              {hasFormatRestriction && !noMatchingAds && !isDisabled && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600">{formatNote} only</span>
                              )}
                            </div>
                            <p className="text-[11px] leading-snug text-muted-foreground">{pos.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {(creative.customPositions ?? []).length === 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/20">
                      <AlertCircle className="size-3 shrink-0 text-amber-500" />
                      <span className="text-xs text-amber-700 dark:text-amber-400">Select at least one placement to continue</span>
                    </div>
                  )}
                  {(creative.customPositions ?? []).length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        {(creative.customPositions ?? []).length} of {SNAP_POSITIONS.filter((p) => !(creative.brandSafety === "LIMITED_INVENTORY" && p.fullOnly)).length} placements selected
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const available = SNAP_POSITIONS.filter((p) => !(creative.brandSafety === "LIMITED_INVENTORY" && p.fullOnly));
                          const hasFormat = available.filter((p) => {
                            if (p.formats === "all") return true;
                            const requiredFormats = p.formats as string[];
                            const currentAdTypes = new Set(ads.map((a) => a.adType));
                            return requiredFormats.some((f) => currentAdTypes.has(f as string));
                          });
                          updateNested("creative", { customPositions: hasFormat.map((p) => p.id) });
                        }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Select all available
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
            )}
            </div>

            </div>
            )}
          </div>

          {/* ---- Ads List ---- */}
          <SectionCard>
            <div className="mb-1">
              <Label className="text-base font-bold text-foreground">Campaign Content</Label>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Create multiple ads with different video and image options. The system will automatically shift budget toward your top-performing ads.
            </p>

            {ads.length === 0 && !catalogEnabled && (
              <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
                <Zap className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Recommended Format</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {campaign.objective.objective === "SALES"
                      ? "For Sales campaigns, Collection Ads with your store products perform 2.3x better."
                      : campaign.objective.objective === "WEBSITE_VISITS"
                        ? "Single Image/Video ads drive the most website traffic. Use eye-catching visuals with a clear CTA."
                        : campaign.objective.objective === "ENGAGEMENT"
                          ? "Story Ads generate 3x more engagement. Use 3-5 snaps to tell your brand story."
                          : campaign.objective.objective === "LEADS"
                            ? "Lead Generation ads with short video (under 10s) have 40% higher form completion rates."
                            : campaign.objective.objective === "APP_PROMOTION"
                              ? "App Install ads with demo videos of your app have 25% higher install rates."
                              : "Start with a Single Image/Video ad for best results across all objectives."}
                  </p>
                </div>
              </div>
            )}

            {ads.length === 0 && catalogEnabled ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.02] py-10">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Zap className="size-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Dynamic Product Ad</p>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    Your catalog is connected. Snapchat will auto-generate ads from your products, targeting users based on their behavior.
                  </p>
                </div>
                <Button
                  onClick={() => addAd("DYNAMIC")}
                  className="gap-2"
                >
                  <Plus className="size-4" />
                  Create Dynamic Ad
                </Button>
              </div>
            ) : ads.length === 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {/* Header */}
                <div className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-foreground">Ad Type</h3>
                    <LearnMoreTrigger {...formatLearnMore.triggerProps} label="Compare formats" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose a format for this ad. You can add more ads in different formats.
                  </p>
                </div>
                {/* Format cards */}
                <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:flex sm:gap-6 sm:px-6 sm:pb-6">
                  {FILTERED_AD_FORMATS.map((opt, i) => {
                    const isFirst = i === 0;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => addAd(opt.value)}
                        className={cn(
                          "flex flex-1 flex-col items-center gap-2 rounded-xl border px-5 py-4 text-center transition-all",
                          isFirst
                            ? "border-[#a4ffe5] bg-[#e6fff9]"
                            : "border-border bg-card hover:border-[#a4ffe5] hover:bg-[#e6fff9]"
                        )}
                      >
                        <div className={cn(
                          "flex size-10 items-center justify-center rounded-full",
                          isFirst ? "bg-[#a4ffe5]" : "bg-muted/60"
                        )}>
                          <span className={cn("[&>svg]:size-5", isFirst ? "text-[#004956]" : "text-muted-foreground")}>{opt.icon}</span>
                        </div>
                        <p className={cn("text-xs font-bold", isFirst ? "text-[#004956]" : "text-foreground")}>{opt.label}</p>
                        <p className="text-xs leading-snug text-muted-foreground">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {ads.map((ad, i) => (
                  <AdGroupPanel
                    key={ad.id}
                    ad={ad}
                    adIndex={i}
                    totalAds={ads.length}
                    isActive={i === activeAdIdx}
                    allowedFormats={allowedFormats}
                    allowedDestinations={allowedDestinations}
                    freqCapLockedFormat={freqCapLockedFormat}
                    onSelect={() => { setActiveAdIdx(i); setPreviewAssetIdx(0); }}
                    onUpdate={(next) => updateAd(ad.id, next)}
                    onRemove={() => removeAd(ad.id)}
                    onDuplicate={() => duplicateAd(ad.id)}
                    catalogEnabled={catalogEnabled}
                    onCreativeFocus={(assetIdx) => setPreviewAssetIdx(assetIdx)}
                    objective={campaign.objective.objective}
                  />
                ))}

                {/* ── Ad count guidance ── */}
                {ads.length >= 5 && ads.length < 10 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#a4ffe5]/50 bg-[#e6fff9]/60 px-4 py-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#004956]/10 mt-0.5">
                      <Sparkles className="size-3.5 text-[#004956]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#004956]">
                        {ads.length} ads created — that&apos;s a solid set
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#004956]/70">
                        Snapchat recommends 3–5 ads per campaign for optimal budget distribution and faster optimization. You can still add more if needed.
                      </p>
                    </div>
                  </div>
                )}
                {ads.length >= 10 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 mt-0.5">
                      <AlertCircle className="size-3.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-800">
                        {ads.length} ads — budget will be spread thin
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                        With {ads.length} ads, each creative gets less budget for Snapchat to optimize. Consider removing underperformers or consolidating similar ads for better results.
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border-2 border-dashed border-border transition-all hover:border-primary/30">
                  {catalogEnabled ? (
                    <button
                      type="button"
                      onClick={() => addAd("DYNAMIC")}
                      className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/[0.03]"
                    >
                      <Plus className="size-4" />
                      Add Dynamic Ad
                    </button>
                  ) : (
                  <div className="px-4 py-6">
                    <div className="rounded-xl border-2 border-dashed border-border py-6">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex size-10 items-center justify-center rounded-full bg-[#e6fff9]">
                          <Plus className="size-5 text-[#004956]" />
                        </div>
                        <p className="text-sm font-bold text-[#004956]">Add Another Ad</p>
                        <p className="text-xs text-muted-foreground">A/B test different creatives or formats to find what works best</p>
                      </div>
                      {freqCapLockedFormat && (
                        <div className="mx-6 mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                          <Info className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                          <p className="text-[11px] leading-relaxed text-amber-700">
                            Frequency cap requires all ads to use the same format (<span className="font-semibold">{FILTERED_AD_FORMATS.find((f) => f.value === freqCapLockedFormat)?.label ?? freqCapLockedFormat}</span>). Disable frequency cap to use multiple formats.
                          </p>
                        </div>
                      )}
                      <div className="mt-4 grid grid-cols-2 gap-2 px-6 sm:grid-cols-3 lg:grid-cols-5">
                        {FILTERED_AD_FORMATS.map((opt) => {
                          const lockedOut = freqCapLockedFormat !== null && opt.value !== freqCapLockedFormat;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={lockedOut}
                              onClick={() => addAd(opt.value)}
                              className={cn(
                                "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all",
                                lockedOut
                                  ? "cursor-not-allowed border-border/50 opacity-40"
                                  : "border-border bg-card hover:border-[#a4ffe5] hover:bg-[#e6fff9]"
                              )}
                            >
                              <div className={cn("flex size-8 items-center justify-center rounded-full", "bg-muted/60")}>
                                <span className="text-muted-foreground [&>svg]:size-4">{opt.icon}</span>
                              </div>
                              <span className="text-[11px] font-bold text-foreground">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ---- Lead Generation Form (LEADS + LEAD_FORM) ---- */}
          {/* Placed AFTER the ad creative so the flow is: create ad → configure form */}
          {campaign.objective.objective === "LEADS" && campaign.objective.conversionLocation === "LEAD_FORM" && (
            <>
              {/* Connecting explainer between ad creative and lead form */}
              <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <ChevronDown className="size-4 text-blue-600" />
                </div>
                <p className="text-xs leading-relaxed text-blue-700">
                  <span className="font-semibold">Your ad above is what users see.</span> When they swipe up, the form below opens. Keep the form short for higher completion rates.
                </p>
              </div>
              <LeadFormBuilder
                form={creative.leadForm ?? makeDefaultLeadForm()}
                onChange={(updated) => updateNested("creative", { leadForm: updated })}
              />
            </>
          )}

        </div>

        {/* ============ RIGHT COLUMN ============ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-20 flex flex-col gap-4">

            <SnapchatAdPreview
              ads={ads}
              activeAdIdx={activeAdIdx}
              setActiveAdIdx={(i) => { setActiveAdIdx(i); setPreviewAssetIdx(0); }}
              activeAd={activeAd}
              activeAdType={activeAdType}
              previewAsset={previewAsset}
              defaultCTA={defaultCTA}
              creative={creative}
              objectiveName={campaign.objective.objective}
              previewAssetIdx={clampedAssetIdx}
              setPreviewAssetIdx={setPreviewAssetIdx}
            />

            {/* ---- LEAD FORM SUMMARY (only for LEADS + LEAD_FORM) ---- */}
            {campaign.objective.objective === "LEADS" && campaign.objective.conversionLocation === "LEAD_FORM" && creative.leadForm && (
              <SectionCard className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Form Summary</Label>
                </div>
                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    {creative.leadForm.bannerPreviewUrl && (
                      <div className="mb-2 overflow-hidden rounded-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={creative.leadForm.bannerPreviewUrl} alt="Banner" className="h-12 w-full object-cover" crossOrigin="anonymous" />
                      </div>
                    )}
                    <p className="text-sm font-semibold text-foreground">
                      {creative.leadForm.title || "Untitled Form"}
                    </p>
                    {creative.leadForm.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{creative.leadForm.description}</p>
                    )}
                    <div className="mt-2 flex flex-col gap-1">
                      {creative.leadForm.form_fields.map((f) => (
                        <div key={f.id} className="flex items-center gap-1.5 rounded border border-border/50 bg-background px-2 py-1">
                          {LEAD_FIELD_ICONS[f.type]}
                          <span className="text-xs text-foreground">
                            {f.type === "CUSTOM" ? (f.custom_form_field_properties?.description || "Custom") : LEAD_FIELD_LABELS[f.type]}
                          </span>
                        </div>
                      ))}
                    </div>
                    {creative.leadForm.privacy_policy_url && (
                      <div className="mt-2 flex items-center gap-1 border-t border-border pt-2">
                        <ShieldCheck className="size-2.5 text-emerald-500" />
                        <span className="truncate text-[11px] text-muted-foreground">Privacy Policy linked</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center rounded-lg border border-border bg-muted/20 px-2 py-2">
                      <span className="text-lg font-bold text-foreground">{creative.leadForm.form_fields.length}</span>
                      <span className="text-[11px] text-muted-foreground">Fields</span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-border bg-muted/20 px-2 py-2">
                      <span className="text-lg font-bold text-foreground">{creative.leadForm.form_fields.filter((f) => f.type === "CUSTOM").length}</span>
                      <span className="text-[11px] text-muted-foreground">Custom</span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-border bg-muted/20 px-2 py-2">
                      {creative.leadForm.end_page_properties ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <div className="size-4 rounded-full border border-muted-foreground/30" />
                      )}
                      <span className="mt-0.5 text-[11px] text-muted-foreground">End Page</span>
                    </div>
                  </div>

                  {/* Form length indicator */}
                  {(() => {
                    const fc = creative.leadForm.form_fields.length;
                    const lengthLabel = fc <= 3 ? "Short form" : fc <= 5 ? "Moderate form" : "Long form";
                    const lengthHint = fc <= 3 ? "High completion rate expected" : fc <= 5 ? "Good balance of data and completion" : "May reduce completion rate";
                    const lengthColor = fc <= 3
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : fc <= 5
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-red-200 bg-red-50 text-red-700";
                    return (
                      <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2", lengthColor)}>
                        <span className="text-xs font-semibold">{lengthLabel}</span>
                        <span className="text-[11px]">{lengthHint}</span>
                      </div>
                    );
                  })()}
                </div>
              </SectionCard>
            )}

            {/* ---- CAMPAIGN READINESS ---- */}
            <CampaignReadinessCard
              ads={ads}
              totalCreatives={totalCreatives}
              creative={creative}
              allChecks={allChecks}
              passingChecks={passingChecks}
              frequencyCapEnabled={campaign.budget.frequencyCapEnabled}
              objective={campaign.objective.objective}
              catalogEnabled={catalogEnabled}
              leadForm={campaign.objective.objective === "LEADS" && campaign.objective.conversionLocation === "LEAD_FORM" ? creative.leadForm : undefined}
            />

          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Next"
        nextDisabled={passingChecks < allChecks.length}
        accent="primary"
        message={passingChecks < allChecks.length ? {
          type: "error" as const,
          text: allChecks.find((c) => !c.ok)?.label ? `Missing: ${allChecks.find((c) => !c.ok)!.label}` : "Complete all required fields",
        } : undefined}
      />

      {/* ---- Learn More: Ad Placement ---- */}
      <LearnMoreSheet
        open={placementLearnMore.open}
        onOpenChange={placementLearnMore.setOpen}
        title="Ad Placement"
        description="Where your ads show up on Snapchat. Each placement is a different spot in the app where users can see your ad."
        icon={<Globe className="size-4" />}
        proTip="Use Automatic for your first campaign — Snapchat will test all placements and focus your budget on the ones that perform best. Automatic typically delivers 20-40% more results than Manual."
      >
        <SheetSection icon={<Sparkles className="size-4" />} title="Which option should I choose?">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Automatic"
              description="Snapchat distributes your ads across all placements and optimizes toward the ones that perform best. Less work, better results for most advertisers."
              highlighted
            />
            <SheetDecisionCard
              title="Manual"
              description="You pick exactly which placements to use. Best for experienced advertisers who know where their audience engages most."
            />
          </div>
        </SheetSection>
        <SheetSection icon={<LayoutGrid className="size-4" />} title="Snapchat placements explained">
          <div className="flex flex-col gap-1.5 text-xs">
            {[
              { name: "Between User Stories", desc: "Full-screen ads between your friends' stories. Highest reach — this is where most users spend their time." },
              { name: "Spotlight", desc: "Short-form video feed, similar to TikTok. Great for reaching users who are discovering new content." },
              { name: "Discover Feed", desc: "Your ad appears as a tile in the Discover tab. Users tap to view your full Story Ad." },
              { name: "Chat Feed", desc: "Full-screen ads in the messaging tab, between conversations. High visibility." },
              { name: "Within Publisher Stories", desc: "Your ad plays inside premium publisher content (news, entertainment). Brand-safe environment." },
              { name: "Within Creator Stories", desc: "Your ad plays inside content from popular Snapchat creators." },
              { name: "Camera", desc: "AR Lens ads shown when users open the camera. Highly interactive and engaging." },
              { name: "Post-Capture Carousel", desc: "Tile ads shown right after a user takes a Snap. Catches them in a creative moment." },
            ].map((p) => (
              <div key={p.name} className="rounded-lg border border-border px-3 py-2">
                <p className="font-semibold text-foreground">{p.name}</p>
                <p className="text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </SheetSection>
      </LearnMoreSheet>

      {/* ---- Learn More: Content Safety ---- */}
      <LearnMoreSheet
        open={safetyLearnMore.open}
        onOpenChange={safetyLearnMore.setOpen}
        title="Content Safety"
        description="This controls what kind of Snapchat content your ads appear next to. It does NOT change your ad — it only affects its surroundings."
        icon={<ShieldCheck className="size-4" />}
        proTip="Most Salla stores can use Full Access safely. Only switch to Safe Access if you sell regulated products (healthcare, supplements, finance) or if your brand has strict safety guidelines."
      >
        <SheetSection icon={<ShieldCheck className="size-4" />} title="Which should I pick?">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Full Access"
              description="Your ads can appear next to all Snapchat content — user stories, Spotlight, publishers, and creators. You get the maximum audience and lowest cost per result."
              highlighted
            />
            <SheetDecisionCard
              title="Safe Access"
              description="Your ads only run next to moderated, brand-safe content. Some placements won't be available. You get a smaller audience but more control over what surrounds your brand."
            />
          </div>
        </SheetSection>
        <SheetSection icon={<Info className="size-4" />} title="What changes with Safe Access?">
          <div className="text-xs leading-relaxed text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">Safe Access removes your ads from appearing near:</p>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <p>News, political, and sensitive current events content</p>
              <p>User-generated stories with mature or edgy themes</p>
              <p>Controversial or provocative creator content</p>
            </div>
            <p className="mt-3 font-medium text-foreground">Your ads will still appear in:</p>
            <div className="rounded-lg border border-[#a4ffe5] bg-[#e6fff9] p-3 mt-1 space-y-1">
              <p>Spotlight, Discover, and curated publisher channels</p>
              <p>Premium shows and entertainment content</p>
              <p>Moderated creator content that passes safety filters</p>
            </div>
          </div>
        </SheetSection>
      </LearnMoreSheet>

      {/* ---- Learn More: Ad Format ---- */}
      <LearnMoreSheet
        open={formatLearnMore.open}
        onOpenChange={formatLearnMore.setOpen}
        title="Ad Formats"
        description="Your ad format determines what users see and how they interact with your ad. Each format works differently."
        icon={<LayoutGrid className="size-4" />}
        proTip={
          campaign.objective.objective === "SALES"
            ? "Collection Ads showcase multiple products and perform 2x better for sales. Start with Collection if you have 4+ products, or Single Image/Video for quick testing."
            : campaign.objective.objective === "ENGAGEMENT"
              ? "Story Ads generate 3x more engagement than single ads. Create 3-5 snaps that tell a story about your brand."
              : campaign.objective.objective === "APP_PROMOTION"
                ? "Single Video showing your app in action drives the highest install rates. Keep it under 15 seconds and show the core feature immediately."
                : campaign.objective.objective === "LEADS"
                  ? "Short video (under 10 seconds) leads to 40% more form completions. Show the benefit of filling out your form."
                  : campaign.objective.objective === "SPONSORED_CHAT"
                    ? "Use video that feels native to Snapchat — UGC-style content under 10 seconds performs best in the Chat Feed."
                    : "Start with Single Image/Video — it works in all placements and is the fastest to set up."
        }
      >
        <SheetSection icon={<LayoutGrid className="size-4" />} title="Available formats">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Single Image / Video"
              description="One full-screen creative (image or video) with a swipe-up button. Works everywhere on Snapchat. You can upload up to 8 variations — Snap will rotate and test them automatically."
              highlighted={campaign.objective.objective === "LEADS" || campaign.objective.objective === "SPONSORED_CHAT"}
            />
            {objectiveConfig.allowedFormats.includes("COLLECTION") && (
              <SheetDecisionCard
                title="Collection Ad"
                description="A large image or video on top, with 2-4 product tiles below. Users can browse and tap individual products without leaving Snapchat. Best when you want to showcase your catalog."
                highlighted={campaign.objective.objective === "SALES"}
              />
            )}
            {objectiveConfig.allowedFormats.includes("STORY") && (
              <SheetDecisionCard
                title="Story Ad"
                description="A sequence of 3-20 snaps, each with its own message and swipe-up link. Appears as a branded tile in Discover. Best for telling a story or showcasing a collection."
                highlighted={campaign.objective.objective === "ENGAGEMENT"}
              />
            )}
            {objectiveConfig.allowedFormats.includes("DYNAMIC") && (
              <SheetDecisionCard
                title="Dynamic Product Ad"
                description="Snapchat automatically creates ads from your product catalog. Each user sees different products based on what they've browsed on your store. Requires a connected catalog."
              />
            )}
            {objectiveConfig.allowedFormats.includes("INFLUENCER") && (
              <SheetDecisionCard
                title="Influencer Content"
                description="Use a creator's video as your ad by entering their Ad Code. It looks like organic creator content with a 'Paid Partnership' label. Great for authentic, high-performing creatives."
              />
            )}
          </div>
        </SheetSection>
        {campaign.objective.objective === "LEADS" && (
          <SheetSection icon={<Info className="size-4" />} title="Why only Single format for Leads?">
            <p className="text-xs leading-relaxed text-muted-foreground">
              When users swipe up on your ad, Snapchat opens a native lead form. This swipe-up flow only works with a single full-screen creative — it&apos;s not compatible with multi-tile Collection Ads or multi-snap Story Ads.
            </p>
          </SheetSection>
        )}
      </LearnMoreSheet>
    </TooltipProvider>
  );
}

/* ================================================================== */
/*  Public Profile Selector                                            */
/* ================================================================== */

const MOCK_PROFILES = [
  { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Mahally", nameAr: "محلي" },
  { id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "Salla Store", nameAr: "متجر سلة" },
  { id: "c3d4e5f6-a7b8-9012-cdef-123456789012", name: "Fashion Hub", nameAr: "مركز الأزياء" },
];

function PublicProfileSelector({
  currentProfileId,
  snapProfile,
  onSelect,
  onSetup,
  hasValidProfile,
}: {
  currentProfileId: string;
  snapProfile: SnapPublicProfile | null;
  onSelect: (id: string) => void;
  onSetup: () => void;
  hasValidProfile: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Build the list: real profile + mock ones
  const profiles = [
    ...(snapProfile ? [{ id: snapProfile.profileId, name: snapProfile.displayName, nameAr: snapProfile.displayNameAr ?? "" }] : []),
    ...MOCK_PROFILES.filter((m) => m.id !== snapProfile?.profileId),
  ];

  const selected = profiles.find((p) => p.id === currentProfileId) ?? profiles[0];

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm font-bold text-foreground">Your public Snapchat account</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your public profile will appear in the advertisement, and it is advisable to match it with your store name.
          </p>
        </div>
        <Switch checked={hasValidProfile || profiles.length > 0} disabled />
      </div>

      {(hasValidProfile || profiles.length > 0) && (
        <div className="border-t border-border px-6 py-4">
          <div className="relative">
            {/* Selected profile trigger */}
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors",
                open && "ring-2 ring-[#a4ffe5]"
              )}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                <SnapchatLogo className="size-5 text-orange-500" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground">
                {selected ? `${selected.name}${selected.nameAr ? ` - ${selected.nameAr}` : ""}` : "Select a profile"}
              </span>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
                {profiles.map((p) => {
                  const isSelected = p.id === currentProfileId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelect(p.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30",
                        isSelected && "bg-[#e6fff9]"
                      )}
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                        <SnapchatLogo className="size-5 text-orange-500" />
                      </div>
                      <span className={cn("flex-1 text-sm font-medium", isSelected ? "text-[#004956]" : "text-foreground")}>
                        {p.name}{p.nameAr ? ` - ${p.nameAr}` : ""}
                      </span>
                      {isSelected && <Check className="size-4 text-[#004956]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {!hasValidProfile && profiles.length === 0 && (
        <div className="border-t border-border px-6 py-4">
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3">
            <AlertCircle className="size-4 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700">
              No Public Profile configured.{" "}
              <button type="button" onClick={onSetup} className="font-medium underline">Set it up in Campaign Settings</button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Campaign Readiness Card                                           */
/* ================================================================== */

/* Circular progress ring for readiness score */
function ReadinessRing({ percent, size = 44, stroke = 3.5 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 100 ? "#10b981" : percent >= 60 ? "#3b82f6" : percent >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-500" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center fill-foreground text-[11px] font-bold tabular-nums">{percent}%</text>
    </svg>
  );
}

/* Group checks by ad for organized display */
function groupChecksByAd(checks: { label: string; ok: boolean }[]): { group: string; items: { label: string; ok: boolean }[] }[] {
  const groups: { group: string; items: { label: string; ok: boolean }[] }[] = [];
  const general: { label: string; ok: boolean }[] = [];

  for (const c of checks) {
    const adMatch = c.label.match(/^Ad (\d+)/);
    if (adMatch) {
      const groupName = `Ad ${adMatch[1]}`;
      let existing = groups.find((g) => g.group === groupName);
      if (!existing) {
        existing = { group: groupName, items: [] };
        groups.push(existing);
      }
      existing.items.push({ ...c, label: c.label.replace(/^Ad \d+ /, "").replace(/^Creative \d+: /, "").replace(/^Snap \d+: /, "") });
    } else {
      general.push(c);
    }
  }

  const result: { group: string; items: { label: string; ok: boolean }[] }[] = [];
  if (general.length > 0) result.push({ group: "General", items: general });
  result.push(...groups);
  return result;
}

function CampaignReadinessCard({
  ads,
  totalCreatives,
  creative,
  allChecks,
  passingChecks,
  frequencyCapEnabled = false,
  objective,
  catalogEnabled = false,
  leadForm,
}: {
  ads: AdGroup[];
  totalCreatives: number;
  creative: { publicProfileId?: string; placement?: string; brandSafety?: string; customPositions?: string[] };
  allChecks: { label: string; ok: boolean }[];
  passingChecks: number;
  frequencyCapEnabled?: boolean;
  objective?: string;
  catalogEnabled?: boolean;
  leadForm?: import("@/lib/snapchat/campaign-types").LeadGenerationForm;
}) {
  const [showAllChecks, setShowAllChecks] = useState(false);
  const failingChecks = allChecks.filter((c) => !c.ok);
  const allPassed = passingChecks === allChecks.length && allChecks.length > 0;

  /* ── Best-practice signals ── */
  const hasMultipleAds = ads.length >= 2;
  const nonDynamicAds = ads.filter((a) => a.adFormat !== "DYNAMIC");
  const hasVideoAd = catalogEnabled || ads.some((a) => a.assets.some((asset) => asset.mediaType === "VIDEO"));
  const hasImageAd = catalogEnabled || ads.some((a) => a.assets.some((asset) => asset.mediaType === "IMAGE"));
  const hasBothMediaTypes = hasVideoAd && hasImageAd;
  const hasMultipleFormats = new Set(ads.map((a) => a.adFormat)).size >= 2;

  const bestPractices: { label: string; met: boolean; tip: string; metTip: string }[] = [];

  if (!catalogEnabled) {
    bestPractices.push({
      label: "Multiple ads",
      met: hasMultipleAds,
      tip: objective === "SALES"
        ? "Each ad supports one creative — add 2+ ads with different visuals or formats to find the best-performing sales driver"
        : objective === "LEADS"
          ? "Add 2+ ads with different images, videos, or headlines to find what drives the most form submissions"
          : "Each ad supports one creative — add 2+ ads to test different formats and creatives",
      metTip: `${ads.length} ads — great for A/B testing`,
    });
  }

  if (!catalogEnabled) {
    bestPractices.push({
      label: "Video + Image ads",
      met: hasBothMediaTypes,
      tip: objective === "ENGAGEMENT"
        ? "Create one video ad and one image ad — video gets 3x more engagement, images provide broader reach"
        : objective === "LEADS"
          ? "Create one video ad (under 10s) and one image ad — video drives 40% higher form completion"
          : "Create both a video ad and an image ad — video drives engagement while images extend your reach",
      metTip: "Both video and image ads included",
    });
  }

  // "Multiple formats" only applies when the objective supports more than SINGLE format.
  // LEADS only supports SINGLE, so this best practice is hidden.
  if (ads.length >= 2 && !frequencyCapEnabled && !catalogEnabled && objective !== "LEADS") {
    bestPractices.push({
      label: "Multiple formats",
      met: hasMultipleFormats,
      tip: "Mix formats (Single, Story, Collection) to reach users in different placements",
      metTip: `${new Set(ads.map((a) => a.adFormat)).size} formats in use`,
    });
  }

  if (ads.length >= 2 && !catalogEnabled) {
    const hasDifferentCreatives = ads.some((a, i) =>
      i > 0 && a.assets.length > 0 && ads[0].assets.length > 0 &&
      (a.assets[0].headline !== ads[0].assets[0].headline || a.assets[0].cta !== ads[0].assets[0].cta)
    );
    bestPractices.push({
      label: "A/B testing",
      met: hasDifferentCreatives,
      tip: objective === "LEADS"
        ? "Test different headlines, CTAs, or visuals — small changes can significantly impact form completion rates"
        : "Vary headlines, CTAs, or visuals across ads to find what resonates best with your audience",
      metTip: "Different creatives across ads",
    });
  }

  /* ── LEADS-specific best practices ── */
  if (objective === "LEADS" && leadForm) {
    bestPractices.push({
      label: "Short form (3-5 fields)",
      met: leadForm.form_fields.length >= 1 && leadForm.form_fields.length <= 5,
      tip: "Forms with 3-5 fields have 60% higher completion rates than longer forms",
      metTip: `${leadForm.form_fields.length} fields — optimal length`,
    });
    bestPractices.push({
      label: "Thank You page",
      met: !!leadForm.end_page_properties,
      tip: "Add a Thank You page with a CTA to continue engagement after form submission",
      metTip: "End page configured with redirect",
    });
    bestPractices.push({
      label: "Banner image",
      met: !!leadForm.bannerPreviewUrl,
      tip: "Forms with a banner image are more visually appealing and build trust",
      metTip: "Banner image uploaded",
    });
    const hasVideo = ads.some((a) => a.assets.some((asset) => asset.mediaType === "VIDEO"));
    bestPractices.push({
      label: "Video creative",
      met: hasVideo,
      tip: "Lead ads with short video (under 10s) have 40% higher form completion rates",
      metTip: "Video creative included",
    });
  }

  const bpMet = bestPractices.filter((bp) => bp.met).length;
  const bpTotal = bestPractices.length;

  const totalWeight = allChecks.length + bpTotal;
  const totalScore = passingChecks + bpMet;
  const overallPercent = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  const readinessLabel = allPassed
    ? overallPercent >= 90 ? "Excellent" : overallPercent >= 70 ? "Good" : "Ready"
    : "Incomplete";

  const readinessColor = allPassed
    ? overallPercent >= 90 ? "text-emerald-600" : overallPercent >= 70 ? "text-primary" : "text-amber-600"
    : "text-red-500";

  const groupedFailing = groupChecksByAd(failingChecks);
  const visibleFailCount = showAllChecks ? failingChecks.length : Math.min(failingChecks.length, 6);

  return (
    <div className="rounded-xl bg-card p-6">
      {/* ── Header with progress ring ── */}
      <div className="mb-6 flex items-center gap-4">
        <ReadinessRing percent={overallPercent} />
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Campaign Readiness</p>
          <p className="text-xs text-muted-foreground">
            {allPassed
              ? "All requirements met"
              : `${failingChecks.length} required items need attention before launch`
            }
          </p>
        </div>
      </div>

      {/* ── Required Steps ── */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Required Steps</p>
          <span className="text-xs font-bold text-[#004956]">{passingChecks}/{allChecks.length}</span>
        </div>
        <div className="flex flex-col gap-3">
          {allChecks.slice(0, showAllChecks ? allChecks.length : 6).map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-3">
              <div className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                c.ok ? "border-[#004956] bg-[#004956]" : "border-muted-foreground/30"
              )}>
                {c.ok && <Check className="size-3 text-white" strokeWidth={3} />}
              </div>
              <p className={cn("text-xs font-medium", c.ok ? "text-muted-foreground line-through" : "text-foreground")}>
                {c.label.replace(/^Ad \d+ /, "").replace(/^Creative \d+: /, "").replace(/^Snap \d+: /, "")}
              </p>
            </div>
          ))}
          {!showAllChecks && allChecks.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllChecks(true)}
              className="text-xs text-[#004956] underline px-3"
            >
              Show all {allChecks.length} items
            </button>
          )}
        </div>
      </div>

      {/* ── Best Practices ── */}
      {bpTotal > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Best Practices</p>
            <span className="text-xs font-bold text-[#004956]">{bpMet}/{bpTotal}</span>
          </div>
          <div className="flex flex-col gap-3">
            {bestPractices.map((bp, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-3",
                  bp.met && "bg-[#e6fff9]"
                )}
              >
                <div className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5",
                  bp.met ? "border-[#004956] bg-[#004956]" : "border-muted-foreground/30"
                )}>
                  {bp.met && <Check className="size-3 text-white" strokeWidth={3} />}
                </div>
                <div>
                  <p className={cn("text-xs font-bold", bp.met ? "text-[#004956]" : "text-foreground")}>{bp.label}</p>
                  <p className="text-xs text-muted-foreground">{bp.met ? bp.metTip : bp.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
