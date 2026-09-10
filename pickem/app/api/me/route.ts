import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ player: null });

  try {
    await ensureSchema();
    const rows = (await sql`SELECT id, name, paid FROM players WHERE id = ${session.id}`) as any[];
    const player = rows[0];
    if (!player) return Response.json({ player: null });
    return Response.json({ player: { id: player.id, name: player.name, paid: player.paid } });
  } catch {
    return Response.json({ player: { id: session.id, name: session.name, paid: false } });
  }
}
