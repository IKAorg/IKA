export const roleKeys = [
  "super_admin",
  "global_admin",
  "country_admin",
  "dojo_admin",
  "kenshi",
] as const;

export type RoleKey = (typeof roleKeys)[number];

export const permissionKeys = [
  "cms.manage",
  "countries.manage",
  "dojos.manage",
  "members.manage",
  "members.read",
  "roles.manage",
  "settings.manage",
  "audit.read",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];

export function isPrivilegedRole(role: RoleKey) {
  return role === "super_admin" || role === "global_admin";
}
