import { NextResponse } from "next/server";

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function corsOptionsResponse() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export function corsJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders() });
}