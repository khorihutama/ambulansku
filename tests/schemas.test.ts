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

describe("feedbackRequestSchema", () => {
  it("accepts a complete feedback body and defaults disliked", () => {
    const parsed = feedbackRequestSchema.parse({
      name: "Ani",
      gender: "P",
      stars: 5,
      liked: "cepat",
    });

    expect(parsed).toEqual({
      name: "Ani",
      gender: "P",
      stars: 5,
      liked: "cepat",
      disliked: "",
    });
  });

  it("rejects missing required fields", () => {
    const result = feedbackRequestSchema.safeParse({
      gender: "L",
      stars: 4,
      liked: "baik",
    });

    expect(firstMessage(result)).toBe(
      "name, gender, stars, dan liked wajib diisi"
    );
  });

  it("rejects an invalid gender", () => {
    const result = feedbackRequestSchema.safeParse({
      name: "Ani",
      gender: "X",
      stars: 5,
      liked: "cepat",
    });

    expect(firstMessage(result)).toBe("gender harus L, P, atau O");
  });

  it("rejects ratings outside 1-5 and non-numbers", () => {
    for (const stars of [0, 6, "5"]) {
      const result = feedbackRequestSchema.safeParse({
        name: "Ani",
        gender: "P",
        stars,
        liked: "cepat",
      });

      expect(firstMessage(result)).toBe("stars harus 1-5");
    }
  });
});