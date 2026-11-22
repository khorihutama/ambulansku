import type { NearbyFacility } from "@/types";
import { getGoogleMapsApiKey, getPlacesTimeoutMs } from "@/lib/config";
import { errorKind, isNetworkError } from "@/lib/network";

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let warnedMissingKey = false;

async function fetchPlaces(
  url: string,
  label: string,
  timeoutMs: number
): Promise<Response | null> {
  const attempt = async () => {
    const startedAt = Date.now();

    try {
      const response = await fetch(
        url,
        timeoutMs > 0
          ? { signal: AbortSignal.timeout(timeoutMs) }
          : undefined
      );
      console.info(
        `[places] ${label} duration=${Date.now() - startedAt}ms status=${
          response.status
        }`
      );
      return response;
    } catch (error) {
      console.warn(
        `[places] ${label} duration=${Date.now() - startedAt}ms failed kind=${errorKind(
          error
        )}`
      );
      throw error;
    }
  };

  try {
    return await attempt();
  } catch (error) {
    if (!isNetworkError(error)) return null;

    console.warn(`[places] ${label} retrying once after network error`);
    try {
      return await attempt();
    } catch {
      return null;
    }
  }
}

export async function getNearbyFacilities(
  lat: number,
  lng: number,
  keywords: string[],
  radius = 10000
): Promise<NearbyFacility[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    if (!warnedMissingKey) {
      console.warn(
        "[places] GOOGLE_MAPS_API_KEY is empty; skipping Places lookup"
      );
      warnedMissingKey = true;
    }
    return [];
  }

  const timeoutMs = getPlacesTimeoutMs();
  const results: NearbyFacility[] = [];

  for (const keyword of keywords.slice(0, 2)) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
      const res = await fetchPlaces(url, "nearbysearch", timeoutMs);
      if (!res) continue;

      const data = await res.json().catch(() => null);
      if (!data) {
        console.error("[places] nearbysearch response invalid");
        continue;
      }

      if (data.results) {
        for (const place of data.results) {
          let phone: string | undefined;
          if (place.place_id) {
            const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number&key=${apiKey}`;
            const detailRes = await fetchPlaces(
              detailUrl,
              "details",
              timeoutMs
            );
            const detailData = detailRes
              ? await detailRes.json().catch(() => null)
              : null;
            phone = detailData?.result?.formatted_phone_number;
          }

          results.push({
            place_id: place.place_id,
            name: place.name,
            vicinity: place.vicinity,
            geometry: {
              location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
              },
            },
            rating: place.rating,
            opening_hours: place.opening_hours
              ? { open_now: place.opening_hours.open_now }
              : undefined,
            formatted_phone_number: phone,
          });
        }
      }
    } catch {
      console.error("[places] nearbysearch processing failed");
    }
  }

  const seen = new Set<string>();
  const unique = results.filter((f) => {
    if (seen.has(f.place_id)) return false;
    seen.add(f.place_id);
    return true;
  });

  return unique
    .map((f) => ({
      ...f,
      distance: calculateDistance(
        lat,
        lng,
        f.geometry.location.lat,
        f.geometry.location.lng
      ),
    }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    .slice(0, 5);
}