import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseFacility, Penilaian, PenilaianStats } from "@/types";

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

export async function submitPenilaian(
  entry: Omit<Penilaian, "id" | "created_at">
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  const { error } = await supabase.from("penilaian").insert([entry]);

  if (error) {
    console.error("Supabase insert error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getPenilaian(): Promise<Penilaian[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("penilaian")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase select error:", error);
    return [];
  }

  return (data ?? []) as Penilaian[];
}

export async function getPenilaianStats(): Promise<PenilaianStats> {
  const entries = await getPenilaian();

  if (entries.length === 0) {
    return { total: 0, avgStars: 0, stars: {}, byGender: {} };
  }

  const stars: Record<number, number> = {};
  const byGender: Record<string, number> = {};
  let sumStars = 0;

  for (const e of entries) {
    stars[e.stars] = (stars[e.stars] || 0) + 1;
    byGender[e.gender] = (byGender[e.gender] || 0) + 1;
    sumStars += e.stars;
  }

  return {
    total: entries.length,
    avgStars: Math.round((sumStars / entries.length) * 10) / 10,
    stars,
    byGender,
  };
}