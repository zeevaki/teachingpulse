import { LogEntry } from "./types";

const STORAGE_KEY = "teachingpulse_log_v1";
const EMPTY_ENTRIES: LogEntry[] = [];

function isBrowser() {
  return typeof window !== "undefined";
}

let cache: LogEntry[] | null = null;
const listeners = new Set<() => void>();

function readFromStorage(): LogEntry[] {
  if (!isBrowser()) return EMPTY_ENTRIES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function commit(next: LogEntry[]) {
  cache = next;
  if (isBrowser()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((cb) => cb());
}

/** For useSyncExternalStore: subscribe to same-tab writes and cross-tab storage events. */
export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      callback();
    }
  };
  if (isBrowser()) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    if (isBrowser()) window.removeEventListener("storage", onStorage);
  };
}

/** For useSyncExternalStore: stable client snapshot (cached until a mutation invalidates it). */
export function getSnapshot(): LogEntry[] {
  if (cache === null) cache = readFromStorage();
  return cache;
}

/** For useSyncExternalStore: stable server snapshot (no localStorage during SSR). */
export function getServerSnapshot(): LogEntry[] {
  return EMPTY_ENTRIES;
}

export function loadEntries(): LogEntry[] {
  return getSnapshot();
}

/** Stops any currently-running entry (if different from categoryId) and starts a new one. */
export function startEntry(categoryId: string): LogEntry[] {
  const entries = getSnapshot();
  const now = Date.now();
  const withStopped = entries.map((e) =>
    e.endTime === null ? { ...e, endTime: now } : e
  );
  const newEntry: LogEntry = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    categoryId,
    startTime: now,
    endTime: null,
  };
  const next = [...withStopped, newEntry];
  commit(next);
  return next;
}

/** Stops the currently-running entry, if any. */
export function stopActiveEntry(): LogEntry[] {
  const entries = getSnapshot();
  const now = Date.now();
  const next = entries.map((e) => (e.endTime === null ? { ...e, endTime: now } : e));
  commit(next);
  return next;
}

export function getActiveEntry(entries: LogEntry[]): LogEntry | undefined {
  return entries.find((e) => e.endTime === null);
}

export const MAX_ACTIVE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

/**
 * If the active entry has run past MAX_ACTIVE_DURATION_MS, auto-stops it at the
 * cap and flags it, so a forgotten-running timer doesn't silently rack up hours.
 */
export function checkAutoCap(now: number): LogEntry[] {
  const entries = getSnapshot();
  const active = getActiveEntry(entries);
  if (!active || now - active.startTime < MAX_ACTIVE_DURATION_MS) return entries;
  const cappedEndTime = active.startTime + MAX_ACTIVE_DURATION_MS;
  const next = entries.map((e) =>
    e.id === active.id ? { ...e, endTime: cappedEndTime, autoStopped: true } : e
  );
  commit(next);
  return next;
}

export function deleteEntry(id: string): LogEntry[] {
  const next = getSnapshot().filter((e) => e.id !== id);
  commit(next);
  return next;
}

/**
 * Merges restored entries into the current log. Entries already present (same id)
 * are skipped so restoring the same backup twice doesn't duplicate anything, and
 * still-running entries from the backup are skipped so there's never more than
 * one active timer. Returns how many entries were added.
 */
export function importEntries(incoming: LogEntry[]): number {
  const current = getSnapshot();
  const existingIds = new Set(current.map((e) => e.id));
  const toAdd = incoming.filter((e) => e.endTime !== null && !existingIds.has(e.id));
  if (toAdd.length === 0) return 0;
  const next = [...current, ...toAdd].sort((a, b) => a.startTime - b.startTime);
  commit(next);
  return toAdd.length;
}

export function clearAllEntries(): LogEntry[] {
  commit([]);
  return [];
}
