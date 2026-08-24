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
  coachingTrack?: string;
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
  code: string;
  name: string;
  coachingTrack: string;
  yearLevel: string;
  subjectIds: string[];
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
