import { PolicyForm } from "@/components/forms";
import { AppShell, PageHeader } from "@/components/shell";
import { requirePortalProfile } from "@/lib/auth";

export default async function EditPolicyPage() {
  const { profile } = await requirePortalProfile();
  return <AppShell userName={profile.full_name} userRole={profile.role}><PageHeader title="Edit policy" description="Update policy details, coverage period, insurer, and IDV." /><PolicyForm /></AppShell>;
}
