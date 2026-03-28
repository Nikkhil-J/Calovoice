import { AuthGate } from "./components/gates/AuthGate";
import { ProfileGate } from "./components/gates/ProfileGate";
import { AppNavigationProvider } from "./navigation/AppNavigationContext";
import type { AppScreen } from "./navigation/AppNavigationContext";
import { useAppRouter } from "./navigation/useAppRouter";
import { DayViewPage } from "./pages/DayViewPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { ProfileSettings } from "./types/profile";
import { getTodayDateKey } from "./utils/dateKey";

type ScreenProps = { screen: AppScreen; uid: string; profile: ProfileSettings };

const ROUTES: Record<string, (props: ScreenProps) => React.ReactNode> = {
  main: (p) => <DayViewPage uid={p.uid} dateKey={getTodayDateKey()} />,
  day: (p) => (
    <DayViewPage
      uid={p.uid}
      dateKey={(p.screen as { dateKey: string }).dateKey}
    />
  ),
  history: (p) => <HistoryPage uid={p.uid} />,
  settings: (p) => <SettingsPage uid={p.uid} initial={p.profile} />,
};

function ScreenRenderer({ screen, uid, profile }: ScreenProps) {
  const render = ROUTES[screen.name];
  if (!render) return <DayViewPage uid={uid} dateKey={getTodayDateKey()} />;
  return <>{render({ screen, uid, profile })}</>;
}

function AppRouter({
  uid,
  profile,
}: {
  uid: string;
  profile: ProfileSettings;
}) {
  const { currentScreen, nav } = useAppRouter();
  return (
    <AppNavigationProvider value={nav}>
      <ScreenRenderer screen={currentScreen} uid={uid} profile={profile} />
    </AppNavigationProvider>
  );
}

export default function App() {
  return (
    <AuthGate>
      {(user) => (
        <ProfileGate uid={user.uid}>
          {(profile) => <AppRouter uid={user.uid} profile={profile} />}
        </ProfileGate>
      )}
    </AuthGate>
  );
}
