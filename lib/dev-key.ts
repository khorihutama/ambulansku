import { timingSafeEqual } from "node:crypto";

/**
 * Compares a provided dev key with the configured one in constant time.
 * Length is checked first because timingSafeEqual throws on different sizes.
 * A missing expected key always fails, even when the provided key is empty.
 */
export function matchesDevKey(
  provided: string | null | undefined,
  expected: string | undefined
): boolean {
  if (!provided || !expected) return false;

  const providedBytes = Buffer.from(provided, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");

  if (providedBytes.length !== expectedBytes.length) return false;

  return timingSafeEqual(providedBytes, expectedBytes);
}