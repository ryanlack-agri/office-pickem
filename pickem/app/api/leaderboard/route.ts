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
    await getWeekGames(season, week);

    const [{ standings, players }, settings] = await Promise.all([
      getLeaderboard(season, week),
      getSettings(),
    ]);

    const paidCount = standings.filter((s) => s.paid).length;
    const pot = settings.buyIn * paidCount;

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
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load leaderboard." }, { status: 500 });
  }
}
