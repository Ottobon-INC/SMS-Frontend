import { useAuth } from "../../authentication/providers/AuthProvider";
import { InstitutionDashboardShellPage } from "../../institution/pages/InstitutionDashboardShellPage";
import { BranchDashboardShellPage } from "./BranchDashboardShellPage";
import { DashboardShellPage } from "./DashboardShellPage";

export function DashboardRouter() {
  const auth = useAuth();
  const role = auth.activeContext?.role_codes[0];

  if (role === "INSTITUTION_ADMIN") {
    return <InstitutionDashboardShellPage />;
  }
  
  if (role === "BRANCH_ADMIN") {
    return <BranchDashboardShellPage />;
  }
  
  return <DashboardShellPage />;
}
