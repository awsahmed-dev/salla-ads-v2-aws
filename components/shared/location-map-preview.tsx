"use client";

import { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { Map, Marker, Source, Layer } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { FillLayer, LineLayer } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Globe } from "lucide-react";
import { getCountryByCode, type SelectedCity } from "@/lib/locations";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const COUNTRY_CENTERS: Record<string, [number, number]> = {
  SA: [45.08, 23.89],
  AE: [53.85, 23.42],
  KW: [47.48, 29.31],
  BH: [50.55, 26.07],
  OM: [55.92, 21.47],
  QA: [51.18, 25.35],
  EG: [30.80, 26.82],
  JO: [36.24, 30.59],
  IQ: [43.68, 33.22],
  LB: [35.86, 33.85],
  PS: [35.23, 31.95],
  MA: [-7.09, 31.79],
  TN: [9.54, 33.89],
  DZ: [1.66, 28.03],
  LY: [17.23, 26.34],
  SD: [30.22, 12.86],
  YE: [48.52, 15.55],
};

interface LocationMapPreviewProps {
  countryCodes: string[];
  cities: SelectedCity[];
}

function createRadiusCircle(lat: number, lng: number, radiusKm: number): GeoJSON.Feature {
  const points = 64;
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
    const dy = radiusKm / 110.574;
    coords.push([lng + dx * Math.cos(angle), lat + dy * Math.sin(angle)]);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

const radiusFillStyle: FillLayer = {
  id: "radius-fill",
  type: "fill",
  paint: {
    "fill-color": "#6366f1",
    "fill-opacity": 0.08,
  },
};

const radiusStrokeStyle: LineLayer = {
  id: "radius-stroke",
  type: "line",
  paint: {
    "line-color": "#6366f1",
    "line-width": 1.5,
    "line-opacity": 0.25,
  },
};

/**
 * Strip all text/symbol layers from the map so our own markers are the only
 * labels visible. This prevents the duplicate-name problem (e.g. "Riyadh"
 * from the basemap + our own "Riyadh" marker).
 */
function stripMapLabels(map: mapboxgl.Map) {
  const style = map.getStyle();
  if (!style?.layers) return;
  for (const layer of style.layers) {
    if (layer.type === "symbol") {
      map.removeLayer(layer.id);
    }
  }
}

export function LocationMapPreview({ countryCodes, cities }: LocationMapPreviewProps) {
  const mapRef = useRef<MapRef>(null);
  const [loaded, setLoaded] = useState(false);

  const hasContent = countryCodes.length > 0 || cities.length > 0;

  const radiusGeoJson = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: cities.map((c) => createRadiusCircle(c.lat, c.lng, c.radiusKm)),
  }), [cities]);

  const focusPoints = useMemo(() => {
    if (cities.length > 0) {
      return cities.map((c): [number, number] => [c.lng, c.lat]);
    }
    const pts: [number, number][] = [];
    for (const code of countryCodes) {
      const center = COUNTRY_CENTERS[code];
      if (center) pts.push(center);
    }
    return pts;
  }, [countryCodes, cities]);

  const fitBounds = useCallback(() => {
    if (!mapRef.current || focusPoints.length === 0) return;

    if (focusPoints.length === 1) {
      mapRef.current.flyTo({
        center: focusPoints[0],
        zoom: cities.length > 0 ? 10 : 4,
        duration: 800,
      });
      return;
    }

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of focusPoints) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    mapRef.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 60, duration: 800, maxZoom: 12 }
    );
  }, [focusPoints, cities.length]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) stripMapLabels(map);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) fitBounds();
  }, [loaded, fitBounds]);

  const countryNames = countryCodes
    .map((c) => getCountryByCode(c)?.name ?? c)
    .slice(0, 3);
  const extraCountries = countryCodes.length - 3;

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
        <div className="flex h-[200px] items-center justify-center">
          <div className="text-center">
            <Globe className="mx-auto mb-2 size-6 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">
              {hasContent
                ? `${countryCodes.length} ${countryCodes.length === 1 ? "country" : "countries"}, ${cities.length} ${cities.length === 1 ? "city" : "cities"}`
                : "Select locations to preview"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      {/* Clean map canvas — all basemap labels stripped, only our markers shown */}
      <div className="relative h-[220px]">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{ longitude: 45, latitude: 25, zoom: 3 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          onLoad={handleLoad}
          interactive={false}
          attributionControl={false}
        >
          {cities.length > 0 && (
            <Source id="radius-circles" type="geojson" data={radiusGeoJson}>
              <Layer {...radiusFillStyle} />
              <Layer {...radiusStrokeStyle} />
            </Source>
          )}

          {cities.map((city) => (
            <Marker
              key={city.id}
              longitude={city.lng}
              latitude={city.lat}
              anchor="center"
            >
              <div className="relative flex flex-col items-center">
                {/* Outer pulse ring */}
                <div className="absolute size-6 rounded-full bg-indigo-500/10 animate-ping [animation-duration:2.5s]" />
                {/* Pin dot */}
                <div className="relative size-3 rounded-full bg-indigo-500 ring-[2.5px] ring-white shadow-sm" />
                {/* City name */}
                <span className="mt-1 whitespace-nowrap text-[10px] font-medium leading-none text-gray-700 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                  {city.name}
                </span>
              </div>
            </Marker>
          ))}
        </Map>

        {/* Empty-state overlay */}
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Globe className="mx-auto mb-2 size-6 text-muted-foreground/20" />
              <p className="text-[11px] text-muted-foreground">Select locations to preview</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary bar */}
      {hasContent && (
        <div className="flex items-center gap-2 border-t border-border px-3 py-1.5">
          <div className="size-1.5 rounded-full bg-indigo-500 shrink-0" />
          <p className="text-[11px] text-muted-foreground truncate leading-none">
            {countryNames.join(", ")}
            {extraCountries > 0 && <span> +{extraCountries}</span>}
            {cities.length > 0 && (
              <>
                <span className="mx-1 text-border">|</span>
                <span className="font-medium text-foreground">
                  {cities.length} {cities.length === 1 ? "city" : "cities"}
                </span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
