"use client";

import { CATEGORIES, getCategory } from "@/lib/categories";
import { startEntry, stopActiveEntry, getActiveEntry, deleteEntry } from "@/lib/storage";
import { useEntries, useNow } from "@/lib/hooks";
import { formatDuration, formatClockTime, startOfDay } from "@/lib/format";

export default function Tracker() {
  const entries = useEntries();
  const now = useNow();

  const active = getActiveEntry(entries);

  function handleTap(categoryId: string) {
    if (active && active.categoryId === categoryId) {
      stopActiveEntry();
    } else {
      startEntry(categoryId);
    }
  }

  // now starts at 0 until the mount effect in useNow() fires; skip rendering
  // time-dependent UI until then, same purpose as the old "hydrated" flag.
  if (now === 0) return null;

  const todayStart = startOfDay(new Date(now)).getTime();
  const todaysEntries = entries
    .filter((e) => e.startTime >= todayStart)
    .sort((a, b) => b.startTime - a.startTime);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Active status */}
      <div
        className="rounded-2xl p-5 border"
        style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
      >
        {active ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Currently tracking
              </p>
              <p className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                {getCategory(active.categoryId).emoji} {getCategory(active.categoryId).label}
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-2xl font-semibold tabular-nums"
                style={{ color: `var(--series-${getCategory(active.categoryId).slot})` }}
              >
                {formatDuration(now - active.startTime)}
              </p>
              <button
                onClick={() => stopActiveEntry()}
                className="mt-1 text-sm font-medium px-3 py-1 rounded-full"
                style={{ color: "var(--surface-1)", background: "var(--series-8)" }}
              >
                Stop
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center" style={{ color: "var(--text-secondary)" }}>
            Tap an activity below to start tracking.
          </p>
        )}
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => {
          const isActive = active?.categoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleTap(cat.id)}
              className="rounded-xl p-4 flex flex-col items-center gap-1 border transition-transform active:scale-95"
              style={{
                borderColor: isActive ? `var(--series-${cat.slot})` : "var(--border)",
                background: isActive
                  ? `color-mix(in srgb, var(--series-${cat.slot}) 14%, var(--surface-1))`
                  : "var(--surface-1)",
              }}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Today's log */}
      <div>
        <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
          Today
        </h2>
        {todaysEntries.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Nothing logged yet today.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {todaysEntries.map((e) => {
              const cat = getCategory(e.categoryId);
              const duration = (e.endTime ?? now) - e.startTime;
              return (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 border text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                >
                  <span className="flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {formatClockTime(e.startTime)}
                      {e.endTime ? ` – ${formatClockTime(e.endTime)}` : " – now"}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className="tabular-nums font-medium"
                      style={{ color: `var(--series-${cat.slot})` }}
                    >
                      {formatDuration(duration)}
                    </span>
                    <button
                      onClick={() => deleteEntry(e.id)}
                      aria-label="Delete entry"
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
