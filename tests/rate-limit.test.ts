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

  it("keeps live buckets and fails closed when the map is full", () => {
    const now = 1_000_000;

    for (let i = 0; i < 60; i += 1) {
      expect(
        checkRateLimit("triage-global", 60, 3_600_000, now).allowed
      ).toBe(true);
    }
    expect(checkRateLimit("triage-global", 60, 3_600_000, now).allowed).toBe(
      false
    );

    expect(checkRateLimit("victim", 1, 60_000, now).allowed).toBe(true);
    expect(checkRateLimit("victim", 1, 60_000, now).allowed).toBe(false);

    let rejected = 0;
    for (let i = 0; i < RATE_LIMIT_MAX_KEYS + 100; i += 1) {
      if (!checkRateLimit(`filler-${i}`, 1, 60_000, now).allowed) {
        rejected += 1;
      }
    }

    // The global budget and the victim bucket must survive the flood.
    const globalAfter = checkRateLimit(
      "triage-global",
      60,
      3_600_000,
      now
    );
    expect(globalAfter.allowed).toBe(false);
    expect(globalAfter.retryAfterSeconds).toBe(3600);
    expect(checkRateLimit("victim", 1, 60_000, now).allowed).toBe(false);

    expect(rateLimitKeyCount()).toBe(RATE_LIMIT_MAX_KEYS);
    expect(rejected).toBeGreaterThan(0);

    const late = checkRateLimit("late-key", 1, 60_000, now);
    expect(late.allowed).toBe(false);
    expect(late.reason).toBe("capacity");
    expect(rateLimitKeyCount()).toBe(RATE_LIMIT_MAX_KEYS);
  });
});