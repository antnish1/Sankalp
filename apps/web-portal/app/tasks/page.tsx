import { requirePortalProfile } from "@/lib/auth";
import { AppShell, Card, PageHeader } from "@/components/shell";
import { EmptyState, ErrorState, SearchFilterBar, StatusBadge } from "@/components/ui";

type PageProps = { searchParams?: Promise<{ q?: string; status?: string }> };
type TaskRow = { id: string; title: string; due_date: string | null; status: string; claims: { claim_no: string; current_status: string } | null; profiles: { full_name: string } | null };

export default async function TasksPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requirePortalProfile();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const status = params?.status ?? "all";
  let query = supabase.from("claim_tasks").select("id, title, due_date, status, claims(claim_no, current_status), profiles!claim_tasks_assigned_to_fkey(full_name)").order("created_at", { ascending: false }).limit(50);
  if (q) query = query.ilike("title", `%${q}%`);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  const tasks = (data ?? []) as unknown as TaskRow[];
  return <AppShell userName={profile.full_name} userRole={profile.role}><PageHeader title="Follow-up tasks" description="Assign, prioritize, and close claim follow-ups across processors and field executives." /><SearchFilterBar searchPlaceholder="Search tasks by title" filterLabel="Task status" query={q} filter={status} filterOptions={["open", "in_progress", "completed", "cancelled"]} /><Card>{error ? <ErrorState description={error.message} /> : null}{!error && tasks.length ? <div className="grid gap-4 md:grid-cols-2">{tasks.map((task) => <div className="rounded-2xl border border-slate-200 bg-white p-4" key={task.id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-navy-900">{task.title}</p><p className="mt-2 text-sm text-slate-500">{task.claims?.claim_no ?? "No claim"} · Due {task.due_date ?? "not set"} · {task.profiles?.full_name ?? "Unassigned"}</p></div><StatusBadge status={task.status} /></div><p className="mt-4 text-xs text-slate-500">Claim status: {task.claims?.current_status ?? "—"}</p></div>)}</div> : null}{!error && !tasks.length ? <EmptyState title="No follow-up tasks" description="No real Supabase task rows match these filters yet." /> : null}</Card></AppShell>;
}
