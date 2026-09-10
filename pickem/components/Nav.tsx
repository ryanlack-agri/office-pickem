"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Leaderboard" },
  { href: "/picks", label: "Make Picks" },
  { href: "/admin", label: "Admin" },
];

export default function Nav({ poolName }: { poolName: string }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-turf-500/15 bg-field-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-turf-500 text-lg font-black text-field-950">
            🏈
          </span>
          <span className="text-lg font-extrabold tracking-tight text-chalk">{poolName}</span>
        </Link>
        <nav className="flex gap-1">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-turf-500 text-field-950"
                    : "text-chalk/70 hover:bg-turf-500/10 hover:text-chalk"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
