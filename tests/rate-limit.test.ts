import { afterEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  checkRateLimits,
  rateLimitKeyCount,
  resetRateLimits,
  RATE_LIMIT_MAX_KEYS,
} from "@/lib/rate-limit";

afterEach(() => {
  resetRateLimits();
});

describe("rate limiter", () => {
  it("does not consume an allowed bucket when another check blocks", () => {
    checkRateLimit("blocked", 1, 60_000, 1_000);

    const result = checkRateLimits(
      [
        { key: "fresh", limit: 1, windowMs: 60_000 },
        { key: "blocked", limit: 1, windowMs: 60_000 },
      ],
      1_000
    );

    expect(result.allowed).toBe(false);
    expect(result.key).toBe("blocked");
    expect(checkRateLimit("fresh", 1, 60_000, 1_000).allowed).toBe(true);
  });

  it("bounds the number of tracked keys", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_KEYS + 500; i += 1) {
      checkRateLimit(`key-${i}`, 1, 60_000, 1_000);
    }

    expect(rateLimitKeyCount()).toBeLessThanOrEqual(RATE_LIMIT_MAX_KEYS);
  });
});