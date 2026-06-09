import Link from "next/link";
import { requirePortalProfile } from "@/lib/auth";
import { AppShell, Card, PageHeader } from "@/components/shell";
import { EmptyState, ErrorState, SearchFilterBar, StatusBadge } from "@/components/ui";

type PageProps = { searchParams?: Promise<{ q?: string; status?: string }> };
type VehicleRow = { id: string; vehicle_no: string; vehicle_type: string; make: string | null; model: string | null; year: number | null; customers: { company_name: string | null; contact_name: string } | null; policies: { policy_no: string; end_date: string }[] | null };

export default async function VehiclesPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requirePortalProfile();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";

  let query = supabase
    .from("vehicles")
    .select("id, vehicle_no, vehicle_type, make, model, year, customers(company_name, contact_name), policies(policy_no, end_date)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) {
    query = query.or(`vehicle_no.ilike.%${q}%,vehicle_type.ilike.%${q}%,make.ilike.%${q}%,model.ilike.%${q}%`);
  }

  const { data, error } = await query;
  const vehicles = (data ?? []) as unknown as VehicleRow[];

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <PageHeader title="Vehicles" description="Maintain commercial vehicle registration, permit, chassis, engine, fitness, and policy linkage records." action={<Link className="rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white shadow-sm" href="/vehicles/new">Add vehicle</Link>} />
      <SearchFilterBar searchPlaceholder="Search vehicles by registration, vehicle type, make, or model" filterLabel="Vehicle status" query={q} filter="all" filterOptions={[]} />
      <Card>
        {error ? <ErrorState description={error.message} /> : null}
        {!error && vehicles.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {vehicles.map((vehicle) => {
            const activePolicy = vehicle.policies?.[0];
            return <Link className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-navy-200 hover:shadow-soft" href={`/vehicles/${vehicle.id}/edit`} key={vehicle.id}><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-sm font-bold text-navy-900">{vehicle.vehicle_no}</p><p className="mt-1 text-sm text-slate-500">{vehicle.customers?.company_name ?? vehicle.customers?.contact_name ?? "Unlinked customer"}</p></div><StatusBadge status="Active" /></div><div className="mt-5 space-y-2 text-sm"><p className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-medium text-slate-700">{vehicle.vehicle_type}</span></p><p className="flex justify-between"><span className="text-slate-500">Model</span><span className="font-medium text-slate-700">{[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ") || "—"}</span></p><p className="flex justify-between"><span className="text-slate-500">Policy</span><span className="font-medium text-slate-700">{activePolicy?.policy_no ?? "—"}</span></p></div></Link>;
          })}
        </div> : null}
        {!error && !vehicles.length ? <EmptyState title="No vehicles found" description="No real Supabase vehicle rows match these filters yet." /> : null}
      </Card>
    </AppShell>
  );
}
