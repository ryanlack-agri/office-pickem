"use client";

import { ClientGame } from "@/lib/types";
import { classNames, shortKickoff, timeUntil } from "@/lib/util";
import { Check, XMark, Lock, Clock } from "@/components/icons";

type RevealPick = { name: string; pick: string };

function TeamButton({
  active,
  logo,
  abbr,
  name,
  score,
  disabled,
  isWinner,
  onClick,
}: {
  active: boolean;
  logo: string | null;
  abbr: string;
  name: string;
  score: number | null;
  disabled: boolean;
  isWinner: boolean | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Pick ${name}`}
      className={classNames(
        "flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition",
        "min-h-[52px] active:scale-[0.98] disabled:active:scale-100",
        active
          ? "border-turf-400 bg-turf-500/20 ring-1 ring-turf-400"
          : "border-turf-500/15 bg-field-900/50 hover:border-turf-500/40",
        disabled && "cursor-default hover:border-turf-500/15",
        isWinner === true && "border-turf-400/70",
        isWinner === false && "opacity-45"
      )}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-8 w-8 shrink-0 object-contain" />
      ) : (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-field-700 text-[10px] font-bold">
          {abbr}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{name}</span>
        {score !== null && <span className="tnum text-xs text-ink-muted">{score} pts</span>}
      </span>
      {active && (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-turf-500 text-field-950">
          <Check size={13} />
        </span>
      )}
    </button>
  );
}

export default function PickCard({
  game: g,
  myPick,
  onPick,
  reveal,
  showReveal,
}: {
  game: ClientGame;
  myPick: string | undefined;
  onPick: (abbr: string) => void;
  reveal: RevealPick[];
  showReveal: boolean;
}) {
  const locked = g.locked;
  const gotIt = g.completed && myPick && myPick === g.winnerAbbr;
  const missed = g.completed && myPick && g.winnerAbbr && myPick !== g.winnerAbbr;

  return (
    <div className="card p-3">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <span className="text-[11px] font-semibold text-ink-faint">
          {g.state === "post"
            ? "Final"
            : g.state === "in"
            ? `Live · ${g.shortDetail}`
            : shortKickoff(g.kickoff)}
        </span>
        {!locked ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-turf-400">
            <Clock size={13} /> Locks in {timeUntil(g.kickoff)}
          </span>
        ) : gotIt ? (
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-turf-400">
            <Check size={13} /> Got it
          </span>
        ) : missed ? (
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-red-400">
            <XMark size={13} /> Missed
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-gold-400">
            <Lock size={12} /> Locked
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <TeamButton
          active={myPick === g.awayAbbr}
          logo={g.awayLogo}
          abbr={g.awayAbbr}
          name={g.awayName}
          score={g.completed || g.state === "in" ? g.awayScore : null}
          disabled={locked}
          isWinner={g.completed ? g.winnerAbbr === g.awayAbbr : null}
          onClick={() => onPick(g.awayAbbr)}
        />
        <TeamButton
          active={myPick === g.homeAbbr}
          logo={g.homeLogo}
          abbr={g.homeAbbr}
          name={g.homeName}
          score={g.completed || g.state === "in" ? g.homeScore : null}
          disabled={locked}
          isWinner={g.completed ? g.winnerAbbr === g.homeAbbr : null}
          onClick={() => onPick(g.homeAbbr)}
        />
      </div>

      {showReveal && locked && reveal.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 px-0.5">
          {reveal.map((r, i) => (
            <span
              key={i}
              className={classNames(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                g.completed && r.pick === g.winnerAbbr
                  ? "bg-turf-500/20 text-turf-300"
                  : g.completed
                  ? "bg-red-500/10 text-red-300/80"
                  : "bg-field-700/70 text-ink-muted"
              )}
              title={`${r.name} picked ${r.pick}`}
            >
              {r.name}: {r.pick}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
