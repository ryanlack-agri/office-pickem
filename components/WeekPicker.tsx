"use client";

import { WEEKS } from "@/lib/util";
import { ChevronLeft, ChevronRight } from "@/components/icons";

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
        className="grid h-11 w-11 place-items-center rounded-xl border border-turf-500/20 bg-field-900/60 text-ink transition hover:bg-turf-500/10 disabled:opacity-40"
        aria-label="Previous week"
      >
        <ChevronLeft />
      </button>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Select week"
          className="h-11 appearance-none rounded-xl border border-turf-500/20 bg-field-900/80 pl-4 pr-9 text-sm font-semibold text-ink"
        >
          {WEEKS.map((w) => (
            <option key={w} value={w}>
              Week {w}
              {w === currentWeek ? " (now)" : ""}
            </option>
          ))}
        </select>
        <ChevronRight
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-ink-faint"
        />
      </div>
      <button
        onClick={() => onChange(Math.min(18, value + 1))}
        disabled={value >= 18}
        className="grid h-11 w-11 place-items-center rounded-xl border border-turf-500/20 bg-field-900/60 text-ink transition hover:bg-turf-500/10 disabled:opacity-40"
        aria-label="Next week"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
