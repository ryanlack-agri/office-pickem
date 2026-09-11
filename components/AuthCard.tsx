"use client";

import { useState } from "react";
import { Player } from "@/lib/types";
import { Football } from "@/components/icons";

export default function AuthCard({ onSuccess }: { onSuccess: (p: Player) => void }) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      onSuccess(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md animate-fade-up">
      <div className="card p-6">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-turf-500/15 text-turf-400">
          <Football size={26} />
        </div>
        <h1 className="text-2xl font-bold text-ink">
          {mode === "register" ? "Join the pool" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {mode === "register"
            ? "Pick a display name and a 4-digit PIN. Your PIN keeps your picks yours."
            : "Enter your name and PIN to make or edit your picks."}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Display name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ryan L"
              maxLength={30}
              autoComplete="username"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="pin" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              4-digit PIN
            </label>
            <input
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder="••••"
              className="field tnum text-2xl tracking-[0.5em]"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary w-full py-3 text-base">
            {busy ? "…" : mode === "register" ? "Create my player" : "Log in"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "register" ? "login" : "register");
            setError(null);
          }}
          className="mt-4 w-full text-center text-sm font-medium text-turf-400 hover:underline"
        >
          {mode === "register" ? "Already joined? Log in with your PIN" : "New here? Create a player"}
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-ink-faint">
        Forgot your PIN? Ask whoever runs the pool to reset it from the Admin screen.
      </p>
    </div>
  );
}
