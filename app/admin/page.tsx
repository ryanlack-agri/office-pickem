"use client";

import { useEffect, useState } from "react";
import { Refresh, Gear, XMark } from "@/components/icons";

type AdminPlayer = { id: number; name: string; paid: boolean; createdAt: string };
type AdminData = {
  players: AdminPlayer[];
  buyIn: number;
  potNote: string;
  paidCount: number;
  pot: number;
};

const money = (n: number) => (n % 1 === 0 ? `$${n.toLocaleString()}` : `$${n.toFixed(2)}`);

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buyIn, setBuyIn] = useState("");
  const [potNote, setPotNote] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("pickem_admin_key") : null;
    if (saved) {
      setKey(saved);
      unlock(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apply(d: AdminData) {
    setData(d);
    setBuyIn(String(d.buyIn));
    setPotNote(d.potNote || "");
  }

  async function unlock(k: string) {
    setError(null);
    const res = await fetch(`/api/admin?key=${encodeURIComponent(k)}`, { cache: "no-store" });
    const d = await res.json();
    if (!res.ok) {
      setError(d.error || "Wrong password.");
      setAuthed(false);
      return;
    }
    setAuthed(true);
    try {
      sessionStorage.setItem("pickem_admin_key", k);
    } catch {}
    apply(d);
  }

  async function action(body: Record<string, unknown>) {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, ...body }),
      });
      const d = await res.json();
      if (!res.ok) {
        setNote(d.error || "Action failed.");
        return;
      }
      apply(d);
      setNote("Saved.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshScores() {
    setBusy(true);
    setNote("Refreshing from the NFL feed…");
    try {
      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const d = await res.json();
      setNote(res.ok ? `Refreshed ${d.games} games (week ${d.weeks?.join(", ")}).` : d.error);
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md animate-fade-up">
        <div className="card p-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-turf-500/15 text-turf-400">
            <Gear size={24} />
          </div>
          <h1 className="text-2xl font-bold text-ink">Admin</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Enter the admin password (the ADMIN_KEY you set on Vercel) to manage the pot and players.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              unlock(key);
            }}
            className="mt-5 flex gap-2"
          >
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Admin password"
              autoComplete="current-password"
              className="field flex-1"
            />
            <button className="btn btn-primary px-5">Unlock</button>
          </form>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="text-2xl font-bold text-ink">Admin</h1>

      {note && (
        <p role="status" className="rounded-lg bg-turf-500/15 px-3 py-2 text-sm text-turf-200">
          {note}
        </p>
      )}

      {/* Pot settings */}
      <section className="card p-5">
        <h2 className="font-display text-lg font-bold text-ink">Pot &amp; buy-in</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Pot is buy-in times the number of players marked paid. Current pot:{" "}
          <span className="tnum font-bold text-gold-400">{data ? money(data.pot) : "$0"}</span> (
          {data?.paidCount || 0} paid).
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Buy-in ($)
            </span>
            <input
              type="number"
              value={buyIn}
              onChange={(e) => setBuyIn(e.target.value)}
              className="field tnum w-28"
            />
          </label>
          <label className="min-w-[200px] flex-1 text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Note (optional)
            </span>
            <input
              value={potNote}
              onChange={(e) => setPotNote(e.target.value)}
              placeholder="e.g. Winner takes all"
              className="field w-full"
            />
          </label>
          <button
            disabled={busy}
            onClick={() => action({ action: "settings", buyIn: Number(buyIn), potNote })}
            className="btn btn-primary px-5 py-2.5"
          >
            Save
          </button>
        </div>
      </section>

      {/* Scores */}
      <section className="card p-5">
        <h2 className="font-display text-lg font-bold text-ink">Scores</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Scores update automatically while people watch, and once a day on their own. Use this only to
          force an immediate pull.
        </p>
        <button disabled={busy} onClick={refreshScores} className="btn btn-ghost mt-3 px-5 py-2.5">
          <Refresh size={16} /> Refresh scores now
        </button>
      </section>

      {/* Players */}
      <section className="card overflow-hidden">
        <h2 className="px-5 pb-2 pt-5 font-display text-lg font-bold text-ink">
          Players ({data?.players.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-turf-500/15 bg-field-850/70 text-[11px] uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 text-center font-semibold">Paid</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.players.map((p) => (
                <tr key={p.id} className="border-b border-turf-500/8 last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={p.paid}
                      aria-label={`Mark ${p.name} paid`}
                      onChange={(e) => action({ action: "paid", playerId: p.id, paid: e.target.checked })}
                      className="h-5 w-5 accent-turf-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        const pin = prompt(`Set a new 4-digit PIN for ${p.name}:`);
                        if (pin) action({ action: "resetPin", playerId: p.id, pin });
                      }}
                      className="mr-3 text-turf-400 hover:underline"
                    >
                      Reset PIN
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${p.name} and all their picks? This cannot be undone.`))
                          action({ action: "delete", playerId: p.id });
                      }}
                      className="inline-flex items-center gap-1 text-red-400 hover:underline"
                    >
                      <XMark size={14} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
              {(!data || data.players.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-ink-faint">
                    No players yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
