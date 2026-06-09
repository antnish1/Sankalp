import Link from "next/link";
import { claimStatuses } from "@/components/data";
import { requirePortalProfile } from "@/lib/auth";
import { AppShell, Card, PageHeader } from "@/components/shell";
import { EmptyState, ErrorState, SearchFilterBar, StatusBadge } from "@/components/ui";

type PageProps = { searchParams?: Promise<{ q?: string; status?: string }> };
type ClaimRow = { id: string; claim_no: string; current_status: string; estimated_loss: number | null; created_at: string; customers: { company_name: string | null; contact_name: string } | null; vehicles: { vehicle_no: string } | null; profiles: { full_name: string } | null };

function money(value: number | null) { return value ? `₹${Number(value).toLocaleString("en-IN")}` : "—"; }

export default async function ClaimsPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requirePortalProfile();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const status = params?.status ?? "all";

  let query = supabase
    .from("claims")
    .select("id, claim_no, current_status, estimated_loss, created_at, customers(company_name, contact_name), vehicles(vehicle_no), profiles!claims_assigned_to_fkey(full_name)")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (q) query = query.ilike("claim_no", `%${q}%`);
  if (status !== "all") query = query.eq("current_status", status);

  const { data, error } = await query;
  const claims = (data ?? []) as unknown as ClaimRow[];

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <PageHeader title="Claims" description="Search, filter, and monitor every accident assistance case from first report through settlement or closure." />
      <SearchFilterBar searchPlaceholder="Search by claim number" filterLabel="Claim status" query={q} filter={status} filterOptions={[...claimStatuses]} />
      <Card>
        {error ? <ErrorState description={error.message} /> : null}
        {!error && claims.length ? <div className="overflow-hidden rounded-2xl border border-slate-200"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Claim no</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3 text-right">Estimate</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{claims.map((claim) => <tr className="hover:bg-slate-50" key={claim.id}><td className="px-4 py-4"><Link href={`/claims/${claim.id}`} className="font-semibold text-navy-700">{claim.claim_no}</Link><p className="text-xs text-slate-500">Created {new Date(claim.created_at).toLocaleDateString("en-IN")}</p></td><td className="px-4 py-4">{claim.customers?.company_name ?? claim.customers?.contact_name ?? "—"}</td><td className="px-4 py-4 font-mono text-xs">{claim.vehicles?.vehicle_no ?? "—"}</td><td className="px-4 py-4"><StatusBadge status={claim.current_status} /></td><td className="px-4 py-4">{claim.profiles?.full_name ?? "Unassigned"}</td><td className="px-4 py-4 text-right font-semibold">{money(claim.estimated_loss)}</td></tr>)}</tbody></table></div></div> : null}
        {!error && !claims.length ? <EmptyState title="No claims match this filter" description="No real Supabase claim rows match the selected filters yet." /> : null}
      </Card>
    </AppShell>
  );
}
