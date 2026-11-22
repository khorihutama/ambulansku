const PRUNE_EVERY = 256;

export const RATE_LIMIT_MAX_KEYS = 10_000;

interface Bucket {
  hits: number[];
  windowMs: number;
}

export interface RateLimitCheck {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  key: string | null;
  reason?: "limit" | "capacity";
}

const buckets = new Map<string, Bucket>();
let checksSincePrune = 0;

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    const lastHit = bucket.hits[bucket.hits.length - 1];
    if (lastHit === undefined || lastHit + bucket.windowMs <= now) {
      buckets.delete(key);
    }
  }
}

function recentHits(bucket: Bucket | undefined, windowMs: number, now: number) {
  if (!bucket) return [];
  const cutoff = now - windowMs;
  return bucket.hits.filter((at) => at > cutoff);
}

export function checkRateLimits(
  checks: RateLimitCheck[],
  now = Date.now()
): RateLimitResult {
  checksSincePrune += 1;
  if (
    checksSincePrune >= PRUNE_EVERY ||
    buckets.size >= RATE_LIMIT_MAX_KEYS
  ) {
    prune(now);
    checksSincePrune = 0;
  }

  const newKeys = new Set<string>();
  for (const check of checks) {
    if (!buckets.has(check.key)) newKeys.add(check.key);
  }

  if (buckets.size + newKeys.size > RATE_LIMIT_MAX_KEYS) {
    // Never evict a live bucket to make room. Reject the new key instead so
    // an attacker cannot flush the global budget or a victim's counter by
    // flooding the limiter with unique keys.
    const blockedCheck =
      checks.find((check) => newKeys.has(check.key)) ?? checks[0];

    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil(blockedCheck.windowMs / 1000)
      ),
      key: blockedCheck.key,
      reason: "capacity",
    };
  }

  const evaluated = checks.map((check) => {
    const hits = recentHits(buckets.get(check.key), check.windowMs, now);
    const allowed = hits.length < check.limit;
    const retryAfterSeconds = allowed
      ? 0
      : Math.max(
          1,
          Math.ceil((hits[0] + check.windowMs - now) / 1000)
        );

    return { check, hits, allowed, retryAfterSeconds };
  });

  const blocked = evaluated.find((entry) => !entry.allowed);
  if (blocked) {
    return {
      allowed: false,
      retryAfterSeconds: blocked.retryAfterSeconds,
      key: blocked.check.key,
      reason: "limit",
    };
  }

  for (const entry of evaluated) {
    const hits = [...entry.hits, now];
    if (hits.length > entry.check.limit) {
      hits.splice(0, hits.length - entry.check.limit);
    }
    buckets.set(entry.check.key, {
      hits,
      windowMs: entry.check.windowMs,
    });
  }

  return { allowed: true, retryAfterSeconds: 0, key: null };
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  return checkRateLimits([{ key, limit, windowMs }], now);
}

export function rateLimitKeyCount(): number {
  return buckets.size;
}

export function resetRateLimits(): void {
  buckets.clear();
  checksSincePrune = 0;
}