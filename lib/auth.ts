import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const COOKIE = "pickem_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me"
);

export type Session = { id: number; name: string };

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function createSession(playerId: number, name: string): Promise<void> {
  const token = await new SignJWT({ name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(playerId))
    .setIssuedAt()
    .setExpirationTime("150d")
    .sign(secret);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 150,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const id = Number(payload.sub);
    if (!id) return null;
    return { id, name: String(payload.name || "") };
  } catch {
    return null;
  }
}

export function clearSession(): void {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}

/** True when the provided key matches the admin password. */
export function checkAdminKey(key: string | null | undefined): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return false;
  return typeof key === "string" && key.length > 0 && key === expected;
}

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

export function cleanName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > 30) return null;
  return trimmed;
}
