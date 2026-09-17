// Season-long standings computed INLINE here so this route never depends on a
// separately-bundled getLeaderboard that a stale build cache can freeze. Pot and
// paid markers cover every registered player, every week.
import { sql, SEASON, ensureSchema } from "@/lib/db";
import { getCurrent, getWeekGames, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

// Weeks that do NOT count toward the season total (Week 1 was a warm-up).
const EXCLUDED_WEEKS = new Set<number>([1]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const current = await getCurrent();
    const season = Number(searchParams.get("season")) || current.season || SEASON;
    const week = Number(searchParams.get("week")) || current.week || 1;

    // Refresh the viewed week's live scores so standings move on their own.
    const games = await getWeekGames(season, week);
    const settings = await getSettings();

    await ensureSchema();

    // Every registered player, every week. No week filter on the roster.
    const roster = (await sql`SELECT id, name, paid FROM players ORDER BY name`) as any[];
    const picks = (await sql`
      SELECT player_id, game_id, week, pick_abbr FROM picks WHERE season = ${season}
    `) as any[];
    const seasonGames = (await sql`
      SELECT id, week, completed, winner_abbr FROM games WHERE season = ${season}
    `) as any[];

    const gameById = new Map<string, any>();
    for (const g of seasonGames) gameById.set(g.id, g);

    const byPlayer = new Map<number, any>();
    for (const p of roster) {
      byPlayer.set(p.id, {
        playerId: p.id,
        name: p.name,
        paid: p.paid,
        correct: 0,
        decided: 0,
        totalPicks: 0,
        weekCorrect: 0,
        week1Correct: 0,
      });
    }

    for (const pk of picks) {
      const s = byPlayer.get(pk.player_id);
      if (!s) continue;
      const g = gameById.get(pk.game_id);
      const isCorrect = Boolean(g && g.completed && g.winner_abbr && pk.pick_abbr === g.winner_abbr);
      if (isCorrect && pk.week === week) s.weekCorrect++;
      if (isCorrect && pk.week === 1) s.week1Correct++;
      if (!EXCLUDED_WEEKS.has(pk.week)) {
        s.totalPicks++;
        if (g && g.completed) {
          s.decided++;
          if (isCorrect) s.correct++;
        }
      }
    }

    const standings = Array.from(byPlayer.values()).sort(
      (a, b) => b.correct - a.correct || b.decided - a.decided || a.name.localeCompare(b.name)
    );

    const week1Max = Math.max(0, ...standings.map((s) => s.week1Correct));
    const week1Winners =
      week1Max > 0
        ? standings.filter((s) => s.week1Correct === week1Max).map((s) => s.playerId)
        : [];

    // Pot and paid markers are season-long: every registered player counts, every week.
    const paidCount = standings.filter((s) => s.paid).length;
    const pot = settings.buyIn * paidCount;

    // Weekly winner: most correct picks this week.
    const anyDecided = games.some((g) => g.completed);
    const weekComplete = games.length > 0 && games.every((g) => g.completed);
    let weekWinner: { name: string; correct: number; tie: number } | null = null;
    const topWeek = Math.max(0, ...standings.map((s) => s.weekCorrect));
    if (anyDecided && topWeek > 0) {
      const leaders = standings.filter((s) => s.weekCorrect === topWeek);
      weekWinner = { name: leaders[0].name, correct: topWeek, tie: leaders.length };
    }

    return Response.json({
      season,
      week,
      currentWeek: current.week,
      standings,
      players: roster.length,
      paidCount,
      buyIn: settings.buyIn,
      pot,
      potNote: settings.potNote,
      weekWinner,
      weekComplete,
      week1Winners,
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load leaderboard." }, { status: 500 });
  }
}
