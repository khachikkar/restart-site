create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from public, anon, authenticated;
grant select on public.admin_users to authenticated;

create policy "Admins can read their own access record"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete on public.products from public, anon, authenticated;
grant insert, update, delete on public.products to authenticated;

create policy "Admins can add products"
  on public.products for insert to authenticated
  with check (
    exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
  );

create policy "Admins can edit products"
  on public.products for update to authenticated
  using (
    exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
  );

create policy "Admins can delete products"
  on public.products for delete to authenticated
  using (
    exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
  );
