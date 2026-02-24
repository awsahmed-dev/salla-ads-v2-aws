"use client";

/**
 * Unified location selector for Step 1 (Audience) across all five ad platforms.
 * Same UI and logic everywhere: Cities tab (quick select + search) + Country / Region tab.
 * Per-city radius (enableRadiusPerCity) enabled for Snapchat, Meta, Google, DV360; disabled only for TikTok (API does not support radius).
 * - Snapchat: audience.countries, audience.cities (lat, lng, radius m).
 * - TikTok: locationIds + cities (ids only); no radius.
 * - Meta: countries + cities + cityRadii; accent: meta.
 * - Google: locationIds + cityIds + cityRadii.
 * - DV360: geoTargets (country/city with radiusKm for cities); accent: dv360.
 * Data: lib/locations.ts (COUNTRIES, CITIES, getCountryByCode, getCityById).
 */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
} from "lucide-react";
import {
  COUNTRIES,
  CITIES,
  PRIMARY_COUNTRY_CODE,
  countryEmoji,
  getCountryByCode,
  getPopularCities,
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
  /** Show City tab and city-level targeting. Default true. Set false for platforms that only support country (e.g. TikTok). */
  enableCityTargeting?: boolean;
  /** Allow per-city radius slider (Snapchat-style). Default true. */
  enableRadiusPerCity?: boolean;
  /** Platform-specific tooltip next to the section label. */
  tooltipText?: string;
  /** Visual accent for selected state. Default "primary". */
  accent?: LocationSelectorAccent;
  /** Optional label override. */
  label?: string;
  /** Optional description under the tabs. */
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

  const styles = ACCENT_STYLES[accent];

  const toggleCountry = (code: string) => {
    const next = value.countryCodes.includes(code)
      ? value.countryCodes.filter((c) => c !== code)
      : [...value.countryCodes, code];
    onChange({ ...value, countryCodes: next });
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
    onChange({ countryCodes: newCountryCodes, cities: newCities });
  };

  const removeCity = (id: string) => {
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

  const clearAllCities = () => {
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

        {/* Tabs — City first (most advertisers target by city, especially Saudi) */}
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
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "country" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Country / Region
            {tab === "country" && (
              <div className={cn("absolute inset-x-0 bottom-0 h-0.5", styles.underline)} />
            )}
          </button>
        </div>

        {/* Country tab */}
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
          </>
        )}

        {/* City tab */}
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

            {/* When no search: compact "Quick select" row only. Full list appears on search. */}
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
                            {enableRadiusPerCity && (
                              <Badge variant="outline" className="rounded-full px-2 py-0 text-xs font-medium tabular-nums">
                                <MapPin className="mr-0.5 size-2.5" />
                                {city.radiusKm} km
                              </Badge>
                            )}
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
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">Targeting radius</span>
                            <span className="text-xs tabular-nums text-muted-foreground">10 km</span>
                            <Slider
                              value={[Math.min(100, Math.max(10, city.radiusKm))]}
                              min={10}
                              max={100}
                              step={5}
                              onValueChange={([v]) => updateCityRadius(city.id, v)}
                              className="flex-1 max-w-[140px]"
                            />
                            <span className="text-xs tabular-nums text-muted-foreground">100 km</span>
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
