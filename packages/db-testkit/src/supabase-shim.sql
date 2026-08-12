-- Minimal Supabase surface, for running the real migrations against a plain
-- Postgres instance.
--
-- Deliberately lives OUTSIDE any package's migrations/ directory so neither the
-- release-manifest generator nor the CLI's migration collector can ever pick it
-- up and ship it to a real database.
--
-- The surface is small because it was enumerated, not guessed. Across all
-- shipped migrations the only Supabase-provided objects referenced are:
--   auth.uid()    — 11 call sites
--   auth.jwt()    — 11 call sites
--   auth.users(id) — 3 foreign keys (core V003, core V004, media V001)
-- There is no `storage.*` usage at all.
--
-- Fidelity note: in real Supabase, auth.uid()/auth.jwt() are themselves thin
-- readers over the `request.jwt.claims` GUC that PostgREST sets per request.
-- Reproducing that exactly — rather than stubbing a fixed user — is what makes
-- the RLS assertions in these tests mean something.

create extension if not exists pgcrypto;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.jwt() returns jsonb
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid;
$$;

create or replace function auth.role() returns text
language sql stable as $$
  select coalesce(auth.jwt() ->> 'role', 'anon');
$$;

-- PostgREST switches into one of these per request; RLS `TO <role>` clauses in
-- the migrations are meaningless unless they exist.
do $$ begin
  create role anon nologin;
exception when duplicate_object then null; end $$;

do $$ begin
  create role authenticated nologin;
exception when duplicate_object then null; end $$;

do $$ begin
  create role service_role nologin bypassrls;
exception when duplicate_object then null; end $$;

grant usage on schema public, auth to anon, authenticated, service_role;
grant select on auth.users to authenticated, service_role;

-- Newly created tables must be reachable by the request roles, the way Supabase
-- configures its projects. Without this every policy test would fail on a
-- missing table-level grant rather than on the policy itself.
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
