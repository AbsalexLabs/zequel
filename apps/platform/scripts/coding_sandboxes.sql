-- Project -> Daytona sandbox binding.
-- Stores ONLY metadata; the sandbox itself is the working filesystem.
-- Apply once in Supabase (SQL editor or migration runner).

create table if not exists public.coding_sandboxes (
  project_id uuid primary key references public.coding_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sandbox_id text not null,
  name text not null,
  status text not null default 'active',
  runtime text not null default 'daytona',
  workdir text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coding_sandboxes_user_id_idx on public.coding_sandboxes (user_id);

alter table public.coding_sandboxes enable row level security;

-- Owner-only access. Every query is additionally scoped by user_id in the app,
-- but RLS is the hard boundary.
drop policy if exists "coding_sandboxes owner select" on public.coding_sandboxes;
create policy "coding_sandboxes owner select" on public.coding_sandboxes
  for select using (auth.uid() = user_id);

drop policy if exists "coding_sandboxes owner insert" on public.coding_sandboxes;
create policy "coding_sandboxes owner insert" on public.coding_sandboxes
  for insert with check (auth.uid() = user_id);

drop policy if exists "coding_sandboxes owner update" on public.coding_sandboxes;
create policy "coding_sandboxes owner update" on public.coding_sandboxes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "coding_sandboxes owner delete" on public.coding_sandboxes;
create policy "coding_sandboxes owner delete" on public.coding_sandboxes
  for delete using (auth.uid() = user_id);
