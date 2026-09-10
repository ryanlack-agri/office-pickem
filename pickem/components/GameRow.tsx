"use client";

import { ClientGame } from "@/lib/types";
import { classNames, shortKickoff } from "@/lib/util";

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
    <div
      className={classNames(
        "flex items-center justify-between gap-3 py-1",
        dim && "opacity-45"
      )}
    >
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo ? (
          <img src={logo} alt="" className="h-7 w-7 object-contain" />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded bg-field-700 text-[10px] font-bold">
            {abbr}
          </span>
        )}
        <span className={classNames("font-semibold", isWinner ? "text-chalk" : "text-chalk/80")}>
          {name}
        </span>
        {isWinner && <span className="text-turf-400">✓</span>}
      </div>
      <span className={classNames("tabular-nums text-lg", isWinner ? "font-black text-chalk" : "text-chalk/70")}>
        {score ?? "—"}
      </span>
    </div>
  );
}

export default function GameRow({ game: g }: { game: ClientGame }) {
  const homeWin = g.completed && g.winnerAbbr === g.homeAbbr;
  const awayWin = g.completed && g.winnerAbbr === g.awayAbbr;

  let status: React.ReactNode;
  if (g.state === "post") {
    status = <span className="text-xs font-bold uppercase tracking-wide text-chalk/50">Final</span>;
  } else if (g.state === "in") {
    status = (
      <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-red-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> Live · {g.shortDetail}
      </span>
    );
  } else {
    status = (
      <span className="text-xs font-semibold text-chalk/50">{shortKickoff(g.kickoff)}</span>
    );
  }

  return (
    <div className="card px-4 py-3">
      <div className="mb-1 flex items-center justify-between">
        {status}
        {g.locked && g.state === "pre" && (
          <span className="text-[10px] font-bold uppercase text-amber-400">Locked</span>
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
