-- PP Trading Journey backend. Run in Supabase Dashboard > SQL Editor.
-- Each logged-in trader can access ONLY their own data.
create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_workspaces enable row level security;
drop policy if exists "Users read their workspace" on public.user_workspaces;
drop policy if exists "Users insert their workspace" on public.user_workspaces;
drop policy if exists "Users update their workspace" on public.user_workspaces;
create policy "Users read their workspace" on public.user_workspaces for select to authenticated using (auth.uid() = user_id);
create policy "Users insert their workspace" on public.user_workspaces for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update their workspace" on public.user_workspaces for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private screenshot storage. Objects must start with user's UUID as first folder name.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('trade-screenshots','trade-screenshots',false,2097152,array['image/jpeg'])
on conflict (id) do update set public=false, file_size_limit=2097152, allowed_mime_types=array['image/jpeg'];
drop policy if exists "Traders upload own screenshots" on storage.objects;
drop policy if exists "Traders view own screenshots" on storage.objects;
drop policy if exists "Traders delete own screenshots" on storage.objects;
create policy "Traders upload own screenshots" on storage.objects for insert to authenticated with check (bucket_id='trade-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Traders view own screenshots" on storage.objects for select to authenticated using (bucket_id='trade-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Traders delete own screenshots" on storage.objects for delete to authenticated using (bucket_id='trade-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);
