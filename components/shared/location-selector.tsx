"use client";

/**
 * Unified location selector for Step 1 (Audience) across all five ad platforms.
 * Same UI and logic everywhere: Cities tab (quick select + search) + Country / Region tab.
 * Per-city radius (enableRadiusPerCity) enabled for Snapchat, Meta, Google, DV360; disabled only for TikTok (API does not support radius).
 */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MapPin,
  Globe,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  Info,
  ChevronDown,
} from "lucide-react";
import {
  COUNTRIES,
  CITIES,
  REGIONS,
  PRIMARY_COUNTRY_CODE,
  countryEmoji,
  getCountryByCode,
  getPopularCities,
  getRegionsByCountry,
  type LocationSelection,
  type SelectedCity,
} from "@/lib/locations";

export type LocationSelectorAccent = "primary" | "meta" | "dv360";

const ACCENT_STYLES: Record<
  LocationSelectorAccent,
  { selected: string; hover: string; check: string; underline: string }
> = {
  primary: {
    selected: "border-primary bg-primary/5 text-primary",
    hover: "hover:border-primary/30",
    check: "text-primary",
    underline: "bg-primary",
  },
  meta: {
    selected: "border-[#1877F2] bg-[#1877F2]/5 text-[#1877F2]",
    hover: "hover:border-[#1877F2]/30",
    check: "text-[#1877F2]",
    underline: "bg-[#1877F2]",
  },
  dv360: {
    selected: "border-red-600 bg-red-600/5 text-red-600",
    hover: "hover:border-red-600/30",
    check: "text-red-600",
    underline: "bg-red-600",
  },
};

export interface LocationSelectorProps {
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  enableCityTargeting?: boolean;
  enableRadiusPerCity?: boolean;
  tooltipText?: string;
  accent?: LocationSelectorAccent;
  label?: string;
  countryDescription?: string;
  cityDescription?: string;
}

export function LocationSelector({
  value,
  onChange,
  enableCityTargeting = true,
  enableRadiusPerCity = true,
  tooltipText = "Choose where your ads will be shown. You can target entire countries or specific cities.",
  accent = "primary",
  label = "Location",
  countryDescription = "Target a whole country or region when you want broader reach.",
  cityDescription = "Pick one or more cities to focus your ads. Great for reaching local customers.",
}: LocationSelectorProps) {
  const [tab, setTab] = useState<"country" | "city">(enableCityTargeting ? "city" : "country");
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const [customRadiusCities, setCustomRadiusCities] = useState<Set<string>>(new Set());

  const styles = ACCENT_STYLES[accent];

  const toggleCountry = (code: string) => {
    const removing = value.countryCodes.includes(code);
    const nextCodes = removing
      ? value.countryCodes.filter((c) => c !== code)
      : [...value.countryCodes, code];
    const nextRegions = removing
      ? (value.regions ?? []).filter((r) => {
          const regionData = REGIONS.find((reg) => reg.id === r);
          return regionData?.countryCode !== code;
        })
      : (value.regions ?? []);
    onChange({ ...value, countryCodes: nextCodes, regions: nextRegions });
  };

  const toggleRegion = (regionId: string) => {
    const current = value.regions ?? [];
    const next = current.includes(regionId)
      ? current.filter((r) => r !== regionId)
      : [...current, regionId];
    onChange({ ...value, regions: next });
  };

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    const q = countrySearch.toLowerCase();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return CITIES;
    const q = citySearch.toLowerCase();
    return CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        getCountryByCode(c.countryCode)?.name.toLowerCase().includes(q)
    );
  }, [citySearch]);

  const cityGroups = useMemo(() => {
    const byCountry = new Map<string, typeof CITIES>();
    for (const city of filteredCities) {
      const list = byCountry.get(city.countryCode) ?? [];
      list.push(city);
      byCountry.set(city.countryCode, list);
    }
    const ordered = [...COUNTRIES].sort((a, b) => {
      if (a.code === PRIMARY_COUNTRY_CODE) return -1;
      if (b.code === PRIMARY_COUNTRY_CODE) return 1;
      return 0;
    });
    return ordered.filter((c) => byCountry.has(c.code)).map((c) => ({
      country: c,
      cities: byCountry.get(c.code)!,
    }));
  }, [filteredCities]);

  const regionsForSelected = useMemo(() => {
    const all: { countryCode: string; countryName: string; regions: typeof REGIONS }[] = [];
    for (const code of value.countryCodes) {
      const regs = getRegionsByCountry(code);
      if (regs.length > 0) {
        all.push({
          countryCode: code,
          countryName: getCountryByCode(code)?.name ?? code,
          regions: regs,
        });
      }
    }
    return all;
  }, [value.countryCodes]);

  const addCity = (city: (typeof CITIES)[0]) => {
    if (value.cities.some((c) => c.id === city.id)) return;
    const newCities: SelectedCity[] = [
      ...value.cities,
      {
        id: city.id,
        name: city.name,
        countryCode: city.countryCode,
        lat: city.lat,
        lng: city.lng,
        radiusKm: city.radiusKm,
      },
    ];
    const newCountryCodes = value.countryCodes.includes(city.countryCode)
      ? value.countryCodes
      : [...value.countryCodes, city.countryCode];
    onChange({ countryCodes: newCountryCodes, cities: newCities, regions: value.regions ?? [] });
  };

  const removeCity = (id: string) => {
    setCustomRadiusCities((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    onChange({
      ...value,
      cities: value.cities.filter((c) => c.id !== id),
    });
  };

  const updateCityRadius = (id: string, radiusKm: number) => {
    onChange({
      ...value,
      cities: value.cities.map((c) => (c.id === id ? { ...c, radiusKm } : c)),
    });
  };

  const resetCityRadius = (id: string) => {
    const original = CITIES.find((c) => c.id === id);
    if (original) {
      updateCityRadius(id, original.radiusKm);
    }
    setCustomRadiusCities((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const enableCustomRadius = (id: string) => {
    setCustomRadiusCities((prev) => new Set(prev).add(id));
  };

  const clearAllCities = () => {
    setCustomRadiusCities(new Set());
    onChange({ ...value, cities: [] });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <Label className="text-sm font-semibold text-foreground">{label}</Label>
          {tooltipText && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{tooltipText}</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {enableCityTargeting && (
            <button
              type="button"
              onClick={() => setTab("city")}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
                tab === "city" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Cities
              {value.cities.length > 0 && (
                <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs">
                  {value.cities.length}
                </Badge>
              )}
              {tab === "city" && (
                <div className={cn("absolute inset-x-0 bottom-0 h-0.5", styles.underline)} />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab("country")}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "country" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Country / Region
            {(value.regions ?? []).length > 0 && (
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs">
                {(value.regions ?? []).length}
              </Badge>
            )}
            {tab === "country" && (
              <div className={cn("absolute inset-x-0 bottom-0 h-0.5", styles.underline)} />
            )}
          </button>
        </div>

        {/* ═══ Country tab ═══ */}
        {tab === "country" && (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="h-10 pl-9 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">{countryDescription}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filteredCountries.map((c) => {
                const selected = value.countryCodes.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleCountry(c.code)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      selected ? styles.selected : cn("border-border bg-background text-foreground", styles.hover)
                    )}
                  >
                    <span className="text-base leading-none">{countryEmoji(c.code)}</span>
                    <span className="truncate">{c.name}</span>
                    {selected && <CheckCircle2 className={cn("ml-auto size-4 shrink-0", styles.check)} />}
                  </button>
                );
              })}
            </div>
            {filteredCountries.length === 0 && (
              <div className="flex flex-col items-center gap-1 py-6 text-center">
                <Search className="size-5 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No countries match &quot;{countrySearch}&quot;</p>
              </div>
            )}
            {value.countryCodes.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/30">
                <AlertCircle className="size-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-700 dark:text-amber-400">Select at least one country to target.</p>
              </div>
            )}
            {value.countryCodes.length > 1 && (
              <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900/30 dark:bg-blue-950/30">
                <Globe className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Multiple countries selected — set a language preference below for best results.
                </p>
              </div>
            )}

            {/* ── Narrow by region ── */}
            {regionsForSelected.length > 0 && (
              <div className="border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setRegionOpen(!regionOpen)}
                  className="flex w-full items-center justify-between text-sm font-medium text-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="size-3.5 text-muted-foreground" />
                    Narrow by region
                    {(value.regions ?? []).length > 0 && (
                      <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-[10px]">
                        {(value.regions ?? []).length}
                      </Badge>
                    )}
                  </span>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", regionOpen && "rotate-180")} />
                </button>

                {regionOpen && (
                  <div className="mt-3 space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Selecting regions targets only those areas. Leave empty to target the entire country.
                    </p>
                    {regionsForSelected.map(({ countryCode, countryName, regions }) => (
                      <div key={countryCode}>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          {countryEmoji(countryCode)} {countryName}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {regions.map((r) => {
                            const sel = (value.regions ?? []).includes(r.id);
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => toggleRegion(r.id)}
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                                  sel
                                    ? styles.selected
                                    : "border-border bg-background text-foreground hover:border-primary/30"
                                )}
                              >
                                {r.name}
                                {sel && " ✓"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══ City tab ═══ */}
        {enableCityTargeting && tab === "city" && (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search cities (e.g. Riyadh, Jeddah, Dammam)..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="h-10 pl-9 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">{cityDescription}</p>

            {!citySearch.trim() ? (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Quick select — Saudi Arabia
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getPopularCities().map((city) => {
                      const isSelected = value.cities.some((c) => c.id === city.id);
                      return (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => (isSelected ? removeCity(city.id) : addCity(city))}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            isSelected ? styles.selected : "border-border bg-background text-foreground hover:border-primary/30"
                          )}
                        >
                          {city.name}
                          {isSelected && " ✓"}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Search above for more cities in Saudi Arabia, UAE, Egypt, Kuwait, and more.
                </p>
              </div>
            ) : cityGroups.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-6 text-center">
                <Search className="size-5 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No cities match &quot;{citySearch}&quot;</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {cityGroups.map(({ country, cities }) => (
                  <div key={country.code}>
                    <div className="mb-2 flex items-center gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {countryEmoji(country.code)} {country.name}
                      </p>
                      {country.code === PRIMARY_COUNTRY_CODE && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Most popular
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cities.map((city) => {
                        const isSelected = value.cities.some((c) => c.id === city.id);
                        return (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => (isSelected ? removeCity(city.id) : addCity(city))}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                              isSelected ? styles.selected : "border-border bg-background text-foreground hover:border-primary/30"
                            )}
                          >
                            {city.name}
                            {isSelected && " ✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected cities with optional radius */}
            {value.cities.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    Selected cities ({value.cities.length})
                  </p>
                  <button
                    type="button"
                    onClick={clearAllCities}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {value.cities.map((city) => {
                    const countryName = getCountryByCode(city.countryCode)?.name ?? "";
                    const hasCustomRadius = customRadiusCities.has(city.id);
                    return (
                      <div
                        key={city.id}
                        className="rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-foreground">{city.name}</span>
                            {countryName && (
                              <span className="ml-1.5 text-xs text-muted-foreground">{countryName}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="rounded-full px-2 py-0 text-xs font-medium tabular-nums">
                              <MapPin className="mr-0.5 size-2.5" />
                              {hasCustomRadius ? `${city.radiusKm} km` : "Full city"}
                            </Badge>
                            <button
                              type="button"
                              onClick={() => removeCity(city.id)}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label={`Remove ${city.name}`}
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        {enableRadiusPerCity && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`radius-toggle-${city.id}`}
                                checked={hasCustomRadius}
                                onCheckedChange={(checked) => {
                                  if (checked) enableCustomRadius(city.id);
                                  else resetCityRadius(city.id);
                                }}
                                className="scale-75"
                              />
                              <label htmlFor={`radius-toggle-${city.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                Custom radius
                              </label>
                            </div>
                            {hasCustomRadius && (
                              <div className="flex items-center gap-3">
                                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">5 km</span>
                                <Slider
                                  value={[Math.min(100, Math.max(5, city.radiusKm))]}
                                  min={5}
                                  max={100}
                                  step={5}
                                  onValueChange={([v]) => updateCityRadius(city.id, v)}
                                  className="flex-1"
                                />
                                <span className="w-12 text-xs tabular-nums text-muted-foreground">100 km</span>
                                <span className="w-12 text-right text-xs font-semibold tabular-nums text-foreground">
                                  {city.radiusKm} km
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
