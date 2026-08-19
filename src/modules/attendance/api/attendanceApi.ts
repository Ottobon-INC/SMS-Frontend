import { apiGet, apiPost, apiPut } from "../../../api/client/apiClient";
import type {
  AttendanceSessionCreate,
  AttendanceSessionResponse,
  AttendanceDraftSavePayload,
  AttendanceSessionListItem,
  LookupItem,
  ProgrammeLookup,
} from "../types/attendance.types";

export const attendanceApi = {
  // --- Attendance Operations ---
  getSessions: (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return apiGet<AttendanceSessionListItem[]>(`/attendance/sessions${query}`);
  },

  createSession: (payload: AttendanceSessionCreate) =>
    apiPost<AttendanceSessionResponse>("/attendance/sessions", payload),

  getSession: (sessionId: string) =>
    apiGet<AttendanceSessionResponse>(`/attendance/sessions/${sessionId}`),

  saveDraft: (sessionId: string, payload: AttendanceDraftSavePayload) =>
    apiPut<AttendanceSessionResponse>(`/attendance/sessions/${sessionId}/records`, payload),

  submitSession: (sessionId: string) =>
    apiPost<AttendanceSessionResponse>(`/attendance/sessions/${sessionId}/submit`, {}),

  finalizeSession: (sessionId: string) =>
    apiPost<AttendanceSessionResponse>(`/attendance/sessions/${sessionId}/finalize`, {}),

  returnSession: (sessionId: string, payload: { reason?: string }) =>
    apiPost<AttendanceSessionResponse>(`/attendance/sessions/${sessionId}/return`, payload),

  // --- Academic Lookups (proxying existing backend endpoints) ---
  getBranches: () =>
    apiGet<LookupItem[]>("/imports/students/lookups/branches"),

  getAcademicYears: () =>
    apiGet<LookupItem[]>("/imports/students/lookups/academic-years"),

  getProgrammes: () =>
    apiGet<ProgrammeLookup[]>("/academic-structure/programmes"),

  getBatches: (branchId?: string, academicYearId?: string, programmeId?: string) => {
    const params = new URLSearchParams();
    if (branchId) params.append("branch_id", branchId);
    if (academicYearId) params.append("academic_year_id", academicYearId);
    if (programmeId) params.append("programme_id", programmeId);
    const qs = params.toString();
    return apiGet<LookupItem[]>(`/imports/students/lookups/batches${qs ? `?${qs}` : ""}`);
  },

  getSections: (batchId: string) =>
    apiGet<LookupItem[]>(`/imports/students/lookups/sections?batch_id=${batchId}`),
};
