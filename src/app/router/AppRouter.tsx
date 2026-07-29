import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AccessDenied } from "../guards/AccessDenied";
import { InstitutionLayout } from "../../layouts/InstitutionLayout";
import { ModulePlaceholder } from "../../components/ModulePlaceholder";

const moduleRoutes = [
  "dashboard",
  "platform-admin",
  "institution",
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
  "support",
  "parent-portal"
];

const router = createBrowserRouter([
  {
    path: "/",
    element: <InstitutionLayout />,
    children: [
      { index: true, element: <ModulePlaceholder moduleName="home" /> },
      ...moduleRoutes.map((moduleName) => ({
        path: moduleName,
        element: <ModulePlaceholder moduleName={moduleName} />
      })),
      { path: "access-denied", element: <AccessDenied /> },
      { path: "*", element: <ModulePlaceholder moduleName="not-found" /> }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
