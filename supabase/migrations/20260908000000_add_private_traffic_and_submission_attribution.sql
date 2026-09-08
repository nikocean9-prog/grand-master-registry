create table public.daily_page_views (
  visited_on date not null default (now() at time zone 'UTC')::date,
  visitor_hash text not null check (visitor_hash ~ '^[a-f0-9]{64}$'),
  path text not null check (path ~ '^/[A-Za-z0-9/_-]*$' and char_length(path) <= 240),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 180),
  view_count integer not null default 1 check (view_count between 1 and 1000000),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (visited_on, visitor_hash, path)
);

create index daily_page_views_date_idx
  on public.daily_page_views (visited_on desc);
create index daily_page_views_path_date_idx
  on public.daily_page_views (path, visited_on desc);

alter table public.daily_page_views enable row level security;
revoke all on public.daily_page_views from public, anon, authenticated;
grant select, insert, update on public.daily_page_views to service_role;

create or replace function public.record_page_view(
  p_visitor_hash text,
  p_path text,
  p_referrer_host text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_path text := split_part(coalesce(p_path, ''), '?', 1);
  v_referrer text := nullif(lower(trim(coalesce(p_referrer_host, ''))), '');
  v_today date := (now() at time zone 'UTC')::date;
begin
  if p_visitor_hash !~ '^[a-f0-9]{64}$'
     or v_path !~ '^/[A-Za-z0-9/_-]*$'
     or char_length(v_path) > 240
     or v_path like '/admin%' then
    return;
  end if;

  if v_referrer is not null and
     (char_length(v_referrer) > 180 or v_referrer !~ '^[a-z0-9.-]+(:[0-9]{1,5})?$') then
    v_referrer := null;
  end if;

  insert into public.daily_page_views (
    visited_on, visitor_hash, path, referrer_host, view_count
  ) values (
    v_today, p_visitor_hash, v_path, v_referrer, 1
  )
  on conflict (visited_on, visitor_hash, path) do update set
    view_count = least(public.daily_page_views.view_count + 1, 100),
    last_seen_at = now(),
    referrer_host = coalesce(public.daily_page_views.referrer_host, excluded.referrer_host);
end;
$$;

revoke all on function public.record_page_view(text, text, text) from public, anon, authenticated;
grant execute on function public.record_page_view(text, text, text) to service_role;

alter table public.submissions
  add column if not exists uploader_hash text,
  add column if not exists submission_origin text not null default 'unknown';

alter table public.submissions
  drop constraint if exists submissions_uploader_hash_format;
alter table public.submissions
  add constraint submissions_uploader_hash_format
  check (uploader_hash is null or uploader_hash ~ '^[a-f0-9]{64}$');

alter table public.submissions
  drop constraint if exists submissions_submission_origin_check;
alter table public.submissions
  add constraint submissions_submission_origin_check
  check (submission_origin in ('public_web', 'owner_direct', 'owner_bulk', 'codex_assisted', 'unknown'));

update public.submissions
set submission_origin = 'owner_bulk'
where photo_url like 'bulk/%' and submission_origin = 'unknown';

create index if not exists submissions_origin_created_idx
  on public.submissions (submission_origin, created_at desc);
create index if not exists submissions_uploader_created_idx
  on public.submissions (uploader_hash, created_at desc)
  where uploader_hash is not null;

create or replace function public.get_owner_traffic_summary(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_days integer := greatest(7, least(coalesce(p_days, 30), 90));
  v_result jsonb;
begin
  if (select auth.uid()) is null
     or (select auth.jwt() ->> 'aal') <> 'aal2'
     or not exists (
       select 1 from public.admins
       where user_id = (select auth.uid()) and is_owner = true
     ) then
    raise exception 'Owner access required';
  end if;

  with date_range as (
    select generate_series(
      (now() at time zone 'UTC')::date - (v_days - 1),
      (now() at time zone 'UTC')::date,
      interval '1 day'
    )::date as day
  ),
  daily as (
    select
      dates.day,
      count(distinct views.visitor_hash)::integer as visitors,
      coalesce(sum(views.view_count), 0)::integer as views
    from date_range dates
    left join public.daily_page_views views on views.visited_on = dates.day
    group by dates.day
    order by dates.day
  ),
  top_pages as (
    select path, sum(view_count)::integer as views,
      count(distinct visitor_hash)::integer as visitors
    from public.daily_page_views
    where visited_on >= (now() at time zone 'UTC')::date - 6
    group by path
    order by views desc, visitors desc, path
    limit 10
  ),
  top_referrers as (
    select coalesce(referrer_host, 'Direct / unknown') as source,
      sum(view_count)::integer as views,
      count(distinct visitor_hash)::integer as visitors
    from public.daily_page_views
    where visited_on >= (now() at time zone 'UTC')::date - 6
    group by coalesce(referrer_host, 'Direct / unknown')
    order by views desc, visitors desc, source
    limit 8
  ),
  traffic_totals as (
    select
      count(distinct visitor_hash) filter (
        where visited_on = (now() at time zone 'UTC')::date
      )::integer as today_visitors,
      coalesce(sum(view_count) filter (
        where visited_on = (now() at time zone 'UTC')::date
      ), 0)::integer as today_views,
      count(distinct visitor_hash) filter (
        where visited_on >= (now() at time zone 'UTC')::date - 6
      )::integer as week_visitors,
      coalesce(sum(view_count) filter (
        where visited_on >= (now() at time zone 'UTC')::date - 6
      ), 0)::integer as week_views
    from public.daily_page_views
  ),
  submission_totals as (
    select
      count(*) filter (where submission_origin = 'public_web')::integer as public_submissions,
      count(distinct uploader_hash) filter (
        where submission_origin = 'public_web' and uploader_hash is not null
      )::integer as public_submitters,
      count(*) filter (
        where submission_origin in ('owner_direct', 'owner_bulk')
      )::integer as owner_submissions,
      count(*) filter (where submission_origin = 'codex_assisted')::integer as codex_submissions,
      count(*) filter (where submission_origin = 'unknown')::integer as unknown_submissions
    from public.submissions
  )
  select jsonb_build_object(
    'timezone', 'UTC',
    'today_visitors', traffic.today_visitors,
    'today_views', traffic.today_views,
    'week_visitors', traffic.week_visitors,
    'week_views', traffic.week_views,
    'daily', (select coalesce(jsonb_agg(to_jsonb(daily) order by day), '[]'::jsonb) from daily),
    'top_pages', (select coalesce(jsonb_agg(to_jsonb(top_pages) order by views desc, visitors desc), '[]'::jsonb) from top_pages),
    'top_referrers', (select coalesce(jsonb_agg(to_jsonb(top_referrers) order by views desc, visitors desc), '[]'::jsonb) from top_referrers),
    'submissions', to_jsonb(submissions)
  ) into v_result
  from traffic_totals traffic cross join submission_totals submissions;

  return v_result;
end;
$$;

revoke all on function public.get_owner_traffic_summary(integer) from public, anon;
grant execute on function public.get_owner_traffic_summary(integer) to authenticated;
