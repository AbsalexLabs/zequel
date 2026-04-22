-- Create preferences table for user settings
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.preferences enable row level security;

create policy "preferences_select_own" on public.preferences
  for select using (auth.uid() = user_id);

create policy "preferences_insert_own" on public.preferences
  for insert with check (auth.uid() = user_id);

create policy "preferences_update_own" on public.preferences
  for update using (auth.uid() = user_id);

create policy "preferences_delete_own" on public.preferences
  for delete using (auth.uid() = user_id);

-- Auto-create default preferences on user creation
create or replace function public.handle_new_user_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.preferences (user_id, theme)
  values (new.id, 'light')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_preferences on auth.users;

create trigger on_auth_user_created_preferences
  after insert on auth.users
  for each row
  execute function public.handle_new_user_preferences();
