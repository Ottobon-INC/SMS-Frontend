export type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE" | "UNMARKED";
export type SessionStatus = "DRAFT" | "SUBMITTED" | "FINALIZED";

export interface AttendanceStudentResponse {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string | null;
  rollNumber?: string | null;
  attendanceStatus: AttendanceStatus;
  note?: string | null;
}

export interface AttendanceSessionListItem {
  id: string;
  tenantId: string;
  branchId: string;
  academicYearId: string;
  sectionId: string;
  sectionName: string;
  batchName: string;
  programmeName?: string;
  attendanceDate: string;
  status: SessionStatus;
  openedBy: string;
  submittedBy?: string | null;
  submittedAt?: string | null;
  finalizedBy?: string | null;
  finalizedAt?: string | null;
}

export interface AttendanceSessionResponse {
  id: string;
  tenantId: string;
  branchId: string;
  academicYearId: string;
  sectionId: string;
  attendanceDate: string;
  status: SessionStatus;
  openedBy: string;
  submittedBy?: string | null;
  submittedAt?: string | null;
  finalizedBy?: string | null;
  finalizedAt?: string | null;
  revisionReason?: string | null;
  students: AttendanceStudentResponse[];
}

export interface AttendanceSessionCreate {
  sectionId: string;
  attendanceDate: string; // YYYY-MM-DD
}

export interface AttendanceRecordUpdate {
  enrollmentId: string;
  attendanceStatus: AttendanceStatus;
  note?: string | null;
}

export interface AttendanceDraftSavePayload {
  records: AttendanceRecordUpdate[];
}

// Academic Lookup Types from importsApi
export interface LookupItem {
  id: string;
  name: string;
  code?: string;
}

export interface ProgrammeLookup {
  id: string;
  code: string;
  name: string;
  yearLevel: string;
}
