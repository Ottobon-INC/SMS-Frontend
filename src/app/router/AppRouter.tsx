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
import { AcademicStructurePage } from "../../modules/academic-structure/pages/AcademicStructurePage";
import { BranchesPage } from "../../modules/branches/pages/BranchesPage";
import { DashboardRouter } from "../../modules/dashboard/pages/DashboardRouter";
import { DeanBranchViewPage } from "../../modules/institution/pages/DeanBranchViewPage";
import { ExaminationsContainer } from "../../modules/examinations/routes";
import { FeesPage } from "../../modules/fees/pages/FeesPage";
import { FeeTemplatePage } from "../../modules/imports/pages/FeeTemplatePage";
import { ImportResultSummary } from "../../modules/imports/pages/ImportResultSummary";
import { ImportValidationPreview } from "../../modules/imports/pages/ImportValidationPreview";
import { ManualAddStudentPage } from "../../modules/imports/pages/ManualAddStudentPage";
import { StudentImportCenter } from "../../modules/imports/pages/StudentImportCenter";
import { TemplateUploadPage } from "../../modules/imports/pages/TemplateUploadPage";
import { InstitutionSetupPage } from "../../modules/institution/pages/InstitutionSetupPage";
import { ParentPortalShellPage } from "../../modules/parent-portal/pages/ParentPortalShellPage";
import { PlatformDashboardShellPage } from "../../modules/platform-admin/pages/PlatformDashboardShellPage";
import { StudentsPage } from "../../modules/students/pages/StudentsPage";
import { UsersPage } from "../../modules/users/pages/UsersPage";
import { AttendanceLandingPage } from "../../modules/attendance/pages/AttendanceLandingPage";
import { AttendanceSessionPage } from "../../modules/attendance/pages/AttendanceSessionPage";

const moduleRoutes = ["notifications", "reports", "audit", "support"];

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
          protectedPage("/dashboard", <DashboardRouter />, { module: "dashboard" }),
          protectedPage("/dashboard/institution/branch/:branchId", <DeanBranchViewPage />, { module: "dashboard" }),
          protectedPage("/platform-admin", <PlatformDashboardShellPage />, { module: "platform-admin" }),
          protectedPage("/branches", <BranchesPage />, { module: "branches", permission: "branch.view" }),
          protectedPage("/students", <StudentsPage />, { module: "students", permission: "student.view" }),
          protectedPage("/users", <UsersPage />, { module: "users", permission: "user.view" }),
          protectedPage("/institution", <InstitutionSetupPage />, {
            module: "institution",
            permission: "institution.view"
          }),
          protectedPage("/academic-structure", <AcademicStructurePage />, {
            module: "academic-structure",
            permission: "academic_structure.view"
          }),
          protectedPage("/parent-portal", <ParentPortalShellPage />, {
            module: "parent-portal",
            permission: "parent.child_view"
          }),
          protectedPage("/examinations", <ExaminationsContainer />, {
            module: "examinations",
            permission: "exam.view"
          }),
          protectedPage("/examinations/*", <ExaminationsContainer />, {
            module: "examinations",
            permission: "exam.view"
          }),
          protectedPage("/fees", <FeesPage />, {
            module: "fees",
            permission: "fee.view"
          }),
          protectedPage("/imports", <StudentImportCenter />, {
            module: "imports",
            permission: "import.view"
          }),
          protectedPage("/imports/manual", <ManualAddStudentPage />, {
            module: "imports",
            permission: "import.view"
          }),
          protectedPage("/imports/template", <TemplateUploadPage />, {
            module: "imports",
            permission: "import.view"
          }),
          protectedPage("/imports/fees", <FeeTemplatePage />, {
            module: "imports",
            permission: "import.view"
          }),
          protectedPage("/imports/preview/:batchId", <ImportValidationPreview />, {
            module: "imports",
            permission: "import.view"
          }),
          protectedPage("/imports/fees/preview/:batchId", <ImportValidationPreview importType="fees" />, {
            module: "imports",
            permission: "import.view"
          }),
          protectedPage("/imports/summary/:batchId", <ImportResultSummary />, {
            module: "imports",
            permission: "import.view"
          }),
          protectedPage("/imports/fees/summary/:batchId", <ImportResultSummary importType="fees" />, {
            module: "imports",
            permission: "import.view"
          }),
          protectedPage("/attendance", <AttendanceLandingPage />, {
            module: "attendance",
            permission: "attendance.view"
          }),
          protectedPage("/attendance/session/:sessionId", <AttendanceSessionPage />, {
            module: "attendance",
            permission: "attendance.view"
          }),
          ...moduleRoutes.map((moduleName) => ({
            element: (
              <ProtectedRoute
                module={moduleName}
                permission={
                  moduleName === "fees"
                    ? "fee.view"
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
