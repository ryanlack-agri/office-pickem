"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Football, Gear, Logo } from "@/components/icons";

const tabs = [
  { href: "/", label: "Leaderboard", Icon: Trophy },
  { href: "/picks", label: "Make Picks", Icon: Football },
  { href: "/admin", label: "Admin", Icon: Gear },
];

export default function Nav({ poolName }: { poolName: string }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-turf-500/15 bg-field-950/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="font-display text-lg font-bold uppercase tracking-wide text-ink">
            {poolName}
          </span>
        </Link>
        <nav className="flex gap-1" aria-label="Primary">
          {tabs.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-turf-500 text-field-950 shadow-turf"
                    : "text-ink-muted hover:bg-turf-500/10 hover:text-ink"
                }`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
