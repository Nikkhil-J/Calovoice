import { useMemo, useState } from "react";
import type { AppNavigation, AppScreen } from "./AppNavigationContext";

export function useAppRouter() {
  const [stack, setStack] = useState<AppScreen[]>([{ name: "main" }]);

  const nav: AppNavigation = useMemo(
    () => ({
      openHistory: () => setStack((s) => [...s, { name: "history" }]),
      openSettings: () => setStack((s) => [...s, { name: "settings" }]),
      openDay: (dateKey: string) =>
        setStack((s) => [...s, { name: "day", dateKey }]),
      pop: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      goToToday: () => setStack([{ name: "main" }]),
    }),
    [],
  );

  const currentScreen = stack[stack.length - 1];
  return { currentScreen, nav };
}
