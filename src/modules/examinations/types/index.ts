export interface Exam {
  id: string;
  institutionId?: string;
  scope?: 'ALL_BRANCHES' | 'SELECTED_BRANCHES' | 'SINGLE_BRANCH';
  branchId?: string;
  branchIds?: string[];
  excludedBranchIds?: string[];
  exemptionReasons?: Record<string, string>;
  academicYearId: string;
  programmeId: string;
  programmeIds?: string[];
  name: string;
  type: string;
  examDate: string;
  marksEntryDeadline?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'RETURNED_FOR_CORRECTION' | 'PUBLISHED';
  marksSummary?: {
    pending: number;
    draft: number;
    submitted: number;
    published: number;
    exempted: number;
    total: number;
  };
  returnReason?: string;
  publishedAt?: string;
  publishedBy?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  examSubjects?: ExamSubject[];
}

export interface ExamSubject {
  id: string;
  examId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  maximumMarks: number;
  passMarks: number;
}

export interface StudentExamRecord {
  id: string;
  examId: string;
  enrollmentId: string;
  studentId: string;
  sectionId?: string;
  subjectMarks: Record<string, number>; // subjectId -> mark (-1: ABSENT, -2: EXEMPTED, -3: MALPRACTICE)
  status: 'DRAFT' | 'SUBMITTED' | 'RETURNED_FOR_CORRECTION' | 'PUBLISHED';
  enteredBy: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  maxMarks: number;
  passMarks: number;
  programmeId?: string;
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

export interface Branch {
  id: string;
  name: string;
  code: string;
}
