import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { profileSchema } from "../schemas/profile";
import type { ProfileSettings } from "../types/profile";

export function profileSettingsRef(uid: string) {
  return doc(db, "users", uid, "profile", "settings");
}

export async function saveProfile(
  uid: string,
  data: ProfileSettings,
): Promise<void> {
  const ref = profileSettingsRef(uid);
  const snap = await getDoc(ref);
  const now = Date.now();
  await setDoc(
    ref,
    {
      ...data,
      updatedAt: now,
      ...(snap.exists() ? {} : { createdAt: now }),
    },
    { merge: true },
  );
}

export function isProfileComplete(
  data: ProfileSettings | null | undefined,
): boolean {
  if (!data) return false;
  return profileSchema.safeParse(data).success;
}
