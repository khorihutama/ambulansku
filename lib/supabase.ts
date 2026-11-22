import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/config";
import type { Penilaian, PenilaianStats } from "@/types";

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;

  try {
    const config = getSupabaseConfig();
    if (!config) return null;

    supabase = createClient(config.url, config.anonKey);
    return supabase;
  } catch {
    console.warn("Supabase configuration invalid; skipping DB access");
    return null;
  }
}

export async function submitPenilaian(
  entry: Omit<Penilaian, "id" | "created_at">
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Gagal menyimpan feedback" };
  }

  const { error } = await client.from("penilaian").insert([entry]);

  if (error) {
    console.error("Supabase insert failed");
    return { success: false, error: "Gagal menyimpan feedback" };
  }

  return { success: true };
}

export async function getPenilaian(): Promise<Penilaian[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("penilaian")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase select failed");
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