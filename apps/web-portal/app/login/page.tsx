import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentPortalProfile, isAllowedAdminRole } from "@/lib/auth";

export default async function LoginPage() {
  const { user, profile } = await getCurrentPortalProfile();

  if (user && profile?.is_active && isAllowedAdminRole(profile.role)) {
    redirect("/dashboard");
  }

  if (user) {
    redirect("/access-denied");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-900 via-navy-700 to-slate-900 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-success">ClaimBridge CV</p>
          <h1 className="mt-3 text-3xl font-bold text-navy-900">Admin sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in with the Supabase Auth email/password account assigned to your operations profile.</p>
        </div>
        <LoginForm />
        <p className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">This browser login uses only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Never add the service role key to Vercel frontend environment variables.</p>
      </div>
    </main>
  );
}
