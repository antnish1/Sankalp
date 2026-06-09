import { requirePortalProfile } from "@/lib/auth";
import { AppShell, Card, PageHeader } from "@/components/shell";
import { ErrorState, MetricCard, SearchFilterBar } from "@/components/ui";

export default async function ReportsPage() {
  const { supabase, profile } = await requirePortalProfile();
  const [claimsCount, settledCount, rejectedCount, documentsCount] = await Promise.all([
    supabase.from("claims").select("id", { count: "exact", head: true }),
    supabase.from("claims").select("id", { count: "exact", head: true }).eq("current_status", "Settled"),
    supabase.from("claims").select("id", { count: "exact", head: true }).eq("current_status", "Rejected"),
    supabase.from("claim_documents").select("id", { count: "exact", head: true })
  ]);
  const hasError = claimsCount.error || settledCount.error || rejectedCount.error || documentsCount.error;
  return <AppShell userName={profile.full_name} userRole={profile.role}><PageHeader title="Reports" description="Operational reporting from real Supabase records for claim volumes, settlements, rejections, and document workload." /><SearchFilterBar searchPlaceholder="Report search will apply to future detailed exports" filterLabel="Report view" filterOptions={["claims", "documents", "tasks"]} />{hasError ? <ErrorState description="Unable to load report counters from Supabase. Check RLS and environment configuration." className="mb-4" /> : null}<div className="grid gap-4 md:grid-cols-4"><MetricCard label="Total claims" value={String(claimsCount.count ?? 0)} hint="Visible through RLS" tone="navy" icon="◆" /><MetricCard label="Settled" value={String(settledCount.count ?? 0)} hint="Settlement completed" tone="green" icon="✓" /><MetricCard label="Rejected" value={String(rejectedCount.count ?? 0)} hint="Rejected claim files" tone="red" icon="!" /><MetricCard label="Documents" value={String(documentsCount.count ?? 0)} hint="Private storage metadata" tone="amber" icon="◧" /></div><div className="mt-6"><Card><h3 className="text-lg font-semibold text-navy-900">No fake charts</h3><p className="mt-2 text-sm leading-6 text-slate-600">Detailed charts should be added after production data and report requirements are finalized. This page intentionally avoids showing sample insurer performance data.</p></Card></div></AppShell>;
}
