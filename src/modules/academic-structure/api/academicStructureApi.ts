import { apiGet, apiPost } from "../../../api/client/apiClient";
import type {
  AcademicYear,
  AcademicYearPayload,
  Programme,
  ProgrammePayload,
  Subject,
  SubjectPayload,
} from "../types";

export const academicStructureApi = {
  getSubjects(): Promise<Subject[]> {
    return apiGet<Subject[]>("/academic-structure/subjects");
  },

  createSubject(payload: SubjectPayload): Promise<Subject> {
    return apiPost<Subject>("/academic-structure/subjects", payload);
  },

  getProgrammes(): Promise<Programme[]> {
    return apiGet<Programme[]>("/academic-structure/programmes");
  },

  createProgramme(payload: ProgrammePayload): Promise<Programme> {
    return apiPost<Programme>("/academic-structure/programmes", payload);
  },

  getAcademicYears(): Promise<AcademicYear[]> {
    return apiGet<AcademicYear[]>("/academic-structure/academic-years");
  },

  createAcademicYear(payload: AcademicYearPayload): Promise<AcademicYear> {
    return apiPost<AcademicYear>("/academic-structure/academic-years", payload);
  },

  setDefaultAcademicYear(id: string): Promise<{ status: string; message?: string }> {
    return apiPost<{ status: string; message?: string }>(
      `/academic-structure/academic-years/${id}/default`,
      {},
    );
  }
} as const;
