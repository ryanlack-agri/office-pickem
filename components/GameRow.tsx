"use client";

import { ClientGame } from "@/lib/types";
import { classNames, shortKickoff } from "@/lib/util";
import { Check, Lock } from "@/components/icons";

function TeamLine({
  logo,
  abbr,
  name,
  score,
  isWinner,
  dim,
}: {
  logo: string | null;
  abbr: string;
  name: string;
  score: number | null;
  isWinner: boolean;
  dim: boolean;
}) {
  return (
    <div className={classNames("flex items-center justify-between gap-3 py-1.5", dim && "opacity-45")}>
      <div className="flex min-w-0 items-center gap-2.5">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-7 w-7 shrink-0 object-contain" />
        ) : (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-field-700 text-[10px] font-bold">
            {abbr}
          </span>
        )}
        <span className={classNames("truncate font-semibold", isWinner ? "text-ink" : "text-ink-muted")}>
          {name}
        </span>
        {isWinner && <Check size={16} className="shrink-0 text-turf-400" />}
      </div>
      <span
        className={classNames(
          "tnum text-lg",
          isWinner ? "font-display font-bold text-ink" : "text-ink-muted"
        )}
      >
        {score ?? "—"}
      </span>
    </div>
  );
}

export default function GameRow({ game: g }: { game: ClientGame }) {
  const homeWin = g.completed && g.winnerAbbr === g.homeAbbr;
  const awayWin = g.completed && g.winnerAbbr === g.awayAbbr;

  return (
    <div className="card px-4 py-3">
      <div className="mb-1 flex items-center justify-between">
        {g.state === "post" ? (
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Final</span>
        ) : g.state === "in" ? (
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-400" />
            Live · {g.shortDetail}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-ink-faint">{shortKickoff(g.kickoff)}</span>
        )}
        {g.locked && g.state === "pre" && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-gold-400">
            <Lock size={12} /> Locked
          </span>
        )}
      </div>
      <TeamLine
        logo={g.awayLogo}
        abbr={g.awayAbbr}
        name={g.awayName}
        score={g.awayScore}
        isWinner={awayWin}
        dim={g.completed && !awayWin}
      />
      <TeamLine
        logo={g.homeLogo}
        abbr={g.homeAbbr}
        name={g.homeName}
        score={g.homeScore}
        isWinner={homeWin}
        dim={g.completed && !homeWin}
      />
    </div>
  );
}
