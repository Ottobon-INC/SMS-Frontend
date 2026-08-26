export interface Subject {
  id: string;
  code: string;
  name: string;
  subjectType?: string;
  maxMarks: number;
  passMarks: number;
}

export interface Programme {
  id: string;
  code: string;
  name: string;
  streamCode?: string;
  coachingTrack?: string;
  displayLabel?: string;
  baseStreamLabel?: string;
  yearLevel: string;
  subjectIds?: string[];
}

export interface SubjectPayload {
  code: string;
  name: string;
  type: string;
  maxMarks: number;
  passMarks: number;
}

export interface ProgrammePayload {
  streamCode: string;
  coachingTrack: string;
  subjectIds: string[];
}

export interface ProgrammeUpdatePayload {
  subjectIds: string[];
  status?: "ACTIVE" | "INACTIVE";
}

export interface ProgrammeOptionStream {
  code: string;
  label: string;
  allowedTracks: string[];
  defaultSubjects: string[];
}

export interface ProgrammeOptions {
  streams: ProgrammeOptionStream[];
  coachingTracks: string[];
}

export interface AcademicYear {
  id: string;
  code: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: string;
  isDefault: boolean;
}

export interface AcademicYearPayload {
  name: string;
  code: string;
  startsOn: string;
  endsOn: string;
  isDefault: boolean;
}

export interface AcademicSection {
  id: string;
  code: string;
  name: string;
  capacity?: number | null;
  status: string;
}

export interface AcademicSectionBatch {
  id: string;
  code: string;
  name: string;
  yearLevel: string;
  sections: AcademicSection[];
}

export interface AcademicSectionPayload {
  batchId: string;
  section: string;
  capacity?: number | null;
}
