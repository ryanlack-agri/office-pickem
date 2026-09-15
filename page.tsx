"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientGame, Player } from "@/lib/types";
import { classNames, timeUntil, formatKickoff } from "@/lib/util";
import AuthCard from "@/components/AuthCard";
import PickCard from "@/components/PickCard";
import WeekPicker from "@/components/WeekPicker";
import { User, Check, Lock, Clock } from "@/components/icons";

type RevealPick = { playerId: number; name: string; gameId: string; pick: string };

export default function PicksPage() {
  const [player, setPlayer] = useState<Player | null | undefined>(undefined);
  const [week, setWeek] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number | undefined>();
  const [games, setGames] = useState<ClientGame[]>([]);
  const [myPicks, setMyPicks] = useState<Record<string, string>>({});
  const [savedPicks, setSavedPicks] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState<RevealPick[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // A one-second tick keeps the countdown live and flips the page to "locked"
  // the moment the first game kicks off, without needing a refresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPlayer(d.player))
      .catch(() => setPlayer(null));
  }, []);

  const load = useCallback(async (w: number | null) => {
    setLoading(true);
    setMsg(null);
    const qs = w ? `?week=${w}` : "";
    const [gRes, pRes] = await Promise.all([
      fetch(`/api/games${qs}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/picks${qs}`, { cache: "no-store" }).then((r) => r.json()),
    ]);
    if (!gRes.error) {
      setGames(gRes.games || []);
      setCurrentWeek(gRes.currentWeek);
      if (w === null) setWeek(gRes.week);
    }
    if (!pRes.error) {
      setMyPicks(pRes.myPicks || {});
      setSavedPicks(pRes.myPicks || {});
      setReveal(pRes.revealed || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (player) load(week);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, week]);

  // The whole week locks when the first game kicks off.
  const weekLockAt = useMemo(() => {
    if (games.length === 0) return 0;
    return Math.min(...games.map((g) => new Date(g.kickoff).getTime()));
  }, [games]);
  const firstKickoffIso = weekLockAt ? new Date(weekLockAt).toISOString() : null;
  const weekLocked = weekLockAt > 0 && now >= weekLockAt;

  const pickedCount = games.filter((g) => myPicks[g.id]).length;
  const allPicked = games.length > 0 && pickedCount === games.length;

  const hasSaved = Object.keys(savedPicks).length > 0;
  const dirty = useMemo(() => {
    if (weekLocked) return false;
    const keys = new Set([...Object.keys(myPicks), ...Object.keys(savedPicks)]);
    for (const k of keys) if (myPicks[k] !== savedPicks[k]) return true;
    return false;
  }, [myPicks, savedPicks, weekLocked]);

  const decidedMine = games.filter((g) => g.completed && myPicks[g.id]);
  const correctCount = decidedMine.filter((g) => myPicks[g.id] === g.winnerAbbr).length;
  const wrongCount = decidedMine.length - correctCount;
  const pendingMine = games.filter((g) => !g.completed && myPicks[g.id]).length;

  const revealByGame = useMemo(() => {
    const m = new Map<string, { name: string; pick: string }[]>();
    for (const r of reveal) {
      if (!m.has(r.gameId)) m.set(r.gameId, []);
      m.get(r.gameId)!.push({ name: r.name, pick: r.pick });
    }
    return m;
  }, [reveal]);

  function pick(gameId: string, abbr: string) {
    if (weekLocked) return;
    setMyPicks((prev) => ({ ...prev, [gameId]: abbr }));
    setMsg(null);
  }

  async function save() {
    if (!player || weekLocked) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ season: games[0]?.season, week, picks: myPicks }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Could not save.");
        if (res.status === 403) load(week);
      } else {
        setSavedPicks({ ...myPicks });
        setMsg(
          allPicked
            ? "You're locked in. All games picked."
            : `Saved. ${games.length - pickedCount} game${games.length - pickedCount === 1 ? "" : "s"} still open.`
        );
      }
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    setPlayer(null);
    setMyPicks({});
    setSavedPicks({});
  }

  if (player === undefined) {
    return (
      <div className="space-y-3">
        <div className="h-12 w-48 skeleton" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }
  if (player === null) {
    return <AuthCard onSuccess={(p) => setPlayer(p)} />;
  }

  const showSaveBar = games.length > 0 && !weekLocked;

  return (
    <div className={classNames("space-y-4", showSaveBar ? "pb-24" : "pb-4")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Your picks</h1>
          <p className="flex items-center gap-1.5 text-sm text-ink-muted">
            <User size={15} />
            <span className="font-semibold text-ink">{player.name}</span>
            <span className="text-ink-faint">·</span>
            <button onClick={signOut} className="text-turf-400 hover:underline">
              sign out
            </button>
          </p>
        </div>
        <WeekPicker week={week} currentWeek={currentWeek} onChange={setWeek} />
      </div>

      {/* Lock status banner */}
      {games.length > 0 &&
        (weekLocked ? (
          <div className="card flex items-start gap-2.5 border-gold-400/25 bg-gold-400/5 p-3">
            <span className="mt-0.5 text-gold-400">
              <Lock size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Picks are locked for this week</p>
              <p className="text-xs text-ink-muted">
                The first game has kicked off, so no more edits. Everyone&apos;s picks are shown on
                each matchup below.
              </p>
            </div>
          </div>
        ) : (
          <div className="card flex items-start gap-2.5 p-3">
            <span className="mt-0.5 text-turf-400">
              <Clock size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                Picks lock in{" "}
                <span className="tnum text-turf-300">
                  {firstKickoffIso ? timeUntil(firstKickoffIso) : "—"}
                </span>
              </p>
              <p className="text-xs text-ink-muted">
                Edit as much as you want until the first game kicks off
                {firstKickoffIso ? ` (${formatKickoff(firstKickoffIso)})` : ""}. After that the whole
                week is final and everyone&apos;s picks show.
              </p>
            </div>
          </div>
        ))}

      {/* Progress */}
      {games.length > 0 && (
        <div className="card p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">
              <span className="tnum font-semibold text-ink">
                {pickedCount}/{games.length}
              </span>{" "}
              games picked
            </span>
            {allPicked ? (
              <span className="flex items-center gap-1 text-xs font-bold uppercase text-turf-400">
                <Check size={14} /> All set
              </span>
            ) : (
              <span className="text-xs text-ink-faint">
                {games.length - pickedCount} left
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-field-700/60">
            <div
              className="h-full rounded-full bg-turf-500 transition-all duration-300"
              style={{ width: `${(pickedCount / games.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {decidedMine.length > 0 && (
        <div className="card grid grid-cols-3 overflow-hidden">
          <RecordStat label="Correct" value={correctCount} tone="turf" />
          <RecordStat label="Wrong" value={wrongCount} tone="red" />
          <RecordStat label="Pending" value={pendingMine} tone="muted" />
        </div>
      )}

      {msg && (
        <p role="status" className="animate-fade-up rounded-lg bg-turf-500/15 px-3 py-2 text-sm text-turf-200">
          {msg}
        </p>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">
          This week&apos;s games aren&apos;t posted yet. Check back once the schedule is up.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {games.map((g) => (
            <PickCard
              key={g.id}
              game={g}
              myPick={myPicks[g.id]}
              onPick={(abbr) => pick(g.id, abbr)}
              reveal={revealByGame.get(g.id) || []}
              showReveal
              weekLocked={weekLocked}
            />
          ))}
        </div>
      )}

      {/* Season-long chat board */}
      <ChatBoard meName={player.name} />

      {/* Sticky save bar */}
      {showSaveBar && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-turf-500/15 bg-field-950/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-sm">
              {hasSaved && !dirty ? (
                <span className="flex items-center gap-1.5 font-semibold text-turf-300">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-turf-500 text-field-950">
                    <Check size={13} />
                  </span>
                  Locked in
                </span>
              ) : (
                <span className="text-ink-muted">
                  <span className="tnum font-semibold text-ink">{pickedCount}</span> of{" "}
                  <span className="tnum">{games.length}</span> picked
                </span>
              )}
            </span>
            <button
              onClick={save}
              disabled={saving || !dirty}
              className={classNames(
                "btn px-6 py-2.5",
                dirty ? "btn-primary" : "cursor-default opacity-60"
              )}
            >
              {saving
                ? "Saving…"
                : dirty
                ? hasSaved
                  ? "Update picks"
                  : "Set picks"
                : "Saved ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "turf" | "red" | "muted";
}) {
  const color =
    tone === "turf" ? "text-turf-400" : tone === "red" ? "text-red-400" : "text-ink-muted";
  return (
    <div className="flex flex-col items-center gap-0.5 border-r border-turf-500/10 py-4 last:border-r-0">
      <span className={classNames("tnum font-display text-3xl font-bold", color)}>{value}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
    </div>
  );
}

/* ---------------- Chat board ---------------- */

type ChatMsg = { id: number; playerId: number | null; name: string; body: string; at: string };

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ChatBoard({ meName }: { meName: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const loadChat = useCallback(async () => {
    try {
      const d = await fetch("/api/chat", { cache: "no-store" }).then((r) => r.json());
      if (Array.isArray(d.messages)) setMessages(d.messages);
    } catch {
      /* keep whatever we have */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadChat();
    const t = setInterval(loadChat, 12000);
    return () => clearInterval(t);
  }, [loadChat]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErr(d.error || "Could not send.");
      } else {
        setText("");
        if (d.message) setMessages((prev) => [...prev, d.message]);
      }
    } catch {
      setErr("Network error.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-turf-500/15 bg-field-850/60 px-4 py-2.5">
        <ChatIcon size={16} />
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
          Trash talk
        </h2>
        <span className="ml-auto text-[11px] text-ink-faint">the whole room can see this</span>
      </div>

      <div ref={listRef} className="max-h-80 space-y-3 overflow-y-auto px-4 py-3">
        {!loaded ? (
          <p className="py-6 text-center text-sm text-ink-faint">Loading the board…</p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-faint">
            Nobody&apos;s said anything yet. Someone has to start the smack talk.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.name === meName;
            return (
              <div key={m.id} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span
                    className={classNames(
                      "font-semibold",
                      mine ? "text-turf-300" : "text-ink"
                    )}
                  >
                    {m.name}
                  </span>
                  <span className="text-[11px] text-ink-faint">{relTime(m.at)}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-ink-muted">{m.body}</p>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-turf-500/15 p-2.5">
        {err && <p className="mb-1.5 px-1 text-xs text-red-400">{err}</p>}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            maxLength={500}
            placeholder="Talk some smack…"
            className="field flex-1 py-2 text-sm"
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="btn btn-primary flex items-center gap-1.5 px-3.5 py-2 disabled:opacity-50"
            aria-label="Send message"
          >
            <SendIcon size={15} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="text-turf-400">
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

function SendIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}
