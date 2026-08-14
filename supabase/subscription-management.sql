-- JFS AI Subscription & Tenant Management
-- Run this SQL in the Supabase SQL Editor before using admin/subscription-management.html.
-- IMPORTANT: replace the UUID below with the Supabase Auth user id of the JFS AI administrator.

create table if not exists public.jfs_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.jfs_admins enable row level security;

-- Admins can only read their own admin record.
drop policy if exists "jfs_admins_self_read" on public.jfs_admins;
create policy "jfs_admins_self_read"
on public.jfs_admins for select
to authenticated
using (user_id = auth.uid());

-- Ensure tenant/subscription tables have RLS enabled.
alter table public.tenants enable row level security;
alter table public.tenant_subscriptions enable row level security;

-- Admins can manage tenants.
drop policy if exists "jfs_admins_manage_tenants" on public.tenants;
create policy "jfs_admins_manage_tenants"
on public.tenants for all
to authenticated
using (exists (select 1 from public.jfs_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.jfs_admins a where a.user_id = auth.uid()));

-- Admins can manage subscriptions.
drop policy if exists "jfs_admins_manage_subscriptions" on public.tenant_subscriptions;
create policy "jfs_admins_manage_subscriptions"
on public.tenant_subscriptions for all
to authenticated
using (exists (select 1 from public.jfs_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.jfs_admins a where a.user_id = auth.uid()));

-- Optional: if the tenant_subscriptions table already has multiple overlapping
-- active rows, review them before activating a new plan. The website guard uses
-- the latest active end_date for the tenant.

-- After creating your Supabase Auth admin account, run:
-- insert into public.jfs_admins(user_id) values ('YOUR-AUTH-USER-UUID');

-- Recommended plan identifiers used by the dashboard:
-- 3-months, 6-months, 12-months
