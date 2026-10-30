revoke insert, delete on public.site_config from public, anon, authenticated;
grant update on public.site_config to authenticated;

create policy "Admins can update site config"
  on public.site_config for update to authenticated
  using (
    exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
  );
