"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClientGame, ClientStanding } from "@/lib/types";
import { classNames } from "@/lib/util";
import GameRow from "@/components/GameRow";
import WeekPicker from "@/components/WeekPicker";
import { Trophy, Football, ListIcon, ChevronRight, Check, XMark } from "@/components/icons";

type RevealPick = { playerId: number; name: string; gameId: string; pick: string };
type SelectedPlayer = { id: number; name: string };

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
  weekWinner: { name: string; correct: number; tie: number } | null;
  weekComplete: boolean;
};

const money = (n: number) => (n % 1 === 0 ? `$${n.toLocaleString()}` : `$${n.toFixed(2)}`);

export default function LeaderboardPage() {
  const [week, setWeek] = useState<number | null>(null);
  const [view, setView] = useState<"season" | "week">("season");
  const [lb, setLb] = useState<LeaderboardResp | null>(null);
  const [games, setGames] = useState<ClientGame[]>([]);
  const [revealed, setRevealed] = useState<RevealPick[]>([]);
  const [selected, setSelected] = useState<SelectedPlayer | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (w: number | null) => {
    const qs = w ? `?week=${w}` : "";
    const [lbRes, gRes, pRes] = await Promise.all([
      fetch(`/api/leaderboard${qs}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/games${qs}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/picks${qs}`, { cache: "no-store" }).then((r) => r.json()),
    ]);
    if (!lbRes.error) {
      setLb(lbRes);
      if (w === null) setWeek(lbRes.week);
    }
    if (!gRes.error) setGames(gRes.games || []);
    if (!pRes.error) setRevealed(pRes.revealed || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(week);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week]);

  useEffect(() => {
    const t = setInterval(() => load(week), 30_000);
    return () => clearInterval(t);
  }, [week, load]);

  const standings = lb?.standings ?? [];

  return (
    <div className="space-y-6">
      <PotHero lb={lb} loading={loading} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-turf-500/20 bg-field-900/60 p-1">
          <ToggleButton active={view === "season"} onClick={() => setView("season")} Icon={Trophy}>
            Season
          </ToggleButton>
          <ToggleButton active={view === "week"} onClick={() => setView("week")} Icon={ListIcon}>
            This Week
          </ToggleButton>
        </div>
        <WeekPicker week={week} currentWeek={lb?.currentWeek} onChange={setWeek} />
      </div>

      {lb?.weekWinner && (
        <WinnerBanner
          week={lb.week}
          name={lb.weekWinner.name}
          correct={lb.weekWinner.correct}
          tie={lb.weekWinner.tie}
          complete={lb.weekComplete}
        />
      )}

      {view === "season" ? (
        loading && !lb ? (
          <StandingsSkeleton />
        ) : (
          <SeasonView standings={standings} week={week} onSelect={setSelected} />
        )
      ) : loading && games.length === 0 ? (
        <GamesSkeleton />
      ) : (
        <WeekView games={games} />
      )}

      {selected && (
        <PlayerModal
          player={selected}
          week={lb?.week ?? week ?? 1}
          games={games}
          revealed={revealed}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  Icon: (p: { size?: number }) => JSX.Element;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition",
        active ? "bg-turf-500 text-field-950" : "text-ink-muted hover:text-ink"
      )}
    >
      <Icon size={16} />
      {children}
    </button>
  );
}

function PotHero({ lb, loading }: { lb: LeaderboardResp | null; loading: boolean }) {
  return (
    <section className="card turf-lines relative overflow-hidden p-6">
      <div className="absolute -right-10 -top-10 opacity-[0.07]">
        <Trophy size={200} />
      </div>
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
            <Trophy size={16} /> Season Pot
          </p>
          {loading && !lb ? (
            <div className="mt-2 h-12 w-40 skeleton" />
          ) : (
            <p className="tnum mt-1 bg-gradient-to-b from-gold-300 to-gold-500 bg-clip-text font-display text-5xl font-bold text-transparent sm:text-6xl">
              {lb ? money(lb.pot) : "$0"}
            </p>
          )}
          <p className="mt-2 text-sm text-ink-muted">
            {lb ? (
              <>
                {lb.paidCount} of {lb.players} paid in
                {lb.buyIn ? ` · ${money(lb.buyIn)} buy-in` : ""}
                {lb.potNote ? ` · ${lb.potNote}` : ""}
              </>
            ) : (
              "Loading standings…"
            )}
          </p>
        </div>
        <Link href="/picks" className="btn btn-gold px-5 py-3 text-sm">
          <Football size={18} />
          Make your picks
        </Link>
      </div>
    </section>
  );
}

function WinnerBanner({
  week,
  name,
  correct,
  tie,
  complete,
}: {
  week: number;
  name: string;
  correct: number;
  tie: number;
  complete: boolean;
}) {
  const who = tie > 1 ? `${name} +${tie - 1} tied` : name;
  if (complete) {
    return (
      <div className="animate-fade-up flex items-center gap-3 rounded-2xl border border-gold-400/40 bg-gradient-to-r from-gold-400/20 to-transparent px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-400 text-[#2a1a03]">
          <Trophy size={20} />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-400">
            Week {week} Champion
          </p>
          <p className="font-semibold text-ink">
            {who} <span className="tnum text-ink-muted">· {correct} correct</span>
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="animate-fade-up flex items-center gap-3 rounded-2xl border border-turf-500/20 bg-turf-500/5 px-4 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-turf-500/15 text-turf-400">
        <Trophy size={17} />
      </span>
      <p className="text-sm text-ink-muted">
        Week {week} leader so far:{" "}
        <span className="font-semibold text-ink">{who}</span>
        <span className="tnum"> · {correct} correct</span>
      </p>
    </div>
  );
}

function SeasonView({
  standings,
  week,
  onSelect,
}: {
  standings: ClientStanding[];
  week: number | null;
  onSelect: (p: SelectedPlayer) => void;
}) {
  if (standings.length === 0) {
    return (
      <div className="card animate-fade-up p-8 text-center">
        <p className="text-ink-muted">
          No players yet. Be the first to{" "}
          <Link href="/picks" className="font-semibold text-turf-400 hover:underline">
            join and make picks
          </Link>
          .
        </p>
      </div>
    );
  }
  return (
    <div className="animate-fade-up space-y-5">
      {standings.length >= 3 && <Podium top3={standings.slice(0, 3)} onSelect={onSelect} />}
      <StandingsTable standings={standings} week={week} onSelect={onSelect} />
      <p className="text-center text-xs text-ink-faint">Tap any player to see their picks.</p>
    </div>
  );
}

function Podium({
  top3,
  onSelect,
}: {
  top3: ClientStanding[];
  onSelect: (p: SelectedPlayer) => void;
}) {
  const order = [top3[1], top3[0], top3[2]];
  const meta = [
    { ring: "ring-slate-300/40", bar: "from-slate-400/30", pad: "pt-6", badge: "bg-slate-300 text-slate-900", place: 2 },
    { ring: "ring-gold-400/60", bar: "from-gold-400/40", pad: "pt-2", badge: "bg-gold-400 text-[#2a1a03]", place: 1 },
    { ring: "ring-amber-700/40", bar: "from-amber-700/30", pad: "pt-9", badge: "bg-amber-600 text-amber-50", place: 3 },
  ];
  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
      {order.map((s, i) => {
        const m = meta[i];
        return (
          <button
            key={s.playerId}
            onClick={() => onSelect({ id: s.playerId, name: s.name })}
            className={classNames("flex flex-col items-center outline-none", m.pad)}
          >
            <div
              className={classNames(
                "flex w-full flex-col items-center rounded-2xl border border-white/5 bg-gradient-to-b to-transparent px-2 py-4 text-center ring-1 transition hover:brightness-110",
                m.bar,
                m.ring
              )}
            >
              <span
                className={classNames(
                  "mb-2 grid h-7 w-7 place-items-center rounded-full text-sm font-bold",
                  m.badge
                )}
              >
                {m.place}
              </span>
              <span className="line-clamp-1 max-w-full break-all text-sm font-semibold text-ink">
                {s.name}
              </span>
              <span className="tnum mt-1 font-display text-2xl font-bold text-ink">{s.correct}</span>
              <span className="text-[11px] uppercase tracking-wide text-ink-faint">correct</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StandingsTable({
  standings,
  week,
  onSelect,
}: {
  standings: ClientStanding[];
  week: number | null;
  onSelect: (p: SelectedPlayer) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-turf-500/15 bg-field-850/70 text-[11px] uppercase tracking-wider text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Player</th>
              <th className="px-4 py-3 text-right font-semibold">Correct</th>
              <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Decided</th>
              <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Win %</th>
              <th className="px-4 py-3 text-right font-semibold">Wk {week ?? ""}</th>
              <th className="w-8 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const pct = s.decided > 0 ? Math.round((s.correct / s.decided) * 100) : 0;
              return (
                <tr
                  key={s.playerId}
                  onClick={() => onSelect({ id: s.playerId, name: s.name })}
                  className={classNames(
                    "cursor-pointer border-b border-turf-500/8 last:border-0 transition-colors hover:bg-turf-500/10",
                    i === 0 && "bg-gold-400/5"
                  )}
                >
                  <td className="px-4 py-3">
                    <RankBadge rank={i + 1} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-ink">{s.name}</span>
                    {s.paid && (
                      <span className="ml-2 rounded bg-turf-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-turf-300">
                        paid
                      </span>
                    )}
                  </td>
                  <td className="tnum px-4 py-3 text-right font-display text-lg font-bold text-ink">
                    {s.correct}
                  </td>
                  <td className="tnum hidden px-4 py-3 text-right text-ink-muted sm:table-cell">
                    {s.decided}
                  </td>
                  <td className="tnum hidden px-4 py-3 text-right text-ink-muted sm:table-cell">
                    {pct}%
                  </td>
                  <td className="tnum px-4 py-3 text-right font-semibold text-turf-400">
                    {s.weekCorrect}
                  </td>
                  <td className="px-2 py-3 text-ink-faint">
                    <ChevronRight size={16} />
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

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: "bg-gold-400 text-[#2a1a03]",
    2: "bg-slate-300 text-slate-900",
    3: "bg-amber-600 text-amber-50",
  };
  if (rank <= 3) {
    return (
      <span
        className={classNames(
          "tnum grid h-6 w-6 place-items-center rounded-full text-xs font-bold",
          styles[rank]
        )}
      >
        {rank}
      </span>
    );
  }
  return <span className="tnum pl-1.5 font-semibold text-ink-faint">{rank}</span>;
}

/* ---------------- Player picks modal ---------------- */

function PlayerModal({
  player,
  week,
  games,
  revealed,
  onClose,
}: {
  player: SelectedPlayer;
  week: number;
  games: ClientGame[];
  revealed: RevealPick[];
  onClose: () => void;
}) {
  const picks = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of revealed) if (r.playerId === player.id) m[r.gameId] = r.pick;
    return m;
  }, [revealed, player.id]);

  const decided = games.filter((g) => g.completed && picks[g.id]);
  const correct = decided.filter((g) => picks[g.id] === g.winnerAbbr).length;
  const wrong = decided.length - correct;
  const anyLocked = games.some((g) => g.locked);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="card relative max-h-[86vh] w-full overflow-y-auto rounded-t-2xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-turf-500/15 bg-field-900/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-ink-faint">Week {week} picks</p>
            <h3 className="font-display text-xl font-bold text-ink">{player.name}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-lg border border-turf-500/20 text-ink-muted transition hover:bg-turf-500/10"
          >
            <XMark />
          </button>
        </div>

        <div className="flex gap-2 px-4 py-3">
          <span className="flex items-center gap-1 rounded-lg bg-turf-500/15 px-2.5 py-1 text-sm font-semibold text-turf-300">
            <Check size={14} /> <span className="tnum">{correct}</span> correct
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1 text-sm font-semibold text-red-300">
            <XMark size={14} /> <span className="tnum">{wrong}</span> wrong
          </span>
        </div>

        <div className="space-y-2 px-4 pb-6">
          {games.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-muted">No games this week yet.</p>
          )}
          {games.length > 0 && !anyLocked && (
            <p className="py-6 text-center text-sm text-ink-muted">
              Picks stay hidden until each game kicks off. Check back after the games start.
            </p>
          )}
          {games.map((g) => {
            if (!g.locked) return null;
            return <PlayerPickRow key={g.id} game={g} pick={picks[g.id]} />;
          })}
        </div>
      </div>
    </div>
  );
}

function PlayerPickRow({ game: g, pick }: { game: ClientGame; pick: string | undefined }) {
  const pickName = pick ? (pick === g.awayAbbr ? g.awayName : g.homeName) : null;
  const correct = g.completed && pick && pick === g.winnerAbbr;
  const wrong = g.completed && pick && g.winnerAbbr && pick !== g.winnerAbbr;
  const noPick = !pick;
  const pending = !g.completed && pick;

  let tone = "border-turf-500/15 bg-field-900/40";
  if (correct) tone = "border-turf-400/40 bg-turf-500/10";
  else if (wrong) tone = "border-red-500/40 bg-red-500/10";
  else if (noPick) tone = "border-red-500/20 bg-red-500/5";

  const score =
    g.homeScore !== null && g.awayScore !== null
      ? ` · ${g.awayAbbr} ${g.awayScore}, ${g.homeAbbr} ${g.homeScore}`
      : "";

  return (
    <div className={classNames("flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5", tone)}>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-ink">
          {pickName || <span className="text-red-300">No pick</span>}
        </div>
        <div className="truncate text-[11px] text-ink-faint">
          {g.awayAbbr} @ {g.homeAbbr}
          {g.completed ? score : g.state === "in" ? " · live" : ""}
        </div>
      </div>
      <div className="shrink-0">
        {correct ? (
          <span className="flex items-center gap-1 rounded-full bg-turf-500 px-2 py-0.5 text-[11px] font-bold uppercase text-field-950">
            <Check size={12} /> Correct
          </span>
        ) : wrong ? (
          <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold uppercase text-white">
            <XMark size={12} /> Wrong
          </span>
        ) : pending ? (
          <span className="rounded-full bg-field-700 px-2 py-0.5 text-[11px] font-bold uppercase text-ink-muted">
            In play
          </span>
        ) : (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold uppercase text-red-300">
            Missed
          </span>
        )}
      </div>
    </div>
  );
}

function WeekView({ games }: { games: ClientGame[] }) {
  if (games.length === 0) {
    return (
      <div className="card animate-fade-up p-8 text-center text-ink-muted">
        No games loaded for this week yet. They appear automatically as the schedule is posted.
      </div>
    );
  }
  return (
    <div className="animate-fade-up grid gap-3 sm:grid-cols-2">
      {games.map((g) => (
        <GameRow key={g.id} game={g} />
      ))}
    </div>
  );
}

function StandingsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 items-end gap-3">
        <div className="h-28 skeleton rounded-2xl" />
        <div className="h-36 skeleton rounded-2xl" />
        <div className="h-24 skeleton rounded-2xl" />
      </div>
      <div className="card space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 skeleton" />
        ))}
      </div>
    </div>
  );
}

function GamesSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 skeleton rounded-2xl" />
      ))}
    </div>
  );
}
