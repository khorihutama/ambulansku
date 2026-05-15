import type { NearbyFacility } from "@/types";

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

const GOOGLE_MAPS_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "";

export async function getNearbyFacilities(
  lat: number,
  lng: number,
  keywords: string[],
  radius = 10000
): Promise<NearbyFacility[]> {
  if (!GOOGLE_MAPS_KEY) return [];

  const results: NearbyFacility[] = [];

  for (const keyword of keywords.slice(0, 2)) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${GOOGLE_MAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.results) {
        for (const place of data.results) {
          let phone: string | undefined;
          if (place.place_id) {
            try {
              const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number&key=${GOOGLE_MAPS_KEY}`;
              const detailRes = await fetch(detailUrl);
              const detailData = await detailRes.json();
              phone = detailData?.result?.formatted_phone_number;
            } catch {}
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
    } catch (error) {
      console.error("Places API error for keyword:", keyword, error);
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