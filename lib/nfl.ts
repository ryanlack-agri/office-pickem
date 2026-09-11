import { sql, SEASON } from "./db";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

export type ParsedGame = {
  id: string;
  week: number;
  homeAbbr: string;
  homeName: string;
  homeLogo: string | null;
  awayAbbr: string;
  awayName: string;
  awayLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoff: string; // ISO
  state: "pre" | "in" | "post";
  completed: boolean;
  winnerAbbr: string | null;
  shortDetail: string;
};

export type Scoreboard = {
  season: number;
  week: number;
  games: ParsedGame[];
};

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parse(json: any): Scoreboard {
  const events: any[] = Array.isArray(json?.events) ? json.events : [];
  const games: ParsedGame[] = [];

  for (const ev of events) {
    const comp = ev?.competitions?.[0];
    if (!comp) continue;
    const competitors: any[] = comp.competitors || [];
    const home = competitors.find((c) => c.homeAway === "home");
    const away = competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;

    const state: string = comp?.status?.type?.state || ev?.status?.type?.state || "pre";
    const completed: boolean = Boolean(comp?.status?.type?.completed);

    let winnerAbbr: string | null = null;
    if (completed) {
      if (home.winner) winnerAbbr = home.team?.abbreviation ?? null;
      else if (away.winner) winnerAbbr = away.team?.abbreviation ?? null;
      else winnerAbbr = "TIE";
    }

    games.push({
      id: String(ev.id),
      week: Number(ev?.week?.number ?? json?.week?.number ?? 0),
      homeAbbr: home.team?.abbreviation ?? "",
      homeName: home.team?.displayName ?? home.team?.name ?? "",
      homeLogo: home.team?.logo ?? null,
      awayAbbr: away.team?.abbreviation ?? "",
      awayName: away.team?.displayName ?? away.team?.name ?? "",
      awayLogo: away.team?.logo ?? null,
      homeScore: num(home.score),
      awayScore: num(away.score),
      kickoff: comp.date || ev.date,
      state: (state === "in" || state === "post" ? state : "pre") as ParsedGame["state"],
      completed,
      winnerAbbr,
      shortDetail: comp?.status?.type?.shortDetail || "",
    });
  }

  return {
    season: Number(json?.season?.year ?? SEASON),
    week: Number(json?.week?.number ?? 0),
    games,
  };
}

export async function fetchScoreboard(season?: number, week?: number): Promise<Scoreboard> {
  const params = new URLSearchParams();
  if (season) params.set("year", String(season));
  params.set("seasontype", "2"); // regular season
  if (week) params.set("week", String(week));
  const res = await fetch(`${BASE}?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN scoreboard request failed: ${res.status}`);
  const json = await res.json();
  return parse(json);
}

/** Returns the season/week the NFL is currently on (default scoreboard view). */
export async function fetchCurrent(): Promise<{ season: number; week: number }> {
  const sb = await fetchScoreboard();
  return {
    season: sb.season || SEASON,
    week: sb.week || 1,
  };
}

/** Pulls a week from ESPN and upserts its games (schedule + live scores + winners). */
export async function refreshWeek(season: number, week: number): Promise<number> {
  const sb = await fetchScoreboard(season, week);
  let n = 0;
  for (let i = 0; i < sb.games.length; i++) {
    const g = sb.games[i];
    await sql`
      INSERT INTO games (
        id, season, week, home_abbr, home_name, home_logo,
        away_abbr, away_name, away_logo, home_score, away_score,
        kickoff, state, completed, winner_abbr, short_detail, ordinal, updated_at
      ) VALUES (
        ${g.id}, ${season}, ${week}, ${g.homeAbbr}, ${g.homeName}, ${g.homeLogo},
        ${g.awayAbbr}, ${g.awayName}, ${g.awayLogo}, ${g.homeScore}, ${g.awayScore},
        ${g.kickoff}, ${g.state}, ${g.completed}, ${g.winnerAbbr}, ${g.shortDetail}, ${i}, now()
      )
      ON CONFLICT (id) DO UPDATE SET
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        kickoff = EXCLUDED.kickoff,
        state = EXCLUDED.state,
        completed = EXCLUDED.completed,
        winner_abbr = EXCLUDED.winner_abbr,
        short_detail = EXCLUDED.short_detail,
        home_logo = EXCLUDED.home_logo,
        away_logo = EXCLUDED.away_logo,
        ordinal = EXCLUDED.ordinal,
        updated_at = now()
    `;
    n++;
  }
  return n;
}
