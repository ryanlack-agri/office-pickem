import { SEASON } from "@/lib/db";
import { getWeekGames, getCurrent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const current = await getCurrent();
    const season = Number(searchParams.get("season")) || current.season || SEASON;
    const week = Number(searchParams.get("week")) || current.week || 1;

    const games = await getWeekGames(season, week);
    return Response.json({ season, week, currentWeek: current.week, games });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load games." }, { status: 500 });
  }
}
