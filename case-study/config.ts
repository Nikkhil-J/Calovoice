import type { CaseStudy } from "../types";

const caseStudy: CaseStudy = {
  id: "calovoice",
  title: "Calovoice — Voice-First Calorie Tracking",
  description:
    "Designed and built a voice-powered calorie tracker that turns natural speech into structured food logs using an LLM pipeline — reducing meal logging from ~2 minutes to under 10 seconds.",
  tags: ["Product Design", "Voice UX", "AI / LLM", "React", "Firebase"],
  featured: true,
  accentBg: "bg-[var(--card-accent-teal)]",
  details: {
    problem:
      "Calorie tracking has a compliance problem, not a feature problem. Apps like HealthifyMe and MyFitnessPal require ~2 minutes per meal — searching databases, scrolling variants, adjusting servings — 3-4x a day. Most users quit within two weeks. The friction of logging outweighs the perceived value.",
    insight:
      "People describe meals in natural language effortlessly. 'Two rotis with dal and a bowl of curd' takes 3 seconds to say but 2 minutes to manually search and log. Voice isn't just a convenience — it's the difference between a habit that sticks and one that doesn't.",
    solution: [
      "Voice-first logging: tap, speak, done. An LLM pipeline (Web Speech API → OpenRouter → CalorieNinjas) parses natural speech into structured food entries with calorie estimates in under 10 seconds.",
      "Silence-as-submit: no 'Done' button during recording. 3.5s of silence after speech auto-submits. Silence IS the punctuation.",
      "Graceful degradation: if voice fails (unsupported browser, API error, empty parse), the user silently lands on a manual form — never an error dead-end.",
      "Time-aware UI: the CTA adapts ('Log Breakfast' → 'Log Dinner'), contextual insights reference your next meal by name, and a pace tick on the calorie ring shows where you 'should' be at this hour.",
      "Predictive coaching: after 2+ meals, the app projects your end-of-day intake and nudges accordingly — 'At your current pace, you'll exceed by ~400 kcal — consider a lighter dinner.'",
    ],
    keyDecisions: [
      {
        decision: "PWA over native",
        rationale:
          "MVP speed. Validates the voice interaction model before investing in native. The V2 roadmap includes native for widget-based logging without opening the app.",
      },
      {
        decision: "No global state store",
        rationale:
          "Firebase real-time listeners ARE the state layer. Components subscribe via hooks. No Redux, no Zustand — zero redundant state.",
      },
      {
        decision: "Custom ESLint rules for design enforcement",
        rationale:
          "Two custom lint rules (no-raw-style-literals, no-color-literals) make design token violations a build error, not a code review comment.",
      },
      {
        decision: "All CSS animations, no libraries",
        rationale:
          "Pure CSS with spring-eased curves achieves native-feel motion. Sheets animate out before unmounting (240ms exit). Zero JS animation runtime cost.",
      },
      {
        decision: "LLM via OpenRouter (model-agnostic)",
        rationale:
          "Can switch between GPT-4, Claude, Llama without code changes. JSON mode ensures structured output. Local food dictionary reduces API calls for common items.",
      },
    ],
    vision: [
      "V1 (MVP): Voice-first logging, calorie ring with pace indicator, contextual insights, activity tracking",
      "V2: Conversational AI coach — analyzes your day's data and guides real-time decisions ('You have 350 kcal left, skip the chips, try almonds with dark chocolate')",
      "V3: Native app with home-screen widget — tap mic, speak, done. No app open required. Background LLM processing.",
    ],
    metrics: [
      "Voice vs. manual usage ratio",
      "Time-to-log (target: <10s for voice path)",
      "LLM parse accuracy (edit rate before save)",
      "7-day and 14-day retention",
      "Meals logged per day consistency",
    ],
    stack:
      "React 19 · TypeScript · Firebase (Auth + Firestore) · OpenRouter (LLM) · CalorieNinjas API · Web Speech API · Vite · MUI · Zod · PWA",
  },
};

export default caseStudy;
