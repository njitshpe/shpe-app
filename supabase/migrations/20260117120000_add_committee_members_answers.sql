alter table public.committee_members
add column if not exists answers jsonb;

alter table public.committee_members
add constraint committee_members_answers_is_object
check (answers is null or jsonb_typeof(answers) = 'object');
