import { describe, expect, it } from "vitest";
import { feedbackRequestSchema, triageRequestSchema } from "@/lib/schemas";

function firstMessage(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) {
  return result.success ? null : result.error?.issues[0]?.message;
}

describe("triageRequestSchema", () => {
  it("accepts the contract body, including zero coordinates", () => {
    expect(
      triageRequestSchema.safeParse({
        situation: "nyeri dada",
        lat: 0,
        lng: 0,
      }).success
    ).toBe(true);
  });

  it("trims the situation text", () => {
    const parsed = triageRequestSchema.parse({
      situation: "  nyeri dada  ",
      lat: -6.2,
      lng: 106.8,
    });

    expect(parsed.situation).toBe("nyeri dada");
  });

  it("rejects a non-string situation", () => {
    const result = triageRequestSchema.safeParse({
      situation: 123,
      lat: -6.2,
      lng: 106.8,
    });

    expect(firstMessage(result)).toBe("situation harus berupa teks");
  });

  it("rejects empty and oversized situations", () => {
    expect(
      firstMessage(
        triageRequestSchema.safeParse({
          situation: "   ",
          lat: -6.2,
          lng: 106.8,
        })
      )
    ).toBe("situation tidak boleh kosong");

    expect(
      firstMessage(
        triageRequestSchema.safeParse({
          situation: "a".repeat(2001),
          lat: -6.2,
          lng: 106.8,
        })
      )
    ).toBe("situation maksimal 2000 karakter");
  });

  it("rejects non-numeric and out-of-range coordinates", () => {
    expect(
      firstMessage(
        triageRequestSchema.safeParse({
          situation: "nyeri dada",
          lat: "-6.2",
          lng: 106.8,
        })
      )
    ).toBe("lat dan lng harus berupa angka");

    expect(
      firstMessage(
        triageRequestSchema.safeParse({
          situation: "nyeri dada",
          lat: 91,
          lng: 106.8,
        })
      )
    ).toBe("lat atau lng di luar rentang");
  });
});

// Phase D: feedback is rating + one optional comment; name/gender/liked
// fields were removed from the schema.
describe("feedbackRequestSchema", () => {
  it("accepts a rating with an optional comment and strips identity fields", () => {
    const parsed = feedbackRequestSchema.parse({
      rating: 5,
      comment: "cepat",
      name: "Ani",
      gender: "P",
    });

    expect(parsed).toEqual({ rating: 5, comment: "cepat" });
  });

  it("defaults an omitted comment to an empty string", () => {
    const parsed = feedbackRequestSchema.parse({ rating: 4 });

    expect(parsed).toEqual({ rating: 4, comment: "" });
  });

  it("rejects a missing or invalid rating", () => {
    expect(firstMessage(feedbackRequestSchema.safeParse({}))).toBe(
      "rating wajib diisi (1-5)"
    );

    for (const rating of [0, 6]) {
      const result = feedbackRequestSchema.safeParse({
        rating,
        comment: "cepat",
      });

      expect(firstMessage(result)).toBe("rating harus 1-5");
    }

    expect(
      firstMessage(
        feedbackRequestSchema.safeParse({ rating: "5", comment: "cepat" })
      )
    ).toBe("rating wajib diisi (1-5)");
  });

  it("rejects a comment longer than 1000 characters", () => {
    const result = feedbackRequestSchema.safeParse({
      rating: 5,
      comment: "a".repeat(1001),
    });

    expect(firstMessage(result)).toBe("comment maksimal 1000 karakter");
  });
});