# Dayline: my personal attendance record

A small private website for recording the days I actually worked, so I always have my own reliable history when the face scanner gets it wrong. Works in any phone browser (Android and iPhone), and data syncs between devices.

**Features:** one-tap "I Worked Today", monthly calendar, history grouped by month (add / edit / delete, optional notes), CSV export for Excel, dark and light themes. Nothing is ever deleted automatically.

**Stack:** React + TypeScript (Vite), Supabase (Postgres + Auth), GitHub Pages, GitHub Actions.

## One-time setup

### 1. Create the database (Supabase, free)
1. Sign up at <https://supabase.com> and create a new project.
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates the table and the Row Level Security rules that make every record visible only to the account that owns it.
3. Open **Authentication → Sign In / Providers → Email** and turn **off** "Confirm email" (so you can sign in right after creating your account).
4. After you have created your own account in the website, go to **Authentication → Sign In / Providers** and turn **off** "Allow new users to sign up". This locks the site to your account alone.
5. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key. Never use the `service_role` key anywhere in this project.

### 2. Give the keys to GitHub (secrets, never in the code)
In this repository: **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | the Project URL |
| `VITE_SUPABASE_ANON_KEY` | the anon public key |

### 3. Turn on GitHub Pages
**Settings → Pages → Build and deployment → Source: GitHub Actions.**

Then push to `main` (or run the workflow from the **Actions** tab). The live address is `https://<your-username>.github.io/<repository-name>/`.

## Using it
- Open the live link on each phone, tap **Create your account** once (same email and password on both phones), then sign in on the other phone with the same details.
- **Add to Home Screen** for an app-like icon: iPhone Safari → Share → Add to Home Screen; Android Chrome → menu → Add to Home screen.
- **Today** tab: tap **I Worked Today**. The date and time are saved automatically.
- **Calendar** tab: worked days are highlighted. Tap any past day to add, edit or remove it.
- **History** tab: every recorded day, grouped by month. Tap an entry to edit its date or note, or delete it. Use **Add missed day** for days you forgot.
- **Export:** History tab → **This month** or **Everything**. The CSV (Date, Day, Time recorded, Notes) opens directly in Excel.

## Changing the site later
Edit the code and push to `main`. GitHub Actions runs the tests, builds the site and republishes it automatically (about a minute).

Local development:

```bash
cp .env.example .env.local   # fill in the two Supabase values
npm install
npm run dev
npm test
```

## Privacy and security
- Row Level Security is enabled; signed-out visitors have no access, and each signed-in user can only touch their own rows.
- The anon key in the built site is public by design. The `service_role` key must never be added.
- Export neutralises spreadsheet formulas typed into notes.
