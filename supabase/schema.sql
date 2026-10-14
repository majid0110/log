-- Dayline database schema, version 2 (entry/exit times, hourly rate, salary).
-- Paste the WHOLE file into Supabase -> SQL Editor -> Run.
-- Safe to run again at any time, and safe on top of the version 1 table: existing records are kept.

-- ============================================================================
-- 1. Tables
-- ============================================================================

create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  work_date   date not null,
  recorded_at timestamptz not null default now(),
  note        text check (note is null or char_length(note) <= 300),
  source      text not null default 'tap' check (source in ('tap', 'manual')),
  unique (user_id, work_date)
);

-- Version 2 columns. entry_at / exit_at are plain local clock times (no time zone),
-- exactly as shown on your phone, so night shifts across midnight are unambiguous.
alter table public.attendance add column if not exists entry_at       timestamp;
alter table public.attendance add column if not exists exit_at        timestamp;
alter table public.attendance add column if not exists worked_minutes integer;  -- exit - entry
alter table public.attendance add column if not exists lunch_minutes  integer;  -- unpaid lunch
alter table public.attendance add column if not exists paid_minutes   integer;  -- worked - lunch
alter table public.attendance add column if not exists night_minutes  integer;  -- paid minutes between 22:00 and 07:00

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_exit_after_entry') then
    alter table public.attendance add constraint attendance_exit_after_entry
      check (exit_at is null
             or (entry_at is not null and exit_at > entry_at and exit_at <= entry_at + interval '24 hours'));
  end if;
end $$;

create index if not exists attendance_user_date_idx on public.attendance (user_id, work_date desc);

-- Hourly rate. One row per month; a month without its own row uses the most recent earlier rate.
create table if not exists public.rates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month       date not null check (month = date_trunc('month', month)::date),
  hourly_rate numeric(12, 2) not null check (hourly_rate >= 0),
  currency    text not null default '' check (char_length(currency) <= 8),
  unique (user_id, month)
);

-- Bonus for a half-month period (period_start is the 1st or the 16th).
create table if not exists public.bonuses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  period_start date not null check (extract(day from period_start) in (1, 16)),
  amount       numeric(12, 2) not null default 0 check (amount >= 0),
  unique (user_id, period_start)
);

-- ============================================================================
-- 2. Shift calculation (runs in the database, so every device gets the same numbers)
-- ============================================================================
--   Lunch (unpaid):  shift up to 8h -> 30 min;  over 8h and under 12h -> 45 min;  12h or more -> 60 min.
--   Night hours:     time between 22:00 and 07:00. Lunch is taken out of daytime first, and only
--                    comes out of night time if there is not enough daytime in the shift.
--   Night extra:     +30% of the hourly rate on paid night hours (applied in salary_summary).

create or replace function public.calc_shift(p_in timestamp, p_out timestamp)
returns table (worked_minutes integer, lunch_minutes integer, paid_minutes integer, night_minutes integer)
language plpgsql
immutable
set search_path = public
as $$
declare
  gross       numeric;
  hrs         numeric;
  lunch       integer;
  night       numeric := 0;
  d           date;
  w_start     timestamp;
  w_end       timestamp;
  ov          numeric;
  day_part    numeric;
  lunch_night numeric;
  paid        numeric;
  night_paid  numeric;
begin
  gross := extract(epoch from (p_out - p_in)) / 60.0;
  hrs   := gross / 60.0;
  lunch := case when hrs <= 8 then 30 when hrs < 12 then 45 else 60 end;

  -- Add up the overlap with every night window (22:00 on day d until 07:00 on day d+1).
  d := p_in::date - 1;
  while d <= p_out::date loop
    w_start := d + time '22:00';
    w_end   := (d + 1) + time '07:00';
    ov := extract(epoch from (least(p_out, w_end) - greatest(p_in, w_start))) / 60.0;
    if ov > 0 then
      night := night + ov;
    end if;
    d := d + 1;
  end loop;

  day_part    := gross - night;
  lunch_night := greatest(0, lunch - day_part);
  paid        := greatest(0, gross - lunch);
  night_paid  := least(paid, greatest(0, night - lunch_night));

  return query select round(gross)::integer, lunch, round(paid)::integer, round(night_paid)::integer;
end;
$$;

create or replace function public.attendance_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  c record;
begin
  if new.entry_at is not null then
    new.work_date := new.entry_at::date;   -- a shift belongs to the day it started
  end if;

  if new.entry_at is not null and new.exit_at is not null then
    select * into c from public.calc_shift(new.entry_at, new.exit_at);
    new.worked_minutes := c.worked_minutes;
    new.lunch_minutes  := c.lunch_minutes;
    new.paid_minutes   := c.paid_minutes;
    new.night_minutes  := c.night_minutes;
  else
    new.worked_minutes := null;
    new.lunch_minutes  := null;
    new.paid_minutes   := null;
    new.night_minutes  := null;
  end if;
  return new;
end;
$$;

drop trigger if exists attendance_calc on public.attendance;
create trigger attendance_calc
  before insert or update on public.attendance
  for each row execute function public.attendance_before_write();

-- Recalculate any rows that already exist (needed when upgrading from version 1).
update public.attendance set entry_at = entry_at where entry_at is not null;

-- ============================================================================
-- 3. Salary for one half-month period (1-15 or 16-end)
-- ============================================================================

create or replace function public.salary_summary(p_from date, p_to date)
returns table (
  rate          numeric,
  currency      text,
  work_days     integer,
  open_days     integer,
  paid_minutes  integer,
  night_minutes integer,
  base_pay      numeric,
  night_pay     numeric,
  total_pay     numeric,
  bonus         numeric,
  grand_total   numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with r as (
    select ra.hourly_rate, ra.currency
    from public.rates ra
    where ra.user_id = auth.uid() and ra.month <= date_trunc('month', p_from)::date
    order by ra.month desc
    limit 1
  ),
  s as (
    select count(*) filter (where a.exit_at is not null)::integer as work_days,
           count(*) filter (where a.entry_at is not null and a.exit_at is null)::integer as open_days,
           coalesce(sum(a.paid_minutes), 0)::integer  as paid_minutes,
           coalesce(sum(a.night_minutes), 0)::integer as night_minutes
    from public.attendance a
    where a.user_id = auth.uid() and a.work_date between p_from and p_to
  ),
  b as (
    select coalesce(sum(bo.amount), 0) as bonus
    from public.bonuses bo
    where bo.user_id = auth.uid() and bo.period_start = p_from
  ),
  c as (
    select s.work_days, s.open_days, s.paid_minutes, s.night_minutes,
           round(s.paid_minutes  / 60.0 * coalesce((select hourly_rate from r), 0), 2)        as base_pay,
           round(s.night_minutes / 60.0 * 0.3 * coalesce((select hourly_rate from r), 0), 2)  as night_pay
    from s
  )
  select (select hourly_rate from r),
         (select currency from r),
         c.work_days, c.open_days, c.paid_minutes, c.night_minutes,
         c.base_pay,
         c.night_pay,
         c.base_pay + c.night_pay,
         (select bonus from b),
         c.base_pay + c.night_pay + (select bonus from b)
  from c;
$$;

-- ============================================================================
-- 4. Privacy: every row is visible and editable only by the user who owns it
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array['attendance', 'rates', 'bonuses'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows: select" on public.%I', t);
    execute format('drop policy if exists "own rows: insert" on public.%I', t);
    execute format('drop policy if exists "own rows: update" on public.%I', t);
    execute format('drop policy if exists "own rows: delete" on public.%I', t);
    execute format('create policy "own rows: select" on public.%I for select to authenticated using (user_id = auth.uid())', t);
    execute format('create policy "own rows: insert" on public.%I for insert to authenticated with check (user_id = auth.uid())', t);
    execute format('create policy "own rows: update" on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "own rows: delete" on public.%I for delete to authenticated using (user_id = auth.uid())', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

revoke all on function public.salary_summary(date, date) from public, anon;
grant execute on function public.salary_summary(date, date) to authenticated;
