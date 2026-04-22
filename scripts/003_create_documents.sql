-- Create documents table for uploaded research documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  file_name text not null,
  file_path text,
  file_size bigint not null default 0,
  page_count integer,
  status text not null default 'uploading' check (status in ('uploading', 'uploaded', 'processing', 'parsed')),
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "documents_select_own" on public.documents
  for select using (auth.uid() = user_id);

create policy "documents_insert_own" on public.documents
  for insert with check (auth.uid() = user_id);

create policy "documents_update_own" on public.documents
  for update using (auth.uid() = user_id);

create policy "documents_delete_own" on public.documents
  for delete using (auth.uid() = user_id);
