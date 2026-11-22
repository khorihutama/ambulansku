const PRUNE_EVERY = 256;
const PRUNE_TARGET_RATIO = 0.9;

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

  const targetSize = Math.floor(RATE_LIMIT_MAX_KEYS * PRUNE_TARGET_RATIO);
  while (buckets.size > targetSize) {
    const oldestKey = buckets.keys().next().value;
    if (oldestKey === undefined) break;
    buckets.delete(oldestKey);
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