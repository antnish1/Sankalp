import { requirePortalProfile } from "@/lib/auth";
import { AppShell, Card, PageHeader } from "@/components/shell";
import { EmptyState, ErrorState, StatusBadge } from "@/components/ui";

type HistoryRow = { id: string; from_status: string | null; to_status: string; notes: string | null; created_at: string; claims: { claim_no: string } | null; profiles: { full_name: string } | null };

export default async function TimelinePage() {
  const { supabase, profile } = await requirePortalProfile();
  const { data, error } = await supabase.from("claim_status_history").select("id, from_status, to_status, notes, created_at, claims(claim_no), profiles!claim_status_history_changed_by_fkey(full_name)").order("created_at", { ascending: false }).limit(50);
  const history = (data ?? []) as unknown as HistoryRow[];
  return <AppShell userName={profile.full_name} userRole={profile.role}><PageHeader title="Claim status timeline" description="A chronological view of real process milestones for auditability, insurer coordination, and customer communication." /><Card>{error ? <ErrorState description={error.message} /> : null}{!error && history.length ? <ol className="relative border-l border-slate-200 pl-6">{history.map((item) => <li className="mb-6" key={item.id}><span className="absolute -left-2 mt-1 h-4 w-4 rounded-full bg-green-600 ring-4 ring-green-50" /><div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.to_status} /><span className="text-xs text-slate-500">{item.claims?.claim_no ?? "No claim"} · {new Date(item.created_at).toLocaleString("en-IN")}</span></div><p className="mt-2 text-sm text-slate-500">{item.notes ?? "No notes recorded."}</p><p className="mt-1 text-xs text-slate-400">Changed by {item.profiles?.full_name ?? "Unknown user"}</p></li>)}</ol> : null}{!error && !history.length ? <EmptyState title="No claim status history yet" description="Real timeline entries will appear after claim statuses are changed in Supabase." /> : null}</Card></AppShell>;
}
