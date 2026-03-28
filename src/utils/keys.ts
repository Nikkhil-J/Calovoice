function envString(key: string): string | undefined {
  const v = import.meta.env[key] as string | undefined
  const t = v?.trim()
  return t || undefined
}

/** OpenRouter key from build env only (Vite `VITE_*`). */
export function getOpenRouterKey(): string | undefined {
  return envString('VITE_OPENROUTER_API_KEY')
}

/** CalorieNinjas key from build env only. Not required when mock calorie API is on. */
export function getCalorieNinjasKey(): string | undefined {
  return envString('VITE_CALORIENINJAS_API_KEY')
}

/** When true, calorie lookups are mocked (no CalorieNinjas HTTP). */
export function isMockCalorieApi(): boolean {
  const v = envString('VITE_MOCK_CALORIE_API')?.toLowerCase()
  return v === 'true' || v === '1'
}

function hasEnvOpenRouterKey(): boolean {
  return Boolean(getOpenRouterKey())
}

/** Mock mode or real CalorieNinjas env key. */
function hasCalorieProvider(): boolean {
  return isMockCalorieApi() || Boolean(getCalorieNinjasKey())
}

export function canUseFoodVoice(): boolean {
  return hasEnvOpenRouterKey() && hasCalorieProvider()
}

/**
 * Activity voice LLM mode only needs the OpenRouter key —
 * no CalorieNinjas required (the LLM estimates burns directly).
 */
export function canUseBurnVoiceLLM(): boolean {
  return hasEnvOpenRouterKey()
}
