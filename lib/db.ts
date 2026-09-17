import { neon } from "@neondatabase/serverless";

// Use the DIRECT (unpooled) endpoint, not the pgbouncer pooler. The pooled
// endpoint was handing different serverless instances connections to diverged
// backends, so the same `SELECT ... FROM players` returned different row counts
// on different requests (the pot/paid "reset"). The direct compute is the single
// source of truth. Fall back to the pooled URLs only if the unpooled ones are unset.
const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

if (!connectionString && process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.warn("[db] No DATABASE_URL set. Add a Postgres database and set DATABASE_URL.");
}

// The neon() factory does not connect until a query runs, so a placeholder is safe at import time.
export const sql = neon(connectionString || "postgres://placeholder:placeholder@localhost/placeholder");

export const SEASON = Number(process.env.SEASON_YEAR || 2026);

let schemaPromise: Promise<void> | null = null;

/**
 * Creates all tables if they don't exist. Runs at most once per warm instance.
 * This removes any manual "set up the database" step after deploy.
 */
export function ensureSchema(): Promise<void> {
  if (!connectionString) {
    return Promise.reject(
      new Error("Database is not configured. Set DATABASE_URL in your environment variables.")
    );
  }
  if (!schemaPromise) schemaPromise = createSchema();
  return schemaPromise;
}

async function createSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      name_lower TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      paid BOOLEAN NOT NULL DEFAULT FALSE,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      season INT NOT NULL,
      week INT NOT NULL,
      home_abbr TEXT NOT NULL,
      home_name TEXT NOT NULL,
      home_logo TEXT,
      away_abbr TEXT NOT NULL,
      away_name TEXT NOT NULL,
      away_logo TEXT,
      home_score INT,
      away_score INT,
      kickoff TIMESTAMPTZ NOT NULL,
      state TEXT NOT NULL DEFAULT 'pre',
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      winner_abbr TEXT,
      short_detail TEXT,
      ordinal INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS games_week_idx ON games (season, week)`;

  await sql`
    CREATE TABLE IF NOT EXISTS picks (
      id SERIAL PRIMARY KEY,
      player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      
      season INT NOT NULL,
      week INT NOT NULL,
      game_id TEXT NOT NULL,
      pick_abbr TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (player_id, game_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS picks_week_idx ON picks (season, week)`;

  await sql`
    CREATE TABLE IF NOT EXISTS tiebreakers (
      id SERIAL PRIMARY KEY,
      player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      season INT NOT NULL,
      week INT NOT NULL,
      points INT NOT NULL,
      UNIQUE (player_id, season, week)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY DEFAULT 1,
      season INT NOT NULL DEFAULT 2026,
      buy_in NUMERIC NOT NULL DEFAULT 0,
      pot_note TEXT DEFAULT '',
      CONSTRAINT settings_singleton CHECK (id = 1)
    )
  `;
  await sql`INSERT INTO settings (id, season) VALUES (1, ${SEASON}) ON CONFLICT (id) DO NOTHING`;
}
