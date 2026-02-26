"use client";

import { useState, useMemo } from "react";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { useDV360Campaign } from "@/lib/dv360/campaign-context";
import { DV360_OBJECTIVE_CONFIGS, createVideoAd, type DV360VideoFormat, type DV360VideoAd } from "@/lib/dv360/campaign-types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  PlayCircle,
  Link2,
  Image as ImageIcon,
  Eye,
  ExternalLink,
  Video,
  SkipForward,
  Clock,
  Type,
  MousePointerClick,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";

/* ================================================================== */
/*  Helpers                                                           */
/* ================================================================== */

/* ================================================================== */
/*  Video format metadata                                             */
/* ================================================================== */

const FORMAT_INFO: Record<DV360VideoFormat, { label: string; desc: string; maxDuration: string; icon: React.ReactNode }> = {
  SKIPPABLE_IN_STREAM: { label: "Skippable In-Stream", desc: "Plays before, during, or after a video. Skip after 5 seconds.", maxDuration: "No max (15s-3min recommended)", icon: <SkipForward className="size-4" /> },
  NON_SKIPPABLE_IN_STREAM: { label: "Non-Skippable In-Stream", desc: "15-second forced ad. Viewer must watch the entire ad.", maxDuration: "15 seconds", icon: <PlayCircle className="size-4" /> },
  BUMPER: { label: "Bumper", desc: "6-second non-skippable ad. Great for brand recall.", maxDuration: "6 seconds", icon: <Clock className="size-4" /> },
  IN_FEED: { label: "In-Feed Video", desc: "Appears in YouTube search, related, and Discover feed.", maxDuration: "No max", icon: <Eye className="size-4" /> },
  SHORTS: { label: "YouTube Shorts", desc: "Vertical video ads in the Shorts feed. Up to 60 seconds.", maxDuration: "60 seconds (vertical 9:16)", icon: <Video className="size-4" /> },
};

/* ================================================================== */
/*  YouTube URL helpers                                               */
/* ================================================================== */

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

export function DV360StepCreative() {
  const { campaign, setStep, updateNested } = useDV360Campaign();
  const creative = campaign.creative;
  const obj = campaign.objective;
  const config = DV360_OBJECTIVE_CONFIGS[obj.objective];

  const [activeAdIdx, setActiveAdIdx] = useState(0);
  const ads = creative.videoAds;
  const activeAd = ads[activeAdIdx] || ads[0];

  const updateAd = (idx: number, patch: Partial<DV360VideoAd>) => {
    const updated = ads.map((ad, i) => i === idx ? { ...ad, ...patch } : ad);
    updateNested("creative", { videoAds: updated });
  };

  const addAd = () => {
    const newAd = createVideoAd(obj.objective);
    updateNested("creative", { videoAds: [...ads, newAd] });
    setActiveAdIdx(ads.length);
  };

  const removeAd = (idx: number) => {
    if (ads.length <= 1) return;
    const updated = ads.filter((_, i) => i !== idx);
    updateNested("creative", { videoAds: updated });
    setActiveAdIdx(Math.min(activeAdIdx, updated.length - 1));
  };

  const videoId = activeAd ? extractYouTubeId(activeAd.youtubeVideoUrl) : null;

  // Format change handler
  const handleFormatChange = (format: DV360VideoFormat) => {
    const skippable = format === "SKIPPABLE_IN_STREAM" || format === "IN_FEED";
    updateAd(activeAdIdx, { videoFormat: format, skippable });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex gap-8", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ============ MAIN CONTENT ============ */}
        <div className="min-w-0 flex-1">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Video Ads</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Build your YouTube video ads. Each ad creates a Line Item with a Creative in DV360.
            </p>
          </div>

          {/* Ad tabs */}
          <div className="mb-4 flex items-center gap-2 overflow-x-auto">
            {ads.map((ad, i) => (
              <div
                key={ad.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveAdIdx(i)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveAdIdx(i); } }}
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                  activeAdIdx === i
                    ? "border-red-600 bg-red-600/[0.04] text-red-600"
                    : "border-border bg-background text-foreground hover:border-red-400"
                )}
              >
                <Video className="size-3.5" />
                {ad.name || `Video Ad ${i + 1}`}
                {ads.length > 1 && activeAdIdx === i && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeAd(i); }}
                    className="ml-1 inline-flex rounded-full p-0.5 hover:bg-red-100 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addAd} className="shrink-0 gap-1 text-[10px]">
              <Plus className="size-3" /> Add Ad
            </Button>
          </div>

          {activeAd && (
            <div className="flex flex-col gap-5">

              {/* Ad Name */}
              <SectionCard>
                <Label className="mb-1.5 text-xs font-semibold text-foreground">Ad Name</Label>
                <Input
                  value={activeAd.name}
                  onChange={(e) => updateAd(activeAdIdx, { name: e.target.value })}
                  placeholder="e.g., Ramadan 2026 - Skippable 30s"
                  className="h-9 text-xs"
                  maxLength={100}
                />
              </SectionCard>

              {/* YouTube Video URL */}
              <SectionCard>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-red-600/10">
                    <PlayCircle className="size-4 text-red-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">YouTube Video</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Paste a YouTube video URL. The video must be uploaded to YouTube (unlisted or public).
                    </p>
                  </div>
                </div>

                <Input
                  value={activeAd.youtubeVideoUrl}
                  onChange={(e) => updateAd(activeAdIdx, { youtubeVideoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="h-10 font-mono text-xs"
                />

                {/* Video preview */}
                {videoId && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-border">
                    <div className="relative aspect-video w-full bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                        title="Video preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 size-full"
                      />
                    </div>
                  </div>
                )}

                {!videoId && activeAd.youtubeVideoUrl && (
                  <p className="mt-2 text-[10px] text-destructive">Invalid YouTube URL. Please paste a valid YouTube video link.</p>
                )}
              </SectionCard>

              {/* Video Format */}
              <SectionCard>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-red-600/10">
                    <Video className="size-4 text-red-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Video Format</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Maps to the creative type and line item's <code className="rounded bg-muted px-1 text-[10px]">youtubeAndPartnersSettings</code>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {config.allowedVideoFormats.map((fmt) => {
                    const info = FORMAT_INFO[fmt];
                    const isSelected = activeAd.videoFormat === fmt;
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => handleFormatChange(fmt)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                          isSelected
                            ? "border-red-600/30 bg-red-600/[0.04]"
                            : "border-border bg-background hover:border-red-400/40"
                        )}
                      >
                        <div className={cn(
                          "flex size-8 items-center justify-center rounded-lg",
                          isSelected ? "bg-red-600/10 text-red-600" : "bg-muted text-muted-foreground"
                        )}>
                          {info.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">{info.label}</p>
                          <p className="text-[10px] text-muted-foreground">{info.desc}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 rounded-full text-[9px]">{info.maxDuration}</Badge>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              {/* CTA, Display URL, Landing Page */}
              <SectionCard>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-red-600/10">
                    <Link2 className="size-4 text-red-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Ad Details</Label>
                    <p className="text-[11px] text-muted-foreground">Call-to-action, display URL, and landing page</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {(activeAd.videoFormat === "IN_FEED" || activeAd.videoFormat === "SHORTS") && (
                    <>
                      <div>
                        <Label className="mb-1 text-xs font-semibold text-foreground">Headline <InfoTip text="Shown in the YouTube feed thumbnail card. Max 100 characters." /></Label>
                        <Input
                          value={activeAd.headline}
                          onChange={(e) => updateAd(activeAdIdx, { headline: e.target.value })}
                          placeholder="Your catchy headline"
                          className="h-9 text-xs"
                          maxLength={100}
                        />
                        <p className="mt-0.5 text-[9px] text-muted-foreground">{activeAd.headline.length}/100</p>
                      </div>
                      <div>
                        <Label className="mb-1 text-xs font-semibold text-foreground">Description</Label>
                        <Textarea
                          value={activeAd.description}
                          onChange={(e) => updateAd(activeAdIdx, { description: e.target.value })}
                          placeholder="Brief description of your ad"
                          className="min-h-[60px] text-xs"
                          maxLength={200}
                        />
                        <p className="mt-0.5 text-[9px] text-muted-foreground">{activeAd.description.length}/200</p>
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="mb-1 text-xs font-semibold text-foreground">Call-to-Action <InfoTip text="Button text shown on the ad. Maps to Creative.exitEvents CTA." /></Label>
                    <Select
                      value={activeAd.callToAction || "none"}
                      onValueChange={(v) => updateAd(activeAdIdx, { callToAction: v === "none" ? "" : v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select CTA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No CTA</SelectItem>
                        <SelectItem value="Shop now">Shop now</SelectItem>
                        <SelectItem value="Learn more">Learn more</SelectItem>
                        <SelectItem value="Sign up">Sign up</SelectItem>
                        <SelectItem value="Subscribe">Subscribe</SelectItem>
                        <SelectItem value="Get offer">Get offer</SelectItem>
                        <SelectItem value="Contact us">Contact us</SelectItem>
                        <SelectItem value="Download">Download</SelectItem>
                        <SelectItem value="Book now">Book now</SelectItem>
                        <SelectItem value="Watch more">Watch more</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-1 text-xs font-semibold text-foreground">Display URL <InfoTip text="Shortened URL shown on the ad overlay. E.g., store.salla.sa" /></Label>
                    <Input
                      value={activeAd.displayUrl}
                      onChange={(e) => updateAd(activeAdIdx, { displayUrl: e.target.value })}
                      placeholder="store.salla.sa"
                      className="h-9 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label className="mb-1 text-xs font-semibold text-foreground">Landing Page URL <InfoTip text="Where users go when they click the ad. Maps to Creative.exitEvents.url." /></Label>
                    <Input
                      value={activeAd.landingPageUrl}
                      onChange={(e) => updateAd(activeAdIdx, { landingPageUrl: e.target.value })}
                      placeholder="https://store.salla.sa/products/..."
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Awareness: Creative Best Practices */}
              {obj.objective === "AWARENESS" && (
                <div className="rounded-xl border border-red-200/50 bg-red-50/30 p-5 dark:border-red-800/30 dark:bg-red-950/10">
                  <div className="mb-3 flex items-center gap-2">
                    <Eye className="size-4 text-red-600" />
                    <p className="text-sm font-semibold text-foreground">Awareness Creative Best Practices</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { title: "Brand in First 5s", desc: "Show your logo and brand name within the first 5 seconds -- even viewers who skip will see it." },
                      { title: "6s Bumper Power", desc: "Bumper ads are great for reach and recall. One clear message, no wasted time. Keep it simple and memorable." },
                      { title: "Sight + Sound + Motion", desc: "Use bold visuals, music, and motion to create emotional impact. YouTube is a lean-back environment." },
                      { title: "Mix Formats", desc: "Combine Skippable (storytelling) + Bumper (recall) + Non-Skippable (full message) for maximum awareness." },
                    ].map((tip) => (
                      <div key={tip.title} className="rounded-lg border border-red-200/40 bg-background px-3 py-2 dark:border-red-800/20">
                        <p className="text-[11px] font-semibold text-foreground">{tip.title}</p>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{tip.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-red-600">Reach tip:</span> For maximum reach, use Non-Skippable (15s) to ensure your full message is seen, combined with Bumpers for frequency reinforcement. Target CPM bidding optimizes for the lowest cost per impression.
                  </p>
                </div>
              )}

              {/* Consideration: Creative Tips */}
              {obj.objective === "CONSIDERATION" && (
                <div className="rounded-xl border border-blue-200/50 bg-blue-50/30 p-5 dark:border-blue-800/30 dark:bg-blue-950/10">
                  <div className="mb-3 flex items-center gap-2">
                    <Eye className="size-4 text-blue-600" />
                    <p className="text-sm font-semibold text-foreground">Consideration Creative Best Practices</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { title: "Hook in First 5s", desc: "Grab attention immediately -- 65% of viewers decide to skip within the first 5 seconds." },
                      { title: "Brand Early", desc: "Show your brand within the first 5 seconds so even skippers see it." },
                      { title: activeAd?.videoFormat === "IN_FEED" ? "Strong Thumbnail" : activeAd?.videoFormat === "SHORTS" ? "Vertical 9:16" : "30s+ for CPV", desc: activeAd?.videoFormat === "IN_FEED" ? "In-Feed ads need a compelling thumbnail and headline to earn clicks." : activeAd?.videoFormat === "SHORTS" ? "Use vertical video (9:16 aspect ratio) for maximum Shorts engagement." : "A view is counted at 30 seconds. Make the first 30s compelling." },
                      { title: "CTA is Key", desc: "For consideration, use 'Learn more' or 'Watch more' CTAs to drive engagement." },
                    ].map((tip) => (
                      <div key={tip.title} className="rounded-lg border border-blue-200/40 bg-background px-3 py-2 dark:border-blue-800/20">
                        <p className="text-[11px] font-semibold text-foreground">{tip.title}</p>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{tip.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversion: Creative Best Practices */}
              {obj.objective === "CONVERSION" && (
                <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/30 p-5 dark:border-emerald-800/30 dark:bg-emerald-950/10">
                  <div className="mb-3 flex items-center gap-2">
                    <MousePointerClick className="size-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-foreground">Conversion Creative Best Practices</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { title: "Strong CTA", desc: "Use action-driven CTAs like 'Shop now', 'Get offer', or 'Sign up'. Make the next step clear." },
                      { title: "Show the Product", desc: "Feature your product/service prominently within the first 5 seconds. Viewers need to see what they're buying." },
                      { title: "Landing Page Match", desc: "Your landing page must match the ad's offer. Mismatches kill conversion rates." },
                      { title: "Urgency & Offers", desc: "Include limited-time offers, discounts, or free shipping to drive immediate action." },
                    ].map((tip) => (
                      <div key={tip.title} className="rounded-lg border border-emerald-200/40 bg-background px-3 py-2 dark:border-emerald-800/20">
                        <p className="text-[11px] font-semibold text-foreground">{tip.title}</p>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{tip.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-100/50 px-3 py-2 dark:bg-emerald-900/20">
                    <Target className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Conversion tip:</span> Skippable In-Stream is the top-performing format for conversions. Use In-Feed to capture users actively browsing YouTube. Both formats support prominent CTAs that drive clicks to your landing page.
                    </p>
                  </div>
                </div>
              )}

              {/* Performance: Multi-Format AI Optimization Tips */}
              {obj.objective === "PERFORMANCE" && (
                <div className="rounded-xl border border-orange-200/50 bg-orange-50/30 p-5 dark:border-orange-800/30 dark:bg-orange-950/10">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="size-4 text-orange-600" />
                    <p className="text-sm font-semibold text-foreground">Performance Multi-Format Best Practices</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { title: "Multiple Formats", desc: "Upload videos in different aspect ratios: 16:9 (landscape), 9:16 (vertical/Shorts), and 1:1 (square). DV360 AI will choose the best format per placement." },
                      { title: "3+ Video Assets", desc: "Provide at least 3 different video creatives. The AI tests them all and allocates more budget to top performers." },
                      { title: "Vary Video Length", desc: "Include a mix: 6s bumpers, 15s non-skippable, 30s+ skippable. AI will match length to placement and user context." },
                      { title: "Strong CTA Always", desc: "Every video needs a clear CTA. Performance campaigns maximize clicks -- give users a reason to act now." },
                    ].map((tip) => (
                      <div key={tip.title} className="rounded-lg border border-orange-200/40 bg-background px-3 py-2 dark:border-orange-800/20">
                        <p className="text-[11px] font-semibold text-foreground">{tip.title}</p>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{tip.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-orange-100/50 px-3 py-2 dark:bg-orange-900/20">
                    <Zap className="mt-0.5 size-3.5 shrink-0 text-orange-600" />
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-orange-700 dark:text-orange-400">AI optimization:</span> DV360 Simple line items automatically select the best combination of format, placement, and creative for each impression. Campaigns with 3+ diverse assets see 15-30% more conversions than single-format campaigns.
                    </p>
                  </div>
                </div>
              )}

              {/* Companion Banner */}
              <SectionCard>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-red-600/10">
                    <ImageIcon className="size-4 text-red-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Companion Banner</Label>
                    <p className="text-[11px] text-muted-foreground">
                      300x60 banner shown next to your video on desktop. Optional -- auto-generated if empty.
                    </p>
                  </div>
                </div>

                <Input
                  value={activeAd.companionBannerUrl}
                  onChange={(e) => updateAd(activeAdIdx, { companionBannerUrl: e.target.value })}
                  placeholder="Image URL (300x60px) or leave empty for auto-generated"
                  className="h-9 font-mono text-xs"
                />

                {activeAd.companionBannerUrl && (
                  <div className="mt-2 rounded-lg border border-border p-2">
                    <img
                      src={activeAd.companionBannerUrl}
                      alt="Companion banner preview"
                      className="h-[30px] w-[150px] rounded object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </div>

        {/* ============ RIGHT SIDEBAR -- Preview ============ */}
        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-24">
            {/* YouTube Player Preview */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Ad Preview</h3>

              {/* Mockup */}
              <div className="overflow-hidden rounded-lg border border-border bg-black">
                {/* Video area */}
                <div className="relative aspect-video w-full">
                  {videoId ? (
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                      alt="Video thumbnail"
                      className="absolute inset-0 size-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-neutral-900">
                      <PlayCircle className="size-12 text-neutral-600" />
                    </div>
                  )}

                  {/* Skip button overlay */}
                  {activeAd?.videoFormat === "SKIPPABLE_IN_STREAM" && (
                    <div className="absolute bottom-3 right-3 rounded bg-neutral-800/90 px-3 py-1.5 text-[10px] font-medium text-white">
                      Skip Ad {">>"}
                    </div>
                  )}

                  {/* Bumper badge */}
                  {activeAd?.videoFormat === "BUMPER" && (
                    <div className="absolute bottom-3 left-3 rounded bg-red-600/90 px-2 py-1 text-[9px] font-bold text-white">
                      6s BUMPER
                    </div>
                  )}

                  {/* Non-skippable badge */}
                  {activeAd?.videoFormat === "NON_SKIPPABLE_IN_STREAM" && (
                    <div className="absolute bottom-3 right-3 rounded bg-neutral-800/90 px-3 py-1.5 text-[10px] font-medium text-white">
                      Ad : 0:15
                    </div>
                  )}

                  {/* CTA overlay */}
                  {activeAd?.callToAction && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <div className="rounded bg-yellow-500 px-3 py-1 text-[10px] font-bold text-black">
                        {activeAd.callToAction}
                      </div>
                      {activeAd.displayUrl && (
                        <span className="text-[9px] text-white/80">{activeAd.displayUrl}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Format badge */}
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full text-[10px]">
                  {activeAd ? FORMAT_INFO[activeAd.videoFormat]?.label : "--"}
                </Badge>
                {activeAd?.skippable && (
                  <Badge variant="outline" className="rounded-full text-[10px]">Skippable</Badge>
                )}
              </div>
            </div>

            {/* In-Feed Discovery Preview (Consideration) */}
            {activeAd?.videoFormat === "IN_FEED" && (
              <div className="mt-4 rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">In-Feed Preview</h3>
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="flex gap-3">
                    <div className="relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800">
                      {videoId ? (
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                          alt="Thumbnail"
                          className="absolute inset-0 size-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <PlayCircle className="size-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground">
                        {activeAd.headline || "Your ad headline appears here"}
                      </p>
                      <p className="text-[9px] text-muted-foreground">{activeAd.displayUrl || "store.salla.sa"}</p>
                      <Badge className="mt-0.5 w-fit rounded bg-amber-100 px-1 py-0 text-[8px] font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Ad</Badge>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[9px] text-muted-foreground">This is how your ad appears in YouTube search results and the home feed.</p>
              </div>
            )}

            {/* Shorts Preview */}
            {activeAd?.videoFormat === "SHORTS" && (
              <div className="mt-4 rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Shorts Preview</h3>
                <div className="mx-auto w-[140px] overflow-hidden rounded-xl border border-border bg-black">
                  <div className="relative aspect-[9/16]">
                    {videoId ? (
                      <img
                        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                        alt="Shorts thumbnail"
                        className="absolute inset-0 size-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-neutral-900">
                        <Video className="size-8 text-neutral-600" />
                      </div>
                    )}
                    {/* Shorts UI overlay */}
                    <div className="absolute bottom-2 left-2 right-8">
                      <p className="line-clamp-2 text-[8px] font-semibold text-white drop-shadow-md">
                        {activeAd.headline || "Your Shorts caption"}
                      </p>
                      <Badge className="mt-0.5 rounded bg-amber-100/80 px-1 py-0 text-[6px] font-bold text-amber-800">Sponsored</Badge>
                    </div>
                    {activeAd.callToAction && (
                      <div className="absolute bottom-2 right-2 flex size-6 items-center justify-center rounded-full bg-white/90">
                        <ExternalLink className="size-3 text-black" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-center text-[9px] text-muted-foreground">Vertical 9:16 format in the Shorts feed</p>
              </div>
            )}

            {/* Ad summary */}
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Summary</h3>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Ads</span>
                  <span className="font-medium text-foreground">{ads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With Video</span>
                  <span className="font-medium text-foreground">{ads.filter((a) => extractYouTubeId(a.youtubeVideoUrl)).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With CTA</span>
                  <span className="font-medium text-foreground">{ads.filter((a) => a.callToAction).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With Landing Page</span>
                  <span className="font-medium text-foreground">{ads.filter((a) => a.landingPageUrl).length}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Next"
        accent="dv360"
      />
    </TooltipProvider>
  );
}
