export type TextBodyResult =
  | { ok: true; raw: string }
  | { ok: false; status: 400 | 413; error: string };

const BODY_TOO_LARGE = "Body permintaan terlalu besar (maksimal 8 KB).";
const BODY_UNREADABLE = "Body permintaan tidak dapat dibaca.";

/**
 * Reads a request body without buffering more than maxBytes. A declared
 * Content-Length is checked before reading, and the stream is cancelled as
 * soon as the running total exceeds the limit.
 */
export async function readTextBody(
  req: Request,
  maxBytes: number
): Promise<TextBodyResult> {
  const contentLength = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, status: 413, error: BODY_TOO_LARGE };
  }

  let raw = "";
  try {
    const reader = req.body?.getReader();
    if (reader) {
      const chunks: Uint8Array[] = [];
      let total = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel().catch(() => undefined);
          return { ok: false, status: 413, error: BODY_TOO_LARGE };
        }

        chunks.push(value);
      }

      raw = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString(
        "utf8"
      );
    }
  } catch {
    return { ok: false, status: 400, error: BODY_UNREADABLE };
  }

  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    return { ok: false, status: 413, error: BODY_TOO_LARGE };
  }

  return { ok: true, raw };
}