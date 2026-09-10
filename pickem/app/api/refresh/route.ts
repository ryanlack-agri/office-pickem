import { ensureSchema, SEASON } from "@/lib/db";
import { refreshWeek, fetchCurrent } from "@/lib/nfl";
import { checkAdminKey } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function runRefresh() {
  await ensureSchema();
  const current = await fetchCurrent();
  const season = current.season || SEASON;
  const weeks = new Set<number>([current.week]);
  if (current.week + 1 <= 18) weeks.add(current.week + 1); // pull next week's schedule too

  let total = 0;
  for (const w of weeks) {
    total += await refreshWeek(season, w);
  }
  return { season, weeks: Array.from(weeks), games: total };
}

// Cron entrypoint (Vercel calls this daily) and public read-only refresh.
export async function GET() {
  try {
    const summary = await runRefresh();
    return Response.json({ ok: true, ...summary });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "Refresh failed." }, { status: 500 });
  }
}

// Admin "refresh now" button, and lets the admin backfill a specific week.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!checkAdminKey(body?.key)) {
      return Response.json({ error: "Not authorized." }, { status: 401 });
    }
    await ensureSchema();

    if (body?.week) {
      const season = Number(body?.season) || SEASON;
      const week = Number(body.week);
      const n = await refreshWeek(season, week);
      return Response.json({ ok: true, season, weeks: [week], games: n });
    }

    const summary = await runRefresh();
    return Response.json({ ok: true, ...summary });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "Refresh failed." }, { status: 500 });
  }
}
