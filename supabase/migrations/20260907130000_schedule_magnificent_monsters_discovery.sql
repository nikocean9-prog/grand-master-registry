create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'discovery_cron_secret'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'discovery_cron_secret',
      'Authenticates scheduled pull-discovery Edge Function calls'
    );
  end if;

  if not exists (
    select 1 from vault.decrypted_secrets where name = 'project_url'
  ) then
    perform vault.create_secret(
      'https://gsisjryquauebazcmcgt.supabase.co',
      'project_url',
      'Supabase project URL for scheduled Edge Function calls'
    );
  end if;
end;
$$;

create or replace function public.verify_discovery_cron_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from vault.decrypted_secrets
    where name = 'discovery_cron_secret'
      and decrypted_secret = p_secret
  );
$$;

revoke all on function public.verify_discovery_cron_secret(text) from public, anon, authenticated;
grant execute on function public.verify_discovery_cron_secret(text) to service_role;

select cron.schedule(
  'magnificent-monsters-discovery-1',
  '0 0 * * *',
  $$select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/discover-pulls',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-discovery-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'discovery_cron_secret')),
    body := '{"set_slug":"magnificent-monsters","batch_index":0,"max_cards":3}'::jsonb
  );$$
);

select cron.schedule('magnificent-monsters-discovery-2', '0 4 * * *', $$select net.http_post(url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/discover-pulls', headers := jsonb_build_object('Content-Type', 'application/json', 'x-discovery-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'discovery_cron_secret')), body := '{"set_slug":"magnificent-monsters","batch_index":1,"max_cards":3}'::jsonb);$$);
select cron.schedule('magnificent-monsters-discovery-3', '0 8 * * *', $$select net.http_post(url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/discover-pulls', headers := jsonb_build_object('Content-Type', 'application/json', 'x-discovery-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'discovery_cron_secret')), body := '{"set_slug":"magnificent-monsters","batch_index":2,"max_cards":3}'::jsonb);$$);
select cron.schedule('magnificent-monsters-discovery-4', '0 12 * * *', $$select net.http_post(url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/discover-pulls', headers := jsonb_build_object('Content-Type', 'application/json', 'x-discovery-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'discovery_cron_secret')), body := '{"set_slug":"magnificent-monsters","batch_index":3,"max_cards":3}'::jsonb);$$);
select cron.schedule('magnificent-monsters-discovery-5', '0 16 * * *', $$select net.http_post(url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/discover-pulls', headers := jsonb_build_object('Content-Type', 'application/json', 'x-discovery-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'discovery_cron_secret')), body := '{"set_slug":"magnificent-monsters","batch_index":4,"max_cards":3}'::jsonb);$$);
select cron.schedule('magnificent-monsters-discovery-6', '0 20 * * *', $$select net.http_post(url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/discover-pulls', headers := jsonb_build_object('Content-Type', 'application/json', 'x-discovery-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'discovery_cron_secret')), body := '{"set_slug":"magnificent-monsters","batch_index":5,"max_cards":3}'::jsonb);$$);
