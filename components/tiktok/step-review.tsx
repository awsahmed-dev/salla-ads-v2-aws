"use client";

import { useState, useMemo } from "react";
import { useTikTokCampaign } from "@/lib/tiktok/campaign-context";
import { OBJECTIVE_CONFIGS } from "@/lib/tiktok/campaign-types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { SectionCard } from "@/components/shared/section-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  AlertCircle,
  Rocket,
  ShoppingBag,
  Users,
  DollarSign,
  ImagePlus,
  Wallet,
  Tag,
  PartyPopper,
  Pencil,
  Globe,
  Calendar,
  Target,
  CreditCard,
  Copy,
  Save,
  Code2,
  ArrowLeft,
  MousePointerClick,
  Play,
  ClipboardList,
  Smartphone,
  Download,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function ReviewRow({ label, value, warn }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className={cn("text-sm", warn ? "text-amber-600" : "text-muted-foreground")}>{label}</span>
      <span className={cn("text-right text-sm font-medium", warn ? "text-amber-600" : "text-foreground")}>{value}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, step, setStep }: {
  icon: React.ElementType;
  title: string;
  step: number;
  setStep: (s: number) => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
      </div>
      <button
        type="button"
        onClick={() => setStep(step)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      >
        <Pencil className="size-3" />
        Edit
      </button>
    </div>
  );
}

/* Country code to name */
const COUNTRY_MAP: Record<string, string> = {
  SA: "Saudi Arabia", AE: "UAE", KW: "Kuwait", BH: "Bahrain",
  OM: "Oman", QA: "Qatar", EG: "Egypt", JO: "Jordan", IQ: "Iraq",
};

const GOAL_LABELS: Record<string, string> = {
  CONVERSION: "Conversions",
  VALUE: "Value (ROAS)",
  CLICK: "Clicks",
  LANDING_PAGE_VIEW: "Landing Page View",
  REACH: "Reach (Impressions)",
  VIDEO_VIEW: "Video Views (2s)",
  FOCUSED_VIEW: "Focused View (6s)",
  LEAD_GENERATION: "Lead Form Submissions",
  INSTALL: "App Installs",
  IN_APP_EVENT: "In-App Events (AEO)",
};

const EVENT_LABELS: Record<string, string> = {
  COMPLETE_PAYMENT: "Purchase",
  INITIATE_CHECKOUT: "Initiate Checkout",
  ADD_TO_CART: "Add to Cart",
  VIEW_CONTENT: "View Product",
  ADD_BILLING: "Add Payment Info",
};

const BID_LABELS: Record<string, string> = {
  BID_TYPE_NO_BID: "Maximum Delivery",
  BID_TYPE_CUSTOM: "Cost Cap",
  };

const FORMAT_LABELS: Record<string, string> = {
  SINGLE_VIDEO: "Single Video",
  SINGLE_IMAGE: "Single Image",
  CAROUSEL: "Carousel",
  SPARK_AD: "Spark Ad",
};

const AGE_LABELS: Record<string, string> = {
  AGE_13_17: "13-17",
  AGE_18_24: "18-24",
  AGE_25_34: "25-34",
  AGE_35_44: "35-44",
  AGE_45_54: "45-54",
  AGE_55_100: "55+",
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function TikTokStepReview() {
  const { campaign, setStep, reset } = useTikTokCampaign();
  const { objective, audience, budget, creative } = campaign;
  const objConfig = OBJECTIVE_CONFIGS[objective.objective] ?? OBJECTIVE_CONFIGS.PRODUCT_SALES;
  const isReach = objective.objective === "REACH";
  const isTraffic = objective.objective === "TRAFFIC";
  const isVideoViews = objective.objective === "VIDEO_VIEWS";
  const isLeadGen = objective.objective === "LEAD_GENERATION";
  const isAppPromo = objective.objective === "APP_PROMOTION";
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showLaunchConfirm, setShowLaunchConfirm] = useState(false);
  const [savedAsDraft, setSavedAsDraft] = useState(false);
  const [showApiJson, setShowApiJson] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  /* ---- Computed ---- */
  const durationDays = useMemo(() => {
    if (budget.startDate && budget.endDate) {
      return Math.max(1, Math.ceil((new Date(budget.endDate).getTime() - new Date(budget.startDate).getTime()) / 86400000));
    }
    return 14;
  }, [budget.startDate, budget.endDate]);

  const totalBudget = budget.amount * durationDays + (budget.performanceBoost ? 149 : 0);

  /* ---- Validation ---- */
  const checks = useMemo(() => {
    const list: { id: string; label: string; ok: boolean; detail?: string }[] = [];

    list.push({
      id: "name",
      label: "Campaign name set",
      ok: !!objective.campaignName.trim(),
      detail: objective.campaignName || "Missing",
    });

    list.push({
      id: "location",
      label: "Target location selected",
      ok: audience.locationIds.length > 0,
      detail: audience.locationIds.map((c) => COUNTRY_MAP[c] || c).join(", ") || "None",
    });

    if (!isReach && !isTraffic && !isVideoViews && !isLeadGen && !isAppPromo) {
      list.push({
        id: "pixel",
        label: "TikTok Pixel configured",
        ok: objective.pixelMode !== "none" && (objective.pixelMode === "salla_managed" || !!objective.pixelId),
        detail: objective.pixelMode === "salla_managed" ? "Salla Managed" : objective.pixelId ? "Connected" : "Missing",
      });
    }

    // Lead Gen: Instant Form validations
    if (isLeadGen && objective.leadOptimizationLocation === "INSTANT_FORM") {
      list.push({
        id: "lead_privacy",
        label: "Privacy policy URL set",
        ok: !!objective.instantForm.privacyPolicyUrl && objective.instantForm.privacyPolicyUrl.startsWith("https://"),
        detail: objective.instantForm.privacyPolicyUrl ? "Set" : "Missing",
      });
      list.push({
        id: "lead_company",
        label: "Company name set",
        ok: !!objective.instantForm.companyName,
        detail: objective.instantForm.companyName || "Missing",
      });
      list.push({
        id: "lead_fields",
        label: "Personal info fields selected",
        ok: objective.instantForm.personalInfoFields.length > 0,
        detail: `${objective.instantForm.personalInfoFields.length} field${objective.instantForm.personalInfoFields.length !== 1 ? "s" : ""}`,
      });
    }

    // App Promo: App details required
    if (isAppPromo) {
      list.push({
        id: "app_id",
        label: "TikTok App ID set",
        ok: !!objective.appSettings.appId.trim(),
        detail: objective.appSettings.appId || "Missing",
      });
      list.push({
        id: "app_url",
        label: "App download URL set",
        ok: !!objective.appSettings.appDownloadUrl.trim(),
        detail: objective.appSettings.appDownloadUrl ? "Set" : "Missing",
      });
    }

    // Traffic + Landing Page View requires pixel
    if (isTraffic && budget.optimizationGoal === "LANDING_PAGE_VIEW") {
      list.push({
        id: "pixel",
        label: "TikTok Pixel (required for Landing Page View)",
        ok: objective.pixelMode !== "none" && (objective.pixelMode === "salla_managed" || !!objective.pixelId),
        detail: objective.pixelMode === "salla_managed" ? "Salla Managed" : objective.pixelId ? "Connected" : "Missing",
      });
    }

    list.push({
      id: "budget",
      label: "Budget set",
      ok: budget.amount >= 20,
      detail: `SAR ${budget.amount}/day`,
    });

    list.push({
      id: "ads",
      label: "At least one ad created",
      ok: creative.ads.length > 0,
      detail: `${creative.ads.length} ad${creative.ads.length !== 1 ? "s" : ""}`,
    });

    // Carousel music validation (music is mandatory for carousel ads)
    const carouselAdsMissingMusic = creative.ads.filter(
      (a) => a.adFormat === "CAROUSEL" && !a.musicFile
    );
    if (carouselAdsMissingMusic.length > 0) {
      list.push({
        id: "carousel_music",
        label: "Carousel ads have music",
        ok: false,
        detail: `${carouselAdsMissingMusic.length} carousel ad${carouselAdsMissingMusic.length !== 1 ? "s" : ""} missing required music`,
      });
    }

  // Landing page URL validation (required for non-Spark ads, optional for Video Views)
  const nonSparkMissingUrl = creative.ads.filter(
    (a) => !a.sparkAdEnabled && !a.landingPageUrl && !isVideoViews && !isLeadGen && !isAppPromo
  );
  if (nonSparkMissingUrl.length > 0) {
      list.push({
        id: "landing_url",
        label: "Landing page URLs set",
        ok: false,
        detail: `${nonSparkMissingUrl.length} ad${nonSparkMissingUrl.length !== 1 ? "s" : ""} missing landing URL`,
      });
    }

    return list;
  }, [objective, audience, budget, creative]);

  const allPassed = checks.every((c) => c.ok);
  const failCount = checks.filter((c) => !c.ok).length;

  /* ---- API JSON ---- */
  const apiJson = useMemo(() => {
    return {
      campaign: {
        advertiser_id: "<ADVERTISER_ID>",
        campaign_name: objective.campaignName,
        objective_type: objective.objective,
        budget_mode: budget.budgetMode,
        budget: budget.amount,
        operation_status: "ENABLE",
      },
      adgroup: {
        advertiser_id: "<ADVERTISER_ID>",
        campaign_id: "<CAMPAIGN_ID>",
        adgroup_name: `${objective.campaignName} - Ad Group`,
        placement_type: creative.placementType,
        budget_mode: budget.budgetMode,
        budget: budget.amount,
        optimization_goal: budget.optimizationGoal,
        ...(!isReach && !isTraffic && !isVideoViews && !isLeadGen && !isAppPromo && { optimization_event: budget.optimizationEvent }),
        // App Promotion fields
        ...(isAppPromo && {
          app_id: objective.appSettings.appId || "<APP_ID>",
          app_type: objective.appSettings.appPlatform,
          promotion_type: objective.appSettings.appPromotionType,
          app_download_url: objective.appSettings.appDownloadUrl || "<APP_DOWNLOAD_URL>",
        }),
        billing_event: budget.billingEvent,
        bid_type: budget.bidType,
        // Cost Cap: send target CPA -- valid for CONVERSION goal per TikTok API
        ...(budget.bidType === "BID_TYPE_CUSTOM" && budget.optimizationGoal === "CONVERSION" && { conversion_bid_price: budget.bidAmount }),
        // Cost Cap: send CPV bid -- valid for VIDEO_VIEW/FOCUSED_VIEW goals
        ...(budget.bidType === "BID_TYPE_CUSTOM" && (budget.optimizationGoal === "VIDEO_VIEW" || budget.optimizationGoal === "FOCUSED_VIEW") && { bid_price: budget.bidAmount }),
        // Cost Cap: send CPL bid -- valid for LEAD_GENERATION goal
        ...(budget.bidType === "BID_TYPE_CUSTOM" && budget.optimizationGoal === "LEAD_GENERATION" && { conversion_bid_price: budget.bidAmount }),
        // Cost Cap: send CPI bid -- valid for INSTALL/IN_APP_EVENT goals
        ...(budget.bidType === "BID_TYPE_CUSTOM" && (budget.optimizationGoal === "INSTALL" || budget.optimizationGoal === "IN_APP_EVENT") && { conversion_bid_price: budget.bidAmount }),
        // Lead Gen: optimization_location
        ...(isLeadGen && { optimization_location: objective.leadOptimizationLocation }),
        // Value optimization: send ROAS target with deep_bid_type: VO_MIN_ROAS
        ...(budget.optimizationGoal === "VALUE" && { deep_bid_type: budget.deepBidType, roas_bid: Number(budget.roasBid) || 1 }),
        // Attribution windows (not for Reach, Traffic, or Video Views)
        ...(!isReach && !isTraffic && !isVideoViews && !isLeadGen && !isAppPromo && {
          click_attribution_window: budget.clickAttributionWindow,
          view_attribution_window: budget.viewAttributionWindow,
        }),
        // Frequency cap (Reach objective only)
        ...(isReach && budget.frequencyCap && {
          frequency: budget.frequencyCap.frequency,
          frequency_schedule: budget.frequencyCap.schedule,
        }),
        pacing: budget.pacing,
        skip_learning_phase: budget.skipLearningPhase ? 1 : 0,
        identity_type: creative.identity?.identityType ?? "CUSTOMIZED_USER",
        identity_id: creative.identity?.identityId || "<ADVERTISER_ID>",
        schedule_start_time: budget.startDate,
        ...(budget.endDate && !budget.endDateOptional && { schedule_end_time: budget.endDate }),
  // Pixel (not for Reach or Video Views; optional for Traffic)
  ...(!isReach && !isVideoViews && !isLeadGen && !isAppPromo && !(isTraffic && objective.pixelMode === "none") && { pixel_id: objective.pixelId || "<PIXEL_ID>" }),
        // Catalog fields (only when using catalog promotion)
        ...(objective.catalogEnabled && {
          shopping_ads_type: objective.shoppingAdsType,
          catalog_id: objective.catalogId || "<CATALOG_ID>",
          ...(objective.productSelectionMode === "PRODUCT_SET" && objective.productSetId && { product_set_id: objective.productSetId }),
        }),
        location_ids: audience.locationIds,
        age_min: audience.ageMin,
        age_max: audience.ageMax,
        gender: audience.gender,
        languages: audience.languages,
        ...(audience.interests.length > 0 && { interest_category_ids: audience.interests }),
        ...(audience.operatingSystems.length > 0 && { operating_systems: audience.operatingSystems }),
      },
      // Instant Form config (Lead Gen only)
      ...(isLeadGen && objective.leadOptimizationLocation === "INSTANT_FORM" && {
        instant_form: {
          form_name: objective.instantForm.formName || `${objective.campaignName} - Lead Form`,
          form_type: objective.instantForm.formType,
          form_template: objective.instantForm.formTemplate,
          ...(objective.instantForm.headline && { headline: objective.instantForm.headline }),
          ...(objective.instantForm.description && { description: objective.instantForm.description }),
          personal_info_fields: objective.instantForm.personalInfoFields,
          custom_questions: objective.instantForm.questions.map((q) => ({
            question_type: q.type,
            question_text: q.questionText,
            ...(q.options.length > 0 && { options: q.options }),
            required: q.required,
          })),
          privacy: {
            company_name: objective.instantForm.companyName,
            privacy_policy_url: objective.instantForm.privacyPolicyUrl,
          },
          thank_you_page: {
            headline: objective.instantForm.thankYouHeadline,
            description: objective.instantForm.thankYouDescription,
            button_text: objective.instantForm.thankYouButtonText,
            ...(objective.instantForm.thankYouUrl && { button_url: objective.instantForm.thankYouUrl }),
          },
        },
      }),
      ads: creative.ads.map((ad) => ({
        advertiser_id: creative.identity?.identityId || "<ADVERTISER_ID>",
        adgroup_id: "<ADGROUP_ID>",
        creatives: [{
          ad_name: ad.name,
          ad_format: ad.adFormat,
          identity_type: creative.identity?.identityType ?? "CUSTOMIZED_USER",
          identity_id: creative.identity?.identityId || "<ADVERTISER_ID>",
          ...(creative.identity?.avatarPreviewUrl && { avatar_icon_web_uri: "<UPLOADED_AVATAR_URI>" }),
          // Spark Ads: only tiktok_item_id is needed (creative comes from post)
          ...(ad.sparkAdEnabled
            ? { tiktok_item_id: `<FROM_AUTH_CODE:${ad.sparkAdAuthCode}>` }
            : {
                ad_text: ad.adText,
                display_name: ad.displayName || creative.identity?.displayName || "",
                call_to_action: ad.callToAction,
                ...(ad.landingPageUrl && { landing_page_url: ad.landingPageUrl }),
              }),
          // Catalog fields on creative (when using catalog promotion)
          ...(objective.catalogEnabled && {
            catalog_id: objective.catalogId || "<CATALOG_ID>",
            ...(objective.productSelectionMode === "PRODUCT_SET" && objective.productSetId && { product_set_id: objective.productSetId }),
            ...(objective.dynamicFormat && { dynamic_format: "DYNAMIC_CREATIVE" }),
          }),
          // Media references (uploaded via TikTok Media API)
          ...(ad.adFormat === "SINGLE_VIDEO" && ad.assets.length > 0 && { video_id: ad.assets[0].mediaId || "<VIDEO_ID>" }),
          ...(ad.adFormat === "SINGLE_IMAGE" && ad.assets.length > 0 && { image_ids: [ad.assets[0].mediaId || "<IMAGE_ID>"] }),
          ...(ad.adFormat === "CAROUSEL" && ad.carouselCards.length > 0 && {
            image_ids: ad.carouselCards.map((_, i) => `<IMAGE_ID_${i + 1}>`),
          }),
          // Music (required for carousel, optional for video/image)
          ...(ad.musicFile && { music_id: "<UPLOADED_MUSIC_ID>" }),
          promotional_music_disabled: ad.promotionalMusicDisabled ?? (ad.adFormat !== "CAROUSEL"),
          // Spark Ad interaction settings
          ...(ad.sparkAdEnabled && ad.sparkDuetStatus && { item_duet_status: ad.sparkDuetStatus }),
          ...(ad.sparkAdEnabled && ad.sparkStitchStatus && { item_stitch_status: ad.sparkStitchStatus }),
          // Tracking
          ...(ad.clickTrackingUrl && { click_tracking_url: ad.clickTrackingUrl }),
          ...(ad.impressionTrackingUrl && { impression_tracking_url: ad.impressionTrackingUrl }),
          ...(ad.deeplink && { deeplink: ad.deeplink, deeplink_type: ad.deeplinkType || "NORMAL" }),
          // Advanced
          ...(ad.aigcDisclosureType && ad.aigcDisclosureType !== "NOT_DECLARED" && { aigc_disclosure_type: ad.aigcDisclosureType }),
          ...(ad.instantProductPageUsed && { instant_product_page_used: true }),
        }],
      })),
    };
  }, [objective, audience, budget, creative]);

  /* ---- Launch handler ---- */
  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      setLaunched(true);
    }, 2000);
  };

  /* ---- Launched success ---- */
  if (launched) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Campaign Launched!</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your TikTok campaign "{objective.campaignName}" is now live. TikTok will review your ads (usually within 24 hours).
        </p>
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] px-6 py-3">
          <p className="text-xs text-muted-foreground">Estimated daily spend</p>
          <p className="text-lg font-bold text-primary">SAR {budget.amount}</p>
        </div>
        <div className="mt-8 flex gap-3">
          <Button variant="outline" onClick={() => { reset(); }}>
            Create Another Campaign
          </Button>
          <Button className="gap-2">
            <Rocket className="size-4" />
            View in Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-background">
        <div className="flex flex-1 flex-col">

          {/* Header */}
          <div className="border-b border-border bg-background">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-4">
              <div>
                <p className="text-base font-semibold text-foreground">Review & Launch</p>
                <p className="text-sm text-muted-foreground">TikTok Campaign</p>
              </div>
              <Badge
                variant={allPassed ? "default" : "destructive"}
                className={cn("gap-1.5 rounded-full text-xs", allPassed && "bg-emerald-600")}
              >
                {allPassed ? (
                  <><CheckCircle2 className="size-3" /> All checks passed</>
                ) : (
                  <><AlertCircle className="size-3" /> {failCount} issue{failCount !== 1 ? "s" : ""}</>
                )}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className={cn("mx-auto w-full max-w-3xl space-y-5 px-8 py-10", WIZARD_FOOTER_PADDING_BOTTOM)}>

              <div className="mb-6">
                <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
                  Review your campaign
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Check everything before launching. You can edit any section by clicking the Edit button.
                </p>
              </div>

              {/* ---- Pre-launch checklist ---- */}
              <SectionCard>
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Pre-launch Checklist</Label>
                </div>
                <div className="space-y-2">
                  {checks.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      {c.ok ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="size-4 shrink-0 text-destructive" />
                      )}
                      <span className={cn("flex-1", c.ok ? "text-foreground" : "text-destructive")}>{c.label}</span>
                      {c.detail && <span className="text-xs text-muted-foreground">{c.detail}</span>}
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* ---- Objective ---- */}
              <SectionCard>
                <SectionHeader icon={isAppPromo ? Smartphone : isLeadGen ? ClipboardList : isVideoViews ? Play : isReach ? Target : isTraffic ? MousePointerClick : ShoppingBag} title="Objective" step={0} setStep={setStep} />
                <ReviewRow label="Objective" value={objConfig.label} />
                {!isReach && !isTraffic && !isVideoViews && !isLeadGen && !isAppPromo && (
                  <ReviewRow label="Product Catalog" value={objective.catalogEnabled ? "Enabled" : "Disabled"} />
                )}
                {objective.catalogEnabled && !isReach && !isTraffic && !isVideoViews && !isLeadGen && !isAppPromo && (
                  <>
                    <ReviewRow label="Shopping Ad Type" value={objective.shoppingAdsType?.replace(/_/g, " ") || "Video Shopping"} />
                    <ReviewRow label="Product Selection" value={objective.productSelectionMode === "ALL" ? "All Products" : objective.productSelectionMode === "PRODUCT_SET" ? `Product Set: ${objective.productSetId || "(not set)"}` : "Specific Products"} />
                    <ReviewRow label="Dynamic Format" value={objective.dynamicFormat ? "Enabled" : "Disabled"} />
                  </>
                )}
                <ReviewRow label="Campaign Name" value={objective.campaignName || "Not set"} warn={!objective.campaignName} />
                {!isReach && !isTraffic && !isVideoViews && !isLeadGen && !isAppPromo && (
                  <ReviewRow label="TikTok Pixel" value={
                    objective.pixelMode === "salla_managed"
                      ? "Salla Managed"
                      : objective.pixelId
                        ? objective.pixelName || objective.pixelId
                        : "Not configured"
                  } warn={objective.pixelMode === "none"} />
                )}
                {(isReach || isVideoViews || isLeadGen || isAppPromo) && (
                  <ReviewRow label="Pixel" value={isAppPromo ? "Not required (SDK tracking)" : isLeadGen ? "Not required (Instant Form)" : isVideoViews ? "Not required for Video Views" : "Not required for Reach"} />
                )}
                {isTraffic && (
                  <ReviewRow label="TikTok Pixel" value={
                    objective.pixelMode === "salla_managed"
                      ? "Salla Managed (enables Landing Page View)"
                      : objective.pixelMode === "existing" && objective.pixelId
                        ? `${objective.pixelId} (enables Landing Page View)`
                        : "Not configured (Clicks only)"
                  } />
                )}
                {isLeadGen && (
                  <>
                    <ReviewRow label="Lead Collection" value={objective.leadOptimizationLocation === "INSTANT_FORM" ? "TikTok Instant Form" : "Website Form"} />
                    {objective.leadOptimizationLocation === "INSTANT_FORM" && (
                      <>
                        <ReviewRow label="Form Template" value={
                          objective.instantForm.formTemplate === "SIMPLE_SIGNUP" ? "Simple Sign-up"
                            : objective.instantForm.formTemplate === "RICH_CONTENT" ? "Rich Content"
                            : objective.instantForm.formTemplate === "LEAD_QUALIFICATION" ? "Lead Qualification"
                            : "Custom"
                        } />
                        <ReviewRow label="Form Intent" value={objective.instantForm.formType === "HIGHER_INTENT" ? "Higher Intent" : "More Volume"} />
                        <ReviewRow label="Personal Fields" value={`${objective.instantForm.personalInfoFields.length} field${objective.instantForm.personalInfoFields.length !== 1 ? "s" : ""}`} />
                        {objective.instantForm.questions.length > 0 && (
                          <ReviewRow label="Custom Questions" value={`${objective.instantForm.questions.length} question${objective.instantForm.questions.length !== 1 ? "s" : ""}`} />
                        )}
                        <ReviewRow label="Privacy Policy" value={objective.instantForm.privacyPolicyUrl ? "Set" : "Missing"} warn={!objective.instantForm.privacyPolicyUrl} />
                        <ReviewRow label="Company Name" value={objective.instantForm.companyName || "Missing"} warn={!objective.instantForm.companyName} />
                      </>
                    )}
                  </>
                )}
                {isAppPromo && (
                  <>
                    <ReviewRow label="App Platform" value={objective.appSettings.appPlatform === "IOS" ? "iOS (App Store)" : "Android (Google Play)"} />
                    <ReviewRow label="App Name" value={objective.appSettings.appName || "Not set"} />
                    <ReviewRow label="TikTok App ID" value={objective.appSettings.appId || "Not set"} warn={!objective.appSettings.appId} />
                    <ReviewRow label="Download URL" value={
                      objective.appSettings.appDownloadUrl
                        ? <span className="max-w-[220px] truncate">{objective.appSettings.appDownloadUrl}</span>
                        : "Not set"
                    } warn={!objective.appSettings.appDownloadUrl} />
                    <ReviewRow label="Promotion Type" value={objective.appSettings.appPromotionType === "APP_INSTALL" ? "New Installs" : "Retargeting"} />
                    <ReviewRow label="Tracking" value="TikTok SDK / MMP" />
                  </>
                )}
              </SectionCard>

              {/* ---- Audience ---- */}
              <SectionCard>
                <SectionHeader icon={Users} title="Audience" step={1} setStep={setStep} />
                <ReviewRow label="Locations" value={audience.locationIds.map((c) => COUNTRY_MAP[c] || c).join(", ")} />
                <ReviewRow label="Age Range" value={`${audience.ageMin} - ${audience.ageMax === 55 ? "55+" : audience.ageMax}`} />
                <ReviewRow label="Gender" value={
                  audience.gender === "GENDER_UNLIMITED" ? "All" :
                  audience.gender === "GENDER_MALE" ? "Male" : "Female"
                } />
                <ReviewRow label="Languages" value={audience.languages.map((l) => l === "ar" ? "Arabic" : "English").join(", ")} />
                {audience.interests.length > 0 && (
                  <ReviewRow label="Interests" value={`${audience.interests.length} selected`} />
                )}
                <ReviewRow label="Auto Targeting" value={audience.autoTargetingEnabled ? "Enabled" : "Disabled"} />
              </SectionCard>

              {/* ---- Budget ---- */}
              <SectionCard>
                <SectionHeader icon={DollarSign} title="Budget & Schedule" step={2} setStep={setStep} />
                <ReviewRow label="Daily Budget" value={`SAR ${budget.amount}`} />
                <ReviewRow label="Duration" value={`${durationDays} days`} />
                <ReviewRow label="Total Budget" value={`SAR ${totalBudget.toLocaleString()}`} />
                <ReviewRow label="Optimization" value={GOAL_LABELS[budget.optimizationGoal] || budget.optimizationGoal} />
                {!isReach && !isTraffic && !isVideoViews && !isLeadGen && !isAppPromo && budget.optimizationGoal !== "CLICK" && (
                  <ReviewRow label="Conversion Event" value={EVENT_LABELS[budget.optimizationEvent] || budget.optimizationEvent} />
                )}
                <ReviewRow label="Bid Strategy" value={BID_LABELS[budget.bidType] || budget.bidType} />
                {budget.bidType === "BID_TYPE_CUSTOM" && (
                  <ReviewRow label="Cost Cap" value={`SAR ${budget.bidAmount}`} />
                )}
                <ReviewRow label="Billing Event" value={
                  budget.billingEvent === "OCPM" ? "Optimized CPM"
                  : budget.billingEvent === "CPM" ? "CPM (per 1,000 impressions)"
                  : budget.billingEvent === "CPC" ? "CPC (per click)"
                  : budget.billingEvent === "CPV" ? `CPV (per ${budget.optimizationGoal === "FOCUSED_VIEW" ? "6s focused view" : "2s video view"})`
                  : budget.billingEvent
                } />
                {budget.optimizationGoal === "VALUE" && (
                  <ReviewRow label="ROAS Target" value={`${Number(budget.roasBid) || 1}x`} />
                )}
                {isTraffic && budget.amount > 0 && (
                  <ReviewRow label={`Est. Daily ${budget.optimizationGoal === "LANDING_PAGE_VIEW" ? "Page Views" : "Clicks"}`} value={
                    budget.optimizationGoal === "CLICK"
                      ? `~${Math.round(budget.amount / 1.5).toLocaleString()} - ${Math.round(budget.amount / 0.8).toLocaleString()}`
                      : `~${Math.round(budget.amount / 4.0).toLocaleString()} - ${Math.round(budget.amount / 1.5).toLocaleString()}`
                  } />
                )}
                {isLeadGen && budget.amount > 0 && (
                  <ReviewRow label="Est. Daily Leads" value={
                    `~${Math.round(budget.amount / 20).toLocaleString()} - ${Math.round(budget.amount / 5).toLocaleString()}`
                  } />
                )}
                {isAppPromo && budget.amount > 0 && (
                  <ReviewRow label={`Est. Daily ${budget.optimizationGoal === "IN_APP_EVENT" ? "In-App Events" : "Installs"}`} value={
                    budget.optimizationGoal === "IN_APP_EVENT"
                      ? `~${Math.round(budget.amount / 40).toLocaleString()} - ${Math.round(budget.amount / 10).toLocaleString()}`
                      : `~${Math.round(budget.amount / 15).toLocaleString()} - ${Math.round(budget.amount / 3).toLocaleString()}`
                  } />
                )}
                {isVideoViews && budget.amount > 0 && (
                  <ReviewRow label={`Est. Daily ${budget.optimizationGoal === "FOCUSED_VIEW" ? "Focused Views" : "Video Views"}`} value={
                    budget.optimizationGoal === "FOCUSED_VIEW"
                      ? `~${Math.round(budget.amount / 0.15).toLocaleString()} - ${Math.round(budget.amount / 0.04).toLocaleString()}`
                      : `~${Math.round(budget.amount / 0.08).toLocaleString()} - ${Math.round(budget.amount / 0.02).toLocaleString()}`
                  } />
                )}
                {isReach && budget.frequencyCap && (
                  <ReviewRow label="Frequency Cap" value={`${budget.frequencyCap.frequency} impressions / ${budget.frequencyCap.schedule === 7 ? "7 days" : budget.frequencyCap.schedule === 3 ? "3 days" : "1 day"}`} />
                )}
                {!isReach && !isTraffic && !isVideoViews && !isLeadGen && !isAppPromo && (
                  <ReviewRow label="Attribution" value={`${budget.clickAttributionWindow}d click / ${budget.viewAttributionWindow === "0" ? "off" : budget.viewAttributionWindow + "d"} view`} />
                )}
                <ReviewRow label="Schedule" value={`${budget.startDate || "Not set"} - ${budget.endDateOptional ? "Ongoing" : budget.endDate || "Not set"}`} />
                <ReviewRow label="Delivery" value={`${budget.pacing === "PACING_MODE_SMOOTH" ? "Standard" : "Accelerated"}${budget.skipLearningPhase ? " (skip learning)" : ""}`} />
                <ReviewRow label="Budget type" value={budget.paymentMethod === "prepaid" ? "Prepaid (Fixed)" : "Pay as You Go"} />
              </SectionCard>

              {/* ---- Creative ---- */}
              <SectionCard>
                <SectionHeader icon={ImagePlus} title="Ad Creative" step={3} setStep={setStep} />
                <ReviewRow label="Identity" value={`${creative.identity?.identityType ?? "CUSTOMIZED_USER"} -- ${creative.identity?.displayName || "(not set)"}`} />
                <ReviewRow label="Avatar" value={creative.identity?.avatarPreviewUrl ? "Uploaded" : "Not set"} />
                <ReviewRow label="Total Ads" value={creative.ads.length} />
                <ReviewRow label="Placement" value={creative.placementType === "PLACEMENT_TYPE_AUTOMATIC" ? "Automatic" : "Manual"} />
                {creative.ads.map((ad, i) => (
                  <div key={ad.id} className="mt-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <p className="text-xs font-medium text-foreground">Ad {i + 1}: {ad.name || "Untitled"}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{FORMAT_LABELS[ad.adFormat] || ad.adFormat}</span>
                      {ad.adFormat === "SPARK_AD" ? (
                        <span>Auth: {ad.sparkAdAuthCode ? "Provided" : "Missing"}</span>
                      ) : (
                        <>
                          <span>CTA: {ad.callToAction}</span>
                          {ad.landingPageUrl && <span className="max-w-[200px] truncate">{ad.landingPageUrl}</span>}
                        </>
                      )}
                      {/* Music status */}
                      {ad.adFormat === "CAROUSEL" && (
                        <span className={ad.musicFile ? "text-primary" : "text-destructive"}>{ad.musicFile ? "Music: Uploaded" : "Music: Missing (required)"}</span>
                      )}
                      {(ad.adFormat === "SINGLE_VIDEO" || ad.adFormat === "SINGLE_IMAGE") && !ad.promotionalMusicDisabled && (
                        <span className="text-primary">{ad.musicFile ? "Music: Custom" : "Music: Enabled"}</span>
                      )}
                      {/* Tracking */}
                      {ad.clickTrackingUrl && <span>Click tracking</span>}
                      {ad.impressionTrackingUrl && <span>Impression tracking</span>}
                      {ad.aigcDisclosureType === "DECLARED" && <span>AIGC disclosed</span>}
                    </div>
                  </div>
                ))}
              </SectionCard>

              {/* ---- Coupon ---- */}
              <SectionCard>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Promo Code</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    disabled={couponApplied}
                    className="h-9 text-sm"
                  />
                  <Button
                    variant={couponApplied ? "outline" : "default"}
                    size="sm"
                    disabled={couponApplied || !coupon}
                    onClick={() => setCouponApplied(true)}
                    className="shrink-0"
                  >
                    {couponApplied ? "Applied" : "Apply"}
                  </Button>
                </div>
                {couponApplied && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="size-3" />
                    Code applied! You get 20% off your first 7 days.
                  </p>
                )}
              </SectionCard>

              {/* ---- API JSON ---- */}
              <SectionCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="size-4 text-primary" />
                    <Label className="text-sm font-semibold text-foreground">TikTok API Payload</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiJson(!showApiJson)}
                    className="text-xs"
                  >
                    {showApiJson ? "Hide" : "Show JSON"}
                  </Button>
                </div>
                {showApiJson && (
                  <div className="relative mt-3">
                    <pre className="max-h-[300px] overflow-auto rounded-lg bg-muted p-4 text-xs leading-relaxed text-foreground">
                      {JSON.stringify(apiJson, null, 2)}
                    </pre>
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-md border bg-background p-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(apiJson, null, 2));
                        setJsonCopied(true);
                        setTimeout(() => setJsonCopied(false), 2000);
                      }}
                    >
                      {jsonCopied ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                )}
              </SectionCard>

              {/* ---- Total & Terms ---- */}
              <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-bold text-foreground">Total Estimated Budget</p>
                    <p className="text-xs text-muted-foreground">{durationDays} days at SAR {budget.amount}/day</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">SAR {totalBudget.toLocaleString()}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded border-border"
                  />
                  <span className="text-muted-foreground leading-relaxed">
                    I agree to TikTok Ads Terms of Service and Salla Ads billing terms. Ads will be reviewed by TikTok before going live (usually within 24 hours).
                  </span>
                </label>
              </div>

            </div>
          </div>
        </div>
        <WizardStepFooter
          onPrevious={() => setStep(3)}
          onNext={() => setShowLaunchConfirm(true)}
          previousLabel="Previous"
          nextLabel="Launch Campaign"
          nextDisabled={!allPassed || !agreedToTerms || launching}
          nextLoading={launching}
          nextIcon={<Rocket className="size-4" />}
          secondaryAction={{
            label: savedAsDraft ? "Saved!" : "Save Draft",
            onClick: () => setSavedAsDraft(true),
            disabled: savedAsDraft,
          }}
        />

        {/* Launch confirmation dialog */}
        <Dialog open={showLaunchConfirm} onOpenChange={setShowLaunchConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Launch TikTok Campaign?</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are about to launch "{objective.campaignName}" with a daily budget of SAR {budget.amount}.
              </p>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <ReviewRow label="Daily spend" value={`SAR ${budget.amount}`} />
                <ReviewRow label="Duration" value={`${durationDays} days`} />
                <ReviewRow label="Total" value={`SAR ${totalBudget.toLocaleString()}`} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowLaunchConfirm(false)}>Cancel</Button>
                <Button onClick={() => { setShowLaunchConfirm(false); handleLaunch(); }} className="gap-2">
                  <Rocket className="size-4" />
                  Confirm Launch
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
