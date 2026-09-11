# 🏈 Office Pick 'Em

A weekly NFL pick 'em pool for your office. Everyone picks the winner of each game, the leaderboard tallies correct picks all season, and whoever tops it takes the pot.

- **Public leaderboard** anyone can open, no account needed to watch.
- **Players pick with a name + 4-digit PIN.** Picks are hidden from everyone until each game kicks off, enforced by the server.
- **Fully automatic.** The weekly schedule and live scores pull from a free NFL feed on their own. Scores update while people watch, and once a day on their own. No spreadsheets.
- **Season standings, weekly standings, Monday-night tiebreaker, and pot tracking.**

Runs entirely on Vercel's free (Hobby) plan with a free Postgres database. No paid plan required.

---

## Deploy it (about 10 minutes)

You already have GitHub and Vercel accounts, so here are the steps beyond that.

### 1. Put the code on GitHub

From this folder, in a terminal:

```bash
git init
git add .
git commit -m "Office pick em"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/office-pickem.git
git push -u origin main
```

(Create the empty `office-pickem` repo first at https://github.com/new, without a README, then run the commands above.)

### 2. Import to Vercel

1. Go to https://vercel.com/new
2. Pick your `office-pickem` repo and click **Import**, then **Deploy**.
3. The first deploy will finish but the app won't work yet because there's no database. That's expected. Keep going.

### 3. Add the free database

1. In your new Vercel project, open the **Storage** tab.
2. Click **Create Database** → choose **Neon** (Postgres) → **Continue**, accept the free plan, and **Connect** it to this project.
3. This automatically adds a `DATABASE_URL` environment variable. You don't have to copy anything.

### 4. Add three settings

In the project's **Settings → Environment Variables**, add these (Production, Preview, and Development all checked):

| Name | Value |
|------|-------|
| `SESSION_SECRET` | A long random string. Generate one by running `openssl rand -base64 32` in a terminal, or just mash 40+ random characters. |
| `ADMIN_KEY` | A password only you know. This unlocks the `/admin` screen. |
| `SEASON_YEAR` | `2026` |
| `NEXT_PUBLIC_POOL_NAME` | *(optional)* Your pool's name, e.g. `AgriTec Pick 'Em`. Shown in the header. |

### 5. Redeploy

Go to the **Deployments** tab → the latest deployment → the **⋯** menu → **Redeploy**. This picks up the database and settings.

### 6. You're live

Open your app's URL (something like `office-pickem.vercel.app`). The database tables create themselves on first visit.

1. Go to **/admin**, enter your `ADMIN_KEY`, and set the **buy-in** (e.g. $20). The pot is buy-in times the number of players you mark as paid.
2. Share the main URL with the office. Everyone clicks **Make Picks**, creates a name + PIN, and picks their games.
3. Mark people **paid** in the admin screen as they pay you.

That's it. The schedule and scores run themselves the rest of the season.

---

## How it works during the season

- **Games appear on their own.** The app reads that week's NFL matchups from the feed. There's nothing to enter each week.
- **Picks lock at each game's kickoff.** Before kickoff, no one can see anyone else's pick for that game. After kickoff, the pick is locked and everyone's choices for that game become visible on the picks screen.
- **Scores and standings update live.** While the leaderboard is open on Sunday it refreshes every 30 seconds. There's also a daily automatic refresh, plus a **Refresh scores now** button in admin if you ever want to force it.
- **Tiebreaker.** Each week players guess the combined total points of that week's last game (usually Monday night). Closest without going over breaks weekly ties.

## Admin screen (`/admin`)

- Set the buy-in and an optional pot note (e.g. "Winner takes 70%, runner-up 30%").
- Mark who has paid (drives the pot total).
- Reset a player's PIN if they forget it.
- Remove a player.
- Force a score refresh.

## Costs

Free. Vercel's Hobby plan and Neon's free Postgres tier are plenty for an office pool. The NFL data feed is free and needs no key.

---

## Local development (optional)

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, SESSION_SECRET, ADMIN_KEY
npm run dev
```

For a local `DATABASE_URL`, the easiest path is a free Neon database (https://neon.tech) since this app uses the Neon serverless driver.

## Tech

Next.js (App Router) · TypeScript · Tailwind · Postgres (Neon serverless driver) · deployed on Vercel. Data from ESPN's public NFL scoreboard API.
