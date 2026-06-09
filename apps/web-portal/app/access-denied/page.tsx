import { LogoutButton } from "@/components/logout-button";
import { getCurrentPortalProfile } from "@/lib/auth";

export default async function AccessDeniedPage() {
  const { user, profile, error } = await getCurrentPortalProfile();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-700">!</div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-green-700">ClaimBridge CV</p>
        <h1 className="mt-3 text-3xl font-bold text-navy-900">Access denied</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your Supabase Auth user is signed in, but it does not have an active operations profile role for this admin portal.
        </p>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left text-sm text-slate-600">
          <p><span className="font-semibold text-navy-900">Email:</span> {user?.email ?? "No active session"}</p>
          <p><span className="font-semibold text-navy-900">Profile role:</span> {profile?.role ?? "Missing profile row"}</p>
          <p><span className="font-semibold text-navy-900">Active:</span> {profile ? String(profile.is_active) : "n/a"}</p>
          {error ? <p className="mt-2 text-red-700">{error}</p> : null}
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-500">
          Ask a Supabase admin to create a matching row in <code>public.profiles</code> with one of: super_admin, admin, manager, claim_processor, or field_executive.
        </p>
        <div className="mt-6 flex justify-center"><LogoutButton /></div>
      </section>
    </main>
  );
}
