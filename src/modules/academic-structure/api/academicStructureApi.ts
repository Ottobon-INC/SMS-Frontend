import { apiGet, apiPatch, apiPost } from "../../../api/client/apiClient";
import type {
  AcademicYear,
  AcademicYearPayload,
  AcademicSection,
  AcademicSectionBatch,
  AcademicSectionPayload,
  Programme,
  ProgrammeOptions,
  ProgrammePayload,
  ProgrammeUpdatePayload,
  Subject,
  SubjectPayload,
} from "../types";

export const academicStructureApi = {
  getBranches(): Promise<{ id: string; name: string; code?: string }[]> {
    return apiGet<{ id: string; name: string; code?: string }[]>("/branches");
  },

  getBranchProgrammes(branchId: string): Promise<Programme[]> {
    return apiGet<Programme[]>(`/branches/${branchId}/programmes`);
  },

  assignBranchProgrammes(branchId: string, programmeIds: string[]): Promise<{ status: string; message?: string }> {
    return apiPost<{ status: string; message?: string }>(`/branches/${branchId}/programmes`, {
      programme_ids: programmeIds,
    });
  },

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

  updateProgramme(id: string, payload: ProgrammeUpdatePayload): Promise<Programme> {
    return apiPatch<Programme>(`/academic-structure/programmes/${id}`, payload);
  },

  getProgrammeOptions(): Promise<ProgrammeOptions> {
    return apiGet<ProgrammeOptions>("/academic-structure/programme-options");
  },

  getAcademicYears(): Promise<AcademicYear[]> {
    return apiGet<AcademicYear[]>("/academic-structure/academic-years");
  },

  createAcademicYear(payload: AcademicYearPayload): Promise<AcademicYear> {
    return apiPost<AcademicYear>("/academic-structure/academic-years", payload);
  },

  setDefaultAcademicYear(id: string): Promise<{ status: string; message?: string }> {
    return apiPatch<{ status: string; message?: string }>(
      `/academic-structure/academic-years/${id}/default`,
      {},
    );
  },

  getSections(params: {
    branchId: string;
    academicYearId: string;
    programmeId: string;
  }): Promise<AcademicSectionBatch[]> {
    const query = new URLSearchParams({
      branch_id: params.branchId,
      academic_year_id: params.academicYearId,
      programme_id: params.programmeId,
    });
    return apiGet<AcademicSectionBatch[]>(`/academic-structure/sections?${query.toString()}`);
  },

  createSection(payload: AcademicSectionPayload): Promise<AcademicSection> {
    return apiPost<AcademicSection>("/academic-structure/sections", payload);
  }
} as const;
