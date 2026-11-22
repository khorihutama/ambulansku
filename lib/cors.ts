import { NextResponse } from "next/server";

function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function corsHeaders(req?: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };

  const origin = req?.headers.get("origin");
  if (origin && allowedOrigins().includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export function corsOptionsResponse(req?: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export function corsJson(
  req: Request | undefined,
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
) {
  return NextResponse.json(data, {
    status,
    headers: { ...corsHeaders(req), ...extraHeaders },
  });
}