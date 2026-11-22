"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import type { NearbyFacility } from "@/types";

interface MapViewProps {
  userLat: number;
  userLng: number;
  facilities: NearbyFacility[];
}

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#16283a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9aaec2" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1b2a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c4359" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1b2a" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

let loaderInstance: Loader | null = null;

function getLoader(): Loader {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["maps", "marker"],
    });
  }
  return loaderInstance;
}

export default function MapView({
  userLat,
  userLng,
  facilities,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    getLoader()
      .load()
      .then(() => setMapReady(true))
      .catch(() => console.warn("Maps failed to load"));
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const { Map } = google.maps;
    const { AdvancedMarkerElement, PinElement } = google.maps.marker;

    const map = new Map(mapRef.current, {
      center: { lat: userLat, lng: userLng },
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "cooperative",
      mapId: "ambulansku-map",
      styles: MAP_STYLES,
    });

    const userPin = new PinElement({
      scale: 1.2,
      background: "#2DC653",
      borderColor: "#ffffff",
    });
    new AdvancedMarkerElement({
      position: { lat: userLat, lng: userLng },
      map,
      content: userPin.element,
    });

    for (const f of facilities) {
      const facilityPin = new PinElement({
        scale: 1,
        background: "#E63946",
        borderColor: "#ffffff",
        glyph: f.name.charAt(0),
      });
      new AdvancedMarkerElement({
        position: f.geometry.location,
        map,
        content: facilityPin.element,
        title: f.name,
      });
    }
  }, [mapReady, userLat, userLng, facilities]);

  if (!apiKey) {
    return (
      <div className="w-full h-full min-h-[10rem] bg-surface flex items-center justify-center">
        <p className="text-ink-muted text-sm">Peta tidak tersedia</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[10rem]"
      role="region"
      aria-label="Peta lokasi fasilitas medis terdekat"
    />
  );
}