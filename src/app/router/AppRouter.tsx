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
import { InstitutionDashboardShellPage } from "../../modules/institution/pages/InstitutionDashboardShellPage";
import { ParentPortalShellPage } from "../../modules/parent-portal/pages/ParentPortalShellPage";
import { PlatformDashboardShellPage } from "../../modules/platform-admin/pages/PlatformDashboardShellPage";

const moduleRoutes = [
  "branches",
  "users",
  "academic-structure",
  "students",
  "imports",
  "fees",
  "attendance",
  "examinations",
  "notifications",
  "reports",
  "audit",
  "support"
];

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
          { path: "/dashboard", element: <DashboardShellPage /> },
          { path: "/branch-dashboard", element: <BranchDashboardShellPage /> },
          { path: "/platform-admin", element: <PlatformDashboardShellPage /> },
          { path: "/institution", element: <InstitutionDashboardShellPage /> },
          { path: "/parent-portal", element: <ParentPortalShellPage /> },
          ...moduleRoutes.map((moduleName) => ({
            path: `/${moduleName}`,
            element: <ModulePlaceholder moduleName={moduleName} />
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
