import { apiDownloadBlob, apiGet, apiPatch, apiPost, apiPostForm } from "../../../api/client/apiClient";

export type LookupItem = {
  id: string;
  name: string;
  code?: string;
};

export type ProgrammeLookup = {
  id: string;
  code: string;
  name: string;
  yearLevel: string;
};

export type ManualAddStudentRequest = {
  student_name: string;
  date_of_birth: string;
  gender: string;
  admission_number: string;
  branch_id: string;
  academic_year_id: string;
  programme_id: string;
  batch_id: string;
  section_id: string;
  year_level: string;
  roll_number?: string | null;
  guardian_name: string;
  guardian_mobile: string;
  guardian_email?: string | null;
  relationship_type: string;
};

export type ManualAddStudentResponse = {
  student_id: string;
  guardian_id?: string | null;
  enrollment_id: string;
  student_number: string;
  message: string;
};

export type ActivatePortalResponse = {
  guardian_id: string;
  portal_user_id?: string | null;
  status: string;
  message: string;
};

export type ImportRowResult = {
  id: string;
  row_number: number;
  raw_data: Record<string, unknown>;
  normalized_data: Record<string, unknown> | null;
  validation_status: string;
  errors: Array<{ field?: string; message?: string }>;
};

export type ImportBatchResponse = {
  id: string;
  file_name: string;
  status: string;
  summary: Record<string, number | string | boolean | null> | null;
  created_at: string;
};

export type PreviewResponse = {
  batch: ImportBatchResponse;
  rows: ImportRowResult[];
};

export type UploadResponse = {
  message: string;
  batch_id: string;
  status: string;
};

export type CommitBatchResponse = {
  message: string;
  batch_id?: string;
};

export const importsApi = {
  downloadStudentTemplate: () => apiDownloadBlob("/imports/students/template"),
  downloadFeeTemplate: () => apiDownloadBlob("/imports/fees/template"),
  uploadFeeTemplate: (file: File, branchId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (branchId) {
      formData.append("branch_id", branchId);
    }
    return apiPostForm<UploadResponse>("/imports/fees/upload", formData);
  },
  uploadStudentTemplate: (file: File, branchId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    // Only include branch_id if explicitly provided — omitting it allows multi-branch Excel imports
    if (branchId) {
      formData.append("branch_id", branchId);
    }
    return apiPostForm<UploadResponse>("/imports/students/upload", formData);
  },
  getBranches: () => apiGet<LookupItem[]>("/imports/students/lookups/branches"),
  getAcademicYears: () => apiGet<LookupItem[]>("/imports/students/lookups/academic-years"),
  getProgrammes: () => apiGet<ProgrammeLookup[]>("/academic-structure/programmes"),
  getBatches: (branchId?: string, academicYearId?: string, programmeId?: string) => {
    const params = new URLSearchParams();
    if (branchId) params.append("branch_id", branchId);
    if (academicYearId) params.append("academic_year_id", academicYearId);
    if (programmeId) params.append("programme_id", programmeId);
    const qs = params.toString();
    return apiGet<LookupItem[]>(`/imports/students/lookups/batches${qs ? `?${qs}` : ""}`);
  },
  getSections: (batchId: string) => apiGet<LookupItem[]>(`/imports/students/lookups/sections?batch_id=${batchId}`),
  manualAddStudent: (payload: ManualAddStudentRequest) => apiPost<ManualAddStudentResponse>("/imports/students/manual-student", payload),
  activatePortal: (guardianId: string) => apiPost<ActivatePortalResponse>(`/imports/students/guardians/${guardianId}/activate-portal`, {}),
  getPreview: (batchId: string) => apiGet<PreviewResponse>(`/imports/students/batches/${batchId}/preview`),
  correctPreviewRow: (batchId: string, rowId: string, rawData: Record<string, unknown>) =>
    apiPatch<PreviewResponse>(`/imports/students/batches/${batchId}/rows/${rowId}`, { raw_data: rawData }),
  correctPreviewRows: (
    batchId: string,
    rows: Array<{ row_id: string; raw_data: Record<string, unknown> }>
  ) => apiPatch<PreviewResponse>(`/imports/students/batches/${batchId}/rows`, { rows }),
  commitBatch: (batchId: string) =>
    apiPost<CommitBatchResponse>(`/imports/students/batches/${batchId}/commit`, {}),
  getFeePreview: (batchId: string) => apiGet<PreviewResponse>(`/imports/fees/batches/${batchId}/preview`),
  correctFeePreviewRow: (batchId: string, rowId: string, rawData: Record<string, unknown>) =>
    apiPatch<PreviewResponse>(`/imports/fees/batches/${batchId}/rows/${rowId}`, { raw_data: rawData }),
  commitFeeBatch: (batchId: string) =>
    apiPost<CommitBatchResponse>(`/imports/fees/batches/${batchId}/commit`, {})
};
