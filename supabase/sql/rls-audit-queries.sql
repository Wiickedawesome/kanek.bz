-- Run these queries in the Supabase SQL editor or against the project database
-- to verify the policies that protect the admin data surfaced in this repo.

-- 1. Confirm RLS is enabled on every public table the site or admin dashboard reads.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname = 'public'
order by c.relname;

-- 2. Inspect the exact public-schema policies in effect.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. Inspect storage policies, especially for the `documents` bucket.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
order by tablename, policyname;

-- 4. Verify which buckets exist and whether `documents` is intended to be public.
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
from storage.buckets
order by id;

-- 5. Review the admin-role population that the Edge Function relies on.
select role, count(*)
from public.profiles
group by role
order by role;

-- 6. Inspect current document references to confirm they point at the expected bucket.
select 'driver_details.license_url' as source, license_url as document_ref
from public.driver_details
where license_url is not null
union all
select 'driver_details.insurance_url' as source, insurance_url as document_ref
from public.driver_details
where insurance_url is not null
union all
select 'driver_details.id_document_url' as source, id_document_url as document_ref
from public.driver_details
where id_document_url is not null
union all
select 'driver_documents.document_url' as source, document_url as document_ref
from public.driver_documents
where document_url is not null
union all
select 'rider_documents.document_url' as source, document_url as document_ref
from public.rider_documents
where document_url is not null;