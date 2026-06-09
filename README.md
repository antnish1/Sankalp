# ClaimBridge CV

ClaimBridge CV is the first version of a commercial vehicle insurance claim assistance platform. This release includes the Supabase database foundation and the protected admin web portal only. It does **not** include a customer mobile app.

## What is included

- `apps/web-portal` — Next.js, TypeScript, Tailwind CSS, Supabase Auth, protected admin portal routes, and live Supabase queries.
- `supabase/migrations` — PostgreSQL schema, enums, indexes, RLS policies, Auth profile trigger, and private storage bucket setup.
- `supabase/functions` — Reserved for future Supabase Edge Functions.
- `docs` — Business flow, database schema, and security notes.
- `.env.example` and `apps/web-portal/.env.example` — Browser-safe environment variable templates.

## Exact npm install command

Run this from the repository root:

```bash
npm install
```

## Exact command to run the admin portal locally

Run this from the repository root after installing dependencies and creating `apps/web-portal/.env.local`:

```bash
npm run dev
```

The portal runs at `http://localhost:3000`. The root URL `/` checks Supabase Auth and redirects unauthenticated users to `/login` or authenticated allowed users to `/dashboard`.

## Browser-only environment variables

Create `apps/web-portal/.env.local` for local development and configure the same values in Vercel for production:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For Vercel production, set `NEXT_PUBLIC_APP_URL` to your deployed URL:

```bash
NEXT_PUBLIC_APP_URL=https://sankalp-web-portal.vercel.app
```

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to the web portal or to Vercel frontend environment variables. The service role key bypasses RLS and must only be used later inside trusted server-only workflows such as Supabase Edge Functions or backend jobs.

## Exact Supabase setup steps

1. Create a Supabase project.
2. Install and authenticate the Supabase CLI:

   ```bash
   npm install -g supabase
   supabase login
   ```

3. Link this repository to your Supabase project:

   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Apply the migration:

   ```bash
   supabase db push
   ```

5. In Supabase Dashboard → Authentication → Providers, enable **Email** provider and keep email/password sign-in enabled.
6. Confirm that the private Storage bucket `claim-documents` exists in Supabase Storage after the migration runs.
7. Create your first admin user in Supabase Dashboard → Authentication → Users.
8. Copy the new Auth user UUID.
9. Create or update the matching `public.profiles` row in SQL Editor. Replace the UUID and name:

   ```sql
   insert into public.profiles (id, role, full_name, is_active)
   values ('00000000-0000-0000-0000-000000000000', 'super_admin', 'First Admin', true)
   on conflict (id) do update
   set role = excluded.role,
       full_name = excluded.full_name,
       is_active = true;
   ```

10. Allowed admin portal roles are:
    - `super_admin`
    - `admin`
    - `manager`
    - `claim_processor`
    - `field_executive`

    The `customer` role is intentionally blocked from this admin portal.

11. Test login at `http://localhost:3000/login` locally or `https://sankalp-web-portal.vercel.app/login` after Vercel deployment.
12. Test protection by opening `/dashboard` in a private/incognito browser window. It should redirect to `/login` until you sign in.

## Vercel deployment checklist

1. Set Vercel project root/build settings for this monorepo:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Development command: `npm run dev`
2. Add only these environment variables in Vercel Project Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. Redeploy after adding environment variables.
4. Visit `/login` and sign in with the Supabase Auth admin user.
5. Confirm `/dashboard`, `/customers`, `/vehicles`, `/policies`, `/claims`, `/documents`, `/timeline`, `/tasks`, `/reports`, and `/users` redirect to `/login` when signed out.

## Security principles

- The frontend uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Middleware protects all admin routes before rendering admin pages.
- After login, the app checks `public.profiles` and allows only active operations roles.
- Users with no profile row, inactive profile, or invalid role see `/access-denied`.
- Claim documents are stored in a private bucket named `claim-documents`.
- Access to sensitive tables is controlled with Supabase Row Level Security.
- Important system changes should be recorded in `audit_logs`.
