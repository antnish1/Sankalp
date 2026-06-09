# Security Notes

## Supabase keys

The admin portal can use these browser-safe values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The Supabase `service_role` key bypasses RLS and must never be used in frontend code, committed to Git, or exposed through any `NEXT_PUBLIC_` environment variable. Use it only in trusted server environments such as server-side routes or Supabase Edge Functions.

## Roles, profiles, and admin portal access

The admin web portal first authenticates the browser with Supabase Auth email/password. It then reads the signed-in user's matching `public.profiles` row and allows only active operations profiles with these roles:

- `super_admin`
- `admin`
- `manager`
- `claim_processor`
- `field_executive`

Users with no profile row, inactive profiles, invalid roles, or the `customer` role are redirected to `/access-denied`. RLS policies still read the application role from Auth metadata and the `profiles.role` fallback, so Supabase data access remains protected even if a route is requested directly.

## Row Level Security

All sensitive tables have RLS enabled. Policies are scoped to the `authenticated` database role and separate internal operations roles from customer-owned records.

## Private claim documents

Claim documents contain sensitive personal, vehicle, accident, and financial information. They must be stored in the private `claim-documents` bucket. Public buckets and public URLs should not be used for claim files.

Use short-lived signed URLs or authenticated download routes when document previews are needed.

## Audit logs

Important changes should create an `audit_logs` row with actor, action, table name, record ID, and before/after JSON. This first migration creates the table; application-level audit insertion should be added as workflows become active.

## Deployment checklist

1. Configure Supabase Auth email/password and create matching active `public.profiles` rows for admin users.
2. Run database migrations in staging first.
3. Confirm RLS behavior with test users for each role.
4. Configure production environment variables in the hosting provider.
5. Keep service role usage server-side only.
6. Review storage policies before enabling real document uploads.
