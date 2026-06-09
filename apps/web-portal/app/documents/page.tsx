import { requirePortalProfile } from "@/lib/auth";
import { AppShell, Card, PageHeader } from "@/components/shell";
import { EmptyState, ErrorState, SearchFilterBar, StatusBadge } from "@/components/ui";

type PageProps = { searchParams?: Promise<{ q?: string; status?: string }> };
type DocumentRow = { id: string; document_type: string; file_name: string; verification_status: string; created_at: string; claims: { claim_no: string } | null; customers: { company_name: string | null; contact_name: string } | null };

export default async function DocumentsPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requirePortalProfile();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const status = params?.status ?? "all";

  let query = supabase
    .from("claim_documents")
    .select("id, document_type, file_name, verification_status, created_at, claims(claim_no), customers(company_name, contact_name)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (q) query = query.or(`document_type.ilike.%${q}%,file_name.ilike.%${q}%`);
  if (status !== "all") query = query.eq("verification_status", status);
  const { data, error } = await query;
  const documents = (data ?? []) as unknown as DocumentRow[];

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <PageHeader title="Document verification" description="Review private claim documents uploaded to the protected Supabase storage bucket." />
      <SearchFilterBar searchPlaceholder="Search documents by type or file name" filterLabel="Document status" query={q} filter={status} filterOptions={["pending", "verified", "rejected"]} />
      <Card>
        {error ? <ErrorState description={error.message} /> : null}
        {!error && documents.length ? <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">{documents.map((doc) => <div className="flex flex-col gap-4 bg-white p-4 hover:bg-slate-50 md:flex-row md:items-center md:justify-between" key={doc.id}><div><p className="font-semibold text-navy-900">{doc.document_type}</p><p className="text-sm text-slate-500">{doc.file_name} · {doc.claims?.claim_no ?? "No claim"} · {doc.customers?.company_name ?? doc.customers?.contact_name ?? "No customer"}</p></div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={doc.verification_status} /><button className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white" type="button">Verify</button><button className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" type="button">Reject</button></div></div>)}</div> : null}
        {!error && !documents.length ? <EmptyState title="No documents awaiting review" description="When private files are uploaded to real claims, verification tasks will appear here." /> : null}
      </Card>
    </AppShell>
  );
}
