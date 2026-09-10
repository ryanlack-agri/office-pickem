"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ClientGame, ClientStanding } from "@/lib/types";
import { WEEKS, classNames, formatKickoff, timeUntil } from "@/lib/util";
import GameRow from "@/components/GameRow";
import WeekPicker from "@/components/WeekPicker";

type LeaderboardResp = {
  season: number;
  week: number;
  currentWeek: number;
  standings: ClientStanding[];
  players: number;
  paidCount: number;
  buyIn: number;
  pot: number;
  potNote: string;
};

export default function LeaderboardPage() {
  const [week, setWeek] = useState<number | null>(null);
  const [view, setView] = useState<"season" | "week">("season");
  const [lb, setLb] = useState<LeaderboardResp | null>(null);
  const [games, setGames] = useState<ClientGame[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (w: number | null) => {
      const qs = w ? `?week=${w}` : "";
      const [lbRes, gRes] = await Promise.all([
        fetch(`/api/leaderboard${qs}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/games${qs}`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (!lbRes.error) {
        setLb(lbRes);
        if (w === null) setWeek(lbRes.week);
      }
      if (!gRes.error) setGames(gRes.games || []);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    load(week);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week]);

  // Live refresh every 30s
  useEffect(() => {
    const t = setInterval(() => load(week), 30_000);
    return () => clearInterval(t);
  }, [week, load]);

  const money = (n: number) =>
    n % 1 === 0 ? `$${n.toLocaleString()}` : `$${n.toFixed(2)}`;

  return (
    <div className="space-y-5">
      {/* Pot hero */}
      <section className="card turf-lines overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-turf-400">
              Season Pot
            </p>
            <p className="mt-1 text-4xl font-black text-chalk">
              {lb ? money(lb.pot) : "—"}
            </p>
            <p className="mt-1 text-sm text-chalk/60">
              {lb
                ? `${lb.paidCount} of ${lb.players} paid in${
                    lb.buyIn ? ` · ${money(lb.buyIn)} buy-in` : ""
                  }`
                : "Loading…"}
              {lb?.potNote ? ` · ${lb.potNote}` : ""}
            </p>
          </div>
          <Link
            href="/picks"
            className="btn btn-primary px-5 py-3 text-sm shadow-lg shadow-turf-600/20"
          >
            Make this week's picks →
          </Link>
        </div>
      </section>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-turf-500/20 bg-field-900/60 p-1">
          <button
            onClick={() => setView("season")}
            className={classNames(
              "rounded-lg px-4 py-1.5 text-sm font-semibold transition",
              view === "season" ? "bg-turf-500 text-field-950" : "text-chalk/70"
            )}
          >
            Season Standings
          </button>
          <button
            onClick={() => setView("week")}
            className={classNames(
              "rounded-lg px-4 py-1.5 text-sm font-semibold transition",
              view === "week" ? "bg-turf-500 text-field-950" : "text-chalk/70"
            )}
          >
            This Week's Games
          </button>
        </div>
        <WeekPicker
          week={week}
          currentWeek={lb?.currentWeek}
          onChange={(w) => setWeek(w)}
        />
      </div>

      {loading && <p className="py-10 text-center text-chalk/50">Loading…</p>}

      {!loading && view === "season" && lb && (
        <SeasonTable standings={lb.standings} week={week} />
      )}

      {!loading && view === "week" && (
        <div className="space-y-3">
          {games.length === 0 && (
            <p className="card p-6 text-center text-chalk/60">
              No games loaded for this week yet. They appear automatically as the schedule is posted.
            </p>
          )}
          {games.map((g) => (
            <GameRow key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function SeasonTable({
  standings,
  week,
}: {
  standings: ClientStanding[];
  week: number | null;
}) {
  if (standings.length === 0) {
    return (
      <p className="card p-6 text-center text-chalk/60">
        No players yet. Be the first to{" "}
        <Link href="/picks" className="text-turf-400 underline">
          join and make picks
        </Link>
        .
      </p>
    );
  }
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-field-800/60 text-xs uppercase tracking-wider text-chalk/50">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3 text-right">Correct</th>
              <th className="px-4 py-3 text-right">Decided</th>
              <th className="px-4 py-3 text-right">Win %</th>
              <th className="px-4 py-3 text-right">Wk {week ?? ""}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const pct = s.decided > 0 ? Math.round((s.correct / s.decided) * 100) : 0;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              return (
                <tr
                  key={s.playerId}
                  className={classNames(
                    "border-t border-turf-500/10",
                    i === 0 && "bg-turf-500/10"
                  )}
                >
                  <td className="px-4 py-3 font-bold text-chalk/70">{medal || i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-chalk">
                    {s.name}
                    {s.paid && (
                      <span className="ml-2 rounded bg-turf-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-turf-400">
                        paid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-black text-chalk">
                    {s.correct}
                  </td>
                  <td className="px-4 py-3 text-right text-chalk/50">{s.decided}</td>
                  <td className="px-4 py-3 text-right text-chalk/70">{pct}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-turf-400">
                    {s.weekCorrect}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
