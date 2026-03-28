import { Stack, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { RHFNumericField } from "../components/form/RHFNumericField";
import { ProfileBodyFields } from "../components/ProfileBodyFields";
import { SuggestedCalorieGoal } from "../components/SuggestedCalorieGoal";
import { saveProfile } from "../firestore/profile";
import { profileSchema, type ProfileFormValues } from "../schemas/profile";
import {
  borders,
  colors,
  motion,
  radius,
  sizes,
  spacing,
  typography,
} from "../theme";
import { computeTdeeSuggested } from "../utils/tdee";

const TOTAL_STEPS = 2;

export function OnboardingPage({
  uid,
  onComplete,
}: {
  uid: string;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const [finishBusy, setFinishBusy] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      sex: "male",
      ageYears: 30,
      heightCm: 170,
      weightKg: 70,
      activityLevel: "moderate",
      maintenanceCalories: 0,
      tdeeSuggested: 0,
    },
    mode: "onChange",
  });

  const { control, watch, setValue, handleSubmit } = form;
  const sex = watch("sex");
  const ageYears = watch("ageYears");
  const heightCm = watch("heightCm");
  const weightKg = watch("weightKg");
  const activityLevel = watch("activityLevel");
  const maintenanceCalories = watch("maintenanceCalories");

  const onboardingStyles = {
    sectionAnimation: motion.animationSlideUp,
    stackSpacing: `${spacing.md + spacing.sm}px`,
    titleMarginBottom: `${spacing.sm - spacing.xs}px`,
    heroLineHeight: `${spacing.md + spacing.xs - spacing.xxs}px`,
    infoPadding: `${spacing.md}px`,
    infoRadius: `${radius.lg}px`,
    infoBorder: borders.input,
    cardBorder: borders.panel,
    cardShadow: "var(--token-shadow-sm)",
    cardPadding: `${spacing.lg - spacing.xxs}px`,
    rowGap: `${spacing.sm}px`,
    noShrink: 0,
    spinnerWrap: {
      display: "flex",
      alignItems: "center",
      gap: `${spacing.sm}px`,
    },
    spinnerStyle: {
      width: sizes.spinnerSm,
      height: sizes.spinnerSm,
      borderWidth: `${sizes.borderStrong}px`,
      borderTopColor: colors.white,
    },
  } as const;

  const liveSuggested = useMemo(
    () =>
      computeTdeeSuggested(sex, weightKg, heightCm, ageYears, activityLevel),
    [sex, weightKg, heightCm, ageYears, activityLevel],
  );

  const goBody = () => {
    setStep(1);
    setValue("maintenanceCalories", liveSuggested);
    setValue("tdeeSuggested", liveSuggested);
  };

  const finish = handleSubmit(async (data) => {
    setFinishBusy(true);
    try {
      const live = computeTdeeSuggested(
        data.sex,
        data.weightKg,
        data.heightCm,
        data.ageYears,
        data.activityLevel,
      );
      await saveProfile(uid, {
        ...data,
        ageYears: Math.round(data.ageYears),
        maintenanceCalories: Math.round(data.maintenanceCalories || live),
        tdeeSuggested: live,
      });
      onComplete();
    } finally {
      setFinishBusy(false);
    }
  });

  return (
    <div className="page onboarding">
      {/* Step indicator */}
      <div
        className="step-indicator"
        aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}
      >
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`step-dot${i <= step ? " active" : ""}`} />
        ))}
      </div>

      {/* ── Step 0: Welcome ── */}
      {step === 0 && (
        <Stack
          spacing={onboardingStyles.stackSpacing}
          sx={{ animation: onboardingStyles.sectionAnimation }}
        >
          <div className="onboarding-hero-icon">🥦</div>

          <div>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: typography.hero.fontWeight,
                mb: onboardingStyles.titleMarginBottom,
              }}
            >
              Voice Health
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ lineHeight: onboardingStyles.heroLineHeight }}
            >
              Log meals by voice, track calories burned, and stay near your
              daily goal. English works best.
            </Typography>
          </div>

          <Stack
            spacing={1}
            sx={{
              background: colors.positiveGhost,
              border: onboardingStyles.infoBorder,
              borderColor: colors.positiveLight,
              borderRadius: onboardingStyles.infoRadius,
              p: onboardingStyles.infoPadding,
            }}
          >
            {[
              "🎤 Say what you ate — we find the calories",
              "🔥 Log calories burned by voice too",
              "📊 Track your daily goal at a glance",
            ].map((line) => (
              <Typography
                key={line}
                variant="body2"
                sx={{
                  color: colors.positiveDark,
                  fontWeight: typography.body.fontWeight,
                }}
              >
                {line}
              </Typography>
            ))}
          </Stack>

          <button
            type="button"
            className="btn primary full lg"
            onClick={goBody}
          >
            Get started →
          </button>
        </Stack>
      )}

      {/* ── Step 1: Body & Goal ── */}
      {step === 1 && (
        <Stack
          spacing={onboardingStyles.stackSpacing}
          sx={{ animation: onboardingStyles.sectionAnimation }}
        >
          <div>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: typography.title.fontWeight,
                mb: `${spacing.sm}px`,
              }}
            >
              Your body &amp; goal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We'll suggest a daily calorie target. Estimates only — not medical
              advice.
            </Typography>
          </div>

          <div
            style={{
              background: colors.surface,
              borderRadius: onboardingStyles.infoRadius,
              border: onboardingStyles.cardBorder,
              boxShadow: onboardingStyles.cardShadow,
              padding: onboardingStyles.cardPadding,
            }}
          >
            <Stack spacing={`${spacing.md + spacing.xs + spacing.xs}px`}>
              <ProfileBodyFields control={control} />

              <SuggestedCalorieGoal
                liveSuggested={liveSuggested}
                maintenanceCalories={maintenanceCalories}
                onUseSuggested={() =>
                  setValue("maintenanceCalories", liveSuggested)
                }
              />

              <RHFNumericField<ProfileFormValues>
                name="maintenanceCalories"
                control={control}
                label="Daily calorie goal"
                helperText="Optional — type your daily target; we suggest based on your stats."
                min={500}
                max={20000}
                step={1}
              />
            </Stack>
          </div>

          <div style={{ display: "flex", gap: onboardingStyles.rowGap }}>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setStep(0)}
              style={{ flexShrink: onboardingStyles.noShrink }}
            >
              ← Back
            </button>
            <button
              type="button"
              className="btn primary full lg"
              disabled={finishBusy || !maintenanceCalories}
              onClick={() => void finish()}
            >
              {finishBusy ? (
                <span style={onboardingStyles.spinnerWrap}>
                  <span
                    className="spinner"
                    style={onboardingStyles.spinnerStyle}
                  />
                  Saving…
                </span>
              ) : (
                "Start tracking →"
              )}
            </button>
          </div>
        </Stack>
      )}
    </div>
  );
}
