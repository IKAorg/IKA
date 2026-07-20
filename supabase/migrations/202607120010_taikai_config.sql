alter table public.grade_history
  add column if not exists taikai_config jsonb not null default '{}'::jsonb;

