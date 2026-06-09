"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">ClaimBridge CV</p>
        <h1 className="mt-3 text-2xl font-bold text-navy-900">Unable to load the admin portal</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Check your Supabase environment variables, Auth session, RLS policies, and network connection.</p>
        <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error.message}</p>
        <button className="mt-6 rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white" type="button" onClick={() => reset()}>Try again</button>
      </section>
    </main>
  );
}
