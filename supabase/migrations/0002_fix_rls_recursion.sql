-- ============================================================
-- FIX: Eliminate RLS Infinite Recursion ("stack depth limit exceeded")
-- ============================================================

-- 1. Redefine helper functions with SECURITY DEFINER
-- This allows the functions to read cafe_profiles without triggering RLS evaluation recursively.

create or replace function public.qrcafe_auth_restaurant_id() returns uuid
language sql security definer set search_path = public stable as $$
  select restaurant_id from cafe_profiles where id = auth.uid();
$$;

create or replace function public.qrcafe_auth_role() returns text
language sql security definer set search_path = public stable as $$
  select role from cafe_profiles where id = auth.uid();
$$;

-- 2. Drop recursive policies on cafe_profiles
drop policy if exists sa_profiles on cafe_profiles;
drop policy if exists owner_profiles on cafe_profiles;
drop policy if exists user_own_profile on cafe_profiles;

-- 3. Re-create clean, non-recursive policies for cafe_profiles
create policy user_own_profile on cafe_profiles for select to authenticated
  using (id = auth.uid());

create policy sa_profiles on cafe_profiles for all to authenticated
  using (qrcafe_auth_role() = 'super_admin')
  with check (qrcafe_auth_role() = 'super_admin');

create policy owner_profiles on cafe_profiles for all to authenticated
  using (
    restaurant_id = qrcafe_auth_restaurant_id() 
    and qrcafe_auth_role() = 'owner'
  )
  with check (
    restaurant_id = qrcafe_auth_restaurant_id() 
    and qrcafe_auth_role() = 'owner'
  );

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
