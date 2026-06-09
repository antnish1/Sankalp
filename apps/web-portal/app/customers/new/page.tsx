import { CustomerForm } from "@/components/forms";
import { AppShell, PageHeader } from "@/components/shell";
import { requirePortalProfile } from "@/lib/auth";

export default async function NewCustomerPage() {
  const { profile } = await requirePortalProfile();
  return <AppShell userName={profile.full_name} userRole={profile.role}><PageHeader title="Add customer" description="Capture customer identity, company, contact, and operating address details." /><CustomerForm /></AppShell>;
}
