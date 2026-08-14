export type NavigationItem = {
  label: string;
  route: string;
  module: string;
  permissions?: string[];
  contextTypes?: string[];
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", route: "/dashboard", module: "dashboard" },
  { label: "Platform Admin", route: "/platform-admin", module: "platform-admin", contextTypes: ["PLATFORM"] },
  // Institution & Branches: TENANT/PLATFORM only (Dean & Platform Admin) — hidden from Principal, Office Staff, Parent
  { label: "Institution", route: "/institution", module: "institution", permissions: ["institution.view"], contextTypes: ["TENANT", "PLATFORM"] },
  { label: "Branches", route: "/branches", module: "branches", permissions: ["branch.manage"], contextTypes: ["TENANT", "PLATFORM"] },
  // Users: Dean (TENANT) and Principal (BRANCH) can manage users; Office Staff and Parents cannot
  { label: "Users", route: "/users", module: "users", permissions: ["user.manage"] },
  // Academic Structure: Dean, Principal, Office Staff can view; Parent cannot
  {
    label: "Academic Structure",
    route: "/academic-structure",
    module: "academic-structure",
    permissions: ["academic_structure.view"]
  },
  // Operational modules: all except Parent
  { label: "Students", route: "/students", module: "students", permissions: ["student.view"] },
  { label: "Imports", route: "/imports", module: "imports", permissions: ["import.view"] },
  { label: "Fees", route: "/fees", module: "fees", permissions: ["fee.view"] },
  { label: "Attendance", route: "/attendance", module: "attendance", permissions: ["attendance.view"] },
  { label: "Examinations", route: "/examinations", module: "examinations", permissions: ["exam.view"] },
  { label: "Notifications", route: "/notifications", module: "notifications", permissions: ["notification.view"] },
  { label: "Reports", route: "/reports", module: "reports", permissions: ["report.branch_view"] },
  { label: "Audit", route: "/audit", module: "audit", permissions: ["audit.view"] },
  { label: "Support", route: "/support", module: "support" },
  // Parent Portal: SELF scope only
  {
    label: "Parent Portal",
    route: "/parent-portal",
    module: "parent-portal",
    permissions: ["parent.child_view"],
    contextTypes: ["SELF"]
  }
];
