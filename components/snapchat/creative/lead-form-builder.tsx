"use client";

import { useState, useRef, useCallback } from "react";
import React from "react";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/shared/section-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { User, ExternalLink, Smartphone, Store, Package, Sparkles, Handshake, Pencil, FileText, Check, AlertCircle, ImagePlus, GripVertical, ChevronUp, ChevronDown, Trash2, Plus, ShieldCheck, ChevronRight, Info } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { type LeadGenerationForm, type LeadFormField, type LeadFormFieldType, type CustomFieldType, type LeadFormEndPageCTA } from "@/lib/snapchat/campaign-types";
import { LEAD_FIELD_LABELS, STANDARD_FIELD_OPTIONS } from "./constants";
import { CharCounter } from "./creative-card";
import { UploadZone } from "@/components/shared/upload-zone";

export const LEAD_FIELD_ICONS: Record<LeadFormFieldType, React.ReactNode> = {
  FIRST_NAME: <User className="size-3 text-blue-500" />,
  LAST_NAME: <User className="size-3 text-blue-500" />,
  EMAIL: <ExternalLink className="size-3 text-violet-500" />,
  PHONE_NUMBER: <Smartphone className="size-3 text-emerald-500" />,
  ADDRESS: <Store className="size-3 text-orange-500" />,
  POSTAL_CODE: <Package className="size-3 text-orange-500" />,
  BIRTHDAY_DATE: <Sparkles className="size-3 text-pink-500" />,
  JOB_TITLE: <Handshake className="size-3 text-cyan-500" />,
  COMPANY_NAME: <Store className="size-3 text-cyan-500" />,
  CUSTOM: <Pencil className="size-3 text-primary" />,
};

export function LeadFormBuilder({
  form,
  onChange,
}: {
  form: LeadGenerationForm;
  onChange: (updated: LeadGenerationForm) => void;
}) {
  const [showAddField, setShowAddField] = useState(false);
  const [showLegalDisclosures, setShowLegalDisclosures] = useState(!!form.legal_disclosures?.length);
  // Snap API: legal_disclosures is an array. UI operates on the first (and only) disclosure.
  const disclosure = form.legal_disclosures?.[0];
  const hasDisclosure = !!disclosure;
  const updateDisclosure = (partial: Partial<typeof disclosure>) => {
    const updated = { ...disclosure!, ...partial };
    onChange({ ...form, legal_disclosures: [updated] });
  };
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const updateField = (idx: number, partial: Partial<LeadFormField>) => {
    const updated = [...form.form_fields];
    updated[idx] = { ...updated[idx], ...partial };
    onChange({ ...form, form_fields: updated });
  };

  const removeField = (idx: number) => {
    onChange({ ...form, form_fields: form.form_fields.filter((_, i) => i !== idx) });
  };

  const moveField = (idx: number, dir: "up" | "down") => {
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= form.form_fields.length) return;
    const updated = [...form.form_fields];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    onChange({ ...form, form_fields: updated });
  };

  const addStandardField = (type: LeadFormFieldType) => {
    const newField: LeadFormField = {
      id: `lf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
    };
    onChange({ ...form, form_fields: [...form.form_fields, newField] });
    setShowAddField(false);
  };

  const addCustomField = (customType: CustomFieldType) => {
    const newField: LeadFormField = {
      id: `lf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "CUSTOM",
      custom_form_field_properties: {
        type: customType,
        description: "",
        ...(customType.includes("MULTIPLE_CHOICE") ? { multiple_choice_options: [{ choice_description: "" }, { choice_description: "" }] } : {}),
      },
    };
    onChange({ ...form, form_fields: [...form.form_fields, newField] });
    setShowAddField(false);
  };

  const handleBannerFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) { alert("Banner image must be under 2MB."); return; }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ratio = img.width / img.height;
      const expectedRatio = 75 / 23;
      if (Math.abs(ratio - expectedRatio) > 0.2) {
        const proceed = window.confirm(
          `Image is ${img.width}x${img.height}px. Snap recommends a 75:23 ratio (e.g. 1875x575). Continue?`
        );
        if (!proceed) return;
      }
      onChange({ ...form, bannerPreviewUrl: URL.createObjectURL(file) });
    };
    img.src = URL.createObjectURL(file);
  }, [form, onChange]);

  const usedTypes = form.form_fields.map((f) => f.type);
  const availableStandard = STANDARD_FIELD_OPTIONS.filter((t) => !usedTypes.includes(t) || t === "CUSTOM");
  // Validate: ADDRESS and POSTAL_CODE cannot both be included
  const hasAddress = usedTypes.includes("ADDRESS");
  const hasPostalCode = usedTypes.includes("POSTAL_CODE");

  // Form validity indicators
  const hasFirstName = usedTypes.includes("FIRST_NAME");
  const hasLastName = usedTypes.includes("LAST_NAME");
  const hasEmail = usedTypes.includes("EMAIL");
  const hasPhone = usedTypes.includes("PHONE_NUMBER");
  const hasContactField = hasEmail || hasPhone;
  const hasPrivacyUrl = form.privacy_policy_url.startsWith("https://");
  const hasTitle = form.title.trim().length > 0;
  const hasConflict = hasAddress && hasPostalCode;

  const formValid = hasFirstName && hasLastName && hasContactField && hasPrivacyUrl && hasTitle && !hasConflict;

  return (
    <SectionCard>
      {/* Header with status */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="size-4 text-primary" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-foreground">Lead Generation Form</Label>
            <p className="text-xs text-muted-foreground">Configure the form users see when they swipe up</p>
          </div>
        </div>
        <Badge
          variant={formValid ? "secondary" : "outline"}
          className={cn(
            "gap-1 rounded-full px-2 py-0.5 text-xs",
            formValid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 text-amber-600"
          )}
        >
          {formValid ? <Check className="size-2.5" /> : <AlertCircle className="size-2.5" />}
          {formValid ? "Valid" : "Incomplete"}
        </Badge>
      </div>

      {/* API Info callout */}
      <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50/50 px-3.5 py-2.5">
        <Info className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
        <div className="text-xs leading-relaxed text-blue-700">
          The form appears when a user swipes up on your ad. Fields are pre-filled with the user's Snapchat profile data when available, increasing conversion rates.
        </div>
      </div>

      {/* Banner Image (optional) */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            Banner Image
            <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[8px] font-normal">Optional</Badge>
          </Label>
          <InfoTip text="Displayed at the top of the form. Must be between 750x230 and 1875x575 pixels (75:23 ratio). Max 2MB." />
        </div>
        {form.bannerPreviewUrl ? (
          <div className="relative overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.bannerPreviewUrl} alt="Form banner" className="h-24 w-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => bannerInputRef.current?.click()}>Replace</Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => onChange({ ...form, bannerPreviewUrl: undefined, banner_media_id: undefined })}>Remove</Button>
            </div>
            <input ref={bannerInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => e.target.files?.[0] && handleBannerFile(e.target.files[0])} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-border px-4 py-3 transition-colors hover:border-primary/40"
          >
            <ImagePlus className="size-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Upload banner image</p>
              <p className="text-xs text-muted-foreground">PNG/JPG, 75:23 ratio (750x230 to 1875x575), max 2MB</p>
            </div>
            <input ref={bannerInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => e.target.files?.[0] && handleBannerFile(e.target.files[0])} />
          </button>
        )}
      </div>

      {/* Form Title & Description */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Form Title
              <Badge variant="secondary" className="rounded-full px-1 py-0 text-[7px]">Required</Badge>
            </Label>
            <CharCounter current={form.title.length} max={25} />
          </div>
          <Input
            placeholder="e.g. Get a Free Quote"
            value={form.title}
            maxLength={25}
            onChange={(e) => onChange({ ...form, title: e.target.value.slice(0, 25) })}
            className={cn("h-8 text-xs", !hasTitle && form.title !== undefined && "border-amber-400")}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">Form Name (internal)</Label>
            <CharCounter current={form.name.length} max={375} />
          </div>
          <Input
            placeholder="Internal form name"
            value={form.name}
            maxLength={375}
            onChange={(e) => onChange({ ...form, name: e.target.value.slice(0, 375) })}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">Form Description</Label>
          <CharCounter current={form.description.length} max={180} />
        </div>
        <Textarea
          placeholder="Describe what the user will get by filling out this form..."
          value={form.description}
          maxLength={180}
          onChange={(e) => onChange({ ...form, description: e.target.value.slice(0, 180) })}
          className="min-h-[60px] resize-none text-xs"
        />
      </div>

      {/* ---- Form Fields Section ---- */}
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-foreground">Form Fields</Label>
            <Badge variant="secondary" className="text-xs tabular-nums">{form.form_fields.length} field{form.form_fields.length !== 1 ? "s" : ""}</Badge>
          </div>
          <InfoTip text="FIRST_NAME and LAST_NAME are always required. At least EMAIL or PHONE_NUMBER must be included. ADDRESS and POSTAL_CODE cannot both be present." />
        </div>

        {/* Requirement indicators */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {[
            { ok: hasFirstName, label: "First Name" },
            { ok: hasLastName, label: "Last Name" },
            { ok: hasContactField, label: "Email or Phone" },
            ...(hasConflict ? [{ ok: false, label: "Address + Postal Code conflict" }] : []),
          ].map(({ ok, label }) => (
            <Badge
              key={label}
              variant={ok ? "secondary" : "outline"}
              className={cn(
                "gap-1 rounded-full px-2 py-0.5 text-xs",
                ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 text-amber-600"
              )}
            >
              {ok ? <Check className="size-2.5" /> : <AlertCircle className="size-2.5" />}
              {label} {ok ? "" : "(required)"}
            </Badge>
          ))}
        </div>

        {/* Fields list */}
        <div className="mb-3 space-y-2">
          {form.form_fields.map((field, idx) => (
            <div
              key={field.id}
              className={cn(
                "rounded-lg border bg-background p-3 transition-all",
                (field.type === "FIRST_NAME" || field.type === "LAST_NAME")
                  ? "border-primary/20 bg-primary/[0.02]"
                  : field.type === "CUSTOM"
                    ? "border-violet-200 bg-violet-50/30"
                    : "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="size-3 cursor-grab text-muted-foreground/50" />
                  <div className="flex size-5 items-center justify-center rounded bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                    {idx + 1}
                  </div>
                  {LEAD_FIELD_ICONS[field.type]}
                  <span className="text-xs font-medium text-foreground">
                    {field.type === "CUSTOM"
                      ? (field.custom_form_field_properties?.description || "Custom Question")
                      : LEAD_FIELD_LABELS[field.type]}
                  </span>
                  {(field.type === "FIRST_NAME" || field.type === "LAST_NAME") && (
                    <Badge variant="secondary" className="rounded-full bg-primary/10 px-1.5 py-0 text-[8px] font-semibold text-primary">Required</Badge>
                  )}
                  {field.type === "CUSTOM" && (
                    <Badge variant="secondary" className="rounded-full bg-violet-100 px-1.5 py-0 text-[8px] text-violet-600">Custom</Badge>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <button type="button" disabled={idx === 0} onClick={() => moveField(idx, "up")} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="size-3" /></button>
                  <button type="button" disabled={idx === form.form_fields.length - 1} onClick={() => moveField(idx, "down")} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="size-3" /></button>
                  {field.type !== "FIRST_NAME" && field.type !== "LAST_NAME" && (
                    <button
                      type="button"
                      onClick={() => removeField(idx)}
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Auto-fill note for standard fields */}
              {field.type !== "CUSTOM" && field.type !== "FIRST_NAME" && field.type !== "LAST_NAME" && (
                <p className="ml-12 mt-1 text-xs text-muted-foreground">
                  {field.type === "EMAIL" ? "Pre-filled from user's Snapchat account" :
                   field.type === "PHONE_NUMBER" ? "Pre-filled from user's Snapchat account" :
                   field.type === "BIRTHDAY_DATE" ? "Pre-filled from user's profile if available" :
                   "User enters manually"}
                </p>
              )}

              {/* Custom field configuration */}
              {field.type === "CUSTOM" && field.custom_form_field_properties && (
                <div className="mt-3 space-y-2.5 border-t border-border pt-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-muted-foreground">Question</Label>
                    <Input
                      placeholder="e.g. What is your budget range?"
                      value={field.custom_form_field_properties.description}
                      onChange={(e) =>
                        updateField(idx, {
                          custom_form_field_properties: {
                            ...field.custom_form_field_properties!,
                            description: e.target.value,
                          },
                        })
                      }
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-muted-foreground">Answer Type</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {([
                        { val: "TEXT" as CustomFieldType, label: "Free Text" },
                        { val: "DATE" as CustomFieldType, label: "Date" },
                        { val: "MULTIPLE_CHOICE_SINGLE_SELECTION" as CustomFieldType, label: "Single Select" },
                        { val: "MULTIPLE_CHOICE_MULTI_SELECTION" as CustomFieldType, label: "Multi Select" },
                      ]).map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() =>
                            updateField(idx, {
                              custom_form_field_properties: {
                                ...field.custom_form_field_properties!,
                                type: opt.val,
                                ...(opt.val.includes("MULTIPLE_CHOICE") && !field.custom_form_field_properties!.multiple_choice_options?.length
                                  ? { multiple_choice_options: [{ choice_description: "" }, { choice_description: "" }] }
                                  : {}),
                              },
                            })
                          }
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                            field.custom_form_field_properties.type === opt.val
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multiple choice options */}
                  {field.custom_form_field_properties.type.includes("MULTIPLE_CHOICE") && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Choices</Label>
                      {(field.custom_form_field_properties.multiple_choice_options ?? []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1.5">
                          <div className={cn(
                            "size-3 shrink-0 rounded border border-border",
                            field.custom_form_field_properties!.type === "MULTIPLE_CHOICE_SINGLE_SELECTION" ? "rounded-full" : "rounded"
                          )} />
                          <Input
                            placeholder={`Option ${optIdx + 1}`}
                            value={opt.choice_description}
                            onChange={(e) => {
                              const opts = [...(field.custom_form_field_properties!.multiple_choice_options ?? [])];
                              opts[optIdx] = { ...opts[optIdx], choice_description: e.target.value };
                              updateField(idx, {
                                custom_form_field_properties: { ...field.custom_form_field_properties!, multiple_choice_options: opts },
                              });
                            }}
                            className="h-6 flex-1 text-xs"
                          />
                          {(field.custom_form_field_properties.multiple_choice_options ?? []).length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const opts = (field.custom_form_field_properties!.multiple_choice_options ?? []).filter((_, i) => i !== optIdx);
                                updateField(idx, {
                                  custom_form_field_properties: { ...field.custom_form_field_properties!, multiple_choice_options: opts },
                                });
                              }}
                              className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const opts = [...(field.custom_form_field_properties!.multiple_choice_options ?? []), { choice_description: "" }];
                          updateField(idx, {
                            custom_form_field_properties: { ...field.custom_form_field_properties!, multiple_choice_options: opts },
                          });
                        }}
                        className="flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline"
                      >
                        <Plus className="size-3" /> Add Option
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Field Menu */}
        {showAddField ? (
          <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">Add a field</p>

            {/* Standard fields */}
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Standard Fields</p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {STANDARD_FIELD_OPTIONS.filter((t) => t !== "CUSTOM").map((t) => {
                  const alreadyUsed = usedTypes.includes(t);
                  const disabled = alreadyUsed || (t === "ADDRESS" && hasPostalCode) || (t === "POSTAL_CODE" && hasAddress);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={disabled}
                      onClick={() => addStandardField(t)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                        disabled
                          ? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground/40"
                          : "border-border text-foreground hover:border-primary hover:bg-primary/5"
                      )}
                      title={
                        (t === "ADDRESS" && hasPostalCode) || (t === "POSTAL_CODE" && hasAddress)
                          ? "ADDRESS and POSTAL_CODE cannot both be included"
                          : alreadyUsed ? "Already added" : undefined
                      }
                    >
                      {LEAD_FIELD_ICONS[t]}
                      {LEAD_FIELD_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom question types */}
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Questions</p>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { val: "TEXT" as CustomFieldType, label: "Free Text", desc: "Open text input" },
                  { val: "DATE" as CustomFieldType, label: "Date Picker", desc: "Date selector" },
                  { val: "MULTIPLE_CHOICE_SINGLE_SELECTION" as CustomFieldType, label: "Single Choice", desc: "One answer" },
                  { val: "MULTIPLE_CHOICE_MULTI_SELECTION" as CustomFieldType, label: "Multi Choice", desc: "Multiple answers" },
                ]).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => addCustomField(opt.val)}
                    className="flex flex-col items-start rounded-md border border-border px-2.5 py-2 text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <span className="text-xs font-medium text-foreground">{opt.label}</span>
                    <span className="text-[8px] text-muted-foreground">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddField(false)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddField(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="size-3.5" /> Add Field
          </button>
        )}
      </div>

      {/* ---- Privacy & Legal Section ---- */}
      <div className="border-t border-border pt-5">
        <Label className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
          <ShieldCheck className="size-3.5" />
          Privacy & Legal
        </Label>

        {/* Privacy Policy URL */}
        <div className="mb-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              Privacy Policy URL
              <Badge variant="secondary" className="rounded-full px-1 py-0 text-[7px]">Required</Badge>
            </Label>
            {form.privacy_policy_url && (
              <Badge
                variant={hasPrivacyUrl ? "secondary" : "outline"}
                className={cn(
                  "gap-0.5 rounded-full px-1.5 py-0 text-[8px]",
                  hasPrivacyUrl ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 text-amber-600"
                )}
              >
                {hasPrivacyUrl ? <Check className="size-2" /> : <AlertCircle className="size-2" />}
                {hasPrivacyUrl ? "Valid" : "Must start with https://"}
              </Badge>
            )}
          </div>
          <Input
            placeholder="https://www.example.com/privacy"
            value={form.privacy_policy_url}
            onChange={(e) => onChange({ ...form, privacy_policy_url: e.target.value })}
            className={cn("h-8 text-xs", form.privacy_policy_url && !hasPrivacyUrl && "border-amber-400")}
          />
          <p className="text-xs text-muted-foreground">
            Shown as a link on the confirmation screen before the user submits. Required by Snap for all Lead Gen forms.
          </p>
        </div>

        {/* Legal Disclosures (optional, collapsible) */}
        <div className="rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setShowLegalDisclosures(!showLegalDisclosures)}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/30"
          >
            <FileText className="size-3.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Legal Disclosures</span>
                <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[8px] font-normal">Optional</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add consent checkboxes and legal text shown before form submission.
              </p>
            </div>
            <ChevronRight className={cn("size-3.5 text-muted-foreground transition-transform", showLegalDisclosures && "rotate-90")} />
          </button>

          {showLegalDisclosures && (
            <div className="border-t border-border px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Enable legal disclosures</Label>
                <Switch
                  checked={hasDisclosure}
                  onCheckedChange={(v) =>
                    onChange({
                      ...form,
                      legal_disclosures: v
                        ? [{ title: "", description: "", consent_form_fields: [{ consent_description: "", required: true }] }]
                        : undefined,
                    })
                  }
                />
              </div>
              {hasDisclosure && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs font-medium text-muted-foreground">Title</Label>
                      <Input
                        placeholder="e.g. Terms & Conditions"
                        value={disclosure!.title}
                        maxLength={35}
                        onChange={(e) => updateDisclosure({ title: e.target.value.slice(0, 35) })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                      <Input
                        placeholder="Legal text..."
                        value={disclosure!.description}
                        maxLength={80}
                        onChange={(e) => updateDisclosure({ description: e.target.value.slice(0, 80) })}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Consent Checkboxes</Label>
                    {disclosure!.consent_form_fields.map((cf, ci) => (
                      <div key={ci} className="flex items-center gap-1.5">
                        <input type="checkbox" checked disabled className="accent-primary" />
                        <Input
                          placeholder={`Consent text ${ci + 1}`}
                          value={cf.consent_description}
                          onChange={(e) => {
                            const fields = [...disclosure!.consent_form_fields];
                            fields[ci] = { ...fields[ci], consent_description: e.target.value };
                            updateDisclosure({ consent_form_fields: fields });
                          }}
                          className="h-6 flex-1 text-xs"
                        />
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={cf.required}
                            onChange={(e) => {
                              const fields = [...disclosure!.consent_form_fields];
                              fields[ci] = { ...fields[ci], required: e.target.checked };
                              updateDisclosure({ consent_form_fields: fields });
                            }}
                            className="accent-primary"
                          />
                          Req.
                        </label>
                        {disclosure!.consent_form_fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const fields = disclosure!.consent_form_fields.filter((_, i) => i !== ci);
                              updateDisclosure({ consent_form_fields: fields });
                            }}
                            className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const fields = [...disclosure!.consent_form_fields, { consent_description: "", required: false }];
                        updateDisclosure({ consent_form_fields: fields });
                      }}
                      className="flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline"
                    >
                      <Plus className="size-3" /> Add Consent
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* End Page Properties (optional) */}
      <div className="mt-5 border-t border-border pt-5">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            Thank You Page
            <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[8px] font-normal">Optional</Badge>
            <InfoTip text="After the user submits the form, show a thank-you page with a CTA button linking to your website." />
          </Label>
          <Switch
            checked={!!form.end_page_properties}
            onCheckedChange={(checked) =>
              onChange({
                ...form,
                end_page_properties: checked ? { call_to_action: "VIEW_WEBSITE", url: "" } : undefined,
              })
            }
          />
        </div>
        {form.end_page_properties && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground">CTA Button</Label>
              <Select
                value={form.end_page_properties.call_to_action}
                onValueChange={(v) =>
                  onChange({ ...form, end_page_properties: { ...form.end_page_properties!, call_to_action: v as LeadFormEndPageCTA } })
                }
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["VIEW_WEBSITE", "BOOK_NOW", "LEARN_MORE", "DONATE", "SPECIAL_OFFER", "SCHEDULE_NOW", "BUY_TICKETS", "TEST_DRIVE", "APPLY_NOW", "GET_COUPON", "CLAIM_SAMPLE", "FREE_TRIAL"] as LeadFormEndPageCTA[]).map((v) => (
                    <SelectItem key={v} value={v}>{v.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()).toLowerCase().replace(/^\w/, (l) => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground">Destination URL</Label>
              <Input
                placeholder="https://www.example.com"
                value={form.end_page_properties.url}
                onChange={(e) => onChange({ ...form, end_page_properties: { ...form.end_page_properties!, url: e.target.value } })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="mt-5 rounded-lg bg-muted/50 p-3">
        <p className="text-xs font-semibold text-foreground mb-1.5">Lead Form Best Practices</p>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc ml-3">
          <li>Keep forms short (3-5 fields) for higher completion rates</li>
          <li>Use a clear, benefit-focused title (e.g. "Get 20% Off" not "Contact Us")</li>
          <li>Include EMAIL for follow-up -- pre-filled from Snapchat increases conversion</li>
          <li>Add a Thank You page with a CTA to continue engagement post-submission</li>
          <li>Use custom questions sparingly -- each added field reduces completion</li>
          <li>Upload a banner image to make your form more visually appealing</li>
        </ul>
      </div>
    </SectionCard>
  );
}
