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
