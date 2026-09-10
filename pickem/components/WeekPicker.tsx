"use client";

import { WEEKS } from "@/lib/util";

export default function WeekPicker({
  week,
  currentWeek,
  onChange,
}: {
  week: number | null;
  currentWeek?: number;
  onChange: (w: number) => void;
}) {
  const value = week ?? currentWeek ?? 1;
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="grid h-9 w-9 place-items-center rounded-lg border border-turf-500/20 bg-field-900/60 text-chalk/80 disabled:opacity-40"
        aria-label="Previous week"
      >
        ‹
      </button>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 rounded-lg border border-turf-500/20 bg-field-900/80 px-3 text-sm font-semibold text-chalk"
      >
        {WEEKS.map((w) => (
          <option key={w} value={w}>
            Week {w}
            {w === currentWeek ? " (now)" : ""}
          </option>
        ))}
      </select>
      <button
        onClick={() => onChange(Math.min(18, value + 1))}
        disabled={value >= 18}
        className="grid h-9 w-9 place-items-center rounded-lg border border-turf-500/20 bg-field-900/60 text-chalk/80 disabled:opacity-40"
        aria-label="Next week"
      >
        ›
      </button>
    </div>
  );
}
