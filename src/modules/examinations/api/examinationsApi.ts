import { Exam, ExamSubject, StudentExamRecord } from '../types';

const API_BASE_URL = '/api/v1/examinations';

export const examinationsApi = {
  async getExams(branchId?: string, status?: string): Promise<Exam[]> {
    try {
      const params = new URLSearchParams();
      if (branchId && branchId !== 'ALL') params.append('branch_id', branchId);
      if (status) params.append('status', status);

      const res = await fetch(`${API_BASE_URL}?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch exams');
      return await res.json();
    } catch (err) {
      console.warn('API connection failed, using local storage fallback:', err);
      const local = localStorage.getItem('sms_exams_fallback');
      return local ? JSON.parse(local) : [];
    }
  },

  async createExam(exam: Partial<Exam>, examSubjects: Partial<ExamSubject>[]): Promise<Exam> {
    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...exam, exam_subjects: examSubjects }),
      });
      if (!res.ok) throw new Error('Failed to create exam');
      return await res.json();
    } catch (err) {
      console.warn('API creation failed, saving locally:', err);
      const newExam = {
        ...exam,
        id: `exam-${Date.now()}`,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
      } as Exam;
      const existing = await this.getExams();
      const updated = [newExam, ...existing];
      localStorage.setItem('sms_exams_fallback', JSON.stringify(updated));
      return newExam;
    }
  },

  async checkOverlap(payload: {
    examDate: string;
    targetBranchIds: string[];
    programmeId: string;
    excludeExamId?: string;
  }): Promise<{ hasOverlap: boolean; conflictingExamName?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/check-overlap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_date: payload.examDate,
          target_branch_ids: payload.targetBranchIds,
          programme_id: payload.programmeId,
          exclude_exam_id: payload.excludeExamId,
        }),
      });
      if (!res.ok) throw new Error('Overlap check failed');
      const data = await res.json();
      return {
        hasOverlap: data.has_overlap,
        conflictingExamName: data.conflicting_exam_name,
      };
    } catch (err) {
      console.warn('Overlap check fallback:', err);
      return { hasOverlap: false };
    }
  },

  async exemptBranch(examId: string, branchId: string, reason: string): Promise<Exam> {
    const res = await fetch(`${API_BASE_URL}/${examId}/exempt-branch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch_id: branchId, reason }),
    });
    if (!res.ok) throw new Error('Exempt branch failed');
    return await res.json();
  },

  async returnForCorrection(examId: string, reason: string): Promise<Exam> {
    const res = await fetch(`${API_BASE_URL}/${examId}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Return exam failed');
    return await res.json();
  },

  async publishExam(examId: string): Promise<Exam> {
    const res = await fetch(`${API_BASE_URL}/${examId}/publish`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Publish exam failed');
    return await res.json();
  },

  async getStudentExamRecords(examId: string, sectionId?: string): Promise<StudentExamRecord[]> {
    try {
      const params = new URLSearchParams();
      if (sectionId) params.append('section_id', sectionId);
      const res = await fetch(`${API_BASE_URL}/${examId}/records?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch exam records');
      return await res.json();
    } catch (err) {
      const local = localStorage.getItem(`sms_records_${examId}_${sectionId}`);
      return local ? JSON.parse(local) : [];
    }
  },

  async bulkSaveStudentExamRecords(examId: string, records: Partial<StudentExamRecord>[]): Promise<StudentExamRecord[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/${examId}/records/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      if (!res.ok) throw new Error('Failed to bulk save records');
      return await res.json();
    } catch (err) {
      console.warn('Bulk save fallback:', err);
      const sectionId = records[0]?.sectionId;
      localStorage.setItem(`sms_records_${examId}_${sectionId}`, JSON.stringify(records));
      return records as StudentExamRecord[];
    }
  },
  async getBranches(): Promise<{ id: string; name: string; code: string }[]> {
    try {
      const res = await fetch('/api/v1/branches');
      if (!res.ok) throw new Error('Failed to fetch branches');
      return await res.json();
    } catch (err) {
      return [
        { id: '11111111-1111-1111-1111-111111111111', name: 'Hyderabad Main Campus', code: 'HYD-MAIN' },
        { id: '22222222-2222-2222-2222-222222222222', name: 'Vijayawada City Campus', code: 'VJY-CITY' },
        { id: '33333333-3333-3333-3333-333333333333', name: 'Visakhapatnam Campus', code: 'VIZAG' },
      ];
    }
  },

  async getSubjects(): Promise<{ id: string; code: string; name: string; maxMarks: number; passMarks: number }[]> {
    try {
      const res = await fetch('/api/v1/academic-structure/subjects');
      if (!res.ok) throw new Error('Failed to fetch subjects');
      return await res.json();
    } catch (err) {
      return [
        { id: '77777777-7777-7777-7777-777777777771', code: 'ENG-101', name: 'English 1', maxMarks: 100, passMarks: 35 },
        { id: '77777777-7777-7777-7777-777777777772', code: 'SAN-101', name: 'Sanskrit 1', maxMarks: 100, passMarks: 35 },
        { id: '77777777-7777-7777-7777-777777777773', code: 'MATH-1A', name: 'Mathematics 1A', maxMarks: 75, passMarks: 26 },
        { id: '77777777-7777-7777-7777-777777777774', code: 'PHY-101', name: 'Physics 1', maxMarks: 60, passMarks: 21 },
        { id: '77777777-7777-7777-7777-777777777775', code: 'CHEM-101', name: 'Chemistry 1', maxMarks: 60, passMarks: 21 },
      ];
    }
  },

  async getProgrammes(): Promise<{ id: string; code: string; name: string; yearLevel: string; subjectIds?: string[] }[]> {
    try {
      const res = await fetch('/api/v1/academic-structure/programmes');
      if (!res.ok) throw new Error('Failed to fetch programmes');
      return await res.json();
    } catch (err) {
      return [
        { id: '55555555-5555-5555-5555-555555555555', code: 'MPC', name: 'Maths, Physics, Chemistry', yearLevel: 'First Year', subjectIds: ['77777777-7777-7777-7777-777777777771', '77777777-7777-7777-7777-777777777772', '77777777-7777-7777-7777-777777777773', '77777777-7777-7777-7777-777777777774', '77777777-7777-7777-7777-777777777775'] },
        { id: '66666666-6666-6666-6666-666666666666', code: 'BiPC', name: 'Biology, Physics, Chemistry', yearLevel: 'First Year', subjectIds: ['77777777-7777-7777-7777-777777777771', '77777777-7777-7777-7777-777777777772', '77777777-7777-7777-7777-777777777774', '77777777-7777-7777-7777-777777777775'] },
      ];
    }
  },
};
