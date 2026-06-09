import { VehicleForm } from "@/components/forms";
import { AppShell, PageHeader } from "@/components/shell";
import { requirePortalProfile } from "@/lib/auth";

export default async function EditVehiclePage() {
  const { profile } = await requirePortalProfile();
  return <AppShell userName={profile.full_name} userRole={profile.role}><PageHeader title="Edit vehicle" description="Update vehicle registration, permit, and identification details." /><VehicleForm /></AppShell>;
}
