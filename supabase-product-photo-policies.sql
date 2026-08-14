-- ARANE Elektronik: policies needed by the temporary anonymous-admin demo.
-- Tenant: 661ae9a0-06c6-457a-a51f-a2c15f85ae89
-- Run this file once in Supabase SQL Editor.

-- Data API grants
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;
grant select on table public.inventory to anon, authenticated;
grant insert, update, delete on table public.inventory to authenticated;

-- Products: allow the anonymous demo session to manage ONLY ARANE rows.
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;

drop policy if exists "Anonymous demo can insert ARANE products" on public.products;
create policy "Anonymous demo can insert ARANE products"
on public.products
for insert
to authenticated
with check (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = true
);

drop policy if exists "Anonymous demo can update ARANE products" on public.products;
create policy "Anonymous demo can update ARANE products"
on public.products
for update
to authenticated
using (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = true
)
with check (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = true
);

drop policy if exists "Anonymous demo can delete ARANE products" on public.products;
create policy "Anonymous demo can delete ARANE products"
on public.products
for delete
to authenticated
using (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = true
);

-- Inventory: same temporary restriction.
drop policy if exists "Anonymous demo can insert ARANE inventory" on public.inventory;
create policy "Anonymous demo can insert ARANE inventory"
on public.inventory
for insert
to authenticated
with check (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = true
);

drop policy if exists "Anonymous demo can update ARANE inventory" on public.inventory;
create policy "Anonymous demo can update ARANE inventory"
on public.inventory
for update
to authenticated
using (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = true
)
with check (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = true
);

drop policy if exists "Anonymous demo can delete ARANE inventory" on public.inventory;
create policy "Anonymous demo can delete ARANE inventory"
on public.inventory
for delete
to authenticated
using (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = true
);

-- Storage: replace broad demo upload policy with an ARANE-only anonymous policy.
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Anonymous demo can upload ARANE product images" on storage.objects;
create policy "Anonymous demo can upload ARANE product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and name like 'arane/%'
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = true
);

-- Keep public viewing of product images.
drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects
for select
to public
using (bucket_id = 'product-images');
