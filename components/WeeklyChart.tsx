"use client";

import { useEffect, useMemo, useRef } from "react";
import { CATEGORIES } from "@/lib/categories";
import { useEntries, useNow } from "@/lib/hooks";
import { clearAllEntries } from "@/lib/storage";
import { formatDuration, startOfWeek } from "@/lib/format";

export default function WeeklyChart() {
  const entries = useEntries();
  const now = useNow();
  const tableDetailsRef = useRef<HTMLDetailsElement>(null);

  const weekStart = useMemo(() => startOfWeek(new Date(now)).getTime(), [now]);

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of CATEGORIES) map.set(cat.id, 0);
    if (now === 0) return map;
    for (const e of entries) {
      if (e.startTime < weekStart) continue;
      const duration = (e.endTime ?? now) - e.startTime;
      map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + duration);
    }
    return map;
  }, [entries, weekStart, now]);

  // Force the collapsible table open for the printout, then restore whatever
  // state it was in on screen — native <details> content is only present in
  // the printed page while it's actually open.
  useEffect(() => {
    const el = tableDetailsRef.current;
    if (!el) return;
    let wasOpen = el.open;
    const onBeforePrint = () => {
      wasOpen = el.open;
      el.open = true;
    };
    const onAfterPrint = () => {
      el.open = wasOpen;
    };
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  function handleClearAll() {
    const confirmed = window.confirm(
      `This permanently deletes all ${entries.length} logged ${entries.length === 1 ? "entry" : "entries"} — not just this week. This cannot be undone. Clear everything and start fresh?`
    );
    if (confirmed) clearAllEntries();
  }

  if (now === 0) return null;

  const maxMs = Math.max(1, ...Array.from(totals.values()));
  const grandTotalMs = Array.from(totals.values()).reduce((a, b) => a + b, 0);
  const hasAnyData = grandTotalMs > 0;
  const weekLabel = new Date(weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 print:py-0">
      {/* Print-only header — the on-screen NavBar is hidden when printing */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-semibold">🩺 TeachingPulse — Weekly Summary</h1>
        <p className="text-sm text-gray-600">Week of {weekLabel}</p>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            This week
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Week of {weekLabel}
          </p>
        </div>
        {hasAnyData && (
          <button
            onClick={() => window.print()}
            className="text-sm font-medium px-3 py-1.5 rounded-full border"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            🖨️ Print summary
          </button>
        )}
      </div>

      {/* Hero figure: total tracked time */}
      <div
        className="rounded-2xl p-5 border"
        style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Total tracked this week
        </p>
        <p className="text-4xl font-semibold" style={{ color: "var(--text-primary)" }}>
          {formatDuration(grandTotalMs)}
        </p>
      </div>

      {/* Bar chart */}
      {!hasAnyData ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No activity logged yet this week — start tracking on the Track tab.
        </p>
      ) : (
        <div
          className="rounded-2xl p-5 border space-y-3"
          style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
        >
          {CATEGORIES.map((cat) => {
            const ms = totals.get(cat.id) ?? 0;
            const widthPct = (ms / maxMs) * 100;
            return (
              <div key={cat.id} className="flex items-center gap-3" role="listitem" aria-label={`${cat.label}: ${formatDuration(ms)}`}>
                <span
                  className="w-32 shrink-0 text-sm truncate"
                  style={{ color: "var(--text-primary)" }}
                  title={cat.label}
                >
                  {cat.emoji} {cat.label}
                </span>
                <div
                  className="flex-1 h-3 rounded-full relative"
                  style={{ background: "var(--gridline)" }}
                >
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${Math.max(widthPct, ms > 0 ? 3 : 0)}%`,
                      background: `var(--series-${cat.slot})`,
                    }}
                  />
                </div>
                <span
                  className="w-14 shrink-0 text-sm tabular-nums text-right"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {ms > 0 ? formatDuration(ms) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Table view fallback (also satisfies the "table view always exists" rule,
          and is what actually prints — forced open around window.print() above) */}
      {hasAnyData && (
        <details ref={tableDetailsRef} className="text-sm">
          <summary className="cursor-pointer print:hidden" style={{ color: "var(--text-secondary)" }}>
            View as table
          </summary>
          <table className="w-full mt-2 border-collapse">
            <thead>
              <tr style={{ color: "var(--text-muted)" }}>
                <th className="text-left font-medium py-1">Activity</th>
                <th className="text-right font-medium py-1">Time</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                <tr key={cat.id} style={{ borderTop: "1px solid var(--gridline)" }}>
                  <td className="py-1" style={{ color: "var(--text-primary)" }}>
                    {cat.emoji} {cat.label}
                  </td>
                  <td className="py-1 text-right tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {formatDuration(totals.get(cat.id) ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      {/* Destructive, so it's tucked at the bottom and requires confirmation */}
      {entries.length > 0 && (
        <div className="text-center pt-2 print:hidden">
          <button
            onClick={handleClearAll}
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Clear all tracking data
          </button>
        </div>
      )}
    </div>
  );
}
