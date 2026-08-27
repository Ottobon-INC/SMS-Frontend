import { apiGet } from "../../../api/client/apiClient";
import type { 
  OfficeStaffDashboardResponse,
  InstitutionDashboardResponse 
} from "../types/dashboard.types";

type DashboardCacheEntry<T> = {
  value?: T;
  promise?: Promise<T>;
};

const officeDashboardCache = new Map<string, DashboardCacheEntry<OfficeStaffDashboardResponse>>();
const institutionDashboardCache: DashboardCacheEntry<InstitutionDashboardResponse> = {};

const officeDashboardKey = (branchId?: string) => branchId ?? "__active_branch__";

function withDeadline<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        window.clearTimeout(timer);
        resolve(null);
      });
  });
}

function getOfficeStaffDashboard(branchId?: string, forceRefresh = false) {
  const key = officeDashboardKey(branchId);
  const cached = officeDashboardCache.get(key);

  if (!forceRefresh && cached?.value) {
    return Promise.resolve(cached.value);
  }

  if (!forceRefresh && cached?.promise) {
    return cached.promise;
  }

  const params = branchId ? new URLSearchParams({ branch_id: branchId }) : undefined;
  const promise = apiGet<OfficeStaffDashboardResponse>(
    `/dashboard/office-staff${params ? `?${params.toString()}` : ""}`
  )
    .then((value) => {
      officeDashboardCache.set(key, { value });
      return value;
    })
    .catch((error) => {
      officeDashboardCache.delete(key);
      throw error;
    });

  officeDashboardCache.set(key, { promise });
  return promise;
}

function getInstitutionDashboard(forceRefresh = false) {
  if (!forceRefresh && institutionDashboardCache.value) {
    return Promise.resolve(institutionDashboardCache.value);
  }

  if (!forceRefresh && institutionDashboardCache.promise) {
    return institutionDashboardCache.promise;
  }

  const promise = apiGet<InstitutionDashboardResponse>("/dashboard/institution")
    .then((value) => {
      institutionDashboardCache.value = value;
      institutionDashboardCache.promise = undefined;
      return value;
    })
    .catch((error) => {
      institutionDashboardCache.value = undefined;
      institutionDashboardCache.promise = undefined;
      throw error;
    });

  institutionDashboardCache.promise = promise;
  return promise;
}

export const dashboardApi = {
  getOfficeStaffDashboard,
  getInstitutionDashboard,
  refreshOfficeStaffDashboard: (branchId?: string) => getOfficeStaffDashboard(branchId, true),
  refreshInstitutionDashboard: () => getInstitutionDashboard(true),
  warmOfficeStaffDashboard: (branchId?: string, timeoutMs = 1800) =>
    withDeadline(getOfficeStaffDashboard(branchId), timeoutMs),
  warmInstitutionDashboard: (timeoutMs = 1800) =>
    withDeadline(getInstitutionDashboard(), timeoutMs),
  clearDashboardCache: () => {
    officeDashboardCache.clear();
    institutionDashboardCache.value = undefined;
    institutionDashboardCache.promise = undefined;
  }
} as const;
