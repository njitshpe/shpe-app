-- =============================================================================
-- GET MY RANK (TIME CONTEXT)
-- =============================================================================
-- Returns the authenticated user's leaderboard rank (dense_rank) and points for
-- a given context: month / semester / allTime.
-- =============================================================================

create or replace function public.get_my_rank(
  p_context text default 'allTime'
)
returns table (
  user_id uuid,
  rank integer,
  rank_points integer
)
language sql
security definer
set search_path = public
as $$
  with lb as (
    select
      up.id as user_id,
      coalesce((
        select sum(rt.points_delta)
        from public.rank_transactions rt
        where rt.user_id = up.id
          and (
            p_context = 'allTime'
            or (p_context = 'month' and rt.created_at >= date_trunc('month', now()) and rt.created_at < date_trunc('month', now()) + interval '1 month')
            or (p_context = 'semester' and (
              (extract(month from now()) between 1 and 6 and rt.created_at >= (extract(year from now())::int || '-01-01')::date and rt.created_at < (extract(year from now())::int || '-07-01')::date)
              or
              (extract(month from now()) between 7 and 12 and rt.created_at >= (extract(year from now())::int || '-07-01')::date and rt.created_at < ((extract(year from now())::int + 1) || '-01-01')::date)
            ))
          )
      ), 0)::int as rank_points
    from public.user_profiles up
    where up.first_name is not null
      and up.last_name is not null
      and up.user_type is not null
  ),
  ranked as (
    select
      user_id,
      rank_points,
      dense_rank() over (order by rank_points desc) as rank
    from lb
    where rank_points >= 0
  )
  select
    user_id,
    rank,
    rank_points
  from ranked
  where user_id = auth.uid();
$$;

grant execute on function public.get_my_rank(text) to authenticated;

comment on function public.get_my_rank is 'Returns the authenticated user rank and points for a given context (month/semester/allTime) using dense_rank window function.';

