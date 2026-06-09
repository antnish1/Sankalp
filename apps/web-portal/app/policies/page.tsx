import Link from "next/link";
import { requirePortalProfile } from "@/lib/auth";
import { AppShell, Card, PageHeader } from "@/components/shell";
import { EmptyState, ErrorState, SearchFilterBar, StatusBadge } from "@/components/ui";

type PageProps = { searchParams?: Promise<{ q?: string; status?: string }> };
type PolicyRow = { id: string; policy_no: string; policy_type: string; start_date: string; end_date: string; customers: { company_name: string | null; contact_name: string } | null; vehicles: { vehicle_no: string } | null; insurance_companies: { name: string } | null };

function policyStatus(endDate: string) {
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  const today = Date.now();
  const days = Math.ceil((end - today) / 86_400_000);
  if (days < 0) return "Expired";
  if (days <= 30) return "Renewal due";
  return "Active";
}

export default async function PoliciesPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requirePortalProfile();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const status = params?.status ?? "all";

  let query = supabase
    .from("policies")
    .select("id, policy_no, policy_type, start_date, end_date, customers(company_name, contact_name), vehicles(vehicle_no), insurance_companies(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) query = query.ilike("policy_no", `%${q}%`);
  const { data, error } = await query;
  let policies = (data ?? []) as unknown as PolicyRow[];
  if (status !== "all") policies = policies.filter((policy) => policyStatus(policy.end_date).toLowerCase().replace(" ", "_") === status);

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <PageHeader title="Policies" description="Track insurer, coverage period, IDV, premium, and vehicle-policy mapping." action={<Link className="rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white shadow-sm" href="/policies/new">Add policy</Link>} />
      <SearchFilterBar searchPlaceholder="Search policies by policy number" filterLabel="Policy status" query={q} filter={status} filterOptions={["active", "renewal_due", "expired"]} />
      <Card>
        {error ? <ErrorState description={error.message} /> : null}
        {!error && policies.length ? <div className="overflow-hidden rounded-2xl border border-slate-200"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Policy no</th><th className="px-4 py-3">Insurer</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Validity</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{policies.map((policy) => <tr className="hover:bg-slate-50" key={policy.id}><td className="px-4 py-4 font-semibold text-navy-700">{policy.policy_no}</td><td className="px-4 py-4">{policy.insurance_companies?.name ?? "—"}</td><td className="px-4 py-4">{policy.customers?.company_name ?? policy.customers?.contact_name ?? "—"}</td><td className="px-4 py-4 font-mono text-xs">{policy.vehicles?.vehicle_no ?? "—"}</td><td className="px-4 py-4">{policy.start_date} to {policy.end_date}</td><td className="px-4 py-4"><StatusBadge status={policyStatus(policy.end_date)} /></td><td className="px-4 py-4 text-right"><Link href={`/policies/${policy.id}/edit`} className="font-semibold text-navy-700">Edit</Link></td></tr>)}</tbody></table></div></div> : null}
        {!error && !policies.length ? <EmptyState title="No policies found" description="No real Supabase policy rows match these filters yet." /> : null}
      </Card>
    </AppShell>
  );
}
