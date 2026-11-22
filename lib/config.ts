export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function requireHttpUrl(name: string, value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    return value;
  } catch {
    throw new ConfigError(`${name} must be a valid HTTP(S) URL`);
  }
}

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function getAiConfig(): AiConfig {
  const baseUrl =
    readEnv("AI_BASE_URL") ?? "https://openrouter.ai/api/v1";

  return {
    // A missing key is a degraded mode: generateTriage falls back to the
    // emergency response. Only a malformed URL is a hard configuration error.
    apiKey: readEnv("OPENROUTER_API_KEY") ?? "",
    baseUrl: requireHttpUrl("AI_BASE_URL", baseUrl),
    model: readEnv("AI_MODEL") ?? "openai/gpt-4o-mini",
  };
}

export function getGoogleMapsApiKey(): string {
  return (
    readEnv("GOOGLE_MAPS_API_KEY") ??
    readEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") ??
    ""
  );
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) return null;

  return { url: requireHttpUrl("NEXT_PUBLIC_SUPABASE_URL", url), anonKey };
}

export function isFeedbackEnabled(): boolean {
  return readEnv("PENILAIAN_ENABLED") === "true";
}

export function getFeedbackDevKey(): string | undefined {
  return readEnv("PENILAIAN_DEV_KEY");
}

export const DEFAULT_TRIAGE_GLOBAL_MAX = 60;

export function getTriageGlobalMax(): number {
  const parsed = Number.parseInt(readEnv("TRIAGE_GLOBAL_MAX") ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_TRIAGE_GLOBAL_MAX;
}