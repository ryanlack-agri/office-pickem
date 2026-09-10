import { sql, ensureSchema } from "@/lib/db";
import { checkAdminKey, hashPin, isValidPin } from "@/lib/auth";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

async function adminSnapshot() {
  const players = (await sql`
    SELECT id, name, paid, created_at FROM players ORDER BY name
  `) as any[];
  const settings = await getSettings();
  const paidCount = players.filter((p) => p.paid).length;
  return {
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      paid: p.paid,
      createdAt: p.created_at,
    })),
    buyIn: settings.buyIn,
    potNote: settings.potNote,
    paidCount,
    pot: settings.buyIn * paidCount,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (!checkAdminKey(searchParams.get("key"))) {
    return Response.json({ error: "Not authorized." }, { status: 401 });
  }
  try {
    await ensureSchema();
    return Response.json({ ok: true, ...(await adminSnapshot()) });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!checkAdminKey(body?.key)) {
      return Response.json({ error: "Not authorized." }, { status: 401 });
    }
    await ensureSchema();
    const action = body?.action;

    if (action === "settings") {
      const buyIn = Math.max(0, Number(body?.buyIn) || 0);
      const potNote = String(body?.potNote || "").slice(0, 200);
      await sql`UPDATE settings SET buy_in = ${buyIn}, pot_note = ${potNote} WHERE id = 1`;
    } else if (action === "paid") {
      const playerId = Number(body?.playerId);
      const paid = Boolean(body?.paid);
      await sql`UPDATE players SET paid = ${paid} WHERE id = ${playerId}`;
    } else if (action === "delete") {
      const playerId = Number(body?.playerId);
      await sql`DELETE FROM players WHERE id = ${playerId}`;
    } else if (action === "resetPin") {
      const playerId = Number(body?.playerId);
      const pin = body?.pin;
      if (!isValidPin(pin)) {
        return Response.json({ error: "PIN must be exactly 4 digits." }, { status: 400 });
      }
      await sql`UPDATE players SET pin_hash = ${await hashPin(pin)} WHERE id = ${playerId}`;
    } else {
      return Response.json({ error: "Unknown action." }, { status: 400 });
    }

    return Response.json({ ok: true, ...(await adminSnapshot()) });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Action failed." }, { status: 500 });
  }
}
