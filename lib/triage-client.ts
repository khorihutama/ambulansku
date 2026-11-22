import type { TriageResponse } from "@/types";

const TOKEN_STORAGE_KEY = "ambulansku.triage.token";
const TOKEN_SAFETY_MS = 60_000;

interface StoredToken {
  token: string;
  expiresAt: number;
}

interface TriagePayload {
  situation: string;
  lat: number;
  lng: number;
}

export class TriageRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TriageRequestError";
    this.status = status;
  }
}

function readStoredToken(): string | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as Partial<StoredToken>;
    if (typeof stored.token !== "string") return null;
    if (typeof stored.expiresAt !== "number") return null;
    if (stored.expiresAt - TOKEN_SAFETY_MS <= Date.now()) return null;

    return stored.token;
  } catch {
    return null;
  }
}

function storeToken(token: string, expiresIn: number): void {
  try {
    sessionStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({
        token,
        expiresAt: Date.now() + expiresIn * 1000,
      })
    );
  } catch {
    // Storage can be unavailable; the token still works for this request.
  }
}

async function requestToken(): Promise<string> {
  const response = await fetch("/api/triage/token", { method: "POST" });
  const body = await response.json().catch(() => null);

  if (!response.ok || typeof body?.token !== "string") {
    throw new TriageRequestError(
      body?.error ?? "Gagal memulai sesi. Silakan coba lagi.",
      response.status
    );
  }

  const expiresIn =
    typeof body.expiresIn === "number" ? body.expiresIn : 30 * 60;
  storeToken(body.token, expiresIn);

  return body.token;
}

function sendTriage(token: string, payload: TriagePayload) {
  return fetch("/api/triage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function requestTriage(
  payload: TriagePayload
): Promise<TriageResponse> {
  let token = readStoredToken() ?? (await requestToken());
  let response = await sendTriage(token, payload);

  if (response.status === 401) {
    token = await requestToken();
    response = await sendTriage(token, payload);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok || !body) {
    throw new TriageRequestError(
      body?.error ?? "Gagal memuat hasil. Silakan coba lagi.",
      response.status
    );
  }

  return body as TriageResponse;
}