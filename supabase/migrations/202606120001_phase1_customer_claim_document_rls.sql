create policy "customers self create"
on public.customers for insert
to authenticated
with check (
  public.current_app_role() = 'customer'
  and profile_id = auth.uid()
);

create policy "claims customer create own"
on public.claims for insert
to authenticated
with check (
  public.current_app_role() = 'customer'
  and created_by = auth.uid()
  and customer_id in (
    select id from public.customers
    where profile_id = auth.uid()
  )
  and vehicle_id in (
    select v.id
    from public.vehicles v
    join public.customers c on c.id = v.customer_id
    where c.profile_id = auth.uid()
  )
  and policy_id in (
    select p.id
    from public.policies p
    join public.customers c on c.id = p.customer_id
    where c.profile_id = auth.uid()
  )
);

drop policy if exists "claim documents customer upload metadata" on public.claim_documents;

create policy "claim documents customer upload metadata"
on public.claim_documents for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and customer_id in (
    select id from public.customers
    where profile_id = auth.uid()
  )
  and claim_id in (
    select id from public.claims
    where customer_id in (
      select id from public.customers
      where profile_id = auth.uid()
    )
  )
);

create policy "claim document objects customer upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'claim-documents'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and split_part(name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.customers c
    join public.claims cl on cl.customer_id = c.id
    where c.profile_id = auth.uid()
      and c.id = split_part(storage.objects.name, '/', 1)::uuid
      and cl.id = split_part(storage.objects.name, '/', 2)::uuid
  )
);
