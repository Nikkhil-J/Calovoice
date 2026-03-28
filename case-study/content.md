# Calovoice — Voice-First Calorie Tracking

**Role:** Product Design, Architecture, Full-Stack Engineering
**Timeline:** 2026 (MVP)
**Stack:** React 19 · TypeScript · Firebase · OpenRouter (LLM) · CalorieNinjas API · Web Speech API · Vite · MUI · PWA
**Status:** MVP complete · V2 in planning

---

## The Problem

Calorie tracking has a compliance problem, not a feature problem.

Apps like HealthifyMe, MyFitnessPal, and Lose It have been around for over a decade. They all do the same thing: give users a massive food database, a search bar, and a manual entry form. The feature set is mature. The problem is — **most people quit within two weeks.**

The reason isn't lack of information. It's friction. Logging a single meal in a traditional calorie tracker looks like this:

1. Open the app
2. Tap "Add Food"
3. Search for "grilled chicken breast"
4. Scroll through 30+ variants (brands, preparations, serving sizes)
5. Adjust the serving to match what you actually ate
6. Repeat for every item on your plate
7. Do this 3–4 times a day, every day

**That's roughly 2 minutes per meal, 6–8 minutes per day, of tedious data entry.** For something that's supposed to help you feel better about your health, it feels like homework. The moment life gets busy — you skip a meal log, then two, then the habit is gone.

I experienced this firsthand. I wanted to track my intake consistently, but the existing tools made the act of logging feel heavier than the meals themselves.

---

## The Insight

People describe meals in natural language effortlessly. "I had two rotis with dal and a bowl of curd" takes 3 seconds to say. But typing that into a search-based interface takes 2 minutes of searching, selecting, and adjusting portions.

**What if logging a meal was as fast as describing it out loud?**

The hypothesis was simple: if you reduce the logging interaction from ~2 minutes to ~10 seconds, compliance goes up dramatically. Voice isn't just a convenience — it's the difference between a habit that sticks and one that doesn't.

---

## The Solution

Calovoice is a **voice-first calorie tracker** built as a PWA. The core interaction: tap a button, say what you ate, and the app handles everything else — parsing the food items, estimating calories, and logging the entry.

### How It Works (The Pipeline)

When a user says *"I had a bowl of oats with banana and a cup of black coffee"*, this is what happens under the hood:

```
Voice Input (Web Speech API)
    ↓
Raw Transcript: "I had a bowl of oats with banana and a cup of black coffee"
    ↓
LLM Structured Extraction (OpenRouter, JSON mode)
    ↓
Parsed Items: [
  { name: "Oats", quantity: "1 bowl" },
  { name: "Banana", quantity: "1" },
  { name: "Black coffee", quantity: "1 cup" }
]
    ↓
Calorie Lookup (Local dictionary → CalorieNinjas API fallback)
    ↓
Final Entries: [
  { name: "Oats", quantity: "1 bowl", kcal: 158 },
  { name: "Banana", quantity: "1", kcal: 89 },
  { name: "Black coffee", quantity: "1 cup", kcal: 2 }
]
    ↓
User Review & Edit (optional) → Save to Firestore
```

The user sees their parsed meal in an editable form. They can adjust quantities or calories before saving — but in most cases, they just hit save. **The entire flow takes under 10 seconds.**

### Silence as Punctuation

One of the more deliberate UX decisions: there's no "Done" or "Submit" button during recording. When the user stops speaking for 3.5 seconds (after they've said at least something), the app automatically finalizes the transcript and sends it for processing. **Silence IS the submit action.** A 15-second maximum recording duration acts as a safety net.

This removes a cognitive step. Users don't have to think about when to stop — they just speak naturally and the app figures out the rest.

### Graceful Degradation

Not every device supports speech recognition. API keys might be misconfigured. The LLM might not parse the transcript cleanly. Rather than showing an error screen, the app silently falls back to a manual entry form. If voice fails, the user still logs their meal — they just type it instead. An inline error banner offers a "Try again with voice" option, keeping the primary path accessible.

**The philosophy: never let a technical failure block the user's intent.**

---

## Product Decisions That Matter

### 1. Time-Aware Interface

The floating action button doesn't just say "Log Food." It adapts:

| Time of Day | Button Label |
|---|---|
| Before 11 AM | "Log Breakfast" |
| 11 AM – 2 PM | "Log Lunch" |
| 2 PM – 5 PM | "Log Snack" |
| After 5 PM | "Log Dinner" |

This is a subtle nudge. It reduces the cognitive overhead of "what am I logging?" and gently reinforces consistent meal patterns. The user doesn't have to categorize — the app already knows.

### 2. The Calorie Ring with Pace Indicator

The main dashboard centers on a progress ring showing calories remaining vs. goal. But there's a detail most users won't consciously notice: **a small tick mark on the ring showing where you "should" be at this time of day.**

It's calculated from a 7 AM – 11 PM eating window. If it's 2 PM and you've eaten 40% of your goal, the tick sits at ~44% (roughly mid-day), telling you you're slightly behind pace — without any text or number. It's ambient information, not a notification.

### 3. Contextual Insight Engine

Instead of generic motivational text, the app generates specific, actionable guidance based on your current state:

- **Morning, nothing logged:** *"3,161 kcal to spend today — start with breakfast."*
- **Mid-day, on track:** *"Eat ~520 kcal per meal across your next 2 meals."*
- **Evening, close to goal:** *"Nearly there — a light snack to finish the day."*
- **Over budget:** *"You're 200 kcal over — a short walk could offset that."*

There are 8 distinct insight branches driven by time of day, meals logged, and remaining budget. The insight text adapts in real-time as entries are added.

### 4. Predictive End-of-Day Projection

Once 2+ meals are logged, the app calculates your eating pace and projects your end-of-day intake:

*"At your current pace, you'll end the day around 2,800 kcal — right on target."*

Or:

*"At this rate you may exceed your goal by ~400 kcal — consider a lighter dinner."*

This is only shown between 7 AM and 9 PM, only when there's enough signal, and only when you're not already over budget. It's forward-looking without being anxious.

### 5. Activity Tracking with Dual-Parse Intelligence

Activity logging supports both voice and manual input. The voice pipeline uses the same LLM extraction, but with a fallback to a local heuristic parser that matches common activities (running, walking, yoga, etc.) from a built-in dictionary. This means activity logging works even without an API connection for common exercises.

### 6. Animated Numbers, Never Jumps

Every caloric number in the UI — remaining, eaten, burned, goal — uses a count-up/count-down animation (500ms, cubic ease-out). When you log a 400 kcal meal, the "remaining" number smoothly counts down from 3161 to 2761. The ring fills proportionally. It makes the data feel alive and gives the user a visceral sense of their budget changing.

---

## Design Philosophy

### Native-Feel Motion

All animations are pure CSS — no Framer Motion, no GSAP, no animation libraries. Sheets slide up with a spring-like overshoot (`cubic-bezier(0.22, 1, 0.36, 1)`), exit with a controlled deceleration, and always animate out before unmounting (240ms exit via a shared `useSheetAnimation` hook). Timeline items stagger in at 30ms intervals for a cascade effect.

Every interactive element has a tactile press state (scale 0.94–0.97), hover states darken intentionally, and the floating button uses a bouncy spring curve on press. The result feels like a native mobile app, not a web page.

`prefers-reduced-motion` is respected globally — all animation durations collapse to near-zero.

### Skeleton-Matched Loading

Loading states aren't generic spinners. The skeleton placeholders match the exact shape of the content they replace — same card heights, same layout. Successive skeleton cards progressively fade in opacity, creating a natural depth effect rather than a wall of shimmer.

### Empty State as Onramp

When no meals are logged, the empty state isn't a sad icon with "Nothing here." It's an active onramp: a plate illustration, clear copy ("Start tracking your day"), and quick-add chips for Breakfast, Lunch, Dinner, and Snack that jump directly into the manual entry form with the meal label pre-filled.

---

## Technical Architecture

### Why These Choices

| Decision | Rationale |
|---|---|
| **PWA, not native** | MVP speed. The real product vision requires native (widgets, background recording) — PWA validates the core interaction first. |
| **Firebase (Auth + Firestore)** | Zero backend to build. Real-time listeners mean the UI is always in sync. Anonymous auth reduces onboarding friction. |
| **No global state store** | Firestore real-time listeners ARE the state management. No Redux, no Zustand. Each component subscribes to what it needs via hooks. |
| **No React Router** | Four screens, stack-based navigation via `useState`. URL routing adds complexity without value at this scale. |
| **OpenRouter for LLM** | Model-agnostic. Can switch between GPT-4, Claude, Llama without changing application code. JSON mode ensures structured output. |
| **Custom ESLint rules** | Two rules (`no-raw-style-literals`, `no-color-literals`) enforce the design system at lint time. Hardcoded colors and pixel values are compilation errors, not code review comments. |
| **All CSS, no CSS-in-JS** | Single `index.css` (~3000 lines) with CSS custom properties for theming. Feature components use class names; MUI's `sx` prop only for form elements. Fast, inspectable, zero runtime cost. |

### Data Model

```
Firestore
├── users/{uid}/
│   ├── profile/settings     → { sex, age, height, weight, activityLevel, maintenanceCalories }
│   └── dayLogs/{dateKey}    → { food: [...entries], burn: [...entries] }
```

Every write uses Firestore transactions to prevent race conditions during rapid voice-parsed saves.

### Onboarding

Two-step flow: welcome screen (value prop) → body stats + TDEE-based calorie goal suggestion. The app computes a suggested daily target from sex, age, height, weight, and activity level using the Mifflin-St Jeor equation. Users can accept or override.

---

## What I'd Measure

Even as an MVP, these are the metrics I'd instrument to validate the hypothesis:

| Metric | What It Validates |
|---|---|
| **Voice vs. manual ratio** | Is voice actually the preferred input method? |
| **Time-to-log (voice path)** | Is it truly <10 seconds end-to-end? |
| **Parse accuracy** | How often do users edit LLM-parsed entries before saving? |
| **7-day retention** | Do users track for more than 2 weeks? (Industry benchmark: most quit by day 14) |
| **Meals logged per day** | Are users logging consistently (3-4 meals) or sporadically? |
| **Fallback-to-manual rate** | How often does voice fail and trigger manual entry? |
| **Insight engagement** | Does the predictive projection change behavior (lighter dinner after "you'll exceed")? |

---

## The Vision: V2 and Beyond

The MVP validates one hypothesis: *voice reduces friction enough to make calorie tracking habitual.* The roadmap extends the concept from passive tracking to **active AI-powered nutritional coaching.**

### V2: Conversational AI Coach

The next evolution is a system that doesn't just record what you ate — it **talks back.**

**Scenario:** It's 8 PM. You've logged breakfast, lunch, and an afternoon snack. You have 350 kcal remaining. You open the app and say:

> *"I feel like eating something junk."*

Instead of a generic "you're over budget" warning, the AI analyzes your day's data and responds:

> *"You've got 350 kcal left — that's enough for a solid snack. How about a handful of almonds with dark chocolate? That's around 280 kcal and will actually satisfy the craving. Skip the chips — that's 500+ kcal and you'll feel worse after."*

This is the core product insight: **calorie tracking is a means to an end. The end is making better decisions in the moment.** The AI coach bridges that gap — it has your context (today's intake, your goal, your remaining budget, the time of day) and can give specific, actionable guidance rather than generic advice.

### V3: Native App with Widget Logging

The ultimate friction reduction: **you don't even open the app.** A native iOS/Android widget with a microphone button on the home screen. Tap, speak, done. The log appears in the app when you open it later. Background processing handles the LLM parse and calorie lookup.

This requires native capabilities (background audio, widget APIs) that justify the move from PWA to native — but only after the core interaction is validated.

### Roadmap Summary

```
V1 (Current MVP)          → Voice-first logging, calorie tracking, contextual insights
V2 (Conversational Coach) → AI that responds to intent, guides decisions, adapts to context
V3 (Native + Widget)      → Zero-open logging via home screen widget, background processing
```

---

## Screenshots

### Day View — Empty State
The calorie ring shows full budget remaining. Time-aware CTA reads "Log Dinner" (captured in evening). Quick-add chips provide an immediate onramp.

### Voice Recording
Bottom sheet with live waveform visualization, recording timer, and fallback option ("Enter manually"). The sheet slides up with spring-eased animation.

### Activity Logging
Preset activity chips (Running, Walking, Cycling, Gym, Yoga, Swimming, Hiking, Sports) with manual description and calorie input as fallback.

---

## Key Takeaway

Calovoice isn't a better calorie tracker — it's a **faster** one. The bet is that the #1 reason people fail at calorie tracking isn't lack of features, data, or motivation. It's that the act of logging is too slow relative to the value it provides in the moment. By making logging a 10-second voice interaction instead of a 2-minute search-and-select ritual, the cost-benefit equation flips — and the habit has a chance to stick.

The MVP proves the interaction model works. The vision is an AI companion that makes the data actionable in real-time. The widget makes the habit invisible.

**The best health app is the one you actually use.**
