import { PolicyForm } from "@/components/forms";
import { AppShell, PageHeader } from "@/components/shell";
import { requirePortalProfile } from "@/lib/auth";

export default async function NewPolicyPage() {
  const { profile } = await requirePortalProfile();
  return <AppShell userName={profile.full_name} userRole={profile.role}><PageHeader title="Add policy" description="Attach an insurance policy to a customer and commercial vehicle." /><PolicyForm /></AppShell>;
}
