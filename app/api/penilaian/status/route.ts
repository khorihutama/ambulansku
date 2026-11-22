import { NextRequest } from "next/server";
import { corsOptionsResponse, corsJson } from "@/lib/cors";
import { isFeedbackEnabled } from "@/lib/config";

export async function OPTIONS(req: NextRequest) {
  return corsOptionsResponse(req);
}

export async function GET(req: NextRequest) {
  return corsJson(req, { enabled: isFeedbackEnabled() });
}