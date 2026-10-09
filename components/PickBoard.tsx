"use client";

import { useMemo } from "react";
import { ClientGame } from "@/lib/types";
import { classNames } from "@/lib/util";

// Matches the RevealPick shape the homepage already loads from /api/picks.
export type RevealPick = { playerId: number; name: string; gameId: string; pick: string };

/**
 * PickBoard: a read-only grid of everyone's picks for the week.
 * Rows = games, columns = players. Each cell shows the team a player took and
 * turns green when they called it right, red when they missed, grey while the
 * game is still in play. It renders ONLY data already fetched on the homepage
 * (games + revealed picks) and never writes anything, so picks and scores are
 * untouched.
 */
export default function PickBoard({
  games,
  revealed,
  week,
  loading,
}: {
  games: ClientGame[];
  revealed: RevealPick[];
  week: number;
  loading: boolean;
}) {
  // Columns: every player who has a revealed pick this week, sorted by name.
  const players = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of revealed) if (!m.has(r.playerId)) m.set(r.playerId, r.name);
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [revealed]);

  // Fast lookup: `${playerId}|${gameId}` -> pick abbr.
  const pickBy = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of revealed) m.set(`${r.playerId}|${r.gameId}`, r.pick);
    return m;
  }, [revealed]);

  // Only games whose picks are revealed (whole slate locks at first kickoff).
  const boardGames = useMemo(() => games.filter((g) => g.locked), [games]);

  // Per-player correct count this week (decided games only).
  const totals = useMemo(() => {
    return players.map((p) => {
      let correct = 0;
      for (const g of boardGames) {
        if (g.completed && g.winnerAbbr && g.winnerAbbr !== "TIE") {
          const pk = pickBy.get(`${p.id}|${g.id}`);
          if (pk && pk === g.winnerAbbr) correct++;
        }
      }
      return correct;
    });
  }, [players, boardGames, pickBy]);
  const maxCorrect = Math.max(0, ...totals);

  if (loading && games.length === 0) {
    return (
      <div className="card animate-fade-up p-6">
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="card animate-fade-up p-8 text-center text-ink-muted">
        No games loaded for this week yet. They appear automatically as the schedule is posted.
      </div>
    );
  }

  if (boardGames.length === 0 || players.length === 0) {
    return (
      <div className="card animate-fade-up p-8 text-center text-ink-muted">
        The board unlocks when the week locks at first kickoff. Once it does, everyone&apos;s picks
        show up here, green if they called it and red if they didn&apos;t.
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-ink">Week {week} pick board</h2>
        <span className="text-xs text-ink-faint">
          {players.length} players · {boardGames.length} games · scroll sideways for everyone
        </span>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-max border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 border-b border-r border-turf-500/15 bg-field-850 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  Game
                </th>
                {players.map((p) => (
                  <th
                    key={p.id}
                    title={p.name}
                    className="border-b border-turf-500/15 bg-field-850 px-2 py-2.5 text-center align-bottom"
                  >
                    <span className="block max-w-[72px] truncate text-xs font-semibold text-ink">
                      {p.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {boardGames.map((g, ri) => {
                const final = g.completed && g.winnerAbbr && g.winnerAbbr !== "TIE";
                const zebra = ri % 2 === 1;
                return (
                  <tr key={g.id}>
                    <th
                      className={classNames(
                        "sticky left-0 z-10 border-b border-r border-turf-500/10 px-3 py-2 text-left",
                        zebra ? "bg-field-900" : "bg-field-850/70"
                      )}
                    >
                      <GameLabel game={g} />
                    </th>
                    {players.map((p) => {
                      const pk = pickBy.get(`${p.id}|${g.id}`);
                      const correct = Boolean(final && pk && pk === g.winnerAbbr);
                      const wrong = Boolean(final && pk && pk !== g.winnerAbbr);
                      let cls = "text-ink-muted";
                      if (!pk) cls = "text-ink-faint";
                      else if (correct) cls = "bg-turf-500/25 text-turf-200 font-bold";
                      else if (wrong) cls = "bg-red-500/25 text-red-200 font-bold";
                      else cls = "bg-field-800/50 text-ink-muted font-semibold";
                      return (
                        <td
                          key={p.id}
                          className={classNames(
                            "border-b border-turf-500/10 px-2 py-2 text-center",
                            cls
                          )}
                        >
                          <span className="tnum">{pk || "—"}</span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* Weekly correct totals */}
              <tr>
                <th className="sticky left-0 z-10 border-r border-turf-500/15 bg-field-850 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  Correct
                </th>
                {totals.map((t, i) => (
                  <td
                    key={players[i].id}
                    className={classNames(
                      "bg-field-850 px-2 py-2.5 text-center",
                      t === maxCorrect && maxCorrect > 0
                        ? "font-display text-base font-bold text-gold-300"
                        : "font-display text-base font-bold text-ink"
                    )}
                  >
                    <span className="tnum">{t}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-turf-500/40 ring-1 ring-inset ring-turf-500/40" /> Called it
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-500/40 ring-1 ring-inset ring-red-500/40" /> Missed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-field-800" /> Still playing
        </span>
        <span>— = no pick</span>
      </div>
    </div>
  );
}

function GameLabel({ game: g }: { game: ClientGame }) {
  const homeWon = g.completed && g.winnerAbbr === g.homeAbbr;
  const awayWon = g.completed && g.winnerAbbr === g.awayAbbr;

  let status = "";
  if (g.completed && g.homeScore !== null && g.awayScore !== null) {
    status = `${g.awayScore}-${g.homeScore} · Final`;
  } else if (g.state === "in") {
    status = "Live";
  } else {
    status = new Date(g.kickoff).toLocaleString(undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-w-[88px]">
      <div className="flex items-center gap-1 text-sm font-semibold">
        <span className={awayWon ? "text-turf-300" : g.completed ? "text-ink-faint" : "text-ink"}>
          {g.awayAbbr}
        </span>
        <span className="text-ink-faint">@</span>
        <span className={homeWon ? "text-turf-300" : g.completed ? "text-ink-faint" : "text-ink"}>
          {g.homeAbbr}
        </span>
      </div>
      <div
        className={classNames(
          "truncate text-[10px]",
          g.state === "in" ? "font-semibold text-turf-400" : "text-ink-faint"
        )}
      >
        {status}
      </div>
    </div>
  );
}
