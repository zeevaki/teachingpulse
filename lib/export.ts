import { getCategory } from "./categories";
import { LogEntry } from "./types";

const BACKUP_APP_ID = "teachingpulse";
const BACKUP_VERSION = 1;

function localDateStamp(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function localTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** One row per logged activity, oldest first; a still-running entry has a blank end time. */
export function entriesToCsv(entries: LogEntry[]): string {
  const header = ["Date", "Activity", "Start", "End", "Minutes", "Auto-stopped"];
  const rows = [...entries]
    .sort((a, b) => a.startTime - b.startTime)
    .map((e) => [
      localDateStamp(e.startTime),
      getCategory(e.categoryId).label,
      localTime(e.startTime),
      e.endTime === null ? "" : localTime(e.endTime),
      e.endTime === null ? "" : Math.round((e.endTime - e.startTime) / 60000),
      e.autoStopped ? "Yes" : "",
    ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function entriesToBackupJson(entries: LogEntry[], exportedAt: number): string {
  return JSON.stringify(
    { app: BACKUP_APP_ID, version: BACKUP_VERSION, exportedAt, entries },
    null,
    2
  );
}

function isLogEntry(value: unknown): value is LogEntry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.categoryId === "string" &&
    typeof e.startTime === "number" &&
    (typeof e.endTime === "number" || e.endTime === null)
  );
}

/**
 * Parses a backup file's text. Accepts the wrapped format written by
 * entriesToBackupJson, or a bare entries array. Throws on anything else.
 */
export function parseBackupJson(text: string): LogEntry[] {
  const parsed: unknown = JSON.parse(text);
  const list = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null && (parsed as { app?: unknown }).app === BACKUP_APP_ID
      ? (parsed as { entries?: unknown }).entries
      : null;
  if (!Array.isArray(list) || !list.every(isLogEntry)) {
    throw new Error("This file isn't a TeachingPulse backup.");
  }
  return list;
}

/** Triggers a browser download of `content` as a file. */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking synchronously can cancel the download in Safari
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportFileStamp(ms: number): string {
  return localDateStamp(ms);
}
