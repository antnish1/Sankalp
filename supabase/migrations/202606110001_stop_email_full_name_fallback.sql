create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_app_meta_data ->> 'app_role', ''), nullif(new.raw_user_meta_data ->> 'app_role', ''), 'customer')::public.app_role,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'New user'),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

update public.profiles as p
set full_name = 'New user'
from auth.users as u
where p.id = u.id
  and p.full_name = u.email;
