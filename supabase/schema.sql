-- Dayline database schema. Paste into Supabase -> SQL Editor -> Run (safe to run more than once).

create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  work_date   date not null,
  recorded_at timestamptz not null default now(),
  note        text check (note is null or char_length(note) <= 300),
  source      text not null default 'tap' check (source in ('tap', 'manual')),
  unique (user_id, work_date)
);

create index if not exists attendance_user_date_idx
  on public.attendance (user_id, work_date desc);

-- Row Level Security: every row is visible and editable only by the user who owns it.
alter table public.attendance enable row level security;

drop policy if exists "own rows: select" on public.attendance;
drop policy if exists "own rows: insert" on public.attendance;
drop policy if exists "own rows: update" on public.attendance;
drop policy if exists "own rows: delete" on public.attendance;

create policy "own rows: select" on public.attendance
  for select to authenticated using (user_id = auth.uid());

create policy "own rows: insert" on public.attendance
  for insert to authenticated with check (user_id = auth.uid());

create policy "own rows: update" on public.attendance
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own rows: delete" on public.attendance
  for delete to authenticated using (user_id = auth.uid());

-- Anonymous (signed-out) visitors get no access at all.
revoke all on public.attendance from anon;
grant select, insert, update, delete on public.attendance to authenticated;
