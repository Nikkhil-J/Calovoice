import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { dayDocRef } from "../firestore/dayLog";
import type { DayDocument } from "../types/dayLog";

const empty: DayDocument = { eatenEntries: [], burnedEntries: [] };

export function useDayLog(uid: string | null, dateKey: string) {
  const [day, setDay] = useState<DayDocument>(empty);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid) {
      queueMicrotask(() => {
        setDay(empty);
        setLoading(false);
      });
      return;
    }
    queueMicrotask(() => setLoading(true));
    const ref = dayDocRef(uid, dateKey);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) setDay(empty);
        else {
          const d = snap.data();
          setDay({
            eatenEntries: d.eatenEntries ?? [],
            burnedEntries: d.burnedEntries ?? [],
          });
        }
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [uid, dateKey]);

  return { day, loading };
}
