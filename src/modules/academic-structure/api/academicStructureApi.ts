import { apiGet, apiPost } from "../../../api/client/apiClient";
import type { Programme, ProgrammePayload, Subject, SubjectPayload } from "../types";

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
  }
} as const;
