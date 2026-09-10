"use client";

import { useState } from "react";
import { Player } from "@/lib/types";

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
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-xl font-extrabold text-chalk">
          {mode === "register" ? "Join the pool" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-chalk/60">
          {mode === "register"
            ? "Pick a display name and a 4-digit PIN. Your PIN keeps your picks yours."
            : "Enter your name and PIN to make or edit your picks."}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chalk/50">
              Display name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ryan L"
              maxLength={30}
              className="w-full rounded-xl border border-turf-500/25 bg-field-900/80 px-4 py-3 outline-none focus:border-turf-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chalk/50">
              4-digit PIN
            </label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              placeholder="••••"
              className="w-full rounded-xl border border-turf-500/25 bg-field-900/80 px-4 py-3 text-2xl tracking-[0.5em] outline-none focus:border-turf-400"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary w-full py-3 text-base"
          >
            {busy ? "…" : mode === "register" ? "Create my player" : "Log in"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "register" ? "login" : "register");
            setError(null);
          }}
          className="mt-4 w-full text-center text-sm text-turf-400 hover:underline"
        >
          {mode === "register"
            ? "Already joined? Log in with your PIN"
            : "New here? Create a player"}
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-chalk/40">
        Forgot your PIN? Ask whoever runs the pool to reset it from the Admin screen.
      </p>
    </div>
  );
}
