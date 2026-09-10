import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

const POOL_NAME = process.env.NEXT_PUBLIC_POOL_NAME || "Office Pick 'Em";

export const metadata: Metadata = {
  title: `${POOL_NAME} — NFL Pick 'Em`,
  description: "Weekly NFL pick 'em pool. Pick winners, climb the leaderboard, take the pot.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Nav poolName={POOL_NAME} />
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4">{children}</main>
      </body>
    </html>
  );
}
