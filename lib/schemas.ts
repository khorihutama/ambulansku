import { z } from "zod";

export const TRIAGE_MAX_SITUATION_CHARS = 2000;

export const triageRequestSchema = z.object({
  situation: z
    .string({ error: "situation harus berupa teks" })
    .trim()
    .min(1, "situation tidak boleh kosong")
    .max(
      TRIAGE_MAX_SITUATION_CHARS,
      `situation maksimal ${TRIAGE_MAX_SITUATION_CHARS} karakter`
    ),
  lat: z
    .number({ error: "lat dan lng harus berupa angka" })
    .finite("lat dan lng harus berupa angka")
    .min(-90, "lat atau lng di luar rentang")
    .max(90, "lat atau lng di luar rentang"),
  lng: z
    .number({ error: "lat dan lng harus berupa angka" })
    .finite("lat dan lng harus berupa angka")
    .min(-180, "lat atau lng di luar rentang")
    .max(180, "lat atau lng di luar rentang"),
});

export type TriageRequest = z.infer<typeof triageRequestSchema>;

export const FEEDBACK_MAX_COMMENT_CHARS = 1000;

export const feedbackRequestSchema = z.object({
  rating: z
    .number({ error: "rating wajib diisi (1-5)" })
    .int("rating harus 1-5")
    .min(1, "rating harus 1-5")
    .max(5, "rating harus 1-5"),
  comment: z
    .string({ error: "comment harus berupa teks" })
    .trim()
    .max(
      FEEDBACK_MAX_COMMENT_CHARS,
      `comment maksimal ${FEEDBACK_MAX_COMMENT_CHARS} karakter`
    )
    .nullish()
    .transform((value) => value ?? ""),
});

export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;