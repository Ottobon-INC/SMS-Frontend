import { apiGet } from "../../../api/client/apiClient";
import type { OfficeStaffDashboardResponse } from "../types/dashboard.types";

export const dashboardApi = {
  getOfficeStaffDashboard: () =>
    apiGet<OfficeStaffDashboardResponse>("/dashboard/office-staff")
} as const;
