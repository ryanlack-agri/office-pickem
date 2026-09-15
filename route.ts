import { sql, SEASON, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getWeekGames, getCurrent } from "@/lib/store";

export const dynamic = "force-dynamic";

async function resolveWeek(searchParams: URLSearchParams) {
  const current = await getCurrent();
  const season = Number(searchParams.get("season")) || current.season || SEASON;
  const week = Number(searchParams.get("week")) || current.week || 1;
  return { season, week };
}

// Returns the caller's picks for the week, plus everyone's picks for games that
// have already kicked off (picks stay hidden until each game locks).
export async function GET(req: Request) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const { season, week } = await resolveWeek(searchParams);
    const session = await getSession();

    const games = await getWeekGames(season, week);
    // The whole week locks the moment the first game kicks off. Until then picks are
    // editable and hidden; after it, no edits and everyone's picks are revealed at once.
    const kickoffs = games.map((g) => new Date(g.kickoff).getTime());
    const firstKickoff = kickoffs.length ? Math.min(...kickoffs) : 0;
    const lastKickoff = kickoffs.length ? Math.max(...kickoffs) : 0;
    const weekLocked = firstKickoff > 0 && Date.now() >= firstKickoff;
    const tiebreakerRevealed = lastKickoff > 0 && Date.now() >= lastKickoff;

    const allPicks = (await sql`
      SELECT pk.player_id, p.name, pk.game_id, pk.pick_abbr
      FROM picks pk JOIN players p ON p.id = pk.player_id
      WHERE pk.season = ${season} AND pk.week = ${week}
    `) as any[];

    const revealed = weekLocked
      ? allPicks.map((r) => ({ playerId: r.player_id, name: r.name, gameId: r.game_id, pick: r.pick_abbr }))
      : [];

    let myPicks: Record<string, string> = {};
    let myTiebreaker: number | null = null;
    if (session) {
      for (const r of allPicks) {
        if (r.player_id === session.id) myPicks[r.game_id] = r.pick_abbr;
      }
      const tb = (await sql`
        SELECT points FROM tiebreakers
        WHERE player_id = ${session.id} AND season = ${season} AND week = ${week}
      `) as any[];
      if (tb[0]) myTiebreaker = tb[0].points;
    }

    const tiebreakers = tiebreakerRevealed
      ? ((await sql`
          SELECT t.player_id, p.name, t.points
          FROM tiebreakers t JOIN players p ON p.id = t.player_id
          WHERE t.season = ${season} AND t.week = ${week}
        `) as any[]).map((r) => ({ playerId: r.player_id, name: r.name, points: r.points }))
      : [];

    return Response.json({
      season,
      week,
      loggedIn: Boolean(session),
      weekLocked,
      firstKickoff: firstKickoff ? new Date(firstKickoff).toISOString() : null,
      myPicks,
      myTiebreaker,
      revealed,
      tiebreakerRevealed,
      tiebreakers,
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load picks." }, { status: 500 });
  }
}

// Submit or update picks. Picks for games that already kicked off are ignored.
export async function POST(req: Request) {
  try {
    await ensureSchema();
    const session = await getSession();
    if (!session) return Response.json({ error: "Log in to submit picks." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const season = Number(body?.season) || SEASON;
    const week = Number(body?.week);
    if (!week) return Response.json({ error: "Missing week." }, { status: 400 });

    const submitted: Record<string, string> = body?.picks || {};
    const games = await getWeekGames(season, week);

    // Once the first game of the week kicks off, the whole slate is locked.
    const kickoffs = games.map((g) => new Date(g.kickoff).getTime());
    const firstKickoff = kickoffs.length ? Math.min(...kickoffs) : 0;
    if (firstKickoff > 0 && Date.now() >= firstKickoff) {
      return Response.json(
        { error: "Picks are locked. The first game of the week has already kicked off." },
        { status: 403 }
      );
    }

    const gameById = new Map(games.map((g) => [g.id, g]));

    let saved = 0;
    let locked = 0;
    for (const [gameId, pickAbbr] of Object.entries(submitted)) {
      const g = gameById.get(gameId);
      if (!g) continue;
      if (g.locked) {
        locked++;
        continue; // cannot change a pick after kickoff
      }
      if (pickAbbr !== g.homeAbbr && pickAbbr !== g.awayAbbr) continue;
      await sql`
        INSERT INTO picks (player_id, season, week, game_id, pick_abbr, updated_at)
        VALUES (${session.id}, ${season}, ${week}, ${gameId}, ${pickAbbr}, now())
        ON CONFLICT (player_id, game_id)
        DO UPDATE SET pick_abbr = EXCLUDED.pick_abbr, updated_at = now()
      `;
      saved++;
    }

    // Tiebreaker: editable until the week's last game kicks off.
    const lastKickoff = games.length
      ? Math.max(...games.map((g) => new Date(g.kickoff).getTime()))
      : 0;
    const tb = body?.tiebreaker;
    if (tb !== undefined && tb !== null && tb !== "" && Date.now() < lastKickoff) {
      const points = Math.max(0, Math.min(200, Math.round(Number(tb))));
      if (Number.isFinite(points)) {
        await sql`
          INSERT INTO tiebreakers (player_id, season, week, points)
          VALUES (${session.id}, ${season}, ${week}, ${points})
          ON CONFLICT (player_id, season, week)
          DO UPDATE SET points = EXCLUDED.points
        `;
      }
    }

    return Response.json({ ok: true, saved, locked });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to save picks." }, { status: 500 });
  }
}
