create table if not exists cms_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table cms_feedback enable row level security;

create policy cms_feedback_insert on cms_feedback for insert to authenticated with check (
  auth.uid() = user_id
);

create policy cms_feedback_read on cms_feedback for select using (
  is_admin()
);
