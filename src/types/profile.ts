export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "extra_active";

export interface ProfileSettings {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  tdeeSuggested: number;
  maintenanceCalories: number;
  createdAt?: number;
  updatedAt?: number;
}
