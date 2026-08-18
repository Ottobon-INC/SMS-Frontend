import { apiGet, apiPatch, apiPost } from "../../../api/client/apiClient";

export interface StudentListItem {
  id: string;
  tenantId: string;
  studentNumber: string;
  admissionNumber: string;
  name: string;
  displayName?: string | null;
  legalName?: string | null;
  rollNo: string;
  rollNumber?: string | null;
  gender: string;
  dob?: string | null;
  dateOfBirth?: string | null;
  studentMobile?: string | null;
  studentEmail?: string | null;
  preferredLanguage?: string | null;
  stream: string;
  section: string;
  status: string;
  studentSourceType?: string | null;
  studentSourceReference?: string | null;
  studentCreatedAt?: string | null;
  studentUpdatedAt?: string | null;
  enrollmentId?: string | null;
  branchId?: string | null;
  branchCode?: string | null;
  branchName?: string | null;
  academicYearId?: string | null;
  academicYearCode?: string | null;
  academicYearName?: string | null;
  programmeId?: string | null;
  programmeCode?: string | null;
  programmeName?: string | null;
  streamCode?: string | null;
  coachingTrack?: string | null;
  batchId?: string | null;
  batchCode?: string | null;
  batchName?: string | null;
  sectionId?: string | null;
  sectionCode?: string | null;
  sectionName?: string | null;
  yearLevel?: string | null;
  enrollmentStatus?: string | null;
  joiningDate?: string | null;
  endingDate?: string | null;
  isCurrent?: boolean | null;
  enrollmentSourceType?: string | null;
  enrollmentSourceReference?: string | null;
  enrollmentCreatedAt?: string | null;
  enrollmentUpdatedAt?: string | null;
  guardianId?: string | null;
  guardianName?: string | null;
  father_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  guardianRelationship?: string | null;
  guardianPhone?: string | null;
  guardianEmail?: string | null;
  guardianStatus?: string | null;
  guardianVerificationStatus?: string | null;
  guardianLinkId?: string | null;
  guardianIsPrimary?: boolean | null;
  portalAccessEnabled?: boolean | null;
  notificationEnabled?: boolean | null;
  paymentEnabled?: boolean | null;
  guardianLinkVerificationStatus?: string | null;
  guardianLinkStatus?: string | null;
  guardianLinkEffectiveFrom?: string | null;
  guardianLinkEffectiveUntil?: string | null;
  guardian_data?: {
    father_name?: string;
    mother_name?: string;
    guardian_phone?: string;
    guardian_email?: string;
  };
}

export interface StudentInlineUpdatePayload {
  student_name?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  student_mobile?: string | null;
  student_email?: string | null;
  roll_number?: string | null;
  joining_date?: string | null;
  ending_date?: string | null;
  guardian_name?: string | null;
  guardian_relationship?: string | null;
  guardian_phone?: string | null;
  guardian_email?: string | null;
}

export const studentsApi = {
  list: (branchId?: string) => apiGet<StudentListItem[]>(`/students${branchId ? `?branch_id=${branchId}` : ''}`),
  create: (payload: unknown) => apiPost<StudentListItem>("/students", payload),
  updateInline: (studentId: string, payload: StudentInlineUpdatePayload) =>
    apiPatch<{ status: string; message: string }>(`/students/${studentId}`, payload)
} as const;
