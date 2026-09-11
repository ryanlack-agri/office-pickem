import { sql, SEASON } from "@/lib/db";
import { getWeekGames, getCurrent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const current = await getCurrent();
    const season = Number(searchParams.get("season")) || current.season || SEASON;
    const week = Number(searchParams.get("week")) || current.week || 1;

    const games = await getWeekGames(season, week);

    // Crowd consensus: how the office split on each game. Only revealed once a
    // game has locked, so it never leaks picks before kickoff.
    const lockedIds = games.filter((g) => g.locked).map((g) => g.id);
    if (lockedIds.length > 0) {
      const rows = (await sql`
        SELECT game_id, pick_abbr, COUNT(*)::int AS n
        FROM picks
        WHERE season = ${season} AND week = ${week}
        GROUP BY game_id, pick_abbr
      `) as any[];
      const byGame = new Map<string, Record<string, number>>();
      for (const r of rows) {
        if (!byGame.has(r.game_id)) byGame.set(r.game_id, {});
        byGame.get(r.game_id)![r.pick_abbr] = r.n;
      }
      for (const g of games) {
        if (!g.locked) {
          g.consensus = null;
          continue;
        }
        const counts = byGame.get(g.id) || {};
        const away = counts[g.awayAbbr] || 0;
        const home = counts[g.homeAbbr] || 0;
        g.consensus = { away, home, total: away + home };
      }
    }

    return Response.json({ season, week, currentWeek: current.week, games });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load games." }, { status: 500 });
  }
}
