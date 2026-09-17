import { sql, ensureSchema } from "@/lib/db";
import { getLeaderboard, getCurrent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const current = await getCurrent();
    const season = Number(searchParams.get("season")) || current.season || 2026;
    const week = Number(searchParams.get("week")) || current.week || 1;

    // Plain, week-independent read straight from the table.
    const rawRows = (await sql`SELECT id, name, paid FROM players ORDER BY name`) as any[];

    // What getLeaderboard actually returns for this week (should match rawRows count).
    const lb = await getLeaderboard(season, week);

    return Response.json({
      build: "diag-2",
      week,
      rawPlayerCount: rawRows.length,
      rawPaidCount: rawRows.filter((r) => r.paid).length,
      lbPlayers: lb.players,
      lbStandingsLen: lb.standings.length,
      lbPaidCount: lb.standings.filter((s) => s.paid).length,
      rawNames: rawRows.map((r) => r.name),
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "diag failed", stack: e?.stack }, { status: 500 });
  }
}
