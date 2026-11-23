import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseConfig,
  getSupabaseServiceConfig,
} from "@/lib/config";
import type { Feedback, Penilaian, PenilaianStats } from "@/types";

let supabase: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

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

function getSupabaseServiceClient(): SupabaseClient | null {
  if (serviceClient) return serviceClient;

  try {
    const config = getSupabaseServiceConfig();
    if (!config) return null;

    serviceClient = createClient(config.url, config.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return serviceClient;
  } catch {
    console.warn("Supabase service configuration invalid");
    return null;
  }
}

export async function submitFeedback(
  entry: Omit<Feedback, "id" | "created_at">
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Gagal menyimpan feedback" };
  }

  const { error } = await client.from("feedback").insert([entry]);

  if (error) {
    console.error("Supabase feedback insert failed");
    return { success: false, error: "Gagal menyimpan feedback" };
  }

  return { success: true };
}

export interface FeedbackReadResult {
  ok: boolean;
  entries: Feedback[];
}

export async function getFeedback(): Promise<FeedbackReadResult> {
  const client = getSupabaseServiceClient();
  if (!client) return { ok: false, entries: [] };

  const { data, error } = await client
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase feedback select failed");
    return { ok: false, entries: [] };
  }

  return { ok: true, entries: (data ?? []) as Feedback[] };
}

export interface PenilaianReadResult {
  ok: boolean;
  entries: Penilaian[];
}

export async function getPenilaian(): Promise<PenilaianReadResult> {
  const client = getSupabaseServiceClient();
  if (!client) return { ok: false, entries: [] };

  const { data, error } = await client
    .from("penilaian")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase penilaian select failed");
    return { ok: false, entries: [] };
  }

  return { ok: true, entries: (data ?? []) as Penilaian[] };
}

function emptyPenilaianStats(): PenilaianStats {
  return { total: 0, avgStars: 0, stars: {}, byGender: {} };
}

export interface PenilaianStatsResult {
  ok: boolean;
  stats: PenilaianStats;
}

export async function getPenilaianStats(): Promise<PenilaianStatsResult> {
  const result = await getPenilaian();
  if (!result.ok) return { ok: false, stats: emptyPenilaianStats() };

  const entries = result.entries;
  if (entries.length === 0) {
    return { ok: true, stats: emptyPenilaianStats() };
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
    ok: true,
    stats: {
      total: entries.length,
      avgStars: Math.round((sumStars / entries.length) * 10) / 10,
      stars,
      byGender,
    },
  };
}