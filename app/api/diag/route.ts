import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

function maskHost(url: string): string {
  const m = url.match(/@([^/?]+)/);
  return m ? m[1] : "none";
}

export async function GET() {
  try {
    await ensureSchema();

    const dbUrl = process.env.DATABASE_URL || "";
    const pgUrl = process.env.POSTGRES_URL || "";
    const unpooled = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || "";
    const usedUrl = dbUrl || pgUrl || unpooled;

    const rows = (await sql`SELECT id, name FROM players ORDER BY name`) as any[];
    const meta = (await sql`
      SELECT current_database() AS db,
             current_setting('neon.endpoint_id', true) AS endpoint,
             current_setting('neon.branch_id', true) AS branch,
             inet_server_addr()::text AS addr,
             pg_backend_pid() AS pid
    `) as any[];

    return Response.json({
      build: "diag-3",
      count: rows.length,
      usedHost: maskHost(usedUrl),
      whichVar: dbUrl ? "DATABASE_URL" : pgUrl ? "POSTGRES_URL" : unpooled ? "UNPOOLED" : "none",
      dbHost: maskHost(dbUrl),
      pgHost: maskHost(pgUrl),
      unpooledHost: maskHost(unpooled),
      meta: meta[0] || null,
      names: rows.map((r) => r.name),
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "diag failed", stack: e?.stack }, { status: 500 });
  }
}
