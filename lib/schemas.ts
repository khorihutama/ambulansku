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

export const feedbackRequestSchema = z.object({
  name: z
    .string({ error: "name, gender, stars, dan liked wajib diisi" })
    .trim()
    .min(1, "name, gender, stars, dan liked wajib diisi"),
  gender: z.enum(["L", "P", "O"], {
    error: "gender harus L, P, atau O",
  }),
  stars: z
    .number({ error: "stars harus 1-5" })
    .int("stars harus 1-5")
    .min(1, "stars harus 1-5")
    .max(5, "stars harus 1-5"),
  liked: z
    .string({ error: "name, gender, stars, dan liked wajib diisi" })
    .trim()
    .min(1, "name, gender, stars, dan liked wajib diisi"),
  disliked: z
    .string({ error: "disliked harus berupa teks" })
    .nullish()
    .transform((value) => value ?? ""),
});

export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;