"use client";

import { useRef, useState } from "react";
import { useEntries } from "@/lib/hooks";
import { importEntries } from "@/lib/storage";
import {
  downloadFile,
  entriesToBackupJson,
  entriesToCsv,
  exportFileStamp,
  parseBackupJson,
} from "@/lib/export";

type Status = { kind: "ok" | "error"; message: string } | null;

/**
 * Export (CSV for spreadsheets, JSON backup for restoring) and restore.
 * Data lives only in this browser's localStorage, so the backup file is the
 * way to keep it safe or move it to another device.
 */
export default function DataBackup() {
  const entries = useEntries();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);

  function handleExportCsv() {
    const now = Date.now();
    downloadFile(`teachingpulse-${exportFileStamp(now)}.csv`, entriesToCsv(entries), "text/csv;charset=utf-8");
    setStatus({ kind: "ok", message: `Exported ${entries.length} ${entries.length === 1 ? "entry" : "entries"} as CSV.` });
  }

  function handleDownloadBackup() {
    const now = Date.now();
    downloadFile(
      `teachingpulse-backup-${exportFileStamp(now)}.json`,
      entriesToBackupJson(entries, now),
      "application/json"
    );
    setStatus({ kind: "ok", message: "Backup downloaded. Keep it somewhere safe (email, Drive, etc.)." });
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so choosing the same file again still fires onChange
    e.target.value = "";
    if (!file) return;
    try {
      const added = importEntries(parseBackupJson(await file.text()));
      setStatus({
        kind: "ok",
        message:
          added === 0
            ? "Nothing new to restore. Everything in that backup is already here."
            : `Restored ${added} ${added === 1 ? "entry" : "entries"}.`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error && err.message.includes("TeachingPulse")
          ? err.message
          : "Couldn't read that file. Make sure it's a TeachingPulse backup (.json).",
      });
    }
  }

  const hasEntries = entries.length > 0;
  const buttonClass = "text-sm font-medium px-3 py-1.5 rounded-full border";
  const buttonStyle = { borderColor: "var(--border)", color: "var(--text-primary)" };

  return (
    <div
      className="rounded-2xl p-5 border space-y-3 print:hidden"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <div>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Your data
        </h2>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Your log is saved only in this browser. Download a backup to keep it safe or move it to another device.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {hasEntries && (
          <>
            <button onClick={handleExportCsv} className={buttonClass} style={buttonStyle}>
              📊 Export CSV
            </button>
            <button onClick={handleDownloadBackup} className={buttonClass} style={buttonStyle}>
              💾 Download backup
            </button>
          </>
        )}
        <button onClick={() => fileInputRef.current?.click()} className={buttonClass} style={buttonStyle}>
          📂 Restore backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleRestoreFile}
        />
      </div>

      {status && (
        <p
          role="status"
          className="text-xs"
          style={{ color: status.kind === "error" ? "var(--danger, #c0392b)" : "var(--text-secondary)" }}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
