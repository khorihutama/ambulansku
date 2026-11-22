import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { getAiConfig, getAiTimeoutMs } from "@/lib/config";
import { errorKind, isNetworkError } from "@/lib/network";
import type { TriageResult } from "@/types";

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
  const startedAt = Date.now();

  try {
    const config = getAiConfig();
    const provider = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    const timeoutMs = getAiTimeoutMs();

    const buildOptions = () => ({
      model: provider(config.model),
      schema: TriageSchema,
      maxOutputTokens: 800,
      system: `Kamu adalah sistem triage medis untuk aplikasi pencarian ambulans di Indonesia.
Analisis situasi yang diceritakan user dan kembalikan data terstruktur.

Aturan klasifikasi:
- emergency: kecelakaan, pingsan, sesak napas, nyeri dada, stroke, melahirkan mendadak, perdarahan
- scheduled: kontrol rutin, cuci darah terjadwal, kemoterapi, cek kesehatan, transport pasien stabil

Selalu prioritaskan keselamatan. Jika tidak jelas, default ke emergency.
responseMessage harus dalam Bahasa Indonesia, empati tapi jelas.
searchKeywords harus dalam Bahasa Indonesia yang cocok untuk Google Places API.`,
      prompt: userInput,
      ...(timeoutMs > 0
        ? { abortSignal: AbortSignal.timeout(timeoutMs) }
        : {}),
    });

    const callModel = async () => {
      try {
        return await generateObject(buildOptions());
      } catch (error) {
        if (!isNetworkError(error)) throw error;

        console.warn("[ai] retrying once after network error");
        return generateObject(buildOptions());
      }
    };

    const { object } = await callModel();
    console.info(
      `[ai] generateTriage duration=${Date.now() - startedAt}ms outcome=ok`
    );

    return object;
  } catch (error) {
    console.error(
      `[ai] generateTriage duration=${Date.now() - startedAt}ms outcome=fallback kind=${errorKind(
        error
      )}`
    );
    return FALLBACK;
  }
}