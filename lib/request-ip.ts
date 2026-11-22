const DEFAULT_TRUSTED_PROXY_HOPS = 1;
const MAX_TRUSTED_PROXY_HOPS = 10;

function trustedProxyHops(): number {
  const parsed = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_TRUSTED_PROXY_HOPS;
  }
  return Math.min(parsed, MAX_TRUSTED_PROXY_HOPS);
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");

  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);

    if (hops.length > 0) {
      // A trusted proxy appends the address it saw to the right of the header.
      // With N trusted proxies, the client is N entries from the right; any
      // entries further left may be supplied by the client and must be ignored.
      const index = Math.max(0, hops.length - trustedProxyHops());
      return hops[index] || "unknown";
    }
  }

  return req.headers.get("x-real-ip")?.trim() || "unknown";
}