grant select (id, serial_id, photo_url, status, created_at)
on public.submissions to anon;

drop policy if exists "Public can view approved submission evidence" on storage.objects;
create policy "Public can view approved submission evidence"
on storage.objects
for select
to anon
using (
  bucket_id = 'submission-evidence'
  and exists (
    select 1
    from public.submissions
    where submissions.status = 'approved'
      and submissions.photo_url = storage.objects.name
  )
);
