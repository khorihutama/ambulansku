import { afterEach, describe, expect, it, vi } from "vitest";

const { generateObjectMock } = vi.hoisted(() => ({
  generateObjectMock: vi.fn(),
}));

vi.mock("ai", () => ({ generateObject: generateObjectMock }));
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => () => "stub-model",
}));

import { generateTriage } from "@/lib/ai";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateTriage emergency fallback", () => {
  it("returns emergency triage instead of an error when the LLM fails", async () => {
    generateObjectMock.mockRejectedValueOnce(new Error("LLM unavailable"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await generateTriage("nyeri dada dan sesak napas");

    expect(result.urgency).toBe("emergency");
    expect(result.facilityTypes).toEqual(["RS", "PMI"]);
    expect(result.specialNeeds).toEqual(["IGD"]);
    expect(result.responseMessage.length).toBeGreaterThan(0);
    expect(result.searchKeywords.length).toBeGreaterThan(0);
    expect(consoleError).toHaveBeenCalled();
  });
});