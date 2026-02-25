"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/lib/snapchat/campaign-context";
import { getCatalogStatus, type SallaCatalogStatus } from "@/lib/salla/store-api";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  User,
  LayoutGrid,
  ShieldCheck,
  Layers,
  FileText,
  Sparkles,
  ImagePlus,
  Zap,
  Check,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
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
  const [showNewAdGroupPicker, setShowNewAdGroupPicker] = useState(false);
  const [placementExpanded, setPlacementExpanded] = useState(true);

  const ads = creative.ads ?? [];
  const activeAd = ads[activeAdIdx] ?? ads[0] ?? null;
  const defaultCTA = getDefaultCTA(campaign.objective.objective);
  const objectiveConfig = OBJECTIVE_CONFIGS[campaign.objective.objective];

  const sponsoredAdConfig = { chatMessage: "", autoResponseMessage: "", autoResponseEnabled: false, wallpaperUrl: "", ...(creative.sponsoredAdConfig ?? {}) };
  const catalogEnabled = campaign.objective.catalogEnabled === true;

  // Load catalog status when catalog is enabled
  useEffect(() => {
    if (catalogEnabled) {
      getCatalogStatus().then(setCatalogStatus);
    }
  }, [catalogEnabled]);
  const allowedFormats: AdFormat[] = catalogEnabled
    ? ["DYNAMIC"]
    : (objectiveConfig.allowedFormats ?? ["SINGLE", "COLLECTION", "STORY"]);

  const allowedDestinations: AdDestination[] = objectiveConfig.allowedDestinations ?? ["WEBSITE"];

  const FILTERED_AD_FORMATS = FORMAT_OPTIONS.filter((o) => allowedFormats.includes(o.value));

  const freqCapEnabled = campaign.budget.frequencyCapEnabled === true;
  const freqCapLockedFormat: AdFormat | null =
    freqCapEnabled && ads.length > 0 ? (ads[0].adFormat ?? "SINGLE") : null;

  /* ---- Ad CRUD ---- */
  const addAd = (format: AdFormat = "SINGLE", destination?: AdDestination) => {
    const dest = destination ?? allowedDestinations[0] ?? "WEBSITE";
    const newAd = makeAdGroup(format, ads.length, dest);
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
  const urlRequired = objectiveConfig.conversionLocation !== "NONE" && objectiveConfig.conversionLocation !== "LEAD_FORM" && objectiveConfig.conversionLocation !== "APP";

  if (campaign.objective.objective === "LEADS") {
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
    if (ad.adFormat === "DYNAMIC") {
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
      });
    }
    if (ad.adFormat === "COLLECTION") {
      if (ad.dynamicCollectionEnabled) {
        allChecks.push({ label: `Ad ${i + 1}: product set for dynamic tiles`, ok: !!(ad.dynamicTemplateConfig?.productSetId) });
      } else {
        allChecks.push({ label: `Ad ${i + 1}: min 2 tiles`, ok: ad.collectionTiles.length >= 2 });
        const tilesWithMedia = ad.collectionTiles.filter((t) => t.imageUrl);
        allChecks.push({ label: `Ad ${i + 1}: tiles have image`, ok: tilesWithMedia.length >= 2 });
        const tilesWithUrl = ad.collectionTiles.filter((t) => t.url && t.url.startsWith("https://"));
        if (ad.collectionTiles.length >= 2) {
          allChecks.push({ label: `Ad ${i + 1}: tiles have URL`, ok: tilesWithUrl.length === ad.collectionTiles.length });
        }
      }
    }
    if (ad.adFormat === "STORY") {
      allChecks.push({ label: `Ad ${i + 1}: min 3 snaps`, ok: ad.assets.length >= 3 });
      const tile = ad.discoverTile;
      allChecks.push({ label: `Ad ${i + 1}: Discover Tile enabled`, ok: !!tile?.enabled });
      if (tile?.enabled) {
        allChecks.push({ label: `Ad ${i + 1}: Discover Tile headline`, ok: (tile.headline ?? "").trim().length > 0 });
        allChecks.push({ label: `Ad ${i + 1}: Discover Tile background`, ok: !!tile.backgroundImageUrl });
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
          {/* ---- Brand Profile ---- */}
          <SectionCard>
            {(() => {
              const profileId = creative.publicProfileId ?? "";
              const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId);
              const hasValue = profileId.length > 0;
              return (
                <div className="flex items-start gap-3.5">
                  <div className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
                    hasValue && isValidUUID ? "bg-emerald-100" : hasValue ? "bg-red-100" : "bg-primary/10"
                  )}>
                    {hasValue && isValidUUID
                      ? <CheckCircle2 className="size-5 text-emerald-600" />
                      : hasValue
                        ? <AlertCircle className="size-5 text-red-500" />
                        : <User className="size-5 text-primary" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold text-foreground">Public Profile</Label>
                      {!hasValue && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Required</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Your brand name and profile picture shown on every ad.
                    </p>

                    <div className="mt-3 flex flex-col gap-1">
                      <div className="relative">
                        <Input
                          placeholder="e.g. 72cf5c50-8343-48d3-a0a7-3ed45b75faaa"
                          value={profileId}
                          onChange={(e) => updateNested("creative", { publicProfileId: e.target.value.trim() })}
                          className={cn(
                            "h-9 pr-8 font-mono text-xs transition-colors",
                            hasValue && isValidUUID ? "border-emerald-300 focus-visible:ring-emerald-200" :
                            hasValue ? "border-red-300 focus-visible:ring-red-200" : ""
                          )}
                        />
                        {hasValue && isValidUUID && (
                          <CheckCircle2 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-emerald-500" />
                        )}
                        {hasValue && !isValidUUID && (
                          <AlertCircle className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-red-400" />
                        )}
                      </div>
                      {hasValue && !isValidUUID ? (
                        <p className="text-[11px] text-red-600">
                          This doesn't look like a valid Profile ID. It should be a UUID (e.g. 72cf5c50-8343-48d3-a0a7-3ed45b75faaa).
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          Find it in <span className="font-medium text-foreground">Snapchat Business Manager</span> → Public Profiles
                        </p>
                      )}
                    </div>

                    {!hasValue && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                        <AlertCircle className="size-3.5 shrink-0 text-amber-500" />
                        <p className="text-xs text-amber-700">Required to publish ads on Snapchat</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </SectionCard>

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
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
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
                  Catalog campaigns use <span className="font-semibold">Dynamic Product Ads</span> only. Ads are auto-generated from your product catalog. To create manual image/video ads, turn off the catalog toggle in Campaign settings.
                </p>
              </div>
            </div>
          )}

          {/* ---- Seasonal Templates ---- */}
          {ads.length === 0 && (
            <SectionCard>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                <Label className="text-sm font-semibold text-foreground">Quick Start Templates</Label>
                <Badge variant="secondary" className="rounded-full bg-amber-100 px-1.5 py-0 text-xs text-amber-700">Saudi Market</Badge>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">Pre-built campaign templates optimized for Saudi e-commerce seasons. Select one to auto-create your first ad.</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Ramadan Sale", nameAr: "عروض رمضان", icon: "🌙", desc: "Gift sets, dates, prayer items" },
                  { name: "Eid Collection", nameAr: "تشكيلة العيد", icon: "🎉", desc: "Eid gifts and celebrations" },
                  { name: "National Day", nameAr: "اليوم الوطني", icon: "🇸🇦", desc: "Saudi National Day specials" },
                  { name: "White Friday", nameAr: "الجمعة البيضاء", icon: "🏷️", desc: "Biggest discounts of the year" },
                  { name: "Back to School", nameAr: "العودة للمدارس", icon: "📚", desc: "School supplies and essentials" },
                  { name: "Year-End Sale", nameAr: "تخفيضات نهاية السنة", icon: "✨", desc: "End-of-year clearance" },
                ].map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => {
                      const newAd = makeAdGroup("SINGLE", 0, allowedDestinations[0] ?? "WEBSITE");
                      newAd.name = template.name;
                      newAd.assets = newAd.assets.map((a) => ({
                        ...a,
                        headline: template.nameAr,
                        cta: defaultCTA,
                      }));
                      updateNested("creative", { ads: [newAd] });
                      setActiveAdIdx(0);
                    }}
                    className="flex items-start gap-2.5 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.02]"
                  >
                    <span className="text-xl">{template.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{template.name}</p>
                      <p className="text-[10px] text-muted-foreground" dir="rtl">{template.nameAr}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{template.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </SectionCard>
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
                      checked={sponsoredAdConfig.autoResponseEnabled}
                      onCheckedChange={(checked) => updateNested("creative", {
                        sponsoredAdConfig: {
                          ...sponsoredAdConfig,
                          autoResponseEnabled: checked,
                          ...(!checked && { autoResponseMessage: "" }),
                        }
                      })}
                    />
                  </div>

                  {sponsoredAdConfig.autoResponseEnabled && (
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
                      <Badge variant="outline" className="ml-1.5 rounded-full px-1.5 py-0 text-[8px]">Optional</Badge>
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

          {/* ---- Lead Generation Form (LEADS objective) ---- */}
          {campaign.objective.objective === "LEADS" && (
            <LeadFormBuilder
              form={creative.leadForm ?? makeDefaultLeadForm()}
              onChange={(updated) => updateNested("creative", { leadForm: updated })}
            />
          )}

          {/* ---- Placement & Brand Safety (combined) ---- */}
          <SectionCard>
            <button
              type="button"
              className="flex w-full items-center gap-2"
              onClick={() => setPlacementExpanded((v) => !v)}
            >
              <LayoutGrid className="size-4 text-primary" />
              <Label className="pointer-events-none text-sm font-semibold text-foreground">Placement & Brand Safety</Label>
              <InfoTip text="Control where your ads appear and what content they run alongside on Snapchat." />
              <div className="ml-auto flex items-center gap-2">
                {!placementExpanded && (
                  <span className="text-[11px] text-muted-foreground">
                    {creative.brandSafety === "LIMITED_INVENTORY" ? "Limited" : "Full"} · {creative.placement === "CUSTOM" ? `Custom (${(creative.customPositions ?? []).length})` : "Automatic"}
                  </span>
                )}
                {placementExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
              </div>
            </button>

            {placementExpanded && (
            <>
            {/* ── Content Safety ── */}
            <div className="mb-5 mt-5">
              <div className="mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-muted-foreground" />
                <Label className="text-xs font-semibold text-foreground">Content Safety</Label>
                <InfoTip text="Controls the type of content your ads appear alongside. Limited Inventory restricts placement to moderated content only." />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { val: "FULL_INVENTORY" as const, label: "Full Inventory", desc: "Maximum reach across all content", icon: <Zap className="size-4" /> },
                  { val: "LIMITED_INVENTORY" as const, label: "Limited Inventory", desc: "Moderated, brand-safe content only", icon: <ShieldCheck className="size-4" /> },
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
                        "relative flex items-start gap-2.5 rounded-xl border-2 px-3.5 py-3 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/[0.04] shadow-sm"
                          : "border-border bg-background hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        selected ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
                      )}>
                        {opt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-xs font-semibold", selected ? "text-primary" : "text-foreground")}>{opt.label}</span>
                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{opt.desc}</p>
                      </div>
                      {selected && (
                        <CheckCircle2 className="absolute right-2.5 top-2.5 size-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="mb-5 border-t border-border" />

            {/* ── Ad Placement ── */}
            {campaign.objective.objective === "SPONSORED_CHAT" ? (
              <div>
                <div className="mb-2.5 flex items-center gap-1.5">
                  <LayoutGrid className="size-3.5 text-muted-foreground" />
                  <Label className="text-xs font-semibold text-foreground">Ad Placement</Label>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Locked</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100">
                    <Check className="size-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Chat Feed</p>
                    <p className="text-[11px] text-muted-foreground">Sponsored Ads are exclusively delivered in the Chat Feed</p>
                  </div>
                </div>
              </div>
            ) : (
            <div>
              <div className="mb-2.5 flex items-center gap-1.5">
                <LayoutGrid className="size-3.5 text-muted-foreground" />
                <Label className="text-xs font-semibold text-foreground">Ad Placement</Label>
                <InfoTip text="Where your ads appear on Snapchat. Automatic is recommended for maximum reach." />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { val: "AUTOMATIC" as PlacementConfig, label: "Automatic", desc: "Snapchat optimizes across all surfaces", recommended: true },
                  { val: "CUSTOM" as PlacementConfig, label: "Custom", desc: "Choose specific placements manually", recommended: false },
                ]).map((opt) => {
                  const selected = creative.placement === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => updateNested("creative", { placement: opt.val })}
                      className={cn(
                        "relative flex flex-col items-start rounded-xl border-2 px-3.5 py-3 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/[0.04] shadow-sm"
                          : "border-border bg-background hover:border-primary/30"
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className={cn("text-xs font-semibold", selected ? "text-primary" : "text-foreground")}>{opt.label}</span>
                        {opt.recommended && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Recommended</span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{opt.desc}</p>
                      {selected && (
                        <CheckCircle2 className="absolute right-2.5 top-2.5 size-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom placements list */}
              {creative.placement === "CUSTOM" && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {creative.brandSafety === "LIMITED_INVENTORY" && (
                    <div className="mb-1 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                      <ShieldCheck className="size-3.5 shrink-0 text-blue-500" />
                      <p className="text-[11px] text-blue-700">
                        Some placements are restricted under Limited Inventory.
                      </p>
                    </div>
                  )}
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
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">Full Inventory only</span>
                              )}
                              {noMatchingAds && !disabledByBrandSafety && (
                                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-500">No {formatNote} ads</span>
                              )}
                              {hasFormatRestriction && !noMatchingAds && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-600">{formatNote}</span>
                              )}
                            </div>
                            <p className="text-[11px] leading-snug text-muted-foreground">{pos.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {(creative.customPositions ?? []).length === 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                      <AlertCircle className="size-3 shrink-0 text-amber-500" />
                      <span className="text-xs text-amber-700">Select at least one placement</span>
                    </div>
                  )}
                  {(creative.customPositions ?? []).length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {(creative.customPositions ?? []).length} of {SNAP_POSITIONS.filter((p) => !(creative.brandSafety === "LIMITED_INVENTORY" && p.fullOnly)).length} placements selected
                    </p>
                  )}
                </div>
              )}
            </div>
            )}
            </>
            )}
          </SectionCard>

          {/* ---- Ad Groups List ---- */}
          <SectionCard>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Ad Groups</Label>
                <Badge variant="secondary" className="text-xs">{ads.length} group{ads.length !== 1 ? "s" : ""}</Badge>
                <InfoTip text="Each ad group has its own format and settings. Inside each group you add creative variations (images/videos). Snapchat recommends 3-5 ad groups per campaign." />
              </div>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Each ad group has its own format, settings, and one or more creative variations.
            </p>

            {ads.length === 0 && (
              <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
                <Zap className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Recommended Format</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {campaign.objective.objective === "SALES"
                      ? "For Sales campaigns, Collection Ads with your store products perform 2.3x better. Dynamic Product Ads are ideal if your catalog is connected."
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

            {ads.length === 0 ? (
              <div className="flex flex-col items-center gap-5 rounded-xl border-2 border-dashed border-border py-12">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
                  <ImagePlus className="size-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">No ad groups yet</p>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">Create your first ad group by selecting a format below. Each group can hold multiple creative variations.</p>
                </div>
                <div className="grid w-full max-w-lg gap-2 px-4 sm:grid-cols-2">
                  {FILTERED_AD_FORMATS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => addAd(opt.value)}
                      className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.02]"
                    >
                      <span className="mt-0.5 shrink-0 text-muted-foreground [&>svg]:size-4">{opt.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">{opt.label}</p>
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
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

                <div className="rounded-xl border-2 border-dashed border-border transition-all">
                  <button
                    type="button"
                    onClick={() => setShowNewAdGroupPicker((v) => !v)}
                    className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/[0.03]"
                  >
                    <Plus className="size-4" />
                    New Ad Group
                    {showNewAdGroupPicker ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>
                  {showNewAdGroupPicker && (
                    <div className="border-t border-border px-4 pb-4 pt-3">
                      <p className="mb-3 text-xs text-muted-foreground">Choose a format for your new ad group:</p>
                      {freqCapLockedFormat && (
                        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                          <Info className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                          <p className="text-[11px] leading-relaxed text-amber-700">
                            Frequency cap requires all ads to use the same format (<span className="font-semibold">{FILTERED_AD_FORMATS.find((f) => f.value === freqCapLockedFormat)?.label ?? freqCapLockedFormat}</span>). Disable frequency cap in Budget settings to use multiple formats.
                          </p>
                        </div>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {FILTERED_AD_FORMATS.map((opt) => {
                          const lockedOut = freqCapLockedFormat !== null && opt.value !== freqCapLockedFormat;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={lockedOut}
                              onClick={() => { addAd(opt.value); setShowNewAdGroupPicker(false); }}
                              className={cn(
                                "flex flex-col items-center gap-2 rounded-lg border bg-background px-3 py-3 text-center transition-all",
                                lockedOut
                                  ? "cursor-not-allowed border-border/50 opacity-40"
                                  : "border-border hover:border-primary/40 hover:bg-primary/[0.02]"
                              )}
                            >
                              <span className="shrink-0 text-muted-foreground [&>svg]:size-5">{opt.icon}</span>
                              <p className="text-xs font-medium text-foreground">{opt.label}</p>
                              <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{opt.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

        </div>

        {/* ============ RIGHT COLUMN ============ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-20 flex flex-col gap-4">

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

            {/* ---- LEAD FORM SUMMARY (only for LEADS) ---- */}
            {campaign.objective.objective === "LEADS" && creative.leadForm && (
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
                        <span className="truncate text-[8px] text-muted-foreground">Privacy Policy linked</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center rounded-lg border border-border bg-muted/20 px-2 py-2">
                      <span className="text-lg font-bold text-foreground">{creative.leadForm.form_fields.length}</span>
                      <span className="text-[8px] text-muted-foreground">Fields</span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-border bg-muted/20 px-2 py-2">
                      <span className="text-lg font-bold text-foreground">{creative.leadForm.form_fields.filter((f) => f.type === "CUSTOM").length}</span>
                      <span className="text-[8px] text-muted-foreground">Custom</span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-border bg-muted/20 px-2 py-2">
                      {creative.leadForm.end_page_properties ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <div className="size-4 rounded-full border border-muted-foreground/30" />
                      )}
                      <span className="mt-0.5 text-[8px] text-muted-foreground">End Page</span>
                    </div>
                  </div>
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
            />

          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Next: Review & Launch"
        nextDisabled={passingChecks < allChecks.length}
        accent="primary"
        message={passingChecks < allChecks.length ? {
          type: "error" as const,
          text: allChecks.find((c) => !c.ok)?.label ? `Missing: ${allChecks.find((c) => !c.ok)!.label}` : "Complete all required fields",
        } : undefined}
      />
    </TooltipProvider>
  );
}

/* ================================================================== */
/*  Campaign Readiness Card                                           */
/* ================================================================== */

function CampaignReadinessCard({
  ads,
  totalCreatives,
  creative,
  allChecks,
  passingChecks,
  frequencyCapEnabled = false,
  objective,
  catalogEnabled = false,
}: {
  ads: AdGroup[];
  totalCreatives: number;
  creative: { publicProfileId?: string; placement?: string; brandSafety?: string; customPositions?: string[] };
  allChecks: { label: string; ok: boolean }[];
  passingChecks: number;
  frequencyCapEnabled?: boolean;
  objective?: string;
  catalogEnabled?: boolean;
}) {
  const failingChecks = allChecks.filter((c) => !c.ok);
  const allPassed = passingChecks === allChecks.length && allChecks.length > 0;

  /* ── Best-practice signals ── */
  const hasMultipleAds = ads.length >= 2;
  const nonDynamicAds = ads.filter((a) => a.adFormat !== "DYNAMIC");
  const avgCreativesPerAd = nonDynamicAds.length > 0
    ? nonDynamicAds.reduce((s, a) => s + a.assets.length, 0) / nonDynamicAds.length
    : 0;
  const hasEnoughCreatives = catalogEnabled || avgCreativesPerAd >= 3;
  const hasVideoCreative = catalogEnabled || ads.some((a) => a.assets.some((asset) => asset.mediaType === "VIDEO"));
  const hasMultipleFormats = new Set(ads.map((a) => a.adFormat)).size >= 2;

  const bestPractices: { label: string; met: boolean; tip: string }[] = [];

  if (!catalogEnabled) {
    bestPractices.push({
      label: "Multiple ad groups",
      met: hasMultipleAds,
      tip: objective === "SALES"
        ? "Create 2+ ad groups to A/B test creatives and find the best-performing sales driver"
        : objective === "LEADS"
          ? "Test different lead form approaches across multiple ad groups"
          : "Create 2+ ad groups to test different audiences or formats",
    });
  }

  if (!catalogEnabled) {
    bestPractices.push({
      label: "3+ creatives per ad",
      met: hasEnoughCreatives,
      tip: objective === "SALES"
        ? "Snap recommends 3-5 creative variations — test different product angles and CTAs"
        : "Snap recommends 3-5 creative variations for optimal delivery",
    });

    bestPractices.push({
      label: "Video creative included",
      met: hasVideoCreative,
      tip: objective === "ENGAGEMENT"
        ? "Video ads generate 3x more engagement than static images on Snapchat"
        : "Video ads get 2x more engagement than static images on Snapchat",
    });
  }

  if (ads.length >= 2 && !frequencyCapEnabled && !catalogEnabled) {
    bestPractices.push({
      label: "Multiple formats",
      met: hasMultipleFormats,
      tip: "Mix formats (Single, Story, Collection) to reach users in different placements",
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
      tip: "Vary headlines, CTAs, or visuals across ad groups to find what resonates best with your audience",
    });
  }

  const bpMet = bestPractices.filter((bp) => bp.met).length;
  const bpTotal = bestPractices.length;
  const bpPercent = bpTotal > 0 ? Math.round((bpMet / bpTotal) * 100) : 0;

  const readinessLabel = allPassed
    ? bpPercent >= 75 ? "Excellent" : bpPercent >= 50 ? "Good" : "Ready"
    : "Incomplete";

  const readinessColor = allPassed
    ? bpPercent >= 75 ? "text-emerald-600" : bpPercent >= 50 ? "text-primary" : "text-amber-600"
    : "text-red-500";

  return (
    <SectionCard className="overflow-hidden p-0">
      {/* ── Header with readiness score ── */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <Label className="text-sm font-semibold text-foreground">Campaign Readiness</Label>
        </div>
        <span className={cn("text-xs font-bold", readinessColor)}>{readinessLabel}</span>
      </div>

      {/* ── Required checks (only show if something is failing) ── */}
      {failingChecks.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Required</span>
            <span className="text-[11px] tabular-nums text-muted-foreground">{passingChecks}/{allChecks.length}</span>
          </div>
          <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", allPassed ? "bg-emerald-500" : "bg-primary")}
              style={{ width: `${allChecks.length > 0 ? (passingChecks / allChecks.length) * 100 : 0}%` }}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            {failingChecks.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <div className="flex size-3 shrink-0 items-center justify-center rounded-full border-[1.5px] border-red-400">
                  <div className="size-1 rounded-full bg-red-400" />
                </div>
                <span className="text-[11px] font-medium text-foreground">{c.label}</span>
              </div>
            ))}
            {failingChecks.length > 5 && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">+{failingChecks.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      {/* ── All passed banner ── */}
      {allPassed && (
        <div className="border-t border-emerald-100 bg-emerald-50/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
            <span className="text-[11px] font-medium text-emerald-700">All required checks passed</span>
          </div>
        </div>
      )}

      {/* ── Best Practices ── */}
      <div className="border-t border-border px-4 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Best Practices</span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
            bpPercent >= 75 ? "bg-emerald-100 text-emerald-700" :
            bpPercent >= 50 ? "bg-primary/10 text-primary" :
            "bg-amber-100 text-amber-700"
          )}>
            {bpMet}/{bpTotal}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {bestPractices.map((bp, i) => (
            <div key={i} className="flex items-start gap-2">
              {bp.met ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("text-[11px] font-medium", bp.met ? "text-muted-foreground" : "text-foreground")}>{bp.label}</p>
                {!bp.met && (
                  <p className="text-[10px] leading-relaxed text-muted-foreground">{bp.tip}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Stats Footer ── */}
      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="block text-sm font-bold tabular-nums text-foreground">{ads.length}</span>
            <span className="text-[9px] text-muted-foreground">Ad{ads.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="text-center">
            <span className="block text-sm font-bold tabular-nums text-foreground">{totalCreatives}</span>
            <span className="text-[9px] text-muted-foreground">Creative{totalCreatives !== 1 ? "s" : ""}</span>
          </div>
        </div>
        {!hasEnoughCreatives && nonDynamicAds.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-700">
            Add more creatives
          </span>
        )}
      </div>
    </SectionCard>
  );
}
