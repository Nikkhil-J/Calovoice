import { z } from "zod";

export const profileSchema = z.object({
  sex: z.enum(["male", "female"]),
  ageYears: z.number().int().min(13).max(120),
  heightCm: z.number().min(50).max(280),
  weightKg: z.number().min(20).max(400),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "extra_active",
  ]),
  maintenanceCalories: z.number().int().min(1).max(20000),
  tdeeSuggested: z.number().positive(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
