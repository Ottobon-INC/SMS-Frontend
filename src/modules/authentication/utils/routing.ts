import type { AccessContextSummary, ActiveContext } from "../types/authContext.types";

export function getDashboardPathForActiveContext(context: ActiveContext | null): string {
  const role = context?.role_codes[0];
  if (role === "SAAS_SUPER_ADMIN") return "/platform-admin";
  if (role === "PARENT_GUARDIAN") return "/parent-portal";
  return "/dashboard";
}

export function getDashboardPathForContext(context: AccessContextSummary | undefined): string {
  const role = context?.role.code;
  if (role === "SAAS_SUPER_ADMIN") return "/platform-admin";
  if (role === "PARENT_GUARDIAN") return "/parent-portal";
  return "/dashboard";
}
