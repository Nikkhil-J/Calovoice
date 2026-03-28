import { isProfileComplete } from "../../firestore/profile";
import { useProfile } from "../../hooks/useProfile";
import { OnboardingPage } from "../../pages/OnboardingPage";
import type { ProfileSettings } from "../../types/profile";
import { FullPageSpinner } from "../primitives/FullPageSpinner";

export function ProfileGate({
  uid,
  children,
}: {
  uid: string;
  children: (profile: ProfileSettings) => React.ReactNode;
}) {
  const { profile, loading } = useProfile(uid);

  if (loading) return <FullPageSpinner />;

  if (!isProfileComplete(profile)) {
    return <OnboardingPage uid={uid} onComplete={() => {}} />;
  }

  return <>{children(profile!)}</>;
}
