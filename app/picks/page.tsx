"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClientGame, Player } from "@/lib/types";
import { classNames, timeUntil } from "@/lib/util";
import AuthCard from "@/components/AuthCard";
import PickCard from "@/components/PickCard";
import WeekPicker from "@/components/WeekPicker";
import { User, Check } from "@/components/icons";

type RevealPick = { playerId: number; name: string; gameId: string; pick: string };

export default function PicksPage() {
  const [player, setPlayer] = useState<Player | null | undefined>(undefined);
  const [week, setWeek] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number | undefined>();
  const [games, setGames] = useState<ClientGame[]>([]);
  const [myPicks, setMyPicks] = useState<Record<string, string>>({});
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
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (player) load(week);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, week]);

  const openGames = games.filter((g) => !g.locked);
  const pickedOpen = openGames.filter((g) => myPicks[g.id]).length;
  const allPicked = openGames.length > 0 && pickedOpen === openGames.length;
  const nextLock = openGames
    .map((g) => g.kickoff)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

  const decidedMine = games.filter((g) => g.completed && myPicks[g.id]);
  const correctCount = decidedMine.filter((g) => myPicks[g.id] === g.winnerAbbr).length;
  const wrongCount = decidedMine.length - correctCount;
  const pendingMine = games.filter((g) => !g.completed && myPicks[g.id]).length;

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
        body: JSON.stringify({ season: games[0]?.season, week, picks: myPicks }),
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
    return (
      <div className="space-y-3">
        <div className="h-12 w-48 skeleton" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }
  if (player === null) {
    return <AuthCard onSuccess={(p) => setPlayer(p)} />;
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Your picks</h1>
          <p className="flex items-center gap-1.5 text-sm text-ink-muted">
            <User size={15} />
            <span className="font-semibold text-ink">{player.name}</span>
            <span className="text-ink-faint">·</span>
            <button onClick={signOut} className="text-turf-400 hover:underline">
              sign out
            </button>
          </p>
        </div>
        <WeekPicker week={week} currentWeek={currentWeek} onChange={setWeek} />
      </div>

      {/* Progress */}
      <div className="card p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">
            {openGames.length > 0 ? (
              <>
                <span className="tnum font-semibold text-ink">
                  {pickedOpen}/{openGames.length}
                </span>{" "}
                open games picked
                {nextLock && (
                  <span className="ml-1 text-ink-faint">· first lock in {timeUntil(nextLock)}</span>
                )}
              </>
            ) : (
              "All games this week are locked."
            )}
          </span>
          {allPicked && (
            <span className="flex items-center gap-1 text-xs font-bold uppercase text-turf-400">
              <Check size={14} /> All set
            </span>
          )}
        </div>
        {openGames.length > 0 && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-field-700/60">
            <div
              className="h-full rounded-full bg-turf-500 transition-all duration-300"
              style={{ width: `${(pickedOpen / openGames.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {decidedMine.length > 0 && (
        <div className="card grid grid-cols-3 overflow-hidden">
          <RecordStat label="Correct" value={correctCount} tone="turf" />
          <RecordStat label="Wrong" value={wrongCount} tone="red" />
          <RecordStat label="Pending" value={pendingMine} tone="muted" />
        </div>
      )}

      {msg && (
        <p role="status" className="animate-fade-up rounded-lg bg-turf-500/15 px-3 py-2 text-sm text-turf-200">
          {msg}
        </p>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">
          This week&apos;s games aren&apos;t posted yet. Check back once the schedule is up.
        </div>
      ) : (
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
      )}

      {/* Sticky save bar */}
      {games.length > 0 && openGames.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-turf-500/15 bg-field-950/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
            <span className="text-sm text-ink-muted">
              <span className="tnum font-semibold text-ink">{pickedOpen}</span> of{" "}
              <span className="tnum">{openGames.length}</span> picked
            </span>
            <button onClick={save} disabled={saving} className="btn btn-primary px-6 py-2.5">
              {saving ? "Saving…" : "Save picks"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "turf" | "red" | "muted";
}) {
  const color =
    tone === "turf" ? "text-turf-400" : tone === "red" ? "text-red-400" : "text-ink-muted";
  return (
    <div className="flex flex-col items-center gap-0.5 border-r border-turf-500/10 py-4 last:border-r-0">
      <span className={classNames("tnum font-display text-3xl font-bold", color)}>{value}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
    </div>
  );
}
