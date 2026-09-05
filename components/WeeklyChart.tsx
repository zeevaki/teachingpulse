"use client";

import { useMemo } from "react";
import { CATEGORIES } from "@/lib/categories";
import { useEntries, useNow } from "@/lib/hooks";
import { formatDuration, startOfWeek } from "@/lib/format";

export default function WeeklyChart() {
  const entries = useEntries();
  const now = useNow();

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

  if (now === 0) return null;

  const maxMs = Math.max(1, ...Array.from(totals.values()));
  const grandTotalMs = Array.from(totals.values()).reduce((a, b) => a + b, 0);
  const hasAnyData = grandTotalMs > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          This week
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Week of {new Date(weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
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

      {/* Table view fallback (also satisfies the "table view always exists" rule) */}
      {hasAnyData && (
        <details className="text-sm">
          <summary className="cursor-pointer" style={{ color: "var(--text-secondary)" }}>
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
    </div>
  );
}
