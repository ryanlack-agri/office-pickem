import { sql, SEASON, ensureSchema } from "./db";
import { refreshWeek, fetchCurrent } from "./nfl";

export type Game = {
  id: string;
  season: number;
  week: number;
  homeAbbr: string;
  homeName: string;
  homeLogo: string | null;
  awayAbbr: string;
  awayName: string;
  awayLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoff: string;
  state: "pre" | "in" | "post";
  completed: boolean;
  winnerAbbr: string | null;
  shortDetail: string;
  locked: boolean; // kickoff has passed
  consensus?: { away: number; home: number; total: number } | null;
};

const STALE_MS = 20_000;

function shape(row: any): Game {
  const kickoff = new Date(row.kickoff).toISOString();
  return {
    id: row.id,
    season: row.season,
    week: row.week,
    homeAbbr: row.home_abbr,
    homeName: row.home_name,
    homeLogo: row.home_logo,
    awayAbbr: row.away_abbr,
    awayName: row.away_name,
    awayLogo: row.away_logo,
    homeScore: row.home_score,
    awayScore: row.away_score,
    kickoff,
    state: row.state,
    completed: row.completed,
    winnerAbbr: row.winner_abbr,
    shortDetail: row.short_detail || "",
    locked: new Date(kickoff).getTime() <= Date.now(),
  };
}

/** Current NFL week, cached briefly in memory to avoid an ESPN call on every request. */
let currentCache: { at: number; value: { season: number; week: number } } | null = null;
export async function getCurrent(): Promise<{ season: number; week: number }> {
  if (currentCache && Date.now() - currentCache.at < 60_000) return currentCache.value;
  try {
    const value = await fetchCurrent();
    currentCache = { at: Date.now(), value };
    return value;
  } catch {
    return currentCache?.value || { season: SEASON, week: 1 };
  }
}

async function rawWeekGames(season: number, week: number) {
  return (await sql`
    SELECT * FROM games
    WHERE season = ${season} AND week = ${week}
    ORDER BY kickoff ASC, ordinal ASC
  `) as any[];
}

function needsLiveRefresh(rows: any[]): boolean {
  if (rows.length === 0) return true;
  const now = Date.now();
  let newestUpdate = 0;
  let anyLive = false;
  for (const r of rows) {
    newestUpdate = Math.max(newestUpdate, new Date(r.updated_at).getTime());
    const kickoff = new Date(r.kickoff).getTime();
    const shouldBeLive = kickoff <= now && !r.completed;
    if (r.state === "in" || shouldBeLive) anyLive = true;
  }
  return anyLive && now - newestUpdate > STALE_MS;
}

/**
 * Returns games for a week. Pulls from ESPN when the week is empty or when a live
 * game's cached scores are stale. This is what makes scores update on their own
 * while people are watching, without needing a paid cron.
 */
export async function getWeekGames(
  season: number,
  week: number,
  opts: { forceRefresh?: boolean } = {}
): Promise<Game[]> {
  await ensureSchema();
  let rows = await rawWeekGames(season, week);

  if (opts.forceRefresh || needsLiveRefresh(rows)) {
    try {
      await refreshWeek(season, week);
      rows = await rawWeekGames(season, week);
    } catch {
      // fall back to whatever we have cached
    }
  }
  return rows.map(shape);
}

export type Settings = { season: number; buyIn: number; potNote: string };

export async function getSettings(): Promise<Settings> {
  await ensureSchema();
  const rows = (await sql`SELECT season, buy_in, pot_note FROM settings WHERE id = 1`) as any[];
  const r = rows[0];
  return {
    season: r?.season ?? SEASON,
    buyIn: r ? Number(r.buy_in) : 0,
    potNote: r?.pot_note ?? "",
  };
}

export type Standing = {
  playerId: number;
  name: string;
  paid: boolean;
  correct: number;
  decided: number;
  totalPicks: number;
  weekCorrect: number;
};

/**
 * Season standings plus this-week correct counts. Computed in JS because an office
 * pool is small and it keeps tiebreaker logic simple and readable.
 */
export async function getLeaderboard(
  season: number,
  week: number
): Promise<{ standings: Standing[]; players: number }> {
  await ensureSchema();

  const players = (await sql`SELECT id, name, paid FROM players ORDER BY name`) as any[];
  const picks = (await sql`
    SELECT player_id, game_id, week, pick_abbr FROM picks WHERE season = ${season}
  `) as any[];
  const games = (await sql`
    SELECT id, week, completed, winner_abbr FROM games WHERE season = ${season}
  `) as any[];

  const gameById = new Map<string, any>();
  for (const g of games) gameById.set(g.id, g);

  const byPlayer = new Map<number, Standing>();
  for (const p of players) {
    byPlayer.set(p.id, {
      playerId: p.id,
      name: p.name,
      paid: p.paid,
      correct: 0,
      decided: 0,
      totalPicks: 0,
      weekCorrect: 0,
    });
  }

  for (const pk of picks) {
    const s = byPlayer.get(pk.player_id);
    if (!s) continue;
    s.totalPicks++;
    const g = gameById.get(pk.game_id);
    if (g && g.completed) {
      s.decided++;
      const isCorrect = g.winner_abbr && pk.pick_abbr === g.winner_abbr;
      if (isCorrect) {
        s.correct++;
        if (pk.week === week) s.weekCorrect++;
      }
    }
  }

  const standings = Array.from(byPlayer.values()).sort(
    (a, b) => b.correct - a.correct || b.decided - a.decided || a.name.localeCompare(b.name)
  );

  return { standings, players: players.length };
}
