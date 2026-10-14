# Dayline: my personal attendance and salary record

A small private website for recording the days I actually work, with entry and exit times, so I always have my own reliable history when the face scanner gets it wrong. It also calculates my salary twice a month. Works in any phone browser (Android and iPhone), and data syncs between devices.

Designed & built by **Хан**.

**Features:** one-tap entry and exit, monthly calendar, history grouped by month (add / edit / delete, optional notes), hourly rate per month, salary for 1–15 and 16–end (plus a bonus you type in), CSV export for Excel, dark and light themes. Nothing is ever deleted automatically.

**Stack:** React + TypeScript (Vite), Supabase (Postgres + Auth), GitHub Pages, GitHub Actions.

## How pay is calculated (in the database, so both phones always agree)
- Hours are from the entry time to the exit time. A shift can run past midnight (an exit earlier than the entry means the next day).
- Unpaid lunch is deducted automatically: shift of 8 hours or less → 30 min; over 8 and under 12 hours → 45 min; 12 hours or more → 60 min.
- Hours between 22:00 and 07:00 earn an extra 30% of the hourly rate. Lunch is taken from daytime hours first, and only from night hours when the shift has too little daytime.
- Pay = paid hours × hourly rate, plus the night extra. Periods: 1–15 and 16–end of the month. The second period adds the bonus typed in on the Salary tab.
- The hourly rate is set once and carries over to later months until changed. Change it on the Salary tab at the start of a new month; earlier months keep the rate they had.
- A day with an entry but no exit time is not counted until the exit time is added.

## One-time setup

### 1. Create the database (Supabase, free)
1. Sign up at <https://supabase.com> and create a new project.
2. Open **SQL Editor**, paste the **whole** contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It creates the tables, the pay calculation and the privacy rules. It is safe to run again, and it keeps existing records, so **run it again after every update that changes this file**.
3. Open **Authentication → Sign In / Providers → Email** and turn **off** "Confirm email".
4. After you have created your own account in the website, turn **off** "Allow new users to sign up" (Authentication → Sign In / Providers). This locks the site to your account alone.
5. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key. Never use the `service_role` key anywhere in this project.

### 2. Give the keys to GitHub (secrets, never in the code)
**Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | the Project URL |
| `VITE_SUPABASE_ANON_KEY` | the anon public key |

### 3. Turn on GitHub Pages
**Settings → Pages → Build and deployment → Source: GitHub Actions.** Then push to `main` (or run the workflow from the **Actions** tab). The live address is `https://<your-username>.github.io/<repository-name>/`.

## Using it
- Open the live link on each phone, create your account once, then sign in on the other phone with the same details. Add it to the Home Screen for an app-like icon.
- **Today:** tap **I Worked Today** to record your entry time. When you finish, tap **Record Exit**. The page also shows your salary so far for the current period.
- **Calendar:** worked days are highlighted. Tap a day to add, edit or remove it.
- **History:** every day with entry and exit times, grouped by month. Tap one to edit times or notes, or to delete it. **Add missed day** adds a day you forgot.
- **Salary:** set the hourly rate for the month, see both half-month periods, and type in the bonus for the second one.
- **Export:** History → **This month** or **Everything**. The CSV has date, day, entry, exit, hours worked, lunch, paid hours, night hours and notes, and opens in Excel.

## Changing the site later
Edit the code and push to `main`. GitHub Actions runs the tests (including a database test against a real Postgres), builds the site and republishes it automatically.

```bash
cp .env.example .env.local   # fill in the two Supabase values
npm install
npm run dev
npm test
```

## Privacy and security
- Row Level Security is enabled on every table; signed-out visitors have no access, and each signed-in user can only touch their own rows (this is tested).
- The anon key in the built site is public by design. The `service_role` key must never be added.
- Export neutralises spreadsheet formulas typed into notes.
