-- ============================================================================
-- Supabase Row Level Security policies for the existing application tables.
-- ----------------------------------------------------------------------------
-- The app uses the Supabase JavaScript client with the publishable key.
-- Admin API routes authenticate with Supabase Auth; the admin user's
-- app_metadata.role must be "admin" for the policies below to allow writes.
--
-- Run this file once after the existing tables are present, then run
-- supabase/admin-setup.sql for the atomic public order RPC and image access policy.
-- ============================================================================

alter table categories     enable row level security;
alter table products       enable row level security;
alter table product_images enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table media          enable row level security;

create or replace function is_admin() returns boolean language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- Public (customers): read catalogue
create policy "public read categories" on categories for select using (true);
create policy "public read visible products" on products for select using (is_visible = true);
create policy "public read images of visible products" on product_images for select
  using (exists (select 1 from products p where p.id = product_id and p.is_visible));

-- Public (customers): create reservation requests only (cannot read or change them)
create policy "public create orders" on orders for insert with check (status = 'new');
create policy "public create order items" on order_items for insert with check (true);

-- Admin: full control
create policy "admin all categories" on categories for all using (is_admin()) with check (is_admin());
create policy "admin all products" on products for all using (is_admin()) with check (is_admin());
create policy "admin all images" on product_images for all using (is_admin()) with check (is_admin());
create policy "admin all orders" on orders for all using (is_admin()) with check (is_admin());
create policy "admin all order items" on order_items for all using (is_admin()) with check (is_admin());
create policy "admin all media" on media for all using (is_admin()) with check (is_admin());

-- Supabase Storage (if you switch image storage): create a public bucket "product-images"
-- with: public read, and insert/update/delete restricted to is_admin().
