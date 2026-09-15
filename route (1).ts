import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// The chat board is one season-long thread. The table is created on demand so
// there's still no manual database step after deploy.
let chatSchema: Promise<void> | null = null;
function ensureChat(): Promise<void> {
  if (!chatSchema) {
    chatSchema = (async () => {
      await ensureSchema();
      await sql`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          player_id INT,
          name TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS messages_created_idx ON messages (created_at)`;
    })();
  }
  return chatSchema;
}

function shape(r: any) {
  return {
    id: r.id,
    playerId: r.player_id,
    name: r.name,
    body: r.body,
    at: new Date(r.created_at).toISOString(),
  };
}

// Returns the most recent messages, oldest first so the client can append to the bottom.
export async function GET() {
  try {
    await ensureChat();
    const rows = (await sql`
      SELECT id, player_id, name, body, created_at
      FROM messages
      ORDER BY created_at DESC
      LIMIT 120
    `) as any[];
    const session = await getSession();
    return Response.json({
      messages: rows.map(shape).reverse(),
      meId: session?.id ?? null,
      loggedIn: Boolean(session),
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load chat." }, { status: 500 });
  }
}

// Post a message. Must be logged in; the name comes from the session, not the client.
export async function POST(req: Request) {
  try {
    await ensureChat();
    const session = await getSession();
    if (!session) return Response.json({ error: "Log in to chat." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    let text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) return Response.json({ error: "Say something first." }, { status: 400 });
    if (text.length > 500) text = text.slice(0, 500);

    const rows = (await sql`
      INSERT INTO messages (player_id, name, body, created_at)
      VALUES (${session.id}, ${session.name}, ${text}, now())
      RETURNING id, player_id, name, body, created_at
    `) as any[];

    return Response.json({ ok: true, message: shape(rows[0]) });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to send." }, { status: 500 });
  }
}
