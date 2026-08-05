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
  { label: "Institution", route: "/institution", module: "institution", permissions: ["institution.view", "institution.manage"] },
  { label: "Branches", route: "/branches", module: "branches", permissions: ["branch.view", "branch.create", "branch.update"] },
  { label: "Users", route: "/users", module: "users", permissions: ["user.view", "user.create", "role.assign"] },
  {
    label: "Academic Structure",
    route: "/academic-structure",
    module: "academic-structure",
    permissions: ["academic_structure.view", "academic_structure.manage"]
  },
  { label: "Students", route: "/students", module: "students", permissions: ["student.view", "student.create"] },
  { label: "Imports", route: "/imports", module: "imports", permissions: ["import.view", "import.upload"] },
  { label: "Fees", route: "/fees", module: "fees", permissions: ["fee.view"] },
  { label: "Attendance", route: "/attendance", module: "attendance", permissions: ["attendance.view", "attendance.mark"] },
  { label: "Examinations", route: "/examinations", module: "examinations", permissions: ["exam.view", "exam.marks_enter"] },
  { label: "Notifications", route: "/notifications", module: "notifications", permissions: ["notification.view"] },
  { label: "Reports", route: "/reports", module: "reports", permissions: ["report.branch_view", "report.institution_view"] },
  { label: "Audit", route: "/audit", module: "audit", permissions: ["audit.view"] },
  { label: "Support", route: "/support", module: "support" },
  {
    label: "Parent Portal",
    route: "/parent-portal",
    module: "parent-portal",
    permissions: ["parent.child_view"],
    contextTypes: ["TENANT", "BRANCH"]
  }
];
