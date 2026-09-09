alter table public.discovery_runs
  drop constraint if exists discovery_runs_status_check;

alter table public.discovery_runs
  add constraint discovery_runs_status_check
  check (status in ('queued', 'processing', 'running', 'completed', 'failed'));

alter table public.discovery_runs
  add column if not exists set_slug text,
  add column if not exists card_ids bigint[],
  add column if not exists next_card_index integer not null default 0 check (next_card_index >= 0),
  add column if not exists total_cards integer not null default 0 check (total_cards >= 0);

select cron.unschedule(jobid)
from cron.job
where jobname = 'discovery-background-worker';

select cron.schedule(
  'discovery-background-worker',
  '* * * * *',
  $$select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/discover-pulls',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-discovery-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'discovery_cron_secret')
    ),
    body := '{"action":"process_queue"}'::jsonb
  );$$
);
