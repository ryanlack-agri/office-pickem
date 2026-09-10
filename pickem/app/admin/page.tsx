"use client";

import { useEffect, useState } from "react";

type AdminPlayer = { id: number; name: string; paid: boolean; createdAt: string };
type AdminData = {
  players: AdminPlayer[];
  buyIn: number;
  potNote: string;
  paidCount: number;
  pot: number;
};

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
    sessionStorage.setItem("pickem_admin_key", k);
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
      <div className="mx-auto max-w-md">
        <div className="card p-6">
          <h1 className="text-xl font-extrabold text-chalk">Admin</h1>
          <p className="mt-1 text-sm text-chalk/60">
            Enter the admin password (the ADMIN_KEY you set on Vercel) to manage the pot and players.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              unlock(key);
            }}
            className="mt-4 flex gap-2"
          >
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Admin password"
              className="flex-1 rounded-xl border border-turf-500/25 bg-field-900/80 px-4 py-3 outline-none focus:border-turf-400"
            />
            <button className="btn btn-primary px-5">Unlock</button>
          </form>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold text-chalk">Admin</h1>

      {note && <p className="rounded-lg bg-turf-500/15 px-3 py-2 text-sm text-turf-200">{note}</p>}

      {/* Pot settings */}
      <section className="card p-5">
        <h2 className="font-bold text-chalk">Pot & buy-in</h2>
        <p className="text-sm text-chalk/60">
          Pot is buy-in times the number of players marked paid. Current pot:{" "}
          <span className="font-bold text-turf-400">
            ${data ? (data.pot % 1 === 0 ? data.pot : data.pot.toFixed(2)) : 0}
          </span>{" "}
          ({data?.paidCount || 0} paid).
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-chalk/50">Buy-in ($)</span>
            <input
              type="number"
              value={buyIn}
              onChange={(e) => setBuyIn(e.target.value)}
              className="w-28 rounded-xl border border-turf-500/25 bg-field-900/80 px-4 py-2 outline-none focus:border-turf-400"
            />
          </label>
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-chalk/50">Note (optional)</span>
            <input
              value={potNote}
              onChange={(e) => setPotNote(e.target.value)}
              placeholder="e.g. Winner takes 70%, runner-up 30%"
              className="w-full rounded-xl border border-turf-500/25 bg-field-900/80 px-4 py-2 outline-none focus:border-turf-400"
            />
          </label>
          <button
            disabled={busy}
            onClick={() => action({ action: "settings", buyIn: Number(buyIn), potNote })}
            className="btn btn-primary px-5 py-2"
          >
            Save
          </button>
        </div>
      </section>

      {/* Scores */}
      <section className="card p-5">
        <h2 className="font-bold text-chalk">Scores</h2>
        <p className="text-sm text-chalk/60">
          Scores update automatically while people watch and once a day on their own. Use this only if
          you want to force an immediate pull.
        </p>
        <button disabled={busy} onClick={refreshScores} className="btn btn-primary mt-3 px-5 py-2">
          Refresh scores now
        </button>
      </section>

      {/* Players */}
      <section className="card overflow-hidden">
        <h2 className="p-5 pb-2 font-bold text-chalk">Players ({data?.players.length || 0})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-field-800/60 text-xs uppercase tracking-wider text-chalk/50">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2 text-center">Paid</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.players.map((p) => (
                <tr key={p.id} className="border-t border-turf-500/10">
                  <td className="px-4 py-3 font-semibold text-chalk">{p.name}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={p.paid}
                      onChange={(e) => action({ action: "paid", playerId: p.id, paid: e.target.checked })}
                      className="h-4 w-4 accent-turf-500"
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
                      className="text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {(!data || data.players.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-chalk/50">
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
