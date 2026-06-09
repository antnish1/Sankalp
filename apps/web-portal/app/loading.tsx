export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">ClaimBridge CV</p>
        <div className="mt-5 animate-pulse space-y-4">
          <div className="h-7 w-64 rounded bg-slate-200" />
          <div className="h-4 w-full max-w-2xl rounded bg-slate-100" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-2xl bg-slate-100" />
            <div className="h-28 rounded-2xl bg-slate-100" />
            <div className="h-28 rounded-2xl bg-slate-100" />
          </div>
        </div>
        <p className="mt-5 text-sm text-slate-500">Loading secure Supabase workspace...</p>
      </div>
    </main>
  );
}
