-- =============================================================================
-- Careers — account lookup for the sign-in and password-reset pages
--
-- Lets the browser ask "is there an account for this email?" so the sign-in
-- page can say "No account found, create one" instead of a generic failure.
--
-- This deliberately reveals whether an email is registered (account
-- enumeration). It is limited to a yes/no answer, throttled per email and with
-- a global budget so it cannot be used to sweep a list of addresses quickly.
-- =============================================================================

create or replace function public.email_has_account(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'VALIDATION_FAILED' using errcode = 'AJA15';
  end if;

  if not public.consume_rate_limit('login_attempt', 'lookup:' || v_email, 10, 900)
     or not public.consume_rate_limit('login_attempt', 'lookup:global', 300, 600) then
    raise exception 'RATE_LIMITED' using errcode = 'AJA14';
  end if;

  return exists (select 1 from auth.users where lower(email) = v_email);
end;
$$;

revoke all on function public.email_has_account(text) from public;
grant execute on function public.email_has_account(text) to anon, authenticated;
