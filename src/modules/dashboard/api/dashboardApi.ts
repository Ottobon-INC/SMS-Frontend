import { apiGet } from "../../../api/client/apiClient";
import type { 
  OfficeStaffDashboardResponse,
  InstitutionDashboardResponse 
} from "../types/dashboard.types";

export const dashboardApi = {
  getOfficeStaffDashboard: (branchId?: string) => {
    const params = branchId ? new URLSearchParams({ branch_id: branchId }) : undefined;
    return apiGet<OfficeStaffDashboardResponse>(`/dashboard/office-staff${params ? `?${params.toString()}` : ""}`);
  },
  getInstitutionDashboard: () =>
    apiGet<InstitutionDashboardResponse>("/dashboard/institution")
} as const;
