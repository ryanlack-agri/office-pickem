import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

const POOL_NAME = process.env.NEXT_PUBLIC_POOL_NAME || "Office Pick 'Em";

export const metadata: Metadata = {
  title: `${POOL_NAME} — NFL Pick 'Em`,
  description: "Weekly NFL pick 'em pool. Pick winners, climb the leaderboard, take the pot.",
};

export const viewport = {
  themeColor: "#060d09",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Fonts loaded at runtime so the build never depends on a network fetch */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500;600;700&display=swap"
        />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-stadium" aria-hidden="true" />
        <Nav poolName={POOL_NAME} />
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:pt-7">{children}</main>
      </body>
    </html>
  );
}
