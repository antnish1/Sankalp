import { requirePortalProfile } from "@/lib/auth";
import { allowedAdminRoles } from "@/lib/roles";
import { AppShell, Card, PageHeader } from "@/components/shell";
import { EmptyState, ErrorState, SearchFilterBar, StatusBadge } from "@/components/ui";

type PageProps = { searchParams?: Promise<{ q?: string; status?: string }> };
type ProfileRow = { id: string; full_name: string; role: string; phone: string | null; is_active: boolean; created_at: string };

export default async function UsersPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requirePortalProfile();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const status = params?.status ?? "all";
  let query = supabase.from("profiles").select("id, full_name, role, phone, is_active, created_at").order("created_at", { ascending: false }).limit(50);
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);
  const { data, error } = await query;
  const users = (data ?? []) as unknown as ProfileRow[];
  return <AppShell userName={profile.full_name} userRole={profile.role}><PageHeader title="User management" description="View Supabase Auth profile rows and role-based portal access. Create Auth users in Supabase, then add or update matching profiles rows." /><SearchFilterBar searchPlaceholder="Search users by name or phone" filterLabel="User status" query={q} filter={status} filterOptions={["active", "inactive"]} /><div className="grid gap-6 xl:grid-cols-3"><Card className="xl:col-span-2">{error ? <ErrorState description={error.message} /> : null}{!error && users.length ? <div className="divide-y divide-slate-100">{users.map((user) => <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between" key={user.id}><div><p className="font-semibold text-navy-900">{user.full_name}</p><p className="text-sm text-slate-500">{user.role} · {user.phone ?? "No phone"}</p></div><StatusBadge status={user.is_active ? "Active" : "Inactive"} /></div>)}</div> : null}{!error && !users.length ? <EmptyState title="No profile rows found" description="Create Supabase Auth users and matching profiles rows before using the admin portal." /> : null}</Card><Card><h3 className="text-lg font-semibold text-navy-900">Allowed admin roles</h3><div className="mt-4 flex flex-wrap gap-2">{allowedAdminRoles.map((role) => <StatusBadge key={role} status={role} />)}</div><p className="mt-4 text-sm leading-6 text-slate-600">Customers are intentionally not allowed to enter this admin web portal. The customer mobile app will be built separately later.</p></Card></div></AppShell>;
}
