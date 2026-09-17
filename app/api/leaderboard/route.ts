// Season pot + paid markers are season-long: this route rebuild forces the
// leaderboard function to re-bundle the current getLeaderboard (all players,
// every week), not a stale copy. See lib/store.ts getLeaderboard.
import { SEASON } from "@/lib/db";
import { getCurrent, getWeekGames, getLeaderboard, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const current = await getCurrent();
    const season = Number(searchParams.get("season")) || current.season || SEASON;
    const week = Number(searchParams.get("week")) || current.week || 1;

    // Refresh the viewed week's live scores so standings move on their own while people watch.
    const games = await getWeekGames(season, week);

    const [{ standings, players, week1Winners }, settings] = await Promise.all([
      getLeaderboard(season, week),
      getSettings(),
    ]);

    // Pot and paid markers are season-long: every registered player counts, every week.
    const paidCount = standings.filter((s) => s.paid).length;
    const pot = settings.buyIn * paidCount;

    // Weekly winner: who has the most correct picks this week.
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
      players,
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
