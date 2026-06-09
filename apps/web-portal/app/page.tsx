import { redirect } from "next/navigation";
import { getCurrentPortalProfile, isAllowedAdminRole } from "@/lib/auth";

export default async function Home() {
  const { user, profile } = await getCurrentPortalProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile || !profile.is_active || !isAllowedAdminRole(profile.role)) {
    redirect("/access-denied");
  }

  redirect("/dashboard");
}
