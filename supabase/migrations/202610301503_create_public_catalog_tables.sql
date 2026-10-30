create table public.products (
  id integer primary key,
  category_key text not null,
  subcategory text not null,
  display_order integer not null,
  title text not null,
  price text not null,
  old_price text not null default '',
  image_url text not null,
  badge text,
  brand text,
  brand_logo text,
  condition text check (condition in ('new', 'used'))
);

create index products_category_order_idx
  on public.products (category_key, display_order);

create table public.site_config (
  key text primary key,
  value jsonb not null
);

alter table public.products enable row level security;
alter table public.site_config enable row level security;

revoke all on public.products from anon, authenticated;
revoke all on public.site_config from anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.site_config to anon, authenticated;

create policy "Public can read products"
  on public.products for select to anon, authenticated
  using (true);

create policy "Public can read site config"
  on public.site_config for select to anon, authenticated
  using (true);
