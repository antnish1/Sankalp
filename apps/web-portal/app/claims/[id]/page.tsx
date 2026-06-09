import { notFound } from "next/navigation";
import { claimStatuses } from "@/components/data";
import { requirePortalProfile } from "@/lib/auth";
import { AppShell, Card, PageHeader } from "@/components/shell";
import { EmptyState, ErrorState, StatusBadge } from "@/components/ui";

type PageProps = { params: Promise<{ id: string }> };
type ClaimDetail = {
  id: string;
  claim_no: string;
  current_status: string;
  accident_at: string | null;
  accident_location: string | null;
  accident_description: string | null;
  estimated_loss: number | null;
  approved_amount: number | null;
  settlement_amount: number | null;
  customers: { company_name: string | null; contact_name: string } | null;
  vehicles: { vehicle_no: string; vehicle_type: string } | null;
  policies: { policy_no: string } | null;
  insurance_companies: { name: string } | null;
  garages: { name: string } | null;
  surveyors: { name: string } | null;
};
type DocumentRow = { id: string; document_type: string; file_name: string; verification_status: string };

function money(value: number | null) { return value ? `₹${Number(value).toLocaleString("en-IN")}` : "—"; }

export default async function ClaimDetailPage({ params }: PageProps) {
  const { supabase, profile } = await requirePortalProfile();
  const { id } = await params;
  const [{ data, error }, documentsResult] = await Promise.all([
    supabase.from("claims").select("id, claim_no, current_status, accident_at, accident_location, accident_description, estimated_loss, approved_amount, settlement_amount, customers(company_name, contact_name), vehicles(vehicle_no, vehicle_type), policies(policy_no), insurance_companies(name), garages(name), surveyors(name)").eq("id", id).maybeSingle(),
    supabase.from("claim_documents").select("id, document_type, file_name, verification_status").eq("claim_id", id).order("created_at", { ascending: false })
  ]);

  if (!data && !error) notFound();
  const claim = data as ClaimDetail | null;
  const documents = (documentsResult.data ?? []) as unknown as DocumentRow[];

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <PageHeader title={claim ? `Claim ${claim.claim_no}` : "Claim detail"} description="Detailed claim workspace for accident summary, documents, insurer coordination, surveyor activity, repair milestones, and settlement values." />
      {error ? <ErrorState description={error.message} className="mb-4" /> : null}
      {claim ? <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-lg font-semibold text-navy-900">Accident and policy details</h3>
              <p className="mt-1 text-sm text-slate-500">Commercial vehicle assistance file with insurer and garage coordination.</p>
            </div>
            <StatusBadge status={claim.current_status} />
          </div>
          <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2"><Info label="Customer" value={claim.customers?.company_name ?? claim.customers?.contact_name ?? "—"} /><Info label="Vehicle" value={claim.vehicles?.vehicle_no ?? "—"} /><Info label="Policy" value={claim.policies?.policy_no ?? "—"} /><Info label="Insurer" value={claim.insurance_companies?.name ?? "—"} /><Info label="Surveyor" value={claim.surveyors?.name ?? "—"} /><Info label="Garage" value={claim.garages?.name ?? "—"} /><Info label="Accident location" value={claim.accident_location ?? "—"} /><Info label="Estimated loss" value={money(claim.estimated_loss)} /></dl>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"><p className="font-semibold text-navy-900">Accident description</p><p className="mt-2 leading-6">{claim.accident_description ?? "No accident description recorded yet."}</p></div>
        </Card>
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-navy-900">Status update</h3>
            <select className="mt-4 w-full" defaultValue={claim.current_status}>{claimStatuses.map((status) => <option key={status}>{status}</option>)}</select>
            <button className="mt-4 w-full rounded-xl bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white" type="button">Record status</button>
            <p className="mt-3 text-xs text-slate-500">Status writes should be implemented through a server action or Edge Function before production use.</p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-navy-900">Document checklist</h3>
            {documentsResult.error ? <ErrorState description={documentsResult.error.message} className="mt-4" /> : null}
            {!documentsResult.error && documents.length ? <div className="mt-4 space-y-3">{documents.map((document) => <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm" key={document.id}><div className="flex items-center justify-between gap-3"><span>{document.document_type}</span><StatusBadge status={document.verification_status} /></div><p className="mt-1 text-xs text-slate-500">{document.file_name}</p></div>)}</div> : null}
            {!documentsResult.error && !documents.length ? <EmptyState className="mt-4" title="No documents uploaded" description="Private claim document metadata will appear here after upload." /> : null}
          </Card>
        </div>
      </div> : null}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-navy-900">{value}</dd></div>;
}
