import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { profileSettingsRef } from "../firestore/profile";
import type { ProfileSettings } from "../types/profile";

export function useProfile(uid: string | null) {
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid) {
      queueMicrotask(() => {
        setProfile(null);
        setLoading(false);
      });
      return;
    }
    queueMicrotask(() => setLoading(true));
    const ref = profileSettingsRef(uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as ProfileSettings) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [uid]);

  return { profile, loading };
}
