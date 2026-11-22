import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("legacy page redirect", () => {
  it("permanently redirects /penilaian to /feedback", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];

    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/penilaian",
          destination: "/feedback",
          permanent: true,
        }),
      ])
    );
  });
});