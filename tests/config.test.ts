import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ConfigError,
  DEFAULT_AI_TIMEOUT_MS,
  DEFAULT_PLACES_TIMEOUT_MS,
  DEFAULT_TRIAGE_GLOBAL_MAX,
  getAiConfig,
  getAiTimeoutMs,
  getFeedbackDevKey,
  getGoogleMapsApiKey,
  getPenilaianDevKey,
  getPlacesTimeoutMs,
  getSupabaseConfig,
  getSupabaseServiceConfig,
  getTriageGlobalMax,
  isFeedbackEnabled,
} from "@/lib/config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("config", () => {
  it("provides defaults without requiring env at import", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");

    expect(getAiConfig()).toEqual({
      apiKey: "",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "openai/gpt-4o-mini",
    });
  });

  it("reads and trims configured values", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "  key  ");
    vi.stubEnv("AI_BASE_URL", " https://example.com/v1 ");
    vi.stubEnv("AI_MODEL", " test/model ");

    expect(getAiConfig()).toEqual({
      apiKey: "key",
      baseUrl: "https://example.com/v1",
      model: "test/model",
    });
  });

  it("rejects a malformed AI base URL when used", () => {
    vi.stubEnv("AI_BASE_URL", "not-a-url");

    expect(() => getAiConfig()).toThrow(ConfigError);
  });

  it("resolves the Google Maps key lazily", () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "public-key");
    expect(getGoogleMapsApiKey()).toBe("public-key");

    vi.stubEnv("GOOGLE_MAPS_API_KEY", "server-key");
    expect(getGoogleMapsApiKey()).toBe("server-key");
  });

  it("returns null Supabase config when unset and validates URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(getSupabaseConfig()).toBeNull();

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://db.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    expect(getSupabaseConfig()).toEqual({
      url: "https://db.example",
      anonKey: "anon",
    });

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "ftp://db.example");
    expect(() => getSupabaseConfig()).toThrow(ConfigError);
  });

  it("reads FEEDBACK_ENABLED first and falls back to PENILAIAN_ENABLED", () => {
    vi.stubEnv("FEEDBACK_ENABLED", "");
    vi.stubEnv("PENILAIAN_ENABLED", "false");
    expect(isFeedbackEnabled()).toBe(false);

    vi.stubEnv("PENILAIAN_ENABLED", "true");
    expect(isFeedbackEnabled()).toBe(true);

    vi.stubEnv("FEEDBACK_ENABLED", "false");
    expect(isFeedbackEnabled()).toBe(false);

    vi.stubEnv("FEEDBACK_ENABLED", "true");
    expect(isFeedbackEnabled()).toBe(true);
  });

  it("reads FEEDBACK_DEV_KEY first and falls back to PENILAIAN_DEV_KEY", () => {
    vi.stubEnv("FEEDBACK_DEV_KEY", "");
    vi.stubEnv("PENILAIAN_DEV_KEY", "  old  ");
    expect(getFeedbackDevKey()).toBe("old");
    expect(getPenilaianDevKey()).toBe("old");

    vi.stubEnv("FEEDBACK_DEV_KEY", "  new  ");
    expect(getFeedbackDevKey()).toBe("new");
    expect(getPenilaianDevKey()).toBe("old");
  });

  it("requires a service key for the service-role Supabase config", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://db.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(getSupabaseServiceConfig()).toBeNull();

    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    expect(getSupabaseServiceConfig()).toEqual({
      url: "https://db.example",
      serviceKey: "service-key",
    });
  });

  it("keeps the global triage default and accepts a positive override", () => {
    vi.stubEnv("TRIAGE_GLOBAL_MAX", "");
    expect(getTriageGlobalMax()).toBe(DEFAULT_TRIAGE_GLOBAL_MAX);

    vi.stubEnv("TRIAGE_GLOBAL_MAX", "5");
    expect(getTriageGlobalMax()).toBe(5);

    vi.stubEnv("TRIAGE_GLOBAL_MAX", "0");
    expect(getTriageGlobalMax()).toBe(DEFAULT_TRIAGE_GLOBAL_MAX);
  });

  it("reads timeout overrides and allows disabling with 0", () => {
    vi.stubEnv("AI_TIMEOUT_MS", "");
    vi.stubEnv("PLACES_TIMEOUT_MS", "");
    expect(getAiTimeoutMs()).toBe(DEFAULT_AI_TIMEOUT_MS);
    expect(getPlacesTimeoutMs()).toBe(DEFAULT_PLACES_TIMEOUT_MS);

    vi.stubEnv("AI_TIMEOUT_MS", "1234");
    vi.stubEnv("PLACES_TIMEOUT_MS", "off");
    expect(getAiTimeoutMs()).toBe(1234);
    expect(getPlacesTimeoutMs()).toBe(0);

    vi.stubEnv("AI_TIMEOUT_MS", "0");
    expect(getAiTimeoutMs()).toBe(0);
  });
});