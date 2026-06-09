import Link from "next/link";
import { requirePortalProfile } from "@/lib/auth";
import { AppShell, Card, PageHeader } from "@/components/shell";
import { EmptyState, ErrorState, SearchFilterBar, StatusBadge } from "@/components/ui";

type PageProps = { searchParams?: Promise<{ q?: string; status?: string }> };
type CustomerRow = { id: string; customer_code: string; company_name: string | null; contact_name: string; phone: string; city: string | null; onboarding_status: string; vehicles: { id: string }[] | null };

export default async function CustomersPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requirePortalProfile();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const status = params?.status ?? "all";

  let query = supabase
    .from("customers")
    .select("id, customer_code, company_name, contact_name, phone, city, onboarding_status, vehicles(id)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) {
    query = query.or(`customer_code.ilike.%${q}%,company_name.ilike.%${q}%,contact_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`);
  }

  if (status !== "all") {
    query = query.eq("onboarding_status", status);
  }

  const { data, error } = await query;
  const customers = (data ?? []) as unknown as CustomerRow[];

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <PageHeader title="Customers" description="Onboard and manage fleet owners, operators, and commercial vehicle customers." action={<Link className="rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white shadow-sm" href="/customers/new">Add customer</Link>} />
      <SearchFilterBar searchPlaceholder="Search customers by name, code, contact, city, or phone" filterLabel="Customer status" query={q} filter={status} filterOptions={["active", "inactive", "pending"]} />
      <Card>
        {error ? <ErrorState description={error.message} /> : null}
        {!error && customers.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Vehicles</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">{customers.map((customer) => <tr className="hover:bg-slate-50" key={customer.id}><td className="px-4 py-4"><p className="font-semibold text-navy-900">{customer.company_name ?? customer.contact_name}</p><p className="text-xs text-slate-500">{customer.customer_code}</p></td><td className="px-4 py-4">{customer.contact_name}</td><td className="px-4 py-4">{customer.phone}</td><td className="px-4 py-4">{customer.city ?? "—"}</td><td className="px-4 py-4 font-semibold">{customer.vehicles?.length ?? 0}</td><td className="px-4 py-4"><StatusBadge status={customer.onboarding_status} /></td><td className="px-4 py-4 text-right"><Link className="font-semibold text-navy-700" href={`/customers/${customer.id}/edit`}>Edit</Link></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        ) : null}
        {!error && !customers.length ? <EmptyState title="No customers found" description="No real Supabase customer rows match these filters yet. Add customers after your admin login is configured." /> : null}
      </Card>
    </AppShell>
  );
}
