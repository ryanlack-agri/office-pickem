import { sql, ensureSchema } from "@/lib/db";
import { hashPin, createSession, isValidPin, cleanName } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const name = cleanName(body?.name);
    const pin = body?.pin;

    if (!name) {
      return Response.json({ error: "Enter a name between 2 and 30 characters." }, { status: 400 });
    }
    if (!isValidPin(pin)) {
      return Response.json({ error: "PIN must be exactly 4 digits." }, { status: 400 });
    }

    const nameLower = name.toLowerCase();
    const existing = (await sql`SELECT id FROM players WHERE name_lower = ${nameLower}`) as any[];
    if (existing.length > 0) {
      return Response.json(
        { error: "That name is taken. If it's you, log in with your PIN instead." },
        { status: 409 }
      );
    }

    const pinHash = await hashPin(pin);
    const rows = (await sql`
      INSERT INTO players (name, name_lower, pin_hash)
      VALUES (${name}, ${nameLower}, ${pinHash})
      RETURNING id, name, paid
    `) as any[];
    const player = rows[0];

    await createSession(player.id, player.name);
    return Response.json({ id: player.id, name: player.name, paid: player.paid });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Something went wrong." }, { status: 500 });
  }
}
