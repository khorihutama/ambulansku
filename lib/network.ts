export type ErrorKind = "timeout" | "network" | "other";

function causeCode(error: Error): string {
  const cause = (error as { cause?: unknown }).cause;
  if (!cause || typeof cause !== "object" || !("code" in cause)) return "";
  return String((cause as { code?: unknown }).code ?? "");
}

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError" || error.name === "TimeoutError") {
    return false;
  }

  const text = `${error.name} ${error.message} ${causeCode(error)}`;
  return /fetch failed|cannot connect|connection error|network|socket hang up|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|UND_ERR/i.test(
    text
  );
}

export function errorKind(error: unknown): ErrorKind {
  if (!(error instanceof Error)) return "other";
  if (error.name === "AbortError" || error.name === "TimeoutError") {
    return "timeout";
  }
  if (isNetworkError(error)) return "network";
  return "other";
}

export function timeoutSignal(timeoutMs: number): AbortSignal | undefined {
  return timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined;
}