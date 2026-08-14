import React, { useState, useEffect } from 'react';
import { examinationsApi } from '../api/examinationsApi';
import { Exam, ExamSubject, StudentExamRecord } from '../types';
import { Save, ArrowLeft, CheckCircle2, X, FileText, Check, Loader2 } from 'lucide-react';

interface StudentItem {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
}

export const ClassMarksEntryPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSectionId] = useState<string>('sec-mpc-a');
  const [notification, setNotification] = useState<string | null>(null);

  const [recordsMap, setRecordsMap] = useState<Record<string, StudentExamRecord>>({});
  const [highlightUnmarked, setHighlightUnmarked] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<StudentItem | null>(null);

  // Mock Students
  const mockStudents: StudentItem[] = [
    { id: 'st-01', admissionNumber: 'ADM-2026-001', firstName: 'Aarav', lastName: 'Sharma' },
    { id: 'st-02', admissionNumber: 'ADM-2026-002', firstName: 'Ananya', lastName: 'Reddy' },
    { id: 'st-03', admissionNumber: 'ADM-2026-003', firstName: 'Karthik', lastName: 'Venkatesh' },
    { id: 'st-04', admissionNumber: 'ADM-2026-004', firstName: 'Priya', lastName: 'Nair' },
  ];

  // Mock Subjects for selected exam
  const displaySubjects: ExamSubject[] = [
    { id: 'exsub-1', examId: selectedExamId, subjectId: 'sub-eng', subjectName: 'English 1', subjectCode: 'ENG-101', maximumMarks: 100, passMarks: 35 },
    { id: 'exsub-2', examId: selectedExamId, subjectId: 'sub-sans', subjectName: 'Sanskrit 1', subjectCode: 'SAN-101', maximumMarks: 100, passMarks: 35 },
    { id: 'exsub-3', examId: selectedExamId, subjectId: 'sub-m1a', subjectName: 'Maths 1A', subjectCode: 'MATH-1A', maximumMarks: 75, passMarks: 26 },
    { id: 'exsub-4', examId: selectedExamId, subjectId: 'sub-p1', subjectName: 'Physics 1', subjectCode: 'PHY-101', maximumMarks: 60, passMarks: 21 },
  ];

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  useEffect(() => {
    examinationsApi.getExams().then((list) => {
      setExams(list);
      if (list.length > 0) setSelectedExamId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    examinationsApi.getStudentExamRecords(selectedExamId, selectedSectionId).then((records) => {
      const map: Record<string, StudentExamRecord> = {};
      mockStudents.forEach((st) => {
        const existing = records.find((r) => r.studentId === st.id);
        if (existing) {
          map[st.id] = existing;
        } else {
          map[st.id] = {
            id: `ser-${selectedExamId}-${st.id}`,
            examId: selectedExamId,
            enrollmentId: `enr-${st.id}`,
            studentId: st.id,
            sectionId: selectedSectionId,
            subjectMarks: {},
            status: 'DRAFT',
            enteredBy: 'Staff User',
            updatedAt: new Date().toISOString(),
          };
        }
      });
      setRecordsMap(map);
    });
  }, [selectedExamId, selectedSectionId]);

  const handleMarkInput = (studentId: string, subjectId: string, value: number, maxMarks: number) => {
    let finalVal = value;
    if (finalVal >= 0 && finalVal > maxMarks) finalVal = maxMarks;

    setRecordsMap((prev) => {
      const current = prev[studentId] || {
        id: `ser-${selectedExamId}-${studentId}`,
        examId: selectedExamId,
        enrollmentId: `enr-${studentId}`,
        studentId,
        sectionId: selectedSectionId,
        subjectMarks: {},
        status: 'DRAFT',
        enteredBy: 'Staff User',
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        [studentId]: {
          ...current,
          subjectMarks: {
            ...current.subjectMarks,
            [subjectId]: finalVal,
          },
        },
      };
    });
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    const list = Object.values(recordsMap).map((r) => ({ ...r, status: 'DRAFT' as const }));
    await examinationsApi.bulkSaveStudentExamRecords(selectedExamId, list);
    setNotification('Draft class marks saved successfully!');
    setIsSavingDraft(false);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSubmitForReview = async () => {
    if (totalUnmarked > 0) {
      setHighlightUnmarked(true);
      setNotification(`⚠️ ${totalUnmarked} unmarked cell(s) remaining. Please enter a mark score or assign [A] / [E].`);
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setIsSubmitting(true);
    const list = Object.values(recordsMap).map((r) => ({ ...r, status: 'SUBMITTED' as const }));
    await examinationsApi.bulkSaveStudentExamRecords(selectedExamId, list);
    setNotification('Class marks submitted to Principal for review!');
    setIsSubmitting(false);
    setTimeout(() => setNotification(null), 4000);
  };

  // Live Summary Stats
  const totalStudents = mockStudents.length;
  let totalAbsentees = 0;
  let totalUnmarked = 0;

  mockStudents.forEach((st) => {
    const rec = recordsMap[st.id];
    if (!rec) {
      totalUnmarked++;
      return;
    }
    const marks = rec.subjectMarks || {};
    const filledCount = displaySubjects.filter((s) => marks[s.subjectId] !== undefined && marks[s.subjectId] !== null && marks[s.subjectId] >= -2).length;
    if (filledCount < displaySubjects.length) totalUnmarked++;
    if (Object.values(marks).some((v) => v === -1)) totalAbsentees++;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold max-w-md">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="flex-1">{notification}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Class Subject Marks Matrix Entry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Input assessment scores with 1-click status pills ([A] Absent, [E] Exempted) and submit for review.
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Exams
          </button>
        )}
      </div>

      {/* Selector & Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select Assessment</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            {isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-slate-500" />}
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleSubmitForReview}
            disabled={isSavingDraft || isSubmitting}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Submit to Principal</span>
          </button>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="p-3 bg-slate-50 rounded-xl text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Enrolled</span>
          <strong className="text-base text-slate-900 font-black">{totalStudents}</strong>
        </div>
        <div className="p-3 bg-amber-50 rounded-xl text-center border border-amber-100">
          <span className="text-[10px] font-bold uppercase text-amber-600 block mb-1">Absentees (-1)</span>
          <strong className="text-base text-amber-700 font-black">{totalAbsentees}</strong>
        </div>
        <div className="p-3 bg-purple-50 rounded-xl text-center border border-purple-100">
          <span className="text-[10px] font-bold uppercase text-purple-600 block mb-1">Unmarked Cells</span>
          <strong className="text-base text-purple-700 font-black">{totalUnmarked}</strong>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3">Adm No</th>
              <th className="p-3">Student Name</th>
              {displaySubjects.map((sub) => (
                <th key={sub.id} className="p-3 text-center min-w-[140px]">
                  <div>{sub.subjectName}</div>
                  <div className="text-[9px] text-slate-400 font-mono normal-case">
                    Max: {sub.maximumMarks} • Pass: {sub.passMarks}
                  </div>
                </th>
              ))}
              <th className="p-3 text-center">Report Card</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockStudents.map((st) => {
              const rec = recordsMap[st.id] || { subjectMarks: {} };
              const marks = rec.subjectMarks || {};

              return (
                <tr key={st.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-900">{st.admissionNumber}</td>
                  <td className="p-3 font-semibold text-slate-800">
                    {st.firstName} {st.lastName}
                  </td>

                  {displaySubjects.map((sub) => {
                    const val = marks[sub.subjectId];
                    const isAbsent = val === -1;
                    const isExempt = val === -2;

                    return (
                      <td key={sub.id} className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={sub.maximumMarks}
                            placeholder="Score"
                            value={val !== undefined && val >= 0 ? val : ''}
                            onChange={(e) => {
                              const v = e.target.value === '' ? -99 : Number(e.target.value);
                              if (v >= 0) handleMarkInput(st.id, sub.subjectId, v, sub.maximumMarks);
                            }}
                            className={`w-14 p-1.5 border rounded-lg text-center font-bold text-xs outline-none ${
                              isAbsent
                                ? 'bg-rose-100 text-rose-800 border-rose-300 font-black'
                                : isExempt
                                ? 'bg-slate-200 text-slate-700 border-slate-300'
                                : highlightUnmarked && (val === undefined || val === null || val < -2)
                                ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300 animate-pulse'
                                : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-2 focus:ring-teal-500'
                            }`}
                          />
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              title="Mark Absent (-1)"
                              onClick={() => handleMarkInput(st.id, sub.subjectId, isAbsent ? 0 : -1, sub.maximumMarks)}
                              className={`px-1.5 py-0.5 text-[9px] rounded font-bold transition-colors ${
                                isAbsent ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-rose-100'
                              }`}
                            >
                              A
                            </button>
                            <button
                              type="button"
                              title="Mark Exempt (-2)"
                              onClick={() => handleMarkInput(st.id, sub.subjectId, isExempt ? 0 : -2, sub.maximumMarks)}
                              className={`px-1.5 py-0.5 text-[9px] rounded font-bold transition-colors ${
                                isExempt ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              E
                            </button>
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  <td className="p-3 text-center">
                    <button
                      onClick={() => setPreviewStudent(st)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3 text-slate-500" /> Card
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* REPORT CARD MODAL */}
      {previewStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="text-center space-y-1 border-b border-slate-200 pb-4">
              <h2 className="font-black text-xl text-slate-900 tracking-wide">SRI VIGNAN INTERMEDIATE COLLEGE</h2>
              <p className="text-xs text-teal-700 font-bold uppercase">{selectedExam?.name} - Report Card</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-medium">
              <div>
                <p><span className="text-slate-400">Student:</span> <strong>{previewStudent.firstName} {previewStudent.lastName}</strong></p>
                <p><span className="text-slate-400">Adm No:</span> <strong className="font-mono">{previewStudent.admissionNumber}</strong></p>
              </div>
              <div className="text-right">
                <p><span className="text-slate-400">Exam Date:</span> <strong>{selectedExam?.examDate}</strong></p>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Subject</th>
                  <th className="p-2.5 text-center">Max Marks</th>
                  <th className="p-2.5 text-center">Pass Marks</th>
                  <th className="p-2.5 text-center">Marks Obtained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displaySubjects.map((sub) => {
                  const m = recordsMap[previewStudent.id]?.subjectMarks?.[sub.subjectId];
                  return (
                    <tr key={sub.id}>
                      <td className="p-2.5 font-semibold text-slate-800">{sub.subjectName}</td>
                      <td className="p-2.5 text-center font-mono">{sub.maximumMarks}</td>
                      <td className="p-2.5 text-center font-mono">{sub.passMarks}</td>
                      <td className="p-2.5 text-center font-bold font-mono">
                        {m === -1 ? <span className="text-rose-600">ABSENT</span> : m === -2 ? <span className="text-slate-500">EXEMPTED</span> : m !== undefined && m >= 0 ? m : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewStudent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-slate-800 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
