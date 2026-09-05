"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { subscribe, getSnapshot, getServerSnapshot } from "./storage";
import { LogEntry } from "./types";

/** Live-synced entries from localStorage, safe across SSR/hydration. */
export function useEntries(): LogEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Current time, ticking every second — set via effect so render stays pure. */
export function useNow(tickMs = 1000): number {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    // Defer even the first tick to a callback (not the effect body itself),
    // so setState is never called synchronously within the effect.
    const timeoutId = setTimeout(tick, 0);
    const intervalId = setInterval(tick, tickMs);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [tickMs]);

  return now;
}
