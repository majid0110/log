// Runs supabase/schema.sql against a real in-memory Postgres (PGlite) and checks the pay rules.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const SCHEMA = readFileSync(new URL('../../supabase/schema.sql', import.meta.url), 'utf8')
const A = '11111111-1111-1111-1111-111111111111'
const B = '22222222-2222-2222-2222-222222222222'

const STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  insert into auth.users values ('${A}'), ('${B}');
`

async function freshDb(): Promise<PGlite> {
  const db = new PGlite()
  await db.exec(STUB)
  await db.exec(SCHEMA)
  return db
}

type Row = Record<string, unknown>

async function shift(db: PGlite, from: string, to: string): Promise<Row> {
  const r = await db.query(
    `select worked_minutes, lunch_minutes, paid_minutes, night_minutes from public.calc_shift($1::timestamp, $2::timestamp)`,
    [from, to],
  )
  return r.rows[0] as Row
}

test('schema can be run twice (safe to re-run)', async () => {
  const db = await freshDb()
  await db.exec(SCHEMA)
  await db.close()
})

test('upgrading from version 1 keeps existing records', async () => {
  const db = new PGlite()
  await db.exec(STUB)
  await db.exec(`
    create table public.attendance (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
      work_date date not null,
      recorded_at timestamptz not null default now(),
      note text check (note is null or char_length(note) <= 300),
      source text not null default 'tap' check (source in ('tap', 'manual')),
      unique (user_id, work_date)
    );
    insert into public.attendance (user_id, work_date, note) values ('${A}', '2026-10-13', 'old entry');
  `)
  await db.exec(SCHEMA)
  const r = await db.query(`select work_date::text as work_date, note, entry_at, paid_minutes from public.attendance`)
  assert.deepEqual(r.rows, [{ work_date: '2026-10-13', note: 'old entry', entry_at: null, paid_minutes: null }])
  await db.close()
})

test('lunch rules by shift length', async () => {
  const db = await freshDb()
  // 8h or less -> 30 min
  assert.deepEqual(await shift(db, '2026-10-14 09:00', '2026-10-14 17:00'),
    { worked_minutes: 480, lunch_minutes: 30, paid_minutes: 450, night_minutes: 0 })
  // over 8h, under 12h -> 45 min
  assert.deepEqual(await shift(db, '2026-10-14 08:00', '2026-10-14 17:30'),
    { worked_minutes: 570, lunch_minutes: 45, paid_minutes: 525, night_minutes: 0 })
  // 12h -> 60 min
  assert.deepEqual(await shift(db, '2026-10-14 08:00', '2026-10-14 20:00'),
    { worked_minutes: 720, lunch_minutes: 60, paid_minutes: 660, night_minutes: 0 })
  await db.close()
})

test('night hours 22:00-07:00, including shifts across midnight', async () => {
  const db = await freshDb()
  // full night shift: lunch has no daytime to come from, so it reduces night time
  assert.deepEqual(await shift(db, '2026-10-14 22:00', '2026-10-15 07:00'),
    { worked_minutes: 540, lunch_minutes: 45, paid_minutes: 495, night_minutes: 495 })
  // evening into night: 18:00-06:00 = 12h, 8h of it at night, lunch comes out of daytime
  assert.deepEqual(await shift(db, '2026-10-14 18:00', '2026-10-15 06:00'),
    { worked_minutes: 720, lunch_minutes: 60, paid_minutes: 660, night_minutes: 480 })
  // short evening shift
  assert.deepEqual(await shift(db, '2026-10-14 20:00', '2026-10-14 23:00'),
    { worked_minutes: 180, lunch_minutes: 30, paid_minutes: 150, night_minutes: 60 })
  // early morning start: 05:00-07:00 is night
  assert.deepEqual(await shift(db, '2026-10-14 05:00', '2026-10-14 13:00'),
    { worked_minutes: 480, lunch_minutes: 30, paid_minutes: 450, night_minutes: 120 })
  await db.close()
})

test('trigger fills calculated columns and work_date; open shifts stay empty', async () => {
  const db = await freshDb()
  await db.query(
    `insert into public.attendance (user_id, work_date, entry_at, exit_at) values ($1, '2000-01-01', '2026-10-14 22:00', '2026-10-15 07:00')`,
    [A],
  )
  await db.query(`insert into public.attendance (user_id, work_date, entry_at) values ($1, '2000-01-01', '2026-10-16 08:00')`, [A])
  const r = await db.query(
    `select work_date::text as work_date, paid_minutes, night_minutes from public.attendance where user_id = $1 order by entry_at`,
    [A],
  )
  assert.deepEqual(r.rows, [
    { work_date: '2026-10-14', paid_minutes: 495, night_minutes: 495 },
    { work_date: '2026-10-16', paid_minutes: null, night_minutes: null },
  ])
  await db.close()
})

test('database refuses an exit before entry or a shift over 24 hours', async () => {
  const db = await freshDb()
  await assert.rejects(db.query(
    `insert into public.attendance (user_id, work_date, entry_at, exit_at) values ($1, '2026-10-14', '2026-10-14 17:00', '2026-10-14 09:00')`, [A]))
  await assert.rejects(db.query(
    `insert into public.attendance (user_id, work_date, entry_at, exit_at) values ($1, '2026-10-14', '2026-10-14 08:00', '2026-10-15 09:00')`, [A]))
  await db.close()
})

test('salary_summary: base pay, +30% night extra, bonus, rate carry-over', async () => {
  const db = await freshDb()
  await db.exec(`select set_config('app.uid', '${A}', false)`) // act as user A
  await db.query(`insert into public.rates (user_id, month, hourly_rate, currency) values ($1, '2026-09-01', 10, 'X')`, [A])
  await db.query(`insert into public.attendance (user_id, work_date, entry_at, exit_at) values
    ($1, '2026-10-01', '2026-10-01 09:00', '2026-10-01 17:00'),
    ($1, '2026-10-02', '2026-10-02 08:00', '2026-10-02 17:30'),
    ($1, '2026-10-03', '2026-10-03 22:00', '2026-10-04 07:00'),
    ($1, '2026-10-05', '2026-10-05 09:00', null),
    ($1, '2026-10-16', '2026-10-16 09:00', '2026-10-16 17:00')`, [A])

  // October has no rate of its own: September's 10/hour carries over.
  // paid minutes 450 + 525 + 495 = 1470 (24.5h) -> 245.00; night 495 min (8.25h) * 0.3 * 10 = 24.75
  const first = (await db.query(`select * from public.salary_summary('2026-10-01', '2026-10-15')`)).rows[0] as Row
  assert.equal(Number(first.rate), 10)
  assert.equal(first.currency, 'X')
  assert.equal(first.work_days, 3)
  assert.equal(first.open_days, 1)
  assert.equal(first.paid_minutes, 1470)
  assert.equal(first.night_minutes, 495)
  assert.equal(Number(first.base_pay), 245)
  assert.equal(Number(first.night_pay), 24.75)
  assert.equal(Number(first.total_pay), 269.75)
  assert.equal(Number(first.bonus), 0)

  // A new rate for October applies to October only, and a bonus is added on the second half.
  await db.query(`insert into public.rates (user_id, month, hourly_rate) values ($1, '2026-10-01', 20)`, [A])
  await db.query(`insert into public.bonuses (user_id, period_start, amount) values ($1, '2026-10-16', 50)`, [A])
  const second = (await db.query(`select * from public.salary_summary('2026-10-16', '2026-10-31')`)).rows[0] as Row
  assert.equal(Number(second.rate), 20)
  assert.equal(second.paid_minutes, 450)
  assert.equal(Number(second.total_pay), 150)
  assert.equal(Number(second.bonus), 50)
  assert.equal(Number(second.grand_total), 200)
  await db.close()
})

test('no rate set: pay is zero and rate is null', async () => {
  const db = await freshDb()
  await db.exec(`select set_config('app.uid', '${A}', false)`) // act as user A
  await db.query(`insert into public.attendance (user_id, work_date, entry_at, exit_at) values ($1, '2026-10-01', '2026-10-01 09:00', '2026-10-01 17:00')`, [A])
  const r = (await db.query(`select * from public.salary_summary('2026-10-01', '2026-10-15')`)).rows[0] as Row
  assert.equal(r.rate, null)
  assert.equal(Number(r.total_pay), 0)
  assert.equal(r.paid_minutes, 450)
  await db.close()
})

test('privacy: each user sees and changes only their own rows; signed-out sees nothing', async () => {
  const db = await freshDb()
  await db.query(`insert into public.attendance (user_id, work_date, entry_at, exit_at) values ($1, '2026-10-01', '2026-10-01 09:00', '2026-10-01 17:00')`, [A])
  await db.query(`insert into public.rates (user_id, month, hourly_rate) values ($1, '2026-10-01', 99)`, [A])

  await db.exec(`set role authenticated; select set_config('app.uid', '${B}', false)`)
  assert.equal((await db.query(`select count(*)::int as n from public.attendance`)).rows[0]?.['n' as never], 0)
  assert.equal((await db.query(`select count(*)::int as n from public.rates`)).rows[0]?.['n' as never], 0)
  const summaryB = (await db.query(`select * from public.salary_summary('2026-10-01', '2026-10-15')`)).rows[0] as Row
  assert.equal(summaryB.paid_minutes, 0)
  await db.query(`delete from public.attendance`)
  await assert.rejects(db.query(
    `insert into public.attendance (user_id, work_date, entry_at) values ($1, '2026-10-02', '2026-10-02 09:00')`, [A]))

  await db.exec(`select set_config('app.uid', '${A}', false)`)
  assert.equal((await db.query(`select count(*)::int as n from public.attendance`)).rows[0]?.['n' as never], 1)

  await db.exec(`reset role; set role anon`)
  await assert.rejects(db.query(`select * from public.attendance`))
  await db.exec(`reset role`)
  await db.close()
})
