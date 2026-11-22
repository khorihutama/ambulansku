const windows = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  const cutoff = now - windowMs;
  const hits = (windows.get(key) ?? []).filter((at) => at > cutoff);

  if (hits.length >= limit) {
    windows.set(key, hits);
    const retryAfterMs = hits[0] + windowMs - now;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  hits.push(now);
  windows.set(key, hits);

  if (windows.size > 5000) {
    for (const [entryKey, entryHits] of windows) {
      if (!entryHits.some((at) => at > cutoff)) windows.delete(entryKey);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimits(): void {
  windows.clear();
}