import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TriageResult } from "@/types";

const { generateObjectMock } = vi.hoisted(() => ({
  generateObjectMock: vi.fn(),
}));

vi.mock("ai", () => ({ generateObject: generateObjectMock }));
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => () => "stub-model",
}));

import { generateTriage } from "@/lib/ai";
import { getNearbyFacilities } from "@/lib/places";

const TRIAGE: TriageResult = {
  urgency: "emergency",
  facilityTypes: ["RS", "PMI"],
  specialNeeds: ["IGD"],
  responseMessage: "Segera hubungi 119.",
  searchKeywords: ["rumah sakit terdekat", "IGD"],
};

function hangUntilAbort(options: {
  abortSignal?: AbortSignal;
}): Promise<never> {
  return new Promise((_, reject) => {
    if (!options.abortSignal) {
      reject(new Error("missing timeout signal"));
      return;
    }

    options.abortSignal.addEventListener("abort", () =>
      reject(options.abortSignal?.reason)
    );
  });
}

beforeEach(() => {
  vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
  vi.stubEnv("AI_TIMEOUT_MS", "150");
  vi.stubEnv("PLACES_TIMEOUT_MS", "150");
  generateObjectMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LLM resilience", () => {
  it("returns the emergency fallback when the call hangs past the timeout", async () => {
    generateObjectMock.mockImplementation(hangUntilAbort);

    const startedAt = Date.now();
    const result = await generateTriage("RAHASIA-SITUASI");
    const elapsed = Date.now() - startedAt;

    expect(result.urgency).toBe("emergency");
    expect(elapsed).toBeLessThan(2150);
    expect(generateObjectMock).toHaveBeenCalledTimes(1);
  });

  it("retries once only for a network failure", async () => {
    generateObjectMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({ object: TRIAGE });

    const result = await generateTriage("nyeri dada");

    expect(result).toEqual(TRIAGE);
    expect(generateObjectMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-network failure", async () => {
    generateObjectMock.mockRejectedValueOnce(new Error("schema mismatch"));

    const result = await generateTriage("nyeri dada");

    expect(result.urgency).toBe("emergency");
    expect(generateObjectMock).toHaveBeenCalledTimes(1);
  });
});

describe("Places resilience", () => {
  it("returns an empty list when the call hangs past the timeout", async () => {
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          const signal = init?.signal;
          if (!signal) {
            reject(new Error("missing timeout signal"));
            return;
          }
          signal.addEventListener("abort", () => reject(signal.reason));
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const startedAt = Date.now();
    const result = await getNearbyFacilities(-6.12345, 106.98765, [
      "rumah sakit",
    ]);
    const elapsed = Date.now() - startedAt;

    expect(result).toEqual([]);
    expect(elapsed).toBeLessThan(2150);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once only for a network failure", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ results: [] }),
      } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const result = await getNearbyFacilities(-6.2, 106.8, ["rumah sakit"]);

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("logs a warning when the Maps key is empty", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await getNearbyFacilities(-6.2, 106.8, ["rumah sakit"]);

    expect(result).toEqual([]);
    expect(warn.mock.calls.flat().join(" ")).toContain("GOOGLE_MAPS_API_KEY");
  });
});

describe("log safety", () => {
  it("does not log the situation, coordinates, names, or feedback", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    generateObjectMock.mockImplementation(hangUntilAbort);
    await generateTriage("RAHASIA-SITUASI");

    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason)
          );
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    await getNearbyFacilities(-6.12345, 106.98765, ["RAHASIA-KEYWORD"]);

    const output = [...info.mock.calls, ...warn.mock.calls, ...error.mock.calls]
      .flat()
      .map((value) => String(value))
      .join(" ");

    expect(output).not.toContain("RAHASIA");
    expect(output).not.toContain("-6.12345");
    expect(output).not.toContain("106.98765");
    expect(output).toContain("duration=");
  });
});