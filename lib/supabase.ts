import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseFacility } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function getNearbyFromDB(
  lat: number,
  lng: number,
  radiusM = 10000
): Promise<SupabaseFacility[]> {
  if (!supabase) {
    console.warn("Supabase not configured — skipping DB query");
    return [];
  }

  const { data, error } = await supabase.rpc("nearby_facilities", {
    lat,
    lng,
    radius_m: radiusM,
  });

  if (error) {
    console.error("Supabase RPC error:", error);
    return [];
  }

  return (data ?? []) as SupabaseFacility[];
}