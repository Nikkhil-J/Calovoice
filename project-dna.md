# Project DNA

> Extracted from: voice-health
> Stack: React 19 (web) · Vite 8 · TypeScript 5.9 · MUI 7 · Firebase · Zod · React Hook Form
> Extracted by Cursor on: 2026-03-28

---

## 1. Animation & Motion Feel

### Philosophy
Motion is functional, not decorative. Every animation exists to communicate a state change — sheets slide up from below because they originate from below, skeletons shimmer because something is loading, numbers count up because they changed. There are no gratuitous flourishes; the app feels fast because transitions are short and directional. The overall feeling is a native mobile app where UI appears from where you'd expect it to, and disappears back where it came from.

### Easing Curves
- **Sheet entrances:** `cubic-bezier(0.22, 1, 0.36, 1)` — overshoots slightly for a spring-like feel (used by `voiceSheetIn`, `voiceContentIn`)
- **Sheet exits:** `cubic-bezier(0.4, 0, 1, 1)` — fast start, linear deceleration (used by `voiceSheetOut`, `sheetDown`, `modal-exit`)
- **Ring/progress fills:** `cubic-bezier(0.4, 0, 0.2, 1)` — Material standard easing, defined as `motion.easingRing` in tokens
- **Page fade-in:** `cubic-bezier(0.25, 0.1, 0.25, 1)` — gentle ease
- **General transitions (hover, focus, color):** `ease` with 150ms — uniform and plain
- **Animated numbers:** Cubic ease-out via JS: `1 - Math.pow(1 - progress, 3)` over 500ms
- **Button press spring:** `cubic-bezier(0.34, 1.56, 0.64, 1)` on `.floating-btn` for a bouncy press-release feel

### Timing
| Category | Duration | Example |
|---|---|---|
| Micro-interactions (hover, focus, color) | 100–150ms | Button active scale, border-color transitions |
| Content entrance (slideUp, fadeIn) | 150–250ms | `.timeline-item` at 150ms, `.page` fadeIn at 250ms |
| Sheet entrance | 280ms | `voiceSheetIn`, `sheetUp` |
| Sheet exit | 240ms | `EXIT_DURATION_MS` constant, shared by all sheets |
| Ring progress fill | 700ms | `.calorie-ring-progress` stroke-dashoffset |
| Number count-up | 500ms | `useAnimatedNumber` |
| Skeleton shimmer | 1500ms loop | `shimmer` keyframe |
| Stagger per timeline item | 30ms | `uiTokens.animation.itemDelayMs` |
| Stagger per history item | 50ms | `uiTokens.animation.historyItemDelayMs` |

### Transition Patterns
All transitions use CSS animations/transitions — no Framer Motion, no React Spring, no GSAP. The dominant pattern for sheets:

1. Enter: CSS `animation` on mount (e.g. `voiceSheetIn 0.28s cubic-bezier(0.22, 1, 0.36, 1)`)
2. Exit: Toggle a `-exit` CSS class → `setTimeout(onClose, EXIT_DURATION_MS)` → parent unmounts

This exit pattern is encapsulated in the `useSheetAnimation` hook:

```typescript
// src/hooks/useSheetAnimation.ts
export function useSheetAnimation(onClose: () => void) {
  const [closing, setClosing] = useState(false)
  const pendingRef = useRef(false)
  const animateOut = useCallback(() => {
    if (pendingRef.current) return
    pendingRef.current = true
    setClosing(true)
    setTimeout(onClose, EXIT_DURATION_MS)
  }, [onClose])
  return { closing, animateOut }
}
```

Components then derive class names: `const sheetClass = closing ? 'entry-sheet entry-sheet-exit' : 'entry-sheet'`

### Motion Rules
- **Always animates:** Page mount (fadeIn), sheet open/close (slideUp/Down), timeline items (staggered slideUp), skeleton shimmer, calorie ring progress, number changes (count-up), floating action bar entrance.
- **Never animates:** Text color changes, layout reflows, data swaps within existing components.
- **Reduced motion is respected:** A global `@media (prefers-reduced-motion: reduce)` rule sets `animation-duration: 0.01ms !important` and `transition-duration: 0.01ms !important` on all elements. The floating bar additionally drops its `backdrop-filter` blur.
- **Triggers:** Mount (most entrance animations), state change (ring fill, number count), class toggle (exit animations), scroll (nothing — no scroll-linked animations exist).

---

## 2. Component Structure & Reusability

### Component Philosophy
Components are sized by feature boundary, not by visual size. The day view is composed of ~10 components, each owning one UI concern (ring, timeline, floating bar, voice sheet, etc.). Presentational components are wrapped in `memo()` as a default — nearly every exported component uses `memo`. Smart/container logic lives in hooks, not in components; components receive pre-computed data and callbacks. There are no "god components" — even `DayViewPage` (the most complex page) only orchestrates hooks and renders children.

### Folder Structure (actual)
```
src/
  components/
    primitives/       ← Token-enforcing MUI wrappers (Box, Stack, Text, FullPageSpinner, FullPageError)
    layout/           ← Page shell pieces (PageHeader + icon sub-components)
    gates/            ← Auth/profile render-prop gates (AuthGate, ProfileGate)
    day/              ← All day-view feature components (CalorieRing, Timeline, VoiceInputSheet, etc.)
    form/             ← React Hook Form adapter wrappers (RHFLabeledSelect, RHFNumericField)
    LabeledSelect.tsx ← Shared MUI Select with token-based styling
    NumericField.tsx  ← Shared numeric input with draft/commit pattern
    ProfileBodyFields.tsx ← Reused in Onboarding + Settings
    SuggestedCalorieGoal.tsx ← Reused in Onboarding + Settings
  hooks/              ← All custom hooks (17 hooks)
  pages/              ← Page-level components (DayViewPage, HistoryPage, OnboardingPage, SettingsPage)
  services/           ← External API clients (audioRecorder, calorieninjas, llm, openrouter, parser)
  firestore/          ← Firestore read/write functions (dayLog, profile)
  navigation/         ← Custom stack-based navigation (AppNavigationContext, useAppRouter)
  schemas/            ← Zod schemas (entry, profile)
  theme/              ← Design tokens (colors, spacing, radius, typography, tokens, muiTheme, index)
  types/              ← TypeScript interfaces (dayLog, profile, timeline)
  utils/              ← Pure utility functions (dateKey, keys, performanceGuardrails, tdee)
```

### Composition Patterns
**Render-prop gates** are the primary composition pattern at the app shell level. `AuthGate` and `ProfileGate` use children-as-function to provide typed data downstream:

```tsx
// src/App.tsx
<AuthGate>
  {(user) => (
    <ProfileGate uid={user.uid}>
      {(profile) => <AppRouter uid={user.uid} profile={profile} />}
    </ProfileGate>
  )}
</AuthGate>
```

**Context injection** is used only for navigation (`AppNavigationContext`). There is no other global context.

**Hook composition** is the dominant pattern for business logic. `useVoiceLogging` composes `useVoiceCapture` + `useParsePipeline` + `useResultEditor` to orchestrate the full voice pipeline. `DayViewPage` composes `useDayLog` + `useProfile` + `useCalorieSummary` + `useInsightText` + `usePredictiveInsight` + `useTimeline` + `useVoiceLogging` + `useEntryModals`.

**Close context** is used once: `BottomSheet` provides a `CloseCtx` so deeply nested content can trigger dismissal without prop drilling.

### Prop Conventions
- Event handlers: `onX` for callback props (`onClose`, `onSave`, `onEdit`, `onRetryVoice`, `onDismissError`)
- Boolean flags: `isX` pattern is not used in props — instead plain adjectives: `saving`, `loading`, `closing`, `foodDisabled`
- Children: Used only in primitives (`Box`, `Stack`) and gates (`AuthGate`, `ProfileGate`). Feature components receive data props, never children.
- Inline prop types for simple components, named interfaces for complex ones (e.g. `VoiceRecorderProps`, `FloatingActionsProps`).
- Forms pass `UseFormReturn<T>` directly to child components rather than individual field props.

### Reusability Line
- **Extracted to `primitives/`:** Only when it wraps a library component to enforce design tokens (Box, Stack, Text) or represents a full-page state (FullPageSpinner, FullPageError).
- **Extracted to `components/`:** When reused across pages (`ProfileBodyFields`, `SuggestedCalorieGoal`) or when it represents a self-contained UI piece within a feature (`CalorieRing`, `TimelineItem`).
- **Stays local (inline):** SVG icons are defined as local function components inside the file that uses them (`MicIcon`, `StopIcon`, `SendIcon`, `FoodIcon`, `ActivityIcon`, `PlateIllustration`). They are never extracted to a shared icons file.
- **Hooks are always extracted:** Even single-use hooks like `useSheetAnimation` live in `src/hooks/` rather than inline.

---

## 3. State Management

### Overall Approach
No global state store exists. The philosophy is: Firestore is the source of truth, real-time listeners push data down, and everything else is derived locally. The only shared context is navigation. All component state is local (`useState`), all form state is managed by React Hook Form, and all derived computations are `useMemo`.

### Local vs Global State
| State Kind | Where It Lives | Example |
|---|---|---|
| Auth user | `useFirebaseAuth` hook → passed via render-prop gate | `AuthGate` provides `User` |
| User profile | Firestore `onSnapshot` via `useProfile` hook | Real-time listener, no cache |
| Day log (food/burn entries) | Firestore `onSnapshot` via `useDayLog` hook | Real-time listener per date |
| Navigation stack | `useState` in `useAppRouter` → Context | `AppNavigationContext` |
| Voice recording state | `useState` in `useVoiceCapture` | `isRecording`, `transcript`, `amplitude` |
| Modal open/close | `useState` in `useEntryModals` | `manualFood`, `editBurn`, etc. |
| Form values | React Hook Form's internal state | `useForm<FoodEntryFormValues>()` |
| Sheet closing animation | `useState` in `useSheetAnimation` | `closing` boolean |

Nothing is elevated to a global store. If two components need the same data, they both call the same hook (e.g. `useProfile(uid)` is called in both `DayViewPage` and `HistoryPage`).

### Async State
There is **no React Query, SWR, or fetch abstraction**. Async data follows two patterns:

1. **Real-time subscriptions** (`useDayLog`, `useProfile`, `useFirebaseAuth`): `onSnapshot` in a `useEffect`, with `loading` boolean tracking initial load. Error is either swallowed (profile) or surfaced to UI (auth).

2. **One-shot fetches** (`HistoryPage.fetchDay`, `useParsePipeline.parse`): Raw `async`/`await` in callbacks or `useEffect` with a `cancelled` flag for cleanup. Loading is tracked via local `useState`.

Loading states are always boolean flags (`loading`), never enum. Success replaces the loading state. Errors are stored as `string | null`.

### Derived State
All derived state uses `useMemo` — never stored separately. The derivation chain in `DayViewPage`:

```
useDayLog(uid, dateKey) → day
useCalorieSummary(day, maintenance) → summary
useInsightText(summary, mealCount) → insightText
usePredictiveInsight(summary, mealCount) → predictiveInsight
useDailyScore(summary, mealCount, activityCount) → breakdown
useTimeline(day) → grouped
```

Each hook memoizes on its specific inputs. There is no redundant state.

### Side Effects
- **Firebase listeners:** Set up in `useEffect`, return the `unsub` function directly for cleanup.
- **Timers:** `clearTimeout`/`clearInterval` in effect cleanup. `useVoiceCapture` manages silence timer and max-duration timer with refs, cleaned up in a dedicated `clearTimers` callback.
- **AbortController:** `useParsePipeline` creates an `AbortController` per parse call, stored in a ref. Previous controller is aborted before starting a new parse. The `abort` method is exposed for external cancellation.
- **queueMicrotask:** Used in `useDayLog` and `useProfile` for edge cases where state must update without triggering synchronous re-renders (null uid path).

---

## 4. File & Folder Architecture

### Top-Level Structure (actual)
```
voice-health/
  public/                  ← PWA icons, static prototype HTML
  src/
    assets/                ← Empty (no static assets in src)
    components/            ← UI components, organized by concern
    firestore/             ← Firestore document references and write functions
    hooks/                 ← All custom React hooks (17 files)
    navigation/            ← Stack-based navigation context + router hook
    pages/                 ← Page-level components (4 pages)
    schemas/               ← Zod validation schemas
    services/              ← External API clients (OpenRouter, CalorieNinjas, parser, audio)
    theme/                 ← Design tokens and MUI theme configuration
    types/                 ← TypeScript type definitions
    utils/                 ← Pure utility functions
    App.tsx                ← Root component (gates + router)
    firebase.ts            ← Firebase initialization
    index.css              ← All styles (~3019 lines, single file)
    main.tsx               ← Entry point (ThemeProvider, CSS var injection, perf guardrails)
  index.html
  package.json
  vite.config.ts
  tsconfig.json / tsconfig.app.json / tsconfig.node.json
  eslint.config.js         ← Includes custom design-system lint rules
```

### Module Boundaries
Clear vertical separation: `firestore/` never imports from `components/`, `services/` never imports from `hooks/`, `hooks/` never imports from `pages/`. The dependency flow is:

```
pages → hooks → services/firestore
pages → components → theme
hooks → services → (external APIs)
hooks → firestore → firebase
hooks → utils
hooks → theme (for config values like uiTokens)
```

There is no `shared/` or `common/` layer. Shared components live at `src/components/` root level (`LabeledSelect.tsx`, `NumericField.tsx`, `ProfileBodyFields.tsx`, `SuggestedCalorieGoal.tsx`).

### Import Conventions
**All imports are relative paths.** No path aliases (`@/`) are configured — `tsconfig.app.json` has no `paths` key. Imports use the `../` pattern consistently:

```typescript
import { colors, sizes } from '../../theme'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
```

The `theme/index.ts` barrel re-exports all tokens, so theme imports use either `'../../theme'` (for multiple tokens) or `'../../theme/muiTheme'` (for a specific submodule).

### File Naming
| Kind | Convention | Examples |
|---|---|---|
| Components | PascalCase `.tsx` | `CalorieRing.tsx`, `VoiceInputSheet.tsx`, `FullPageSpinner.tsx` |
| Hooks | camelCase `.ts` with `use` prefix | `useAnimatedNumber.ts`, `useVoiceCapture.ts` |
| Services | camelCase `.ts` | `audioRecorder.ts`, `openrouter.ts`, `calorieninjas.ts` |
| Types | camelCase `.ts` | `dayLog.ts`, `profile.ts`, `timeline.ts` |
| Schemas | camelCase `.ts` | `entry.ts`, `profile.ts` |
| Utils | camelCase `.ts` | `dateKey.ts`, `keys.ts`, `tdee.ts` |
| Theme tokens | camelCase `.ts` | `colors.ts`, `spacing.ts`, `tokens.ts` |
| Constants | camelCase `.ts` | `constants.ts` (only one, in `day/`) |

### Co-location
- **Styles are not co-located.** All styles live in a single `src/index.css` file (~3019 lines), organized by section with `/* === SECTION NAME === */` comment headers.
- **Types are separated** into `src/types/`, not co-located with components.
- **Schemas are separated** into `src/schemas/`.
- **No test files exist** anywhere in the codebase.
- **Constants are co-located** with the feature that uses them (`src/components/day/constants.ts`).

---

## 5. Naming Conventions & Code Style

### Variable & Function Naming
- **Local variables:** Terse but readable. `const h = new Date().getHours()`, `const net = eaten - burned`, `const er = expectedRatio()`. Single-letter variables only for loop indices and very local math.
- **Booleans:** `isOver`, `isRecording`, `isFood`, `isToday`, `canSubmit`, `canInstall`, `hasEntries`, `hasProfileChanges`. Mix of `is` and `has` prefixes; `can` prefix for capability checks.
- **Event handlers:** `handleX` for local handlers (`handleLogFood`, `handleCancel`, `handleSend`), `onX` for prop callbacks (`onClose`, `onSave`, `onEdit`).
- **Constants:** `SCREAMING_SNAKE_CASE` — `EXIT_DURATION_MS`, `WAVEFORM_BARS`, `PRESET_ACTIVITIES`, `FOOD_DB`, `ACTIVITY_DB`.
- **Refs:** `xRef` suffix — `pendingRef`, `frameRef`, `audioRef`, `transcriptRef`, `draftForCommitRef`.

### Component Naming
- PascalCase, no prefix conventions (no `Base`, `App`, `The` prefixes).
- Memo'd components use the named function form: `export const Timeline = memo(function Timeline({...}) {...})`.
- Internal sub-components are non-exported functions in the same file: `function PeriodGroup(...)`, `function StatusChip(...)`, `function SegmentDot(...)`.
- SVG icon components are local unexported functions: `function MicIcon()`, `function FoodIcon()`.
- Gate components follow `XGate` naming: `AuthGate`, `ProfileGate`.
- Modal variants use `Add`/`Edit` prefix: `AddFoodModal`, `EditFoodModal`, `AddActivityModal`.

### Custom Hook Naming & Structure
Every hook follows the same shape: named export, `useX` prefix, returns either an object or a composed type. Hooks that manage a lifecycle return `{ state, actions }` via intersection types:

```typescript
// src/hooks/useVoiceCapture.ts
export type VoiceCaptureState = { isRecording: boolean; transcript: string; amplitude: number; speechSupported: boolean }
export type VoiceCaptureActions = { start: (...) => Promise<void>; stop: () => void; cancel: () => void }
export function useVoiceCapture(): VoiceCaptureState & VoiceCaptureActions { ... }
```

Pure derivation hooks are simple:

```typescript
// src/hooks/useInsightText.ts
export function useInsightText(summary: CalorieSummary, mealCount: number): string {
  return useMemo(() => { ... }, [summary, mealCount])
}
```

Hook length ranges from 10 lines (`useSheetAnimation`) to 150 lines (`useVoiceCapture`). Business logic hooks like `useVoiceLogging` and `useEntryModals` are the longest (~180 lines).

### CSS / Styling Approach
**Hybrid: single global CSS file + MUI's `sx` prop for MUI-wrapped components.**

The dominant pattern is vanilla CSS classes in `index.css` with BEM-ish flat naming. Classes are descriptive and component-scoped by naming convention:

```
.timeline-item          ← component
.timeline-item:hover    ← state
.timeline-cal.food      ← modifier
.entry-sheet-field-label ← child element
```

MUI's `sx` prop is used in `OnboardingPage`, `SettingsPage`, `LabeledSelect`, `NumericField`, and the primitive wrappers — always referencing theme tokens, never raw values. This split is consistent: day-view components use CSS classes; form/settings/onboarding components use MUI + `sx`.

All colors and spacing in CSS reference custom properties (`var(--green)`, `var(--t1)`, `var(--surface-2)`). No hardcoded color values in CSS (enforced by custom ESLint rule).

### Code Density
- Functions are short to medium. Most component functions are 20–60 lines of JSX.
- **Early returns** are the standard control flow in hooks and rendering: `if (loading) return <Spinner />`, `if (!user) return <Spinner />`, `if (entries.length === 0) return null`.
- **Ternaries** are used freely for simple conditionals in JSX: `isOver ? 'over' : 'remaining'`, `closing ? 'entry-sheet entry-sheet-exit' : 'entry-sheet'`. No nested ternaries.
- Abstraction is kept flat. There are no HOCs, no render-prop chains beyond the two gates, no deeply nested generics.
- **`as const`** is used on every configuration object in the theme and token files.
- **`void`** is used to explicitly ignore promise returns: `onClick={() => void onSave()}`, `void voiceStart('food')`.

---

## 6. UI Interaction Feedback

### Hover States
CSS-driven. The standard treatments:
- **Buttons (`.btn`):** Background darkens one shade, box-shadow intensifies. Primary: `var(--green)` → `var(--green-d)`, shadow gains 10% more opacity.
- **List items (`.timeline-item`, `.history-row`, `.log-row`):** Background shifts to `var(--surface-2)` on hover. Transition: `background 0.12s ease`.
- **Icon buttons (`.header-icon-btn`):** Color shifts from `var(--t3)` to `var(--t1)`.
- **Chips (`.entry-chip`):** Border color shifts to accent, background shifts to the accent's light variant.
- **Destructive hover (`.food-remove-btn`):** Color shifts to `var(--token-color-negative)`, background to `var(--token-color-negative-ghost)`.

### Press / Active States
Every interactive element has an `:active` state. The standard treatment is **scale down**:
- **Buttons (`.btn`):** `transform: scale(0.97)` — barely perceptible, feels tactile
- **Floating buttons:** `transform: scale(0.94)` with a springy easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- **List rows:** `transform: scale(0.98)` + background shift to `var(--surface-2)`
- **Header buttons:** `transform: scale(0.94)`
- **Voice icon buttons:** `transform: scale(0.9)` — more aggressive for small targets
- **Chips/pills:** `transform: scale(0.95–0.97)`

All scale transitions are 100ms ease. `-webkit-tap-highlight-color: transparent` is set on all interactive elements.

### Loading States
Three patterns are used depending on context:

1. **Full-page spinner:** `FullPageSpinner` — a simple CSS-animated spinning ring, centered in a full-height container. Used during auth and profile loading.
2. **Skeleton cards:** Shimmer-animated placeholder cards that match the shape of the content they replace. The `.skeleton` class uses a `linear-gradient` background with a `shimmer` keyframe. Opacity decreases for successive cards (`uiTokens.opacity.skeletonMedium = 0.6`, `uiTokens.opacity.timelineSkeletonTail = 0.3`) to create a fade-out effect.
3. **Inline spinners:** Small `.spinner` elements inside buttons during async actions (saving profile, finishing onboarding). The button text changes to "Saving…" with a spinner beside it.

Disabled buttons get `opacity: 0.42` and `cursor: not-allowed`.

### Empty States
The main empty state (`EmptyState` component) features:
- An inline SVG illustration of a plate (custom, not imported)
- A title ("Start tracking your day")
- A subtitle with guidance ("Log your first meal to see insights and progress")
- Quick-add chip buttons for common meals (Breakfast, Lunch, Dinner, Snack)

This is not a reusable pattern — it's a specific component for the day view. Other empty cases (e.g. no activities parsed) use simple text: `"Nothing detected — add an item below."`.

### Error States
Three patterns:

1. **Full-page error (`FullPageError`):** Emoji icon, error message, and a "Retry" button. Used when auth fails.
2. **Error banner (`ErrorBanner`):** A red-bordered inline banner with a warning icon, error message, a "Try again with voice" button, and a dismiss X. Appears inside modals when voice parsing fails, giving the user a path back to voice input.
3. **Inline text errors:** A `<p className="error">` for form-level errors in ResultForm and settings page.

Errors are always `string | null` — there are no error objects, error codes, or error types.

### Focus States
Custom focus states exist on form inputs: `border-color: var(--green); box-shadow: 0 0 0 3px var(--token-color-positive-light)`. Activity inputs use a blue variant: `border-color: var(--blue); box-shadow: 0 0 0 3px var(--token-color-info-light)`.

The `.food-remove-btn:focus-visible` and `.food-add-btn:focus-visible` use `outline: 2px solid var(--green); outline-offset: 1px` — these are the only elements using `:focus-visible`.

Browser default focus rings are suppressed on most inputs via `outline: none` with custom replacements. MUI inputs get themed focus via the `muiTheme` overrides (`boxShadow: 0 0 0 3px rgba(10, 146, 99, 0.25)`).

---

## 7. Things That Make This App Feel Good

1. **Calorie numbers never jump — they count up/down.** `useAnimatedNumber` smoothly interpolates between values over 500ms with cubic ease-out. This applies to the ring's remaining count, the daily score, and all stat values. The number feels alive.

2. **Sheets always animate out before unmounting.** Every bottom sheet (`VoiceInputSheet`, `AddFoodModal`, `EditFoodModal`, etc.) plays a 240ms exit animation before the parent removes it from the DOM. There's never a jarring pop-out. The `useSheetAnimation` hook prevents double-firing via a `pendingRef`.

3. **The calorie ring has a "time of day" tick mark.** `CalorieRing` computes `expectedRatio()` based on a 7am–11pm eating window and renders a small tick on the ring showing where you "should" be. It silently shows pace without any text explanation.

4. **Voice capture auto-submits on silence.** After the user stops speaking for 3.5 seconds (only after they've spoken at least once), the transcript is automatically submitted for processing. There's no "Done" step — the silence IS the punctuation. A 15-second max duration serves as a safety net.

5. **Timeline items stagger in at 30ms intervals.** Each `TimelineItem` gets `animationDelay: ${index * 30}ms` so items cascade into view rather than appearing simultaneously. History items use 50ms for a slightly slower reveal.

6. **The floating action bar adapts its label to the time of day.** The primary button says "Log Breakfast" before 11am, "Log Lunch" before 2pm, "Log Snack" before 5pm, and "Log Dinner" after. It subtly guides without instructing.

7. **Insight text is contextually specific, not generic.** `useInsightText` has 8 distinct branches that produce advice like "Eat ~520 kcal per meal across your next 2 meals" or "Nearly there — a light snack to finish the day." It adapts to time of day, meals logged, and remaining budget.

8. **Voice failure falls back to manual form, not an error screen.** If speech recognition isn't supported, API keys are missing, no items are parsed, or the transcript is empty, the user is silently dropped into the manual entry form (`onFallbackManual`). The error banner inside the manual form offers a "Try again with voice" button.

9. **The skeleton loading states match the exact shape of the content they replace.** The day view loading shell renders skeleton cards at the same heights as the summary card and timeline cards. History page skeletons progressively fade: each successive skeleton has lower opacity (`1 - i * 0.1`).

10. **A custom ESLint plugin enforces the design system at lint time.** Two rules (`no-raw-style-literals` and `no-color-literals`) prevent hardcoded pixel values and color strings from appearing in `style` or `sx` props inside component/page files. This is not just a convention — it's enforced by the toolchain.

11. **Dev-mode performance guardrails warn about smoothness regressions.** `startPerformanceGuardrails()` sets up `PerformanceObserver` watchers for CLS > 0.1 and long tasks > 120ms, logging console warnings. This catches animation jank during development.

12. **All Firestore writes use transactions.** `withDayTransaction` wraps every write (append, update, delete) in `runTransaction`, preventing race conditions when multiple items are saved rapidly from voice parsing.

---

## 8. What NOT to Do

1. **No global state store.** There is no Redux, Zustand, Jotai, or even a large React Context. The codebase deliberately avoids centralized state — Firebase real-time listeners and local `useState` handle everything.

2. **No client-side routing library.** No React Router, no Tanstack Router. Navigation is a simple `useState<AppScreen[]>` stack in `useAppRouter` with push/pop semantics. URL-based routing is intentionally absent.

3. **No CSS-in-JS for feature components.** MUI's `sx` is used for MUI-wrapped form components, but all feature/day-view components use plain CSS classes. No styled-components, no Emotion templates, no Tailwind.

4. **No prop drilling beyond 2 levels.** When data needs to reach deep children, it goes through hooks (each component calls its own hooks) or a focused context (navigation). The only render-prop chain is Auth → Profile at the root.

5. **No inline style attributes for static values.** The ESLint rule `no-raw-style-literals` catches numeric/pixel/rem values in `style` and `sx` props. Dynamic values (like `animationDelay`, `width` percentages, `color` from computed functions) are the exception.

6. **No hardcoded color strings in components.** The ESLint rule `no-color-literals` catches hex codes and `rgba()`/`hsl()` in component files. All colors come from theme tokens or CSS variables.

7. **No page-level loading spinners for data fetches.** When transitioning between loaded states, skeletons always replace the expected content shape. `FullPageSpinner` is only used for the initial auth/profile gate.

8. **No error toasts or notification system.** Errors are always inline — either a full-page error (auth), an error banner (voice failure), or inline text (form validation). There are no floating toasts.

9. **No separate icon library.** Every icon is a hand-crafted inline SVG component, co-located with the component that uses it. No Heroicons, no Lucide, no icon sprites.

10. **No React Query or data caching layer.** Firebase `onSnapshot` listeners are the only data subscription mechanism. One-shot fetches (history page) use raw `fetch`/`getDoc` with manual loading state. There is no cache invalidation to manage because there is no cache.

11. **No `useEffect` for derived state.** All derived values use `useMemo`. There is never a pattern of `useEffect(() => setDerived(compute(source)), [source])` — that would be redundant state.

12. **No magic numbers in component files.** The ESLint rule `@typescript-eslint/no-magic-numbers` is enabled with a curated allowlist. All timing, sizing, and threshold values are defined as named constants in token files or at the top of the file that uses them.
