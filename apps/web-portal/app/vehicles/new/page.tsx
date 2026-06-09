import { VehicleForm } from "@/components/forms";
import { AppShell, PageHeader } from "@/components/shell";
import { requirePortalProfile } from "@/lib/auth";

export default async function NewVehiclePage() {
  const { profile } = await requirePortalProfile();
  return <AppShell userName={profile.full_name} userRole={profile.role}><PageHeader title="Add vehicle" description="Register a commercial vehicle and attach it to a customer account." /><VehicleForm /></AppShell>;
}
