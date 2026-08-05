import type { PortalKey } from "../types/authContext.types";

export const portalDefinitions: Record<
  PortalKey,
  {
    label: string;
    description: string;
    expectedRoles: string[];
    dashboardPath: string;
  }
> = {
  institution: {
    label: "Institution Admin / Dean",
    description: "Institution setup, users, branches, academic structures and consolidated oversight.",
    expectedRoles: ["INSTITUTION_ADMIN"],
    dashboardPath: "/institution"
  },
  branch: {
    label: "Principal / Campus Admin",
    description: "Branch approvals, attendance finalization, fee corrections and result approval.",
    expectedRoles: ["BRANCH_ADMIN"],
    dashboardPath: "/branch-dashboard"
  },
  office: {
    label: "Office Staff",
    description: "Daily student, import, fee, attendance and marks operations.",
    expectedRoles: ["OFFICE_STAFF"],
    dashboardPath: "/dashboard"
  },
  parent: {
    label: "Parent / Guardian",
    description: "Linked-child attendance, fees, results, reports and notification preferences.",
    expectedRoles: ["PARENT_GUARDIAN"],
    dashboardPath: "/parent-portal"
  },
  platform: {
    label: "SaaS Super Admin",
    description: "Ottobon platform operations, tenants, subscriptions and system health.",
    expectedRoles: ["SAAS_SUPER_ADMIN"],
    dashboardPath: "/platform-admin"
  }
};

export function getPortalForRole(roleCode: string): PortalKey {
  if (roleCode === "SAAS_SUPER_ADMIN") return "platform";
  if (roleCode === "INSTITUTION_ADMIN") return "institution";
  if (roleCode === "BRANCH_ADMIN") return "branch";
  if (roleCode === "PARENT_GUARDIAN") return "parent";
  return "office";
}
