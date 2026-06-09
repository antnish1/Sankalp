export const allowedAdminRoles = ["super_admin", "admin", "manager", "claim_processor", "field_executive"] as const;
export type AllowedAdminRole = (typeof allowedAdminRoles)[number];

export function isAllowedAdminRole(role: string | null | undefined): role is AllowedAdminRole {
  return Boolean(role && allowedAdminRoles.includes(role as AllowedAdminRole));
}
