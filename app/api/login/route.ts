import { sql, ensureSchema } from "@/lib/db";
import { verifyPin, createSession, isValidPin, cleanName } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const name = cleanName(body?.name);
    const pin = body?.pin;

    if (!name || !isValidPin(pin)) {
      return Response.json({ error: "Enter your name and 4-digit PIN." }, { status: 400 });
    }

    const rows = (await sql`
      SELECT id, name, pin_hash, paid FROM players WHERE name_lower = ${name.toLowerCase()}
    `) as any[];
    const player = rows[0];

    if (!player || !(await verifyPin(pin, player.pin_hash))) {
      return Response.json({ error: "Name or PIN is incorrect." }, { status: 401 });
    }

    await createSession(player.id, player.name);
    return Response.json({ id: player.id, name: player.name, paid: player.paid });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Something went wrong." }, { status: 500 });
  }
}
