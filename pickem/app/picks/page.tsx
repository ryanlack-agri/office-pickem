"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClientGame, Player } from "@/lib/types";
import { classNames, formatKickoff, timeUntil } from "@/lib/util";
import AuthCard from "@/components/AuthCard";
import PickCard from "@/components/PickCard";
import WeekPicker from "@/components/WeekPicker";

type RevealPick = { playerId: number; name: string; gameId: string; pick: string };

export default function PicksPage() {
  const [player, setPlayer] = useState<Player | null | undefined>(undefined);
  const [week, setWeek] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number | undefined>();
  const [games, setGames] = useState<ClientGame[]>([]);
  const [myPicks, setMyPicks] = useState<Record<string, string>>({});
  const [tiebreaker, setTiebreaker] = useState<string>("");
  const [reveal, setReveal] = useState<RevealPick[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPlayer(d.player))
      .catch(() => setPlayer(null));
  }, []);

  const load = useCallback(async (w: number | null) => {
    setLoading(true);
    setMsg(null);
    const qs = w ? `?week=${w}` : "";
    const [gRes, pRes] = await Promise.all([
      fetch(`/api/games${qs}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/picks${qs}`, { cache: "no-store" }).then((r) => r.json()),
    ]);
    if (!gRes.error) {
      setGames(gRes.games || []);
      setCurrentWeek(gRes.currentWeek);
      if (w === null) setWeek(gRes.week);
    }
    if (!pRes.error) {
      setMyPicks(pRes.myPicks || {});
      setReveal(pRes.revealed || []);
      setTiebreaker(pRes.myTiebreaker != null ? String(pRes.myTiebreaker) : "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (player) load(week);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, week]);

  const tiebreakerGame = useMemo(() => {
    if (games.length === 0) return null;
    return [...games].sort(
      (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
    )[0];
  }, [games]);

  const openGames = games.filter((g) => !g.locked);
  const pickedOpen = openGames.filter((g) => myPicks[g.id]).length;
  const nextLock = openGames
    .map((g) => g.kickoff)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

  const revealByGame = useMemo(() => {
    const m = new Map<string, { name: string; pick: string }[]>();
    for (const r of reveal) {
      if (!m.has(r.gameId)) m.set(r.gameId, []);
      m.get(r.gameId)!.push({ name: r.name, pick: r.pick });
    }
    return m;
  }, [reveal]);

  function pick(gameId: string, abbr: string) {
    setMyPicks((prev) => ({ ...prev, [gameId]: abbr }));
    setMsg(null);
  }

  async function save() {
    if (!player) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: games[0]?.season,
          week,
          picks: myPicks,
          tiebreaker: tiebreaker === "" ? null : Number(tiebreaker),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Could not save.");
      } else {
        setMsg(
          data.locked > 0
            ? `Saved ${data.saved} picks. ${data.locked} game(s) had already kicked off and were left as-is.`
            : `Saved ${data.saved} pick${data.saved === 1 ? "" : "s"}. You're locked in.`
        );
        load(week);
      }
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    setPlayer(null);
    setMyPicks({});
  }

  if (player === undefined) {
    return <p className="py-10 text-center text-chalk/50">Loading…</p>;
  }
  if (player === null) {
    return <AuthCard onSuccess={(p) => setPlayer(p)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-chalk">Your picks</h1>
          <p className="text-sm text-chalk/60">
            Signed in as <span className="font-semibold text-chalk">{player.name}</span> ·{" "}
            <button onClick={signOut} className="text-turf-400 hover:underline">
              sign out
            </button>
          </p>
        </div>
        <WeekPicker week={week} currentWeek={currentWeek} onChange={setWeek} />
      </div>

      {/* Status bar */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
        <span className="text-chalk/70">
          {openGames.length > 0 ? (
            <>
              {pickedOpen}/{openGames.length} open games picked
              {nextLock && (
                <span className="ml-2 text-chalk/50">
                  · first lock in {timeUntil(nextLock)}
                </span>
              )}
            </>
          ) : (
            "All games this week are locked."
          )}
        </span>
        <button
          onClick={save}
          disabled={saving || openGames.length === 0}
          className="btn btn-primary px-5 py-2"
        >
          {saving ? "Saving…" : "Save picks"}
        </button>
      </div>

      {msg && (
        <p className="rounded-lg bg-turf-500/15 px-3 py-2 text-sm text-turf-200">{msg}</p>
      )}

      {loading ? (
        <p className="py-10 text-center text-chalk/50">Loading week…</p>
      ) : games.length === 0 ? (
        <p className="card p-6 text-center text-chalk/60">
          This week's games aren't posted yet. Check back once the schedule is up.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {games.map((g) => (
              <PickCard
                key={g.id}
                game={g}
                myPick={myPicks[g.id]}
                onPick={(abbr) => pick(g.id, abbr)}
                reveal={revealByGame.get(g.id) || []}
                showReveal
              />
            ))}
          </div>

          {/* Tiebreaker */}
          {tiebreakerGame && (
            <div className="card p-4">
              <p className="text-sm font-semibold text-chalk">
                Tiebreaker: total points in {tiebreakerGame.awayAbbr} @ {tiebreakerGame.homeAbbr}
              </p>
              <p className="mt-0.5 text-xs text-chalk/50">
                Both teams combined. Closest without going over breaks weekly ties.{" "}
                {tiebreakerGame.locked ? "Locked." : `Editable until ${formatKickoff(tiebreakerGame.kickoff)}.`}
              </p>
              <input
                type="number"
                value={tiebreaker}
                onChange={(e) => setTiebreaker(e.target.value)}
                disabled={tiebreakerGame.locked}
                placeholder="e.g. 47"
                className="mt-3 w-32 rounded-xl border border-turf-500/25 bg-field-900/80 px-4 py-2 text-lg outline-none focus:border-turf-400 disabled:opacity-50"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving || openGames.length === 0}
              className="btn btn-primary px-6 py-3"
            >
              {saving ? "Saving…" : "Save picks"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
