import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GuestOnlyRoute } from "../guards/GuestOnlyRoute";
import { ProtectedRoute } from "../guards/ProtectedRoute";
import { AccessDenied } from "../guards/AccessDenied";
import { AppShellLayout } from "../../components/navigation/AppShellLayout";
import { ModulePlaceholder } from "../../components/ModulePlaceholder";
import { ContextSelectionPage } from "../../modules/authentication/pages/ContextSelectionPage";
import { LoginPage } from "../../modules/authentication/pages/LoginPage";
import { PortalSelectionPage } from "../../modules/authentication/pages/PortalSelectionPage";
import { SignupRequestPage } from "../../modules/authentication/pages/SignupRequestPage";
import { BranchDashboardShellPage } from "../../modules/dashboard/pages/BranchDashboardShellPage";
import { DashboardShellPage } from "../../modules/dashboard/pages/DashboardShellPage";
import { BranchesPage } from "../../modules/branches/pages/BranchesPage";
import { InstitutionSetupPage } from "../../modules/institution/pages/InstitutionSetupPage";
import { AcademicStructurePage } from "../../modules/academic-structure/pages/AcademicStructurePage";
import { StudentsPage } from "../../modules/students/pages/StudentsPage";
import { UsersPage } from "../../modules/users/pages/UsersPage";
import { ParentPortalShellPage } from "../../modules/parent-portal/pages/ParentPortalShellPage";
import { PlatformDashboardShellPage } from "../../modules/platform-admin/pages/PlatformDashboardShellPage";
import { ExaminationsContainer } from "../../modules/examinations/routes";

const moduleRoutes = [
  "imports",
  "fees",
  "attendance",
  "notifications",
  "reports",
  "audit",
  "support"
];

function protectedPage(
  path: string,
  element: React.ReactNode,
  options: { module?: string; permission?: string } = {}
) {
  return {
    element: <ProtectedRoute module={options.module} permission={options.permission} />,
    children: [{ path, element }]
  };
}

const router = createBrowserRouter([
  {
    element: <GuestOnlyRoute />,
    children: [
      { path: "/", element: <PortalSelectionPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/platform-login", element: <LoginPage platform /> },
      { path: "/signup", element: <SignupRequestPage /> }
    ]
  },
  { path: "/select-context", element: <ContextSelectionPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShellLayout />,
        children: [
          protectedPage("/dashboard", <DashboardShellPage />, { module: "dashboard" }),
          protectedPage("/branch-dashboard", <BranchDashboardShellPage />, { module: "dashboard" }),
          protectedPage("/platform-admin", <PlatformDashboardShellPage />, { module: "platform-admin" }),
          protectedPage("/branches", <BranchesPage />, { module: "branches", permission: "branch.manage" }),
          protectedPage("/students", <StudentsPage />, { module: "students", permission: "student.view" }),
          protectedPage("/users", <UsersPage />, { module: "users", permission: "user.view" }),
          protectedPage("/institution", <InstitutionSetupPage />, { module: "institution", permission: "institution.view" }),
          protectedPage("/academic-structure", <AcademicStructurePage />, { module: "academic-structure", permission: "academic_structure.view" }),
          protectedPage("/parent-portal", <ParentPortalShellPage />, { module: "parent-portal", permission: "parent.child_view" }),
          protectedPage("/examinations", <ExaminationsContainer />, { module: "examinations", permission: "exam.view" }),
          protectedPage("/examinations/*", <ExaminationsContainer />, { module: "examinations", permission: "exam.view" }),
          ...moduleRoutes.map((moduleName) => ({
            element: (
              <ProtectedRoute
                module={moduleName}
                permission={
                  moduleName === "academic-structure"
                    ? "academic_structure.view"
                    : moduleName === "imports"
                      ? "import.view"
                      : moduleName === "fees"
                        ? "fee.view"
                        : moduleName === "attendance"
                          ? "attendance.view"
                          : moduleName === "notifications"
                            ? "notification.view"
                            : moduleName === "reports"
                              ? "report.branch_view"
                              : moduleName === "audit"
                                ? "audit.view"
                                : undefined
                }
              />
            ),
            children: [{ path: `/${moduleName}`, element: <ModulePlaceholder moduleName={moduleName} /> }]
          }))
        ]
      }
    ]
  },
  { path: "/access-denied", element: <AccessDenied /> },
  { path: "*", element: <ModulePlaceholder moduleName="not-found" /> }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
