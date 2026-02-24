"use client";

import { useState, useMemo } from "react";
import { useMetaCampaign } from "@/lib/meta/campaign-context";
import { META_OBJECTIVE_CONFIGS, getDestinationType } from "@/lib/meta/campaign-types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Pencil,
  Globe,
  Calendar,
  Target,
  CreditCard,
  Copy,
  Save,
  Code2,
  ArrowLeft,
  Tag,
  Zap,
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
  icon: React.ElementType; title: string; step: number; setStep: (s: number) => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-[#1877F2]" />
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
      </div>
      <button
        type="button"
        onClick={() => setStep(step)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-[#1877F2] transition-colors hover:bg-[#1877F2]/10"
      >
        <Pencil className="size-3" />
        Edit
      </button>
    </div>
  );
}

/* Label maps */
const COUNTRY_MAP: Record<string, string> = {
  SA: "Saudi Arabia", AE: "UAE", KW: "Kuwait", BH: "Bahrain",
  OM: "Oman", QA: "Qatar", EG: "Egypt", JO: "Jordan", IQ: "Iraq",
};

const GOAL_LABELS: Record<string, string> = {
  OFFSITE_CONVERSIONS: "Maximum Conversions",
  VALUE: "Maximum Value (ROAS)",
  LINK_CLICKS: "Link Clicks",
  CONVERSATIONS: "Conversations",
};

const EVENT_LABELS: Record<string, string> = {
  PURCHASE: "Purchase",
  INITIATE_CHECKOUT: "Initiate Checkout",
  ADD_TO_CART: "Add to Cart",
  VIEW_CONTENT: "View Content",
  ADD_PAYMENT_INFO: "Add Payment Info",
  COMPLETE_REGISTRATION: "Registration",
};

const BID_LABELS: Record<string, string> = {
  LOWEST_COST_WITHOUT_CAP: "Lowest Cost (Auto)",
  COST_CAP: "Cost Cap",
  LOWEST_COST_WITH_BID_CAP: "Bid Cap",
  LOWEST_COST_WITH_MIN_ROAS: "Minimum ROAS",
};

const FORMAT_LABELS: Record<string, string> = {
  SINGLE_IMAGE: "Single Image",
  SINGLE_VIDEO: "Single Video",
  CAROUSEL: "Carousel",
  COLLECTION: "Catalog Ads (Collection)",
  DYNAMIC: "Catalog Ads",
};

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

export function MetaStepReview() {
  const { campaign, setStep, reset } = useMetaCampaign();
  const { objective, audience, budget, creative } = campaign;
  const objConfig = META_OBJECTIVE_CONFIGS[objective.objective] ?? META_OBJECTIVE_CONFIGS.OUTCOME_SALES;

  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showLaunchConfirm, setShowLaunchConfirm] = useState(false);
  const [savedAsDraft, setSavedAsDraft] = useState(false);
  const [showApiJson, setShowApiJson] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  /* Duration */
  const durationDays = useMemo(() => {
    if (budget.startDate && budget.endDate) {
      return Math.max(1, Math.ceil((new Date(budget.endDate).getTime() - new Date(budget.startDate).getTime()) / 86400000));
    }
    return 14;
  }, [budget.startDate, budget.endDate]);

  const totalBudget = budget.budgetType === "lifetime" ? budget.amount : budget.amount * durationDays;

  /* Validation */
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
      ok: audience.countries.length > 0,
      detail: audience.countries.map((c) => COUNTRY_MAP[c] || c).join(", ") || "None",
    });

    list.push({
      id: "page",
      label: "Facebook Page set",
      ok: !!objective.facebookPageName.trim(),
      detail: objective.facebookPageName || "Missing",
    });

    list.push({
      id: "pixel",
      label: "Meta Pixel configured",
      ok: objective.pixelMode !== "none" && (objective.pixelMode === "salla_managed" || !!objective.pixelId),
      detail: objective.pixelMode === "salla_managed" ? "Salla Managed" : objective.pixelId ? "Connected" : "Missing",
    });

    list.push({
      id: "budget",
      label: "Budget configured",
      ok: budget.amount > 0,
      detail: `SAR ${budget.amount}/day`,
    });

    list.push({
      id: "creative",
      label: "At least 1 ad created",
      ok: creative.ads.length > 0,
      detail: `${creative.ads.length} ad(s)`,
    });

    list.push({
      id: "ad_copy",
      label: "Ad copy completed",
      ok: creative.ads.length > 0 && creative.ads.every((a) => a.primaryText && a.headline),
      detail: creative.ads.length > 0 && creative.ads.every((a) => a.primaryText && a.headline) ? "Complete" : "Missing text",
    });

    list.push({
      id: "url",
      label: "Landing page URL set",
      ok: creative.ads.length > 0 && creative.ads.every((a) => a.websiteUrl),
      detail: creative.ads[0]?.websiteUrl || "Missing",
    });

    return list;
  }, [objective, audience, budget, creative]);

  const allPassed = checks.every((c) => c.ok);

  /* API JSON -- aligned to Meta Marketing API v24 (Graph API) */
  const destinationType = getDestinationType(objective.objective, objective.conversionLocation);

  const apiJson = useMemo(() => {
    const clickDays = budget.clickAttributionWindow === "1d_click" ? 1 : budget.clickAttributionWindow === "7d_click" ? 7 : 28;
    const viewDays = budget.viewAttributionWindow === "1d_view" ? 1 : budget.viewAttributionWindow === "7d_view" ? 7 : 0;

    return {
      // POST /act_{ad_account_id}/campaigns
      campaign: {
        name: objective.campaignName,
        objective: objective.objective,
        special_ad_categories: objective.specialAdCategories.filter((c) => c !== "NONE"),
        bid_strategy: budget.bidStrategy,
        ...(budget.bidStrategy === "COST_CAP" && budget.bidAmount > 0 && { daily_budget: undefined }),
        status: "PAUSED",
      },
      // POST /act_{ad_account_id}/adsets
      ad_set: {
        name: `${objective.campaignName} - Ad Set`,
        campaign_id: "<CAMPAIGN_ID>",
        optimization_goal: budget.optimizationGoal,
        billing_event: budget.billingEvent || "IMPRESSIONS",
        destination_type: destinationType,
        // Budget (amounts in cents per Meta API)
        ...(budget.budgetType === "daily" && { daily_budget: Math.round(budget.amount * 100) }),
        ...(budget.budgetType === "lifetime" && { lifetime_budget: Math.round(budget.amount * 100) }),
        start_time: budget.startDate || undefined,
        end_time: budget.endDate || undefined,
        // Bid controls
        ...(budget.bidStrategy === "COST_CAP" && budget.bidAmount > 0 && { bid_amount: Math.round(budget.bidAmount * 100) }),
        ...(budget.bidStrategy === "LOWEST_COST_WITH_BID_CAP" && budget.bidAmount > 0 && { bid_amount: Math.round(budget.bidAmount * 100) }),
        ...(budget.bidStrategy === "LOWEST_COST_WITH_MIN_ROAS" && { roas_average_floor: budget.roasTarget }),
        // Promoted Object (required for OUTCOME_SALES)
        promoted_object: {
          pixel_id: objective.pixelId || "<PIXEL_ID>",
          custom_event_type: budget.conversionEvent,
          ...(objective.facebookPageId && { page_id: objective.facebookPageId }),
          ...(objective.catalogEnabled && objective.catalogId && { product_catalog_id: objective.catalogId }),
        },
        // Targeting
        targeting: {
          geo_locations: {
            countries: audience.countries,
          },
          age_min: audience.ageMin,
          age_max: audience.ageMax,
          ...(audience.gender !== "ALL" && { genders: audience.gender === "MALE" ? [1] : [2] }),
          ...(audience.languages.length > 0 && { locales: audience.languages }),
          ...(audience.interests.length > 0 && {
            flexible_spec: [{ interests: audience.interests.map((id) => ({ id, name: id })) }],
          }),
          ...(objective.placementMode === "MANUAL" && {
            publisher_platforms: objective.publisherPlatforms,
            facebook_positions: objective.facebookPositions,
            instagram_positions: objective.instagramPositions,
          }),
          ...(audience.customAudienceIds.length > 0 && {
            custom_audiences: audience.customAudienceIds.map((id) => ({ id })),
          }),
          ...(audience.excludedAudienceIds.length > 0 && {
            excluded_custom_audiences: audience.excludedAudienceIds.map((id) => ({ id })),
          }),
        },
        // Attribution spec
        attribution_spec: [
          { event_type: "CLICK_THROUGH", window_days: clickDays },
          ...(viewDays > 0 ? [{ event_type: "VIEW_THROUGH", window_days: viewDays }] : []),
        ],
        status: "PAUSED",
      },
      // POST /act_{ad_account_id}/ads (one per ad creative)
      ads: creative.ads.map((ad) => ({
        name: ad.name,
        adset_id: "<ADSET_ID>",
        status: "PAUSED",
        creative: {
          // object_story_spec is the correct format for link ads
          object_story_spec: {
            page_id: objective.facebookPageId || "<PAGE_ID>",
            ...(objective.instagramAccountId && { instagram_actor_id: objective.instagramAccountId }),
            link_data: {
              link: ad.websiteUrl,
              message: ad.primaryText,
              name: ad.headline,
              description: ad.description,
              call_to_action: {
                type: ad.callToAction,
                value: { link: ad.websiteUrl },
              },
              ...(ad.assets.length > 0 && ad.assets[0].type === "IMAGE" && { image_hash: "<IMAGE_HASH>" }),
            },
          },
        },
        tracking_specs: [
          { "action.type": ["offsite_conversion"], fb_pixel: [objective.pixelId || "<PIXEL_ID>"] },
        ],
      })),
    };
  }, [objective, audience, budget, creative, destinationType]);

  /* Launch handler */
  const handleLaunch = async () => {
    setLaunching(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLaunching(false);
    setLaunched(true);
    setShowLaunchConfirm(false);
  };

  if (launched) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100">
          <Rocket className="size-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campaign Submitted!</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Your Meta Sales campaign <span className="font-semibold text-foreground">{objective.campaignName}</span> has been submitted to Meta for review. It typically takes 24 hours for ads to be approved and start delivering.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-lg font-bold text-foreground">SAR {totalBudget.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Budget</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-lg font-bold text-foreground">{creative.ads.length}</p>
            <p className="text-xs text-muted-foreground">Ad(s)</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-lg font-bold text-foreground">{audience.countries.length}</p>
            <p className="text-xs text-muted-foreground">Countries</p>
          </div>
        </div>
        <Button onClick={reset} variant="outline" className="mt-4">
          Create Another Campaign
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============================================================ */}
        {/* LEFT COLUMN                                                   */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">

          {/* ---- Objective ---- */}
          <SectionCard>
            <SectionHeader icon={ShoppingBag} title="Objective" step={0} setStep={setStep} />
            <ReviewRow label="Objective" value={objConfig.label} />
            <ReviewRow label="Campaign Name" value={objective.campaignName || "Not set"} warn={!objective.campaignName} />
            <ReviewRow label="Pixel" value={objective.pixelMode === "salla_managed" ? "Salla Managed" : objective.pixelId || "Not set"} warn={objective.pixelMode === "none"} />
            <ReviewRow label="Conversion Location" value={objective.conversionLocation} />
            <ReviewRow label="Destination Type" value={destinationType} />
            <ReviewRow label="Facebook Page" value={objective.facebookPageName || "Not set"} warn={!objective.facebookPageName} />
            {objective.instagramAccountName && (
              <ReviewRow label="Instagram Account" value={objective.instagramAccountName} />
            )}
            <ReviewRow label="Placements" value={objective.placementMode === "AUTOMATIC" ? "Advantage+ (Auto)" : objective.publisherPlatforms.join(", ")} />
          </SectionCard>

          {/* ---- Audience ---- */}
          <SectionCard>
            <SectionHeader icon={Users} title="Audience" step={1} setStep={setStep} />
            <ReviewRow label="Countries" value={audience.countries.map((c) => COUNTRY_MAP[c] || c).join(", ") || "None"} warn={audience.countries.length === 0} />
            <ReviewRow label="Gender" value={audience.gender === "ALL" ? "All" : audience.gender === "MALE" ? "Male" : "Female"} />
            <ReviewRow label="Age" value={`${audience.ageMin} - ${audience.ageMax === 65 ? "65+" : audience.ageMax}`} />
            <ReviewRow label="Languages" value={audience.languages.join(", ") || "All"} />
            <ReviewRow label="Interests" value={audience.interests.length > 0 ? `${audience.interests.length} selected` : "Broad"} />
            <ReviewRow label="Advantage+" value={audience.advantagePlusAudience ? "Enabled" : "Disabled"} />
          </SectionCard>

          {/* ---- Budget ---- */}
          <SectionCard>
            <SectionHeader icon={DollarSign} title="Budget & Optimization" step={2} setStep={setStep} />
            <ReviewRow label="Budget Type" value={budget.budgetType === "daily" ? "Daily" : "Lifetime"} />
            <ReviewRow label="Amount" value={`SAR ${budget.amount.toLocaleString()}${budget.budgetType === "daily" ? "/day" : " total"}`} />
            <ReviewRow label="Duration" value={`${durationDays} days`} />
            <ReviewRow label="Est. Total" value={`SAR ${totalBudget.toLocaleString()}`} />
            <div className="my-1 border-t border-border" />
            <ReviewRow label="Conversion Event" value={EVENT_LABELS[budget.conversionEvent] || budget.conversionEvent} />
            <ReviewRow label="Optimization" value={GOAL_LABELS[budget.optimizationGoal] || budget.optimizationGoal} />
            <ReviewRow label="Billing Event" value={budget.billingEvent || "IMPRESSIONS"} />
            <ReviewRow label="Bid Strategy" value={BID_LABELS[budget.bidStrategy] || budget.bidStrategy} />
            {(budget.bidStrategy === "COST_CAP" || budget.bidStrategy === "LOWEST_COST_WITH_BID_CAP") && budget.bidAmount > 0 && (
              <ReviewRow label="Bid Amount" value={`SAR ${budget.bidAmount}`} />
            )}
            {budget.bidStrategy === "LOWEST_COST_WITH_MIN_ROAS" && (
              <ReviewRow label="Min ROAS" value={`${budget.roasTarget}x`} />
            )}
            <ReviewRow label="Attribution" value={`${budget.clickAttributionWindow === "7d_click" ? "7d" : budget.clickAttributionWindow === "1d_click" ? "1d" : "28d"} click + ${budget.viewAttributionWindow === "1d_view" ? "1d" : budget.viewAttributionWindow === "7d_view" ? "7d" : "no"} view`} />
          </SectionCard>

          {/* ---- Creative ---- */}
          <SectionCard>
            <SectionHeader icon={ImagePlus} title="Ad Creative" step={3} setStep={setStep} />
            {creative.ads.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <AlertCircle className="size-3.5 text-amber-600" />
                <span className="text-xs text-amber-700">No ads created yet</span>
              </div>
            ) : (
              <div className="space-y-3">
                {creative.ads.map((ad, i) => (
                  <div key={ad.id} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{ad.name}</span>
                      <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">
                        {FORMAT_LABELS[ad.adFormat] || ad.adFormat}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                      <span>Headline: {ad.headline || "Not set"}</span>
                      <span>CTA: {ad.callToAction}</span>
                      <span>URL: {ad.websiteUrl || "Not set"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowApiJson(true)} className="gap-1.5 text-muted-foreground">
              <Code2 className="size-4" />
              View API JSON
            </Button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN                                                  */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* Validation */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#1877F2]" />
                <Label className="text-sm font-semibold text-foreground">Launch Checklist</Label>
              </div>
              <div className="flex flex-col gap-1.5">
                {checks.map((check) => (
                  <div key={check.id} className="flex items-center gap-2">
                    {check.ok ? (
                      <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="size-3 shrink-0 text-amber-500" />
                    )}
                    <span className={cn("text-xs", check.ok ? "text-muted-foreground" : "text-amber-700")}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className={cn(
                "mt-3 rounded-lg px-3 py-2 text-xs font-medium",
                allPassed
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-amber-200 bg-amber-50 text-amber-700"
              )}>
                {allPassed
                  ? "All checks passed. Ready to launch!"
                  : `${checks.filter((c) => !c.ok).length} issue(s) need attention`}
              </div>
            </SectionCard>

            {/* Cost Summary */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <DollarSign className="size-4 text-[#1877F2]" />
                <Label className="text-sm font-semibold text-foreground">Cost Summary</Label>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{budget.budgetType === "daily" ? "Daily Budget" : "Total Budget"}</span>
                  <span className="font-medium text-foreground">SAR {budget.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-foreground">{durationDays} days</span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Estimated Total</span>
                    <span className="font-bold text-[#1877F2]">SAR {totalBudget.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="mt-4 flex gap-2">
                <Input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Promo code"
                  className="h-8 text-xs"
                  disabled={couponApplied}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!coupon || couponApplied}
                  onClick={() => setCouponApplied(true)}
                  className="h-8 text-xs"
                >
                  {couponApplied ? "Applied" : "Apply"}
                </Button>
              </div>
            </SectionCard>

            {/* Terms */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <label className="flex cursor-pointer items-start gap-2">
                <Checkbox
                  checked={agreedToTerms}
                  onCheckedChange={(v) => setAgreedToTerms(!!v)}
                  className="mt-0.5 data-[state=checked]:border-[#1877F2] data-[state=checked]:bg-[#1877F2]"
                />
                <span className="text-xs leading-relaxed text-muted-foreground">
                  I agree to the <span className="font-medium text-foreground underline">Meta Advertising Policies</span> and <span className="font-medium text-foreground underline">Salla Ads Terms of Service</span>. I understand my campaign will be reviewed before delivery begins.
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Launch Confirmation Dialog ---- */}
      <Dialog open={showLaunchConfirm} onOpenChange={setShowLaunchConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="size-5 text-[#1877F2]" />
              Confirm Launch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are about to submit your campaign <span className="font-semibold text-foreground">{objective.campaignName}</span> to Meta for review and delivery.
            </p>
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Spend</span>
                <span className="font-bold text-foreground">SAR {totalBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ads</span>
                <span className="font-medium text-foreground">{creative.ads.length}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLaunchConfirm(false)}>Cancel</Button>
              <Button
                onClick={handleLaunch}
                disabled={launching}
                className="gap-1.5 bg-[#1877F2] hover:bg-[#1877F2]/90"
              >
                {launching ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting...
                  </span>
                ) : (
                  <>
                    <Rocket className="size-4" />
                    Launch Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- API JSON Dialog ---- */}
      <Dialog open={showApiJson} onOpenChange={setShowApiJson}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="size-5 text-[#1877F2]" />
              Meta Marketing API Payload
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <pre className="max-h-[50vh] overflow-auto rounded-lg bg-muted p-4 text-xs">
              {JSON.stringify(apiJson, null, 2)}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-2 gap-1.5"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(apiJson, null, 2));
                setJsonCopied(true);
                setTimeout(() => setJsonCopied(false), 2000);
              }}
            >
              <Copy className="size-3" />
              {jsonCopied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <WizardStepFooter
        onPrevious={() => setStep(3)}
        onNext={() => setShowLaunchConfirm(true)}
        previousLabel="Previous"
        nextLabel="Launch Campaign"
        nextDisabled={!allPassed || !agreedToTerms || launching}
        nextLoading={launching}
        nextIcon={<Rocket className="size-4" />}
        accent="meta"
        secondaryAction={{
          label: savedAsDraft ? "Saved" : "Save Draft",
          onClick: () => setSavedAsDraft(true),
          disabled: savedAsDraft,
        }}
      />
    </TooltipProvider>
  );
}
