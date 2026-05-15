import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { TriageResult } from "@/types";

const provider = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: process.env.AI_BASE_URL || "https://openrouter.ai/api/v1",
});

const model = provider(process.env.AI_MODEL || "openai/gpt-4o-mini");

const TriageSchema = z.object({
  urgency: z.enum(["emergency", "scheduled"]),
  facilityTypes: z.array(
    z.enum(["RS", "Puskesmas", "PMI", "Klinik", "BPBD"])
  ),
  specialNeeds: z.array(z.string()),
  responseMessage: z.string(),
  searchKeywords: z.array(z.string()),
});

const FALLBACK: TriageResult = {
  urgency: "emergency",
  facilityTypes: ["RS", "PMI"],
  specialNeeds: ["IGD"],
  responseMessage:
    "Kami membantu menemukan fasilitas medis terdekat untuk Anda.",
  searchKeywords: ["rumah sakit terdekat", "IGD"],
};

export async function generateTriage(
  userInput: string
): Promise<TriageResult> {
  try {
    const { object } = await generateObject({
      model,
      schema: TriageSchema,
      system: `Kamu adalah sistem triage medis untuk aplikasi pencarian ambulans di Indonesia.
Analisis situasi yang diceritakan user dan kembalikan data terstruktur.

Aturan klasifikasi:
- emergency: kecelakaan, pingsan, sesak napas, nyeri dada, stroke, melahirkan mendadak, perdarahan
- scheduled: kontrol rutin, cuci darah terjadwal, kemoterapi, cek kesehatan, transport pasien stabil

Selalu prioritaskan keselamatan. Jika tidak jelas, default ke emergency.
responseMessage harus dalam Bahasa Indonesia, empati tapi jelas.
searchKeywords harus dalam Bahasa Indonesia yang cocok untuk Google Places API.`,
      prompt: userInput,
    });

    return object;
  } catch (error) {
    console.error("AI triage error:", error);
    return FALLBACK;
  }
}