import Link from "next/link";
import { requirePortalProfile } from "@/lib/auth";
import { AppShell, Card, PageHeader } from "@/components/shell";
import { EmptyState, ErrorState, LoadingState, MetricCard, StatusBadge } from "@/components/ui";

type ClaimRow = {
  id: string;
  claim_no: string;
  current_status: string;
  estimated_loss: number | null;
  created_at: string;
  customers: { company_name: string | null; contact_name: string } | null;
  vehicles: { vehicle_no: string } | null;
  profiles: { full_name: string } | null;
};

function money(value: number | null) {
  return value ? `₹${Number(value).toLocaleString("en-IN")}` : "—";
}

export default async function DashboardPage() {
  const { supabase, profile } = await requirePortalProfile();

  const [claimsCount, documentsCount, tasksCount, settledCount, priorityClaims] = await Promise.all([
    supabase.from("claims").select("id", { count: "exact", head: true }),
    supabase.from("claim_documents").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
    supabase.from("claim_tasks").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    supabase.from("claims").select("id", { count: "exact", head: true }).eq("current_status", "Settled"),
    supabase
      .from("claims")
      .select("id, claim_no, current_status, estimated_loss, created_at, customers(company_name, contact_name), vehicles(vehicle_no), profiles!claims_assigned_to_fkey(full_name)")
      .order("updated_at", { ascending: false })
      .limit(6)
  ]);

  const hasError = claimsCount.error || documentsCount.error || tasksCount.error || settledCount.error || priorityClaims.error;
  const claims = (priorityClaims.data ?? []) as unknown as ClaimRow[];

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <PageHeader title="Operations dashboard" description="Live commercial vehicle accident assistance workspace powered by Supabase Auth, RLS, and your claim data." />
      {hasError ? <ErrorState description="Supabase returned an error while loading dashboard metrics. Check RLS policies, environment variables, and the signed-in profile role." className="mb-4" /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open claims" value={String(claimsCount.count ?? 0)} hint="Claims visible to your RLS role" tone="navy" icon="◆" />
        <MetricCard label="Pending documents" value={String(documentsCount.count ?? 0)} hint="Documents awaiting verification" tone="amber" icon="◧" />
        <MetricCard label="Settled claims" value={String(settledCount.count ?? 0)} hint="Claims marked settled" tone="green" icon="✓" />
        <MetricCard label="Open tasks" value={String(tasksCount.count ?? 0)} hint="Follow-ups assigned to operations" tone="red" icon="!" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-navy-900">Recent claim queue</h3>
              <p className="text-sm text-slate-500">Real claims from Supabase. No demo customer or claim data is shown.</p>
            </div>
            <Link className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700" href="/claims">View all claims</Link>
          </div>
          {claims.length ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Claim</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3 text-right">Estimate</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {claims.map((claim) => (
                      <tr className="hover:bg-slate-50" key={claim.id}><td className="px-4 py-4 font-semibold text-navy-700"><Link href={`/claims/${claim.id}`}>{claim.claim_no}</Link></td><td className="px-4 py-4">{claim.customers?.company_name ?? claim.customers?.contact_name ?? "—"}</td><td className="px-4 py-4 font-mono text-xs">{claim.vehicles?.vehicle_no ?? "—"}</td><td className="px-4 py-4"><StatusBadge status={claim.current_status} /></td><td className="px-4 py-4">{claim.profiles?.full_name ?? "Unassigned"}</td><td className="px-4 py-4 text-right font-semibold">{money(claim.estimated_loss)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : <EmptyState title="No claims yet" description="Once you create claims in Supabase, the live operations queue will appear here." />}
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-navy-900">Secure workspace</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>• Authenticated with Supabase email/password</li>
              <li>• Protected by middleware before admin pages render</li>
              <li>• Profile role checked against operations-only roles</li>
              <li>• Claim documents remain private in Supabase Storage</li>
            </ul>
          </Card>
          <LoadingState className="hidden" label="Loading live SLA indicators from Supabase..." />
        </div>
      </div>
    </AppShell>
  );
}
