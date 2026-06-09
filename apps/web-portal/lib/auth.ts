import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "./supabase-server";
import { isAllowedAdminRole } from "./roles";
export { allowedAdminRoles, isAllowedAdminRole } from "./roles";
export type { AllowedAdminRole } from "./roles";

export type PortalProfile = {
  id: string;
  role: string;
  full_name: string;
  is_active: boolean;
};


export async function getCurrentPortalProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, profile: null, error: userError?.message ?? null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, is_active")
    .eq("id", user.id)
    .maybeSingle<PortalProfile>();

  return { supabase, user, profile, error: profileError?.message ?? null };
}

export async function requirePortalProfile() {
  const result = await getCurrentPortalProfile();

  if (!result.user) {
    redirect("/login");
  }

  if (!result.profile || !result.profile.is_active || !isAllowedAdminRole(result.profile.role)) {
    redirect("/access-denied");
  }

  return { ...result, user: result.user, profile: result.profile };
}
