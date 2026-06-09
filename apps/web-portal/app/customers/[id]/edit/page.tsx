import { CustomerForm } from "@/components/forms";
import { AppShell, PageHeader } from "@/components/shell";
import { requirePortalProfile } from "@/lib/auth";

export default async function EditCustomerPage() {
  const { profile } = await requirePortalProfile();
  return <AppShell userName={profile.full_name} userRole={profile.role}><PageHeader title="Edit customer" description="Update customer profile information and onboarding status." /><CustomerForm /></AppShell>;
}
