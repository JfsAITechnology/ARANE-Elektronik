-- ARANE Elektronik: allow the authenticated anonymous session used by the website
-- to create/update inventory rows for this tenant.
-- Run this in Supabase SQL Editor.

create policy "ARANE anonymous can insert inventory"
on public.inventory
for insert
to authenticated
with check (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'::uuid
  and (select (auth.jwt()->>'is_anonymous')::boolean) is true
);

create policy "ARANE anonymous can update inventory"
on public.inventory
for update
to authenticated
using (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'::uuid
  and (select (auth.jwt()->>'is_anonymous')::boolean) is true
)
with check (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'::uuid
  and (select (auth.jwt()->>'is_anonymous')::boolean) is true
);

create policy "ARANE anonymous can view inventory"
on public.inventory
for select
to authenticated
using (
  tenant_id = '661ae9a0-06c6-457a-a51f-a2c15f85ae89'::uuid
  and (select (auth.jwt()->>'is_anonymous')::boolean) is true
);
