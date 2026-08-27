import React, { useState, useEffect, useMemo } from 'react';
import { examinationsApi } from '../api/examinationsApi';
import { Branch, Exam, ExamSubject, StudentExamRecord } from '../types';
import { Save, ArrowLeft, CheckCircle2, X, FileText, Check, Loader2, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../../authentication/providers/AuthProvider';
import { apiGet } from '../../../api/client/apiClient';

interface StudentItem {
  id: string;
  enrollmentId?: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
}

interface SectionItem {
  id: string;
  name: string;
  code?: string;
  batchId?: string | null;
  batchName?: string | null;
  batchYearLevel?: string | null;
  status?: 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'PENDING';
  studentCount?: number;
  enteredCount?: number;
}

interface StudentApiItem {
  id: string;
  enrollmentId?: string;
  admissionNumber?: string;
  studentNumber?: string;
  displayName?: string;
  name?: string;
}


export const ClassMarksEntryPage: React.FC<{ initialExamId?: string; onBack?: () => void }> = ({ initialExamId, onBack }) => {
  const auth = useAuth();
  const currentSummary = auth.availableContexts?.find(
    (c) => c.assignment_id === auth.activeContext?.assignment_id
  );
  const roleCode = currentSummary?.role?.code || auth.activeContext?.role_codes?.[0] || 'INSTITUTION_ADMIN';
  const isDean = roleCode === 'INSTITUTION_ADMIN' || roleCode === 'SUPER_ADMIN';
  const canPublish = auth.hasPermission('exam.publish');
  const userBranchId = auth.activeContext?.branch_id || currentSummary?.branch?.id;

  const [exams, setExams] = useState<Exam[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(isDean ? '' : (userBranchId || ''));
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [selectedStreamCode, setSelectedStreamCode] = useState<string>('ALL');

  const availableStreamCodes = useMemo(() => {
    const set = new Set<string>();
    sections.forEach((sec) => {
      const code = sec.name ? sec.name.split('-')[0] : '';
      if (code) set.add(code);
    });
    return Array.from(set);
  }, [sections]);

  const filteredSections = useMemo(() => {
    if (selectedStreamCode === 'ALL') return sections;
    return sections.filter((sec) => sec.name && sec.name.startsWith(selectedStreamCode));
  }, [sections, selectedStreamCode]);
  const [notification, setNotification] = useState<string | null>(null);

  const [recordsMap, setRecordsMap] = useState<Record<string, StudentExamRecord>>({});
  const [highlightUnmarked, setHighlightUnmarked] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<StudentItem | null>(null);

  // Unsaved Changes Navigation Guard state
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedWarningModal, setShowUnsavedWarningModal] = useState(false);
  const [pendingTargetSectionId, setPendingTargetSectionId] = useState<string | null>(null);

  const [sectionStudents, setSectionStudents] = useState<StudentItem[]>([]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  const allowedBranches = useMemo(() => {
    if (!selectedExam) return branches;
    const scope = selectedExam.scope || (selectedExam as any).scope;
    const targetId = selectedExam.branchId || (selectedExam as any).branch_id;
    const targetIds = selectedExam.branchIds || (selectedExam as any).branch_ids || [];
    const excludedIds = selectedExam.excludedBranchIds || (selectedExam as any).excluded_branch_ids || [];

    if (scope === 'SINGLE_BRANCH') {
      if (targetId) {
        const filtered = branches.filter((b) => b.id === targetId);
        if (filtered.length > 0) return filtered;
      }
    } else if (scope === 'SELECTED_BRANCHES') {
      if (targetIds.length > 0) {
        const filtered = branches.filter((b) => targetIds.includes(b.id));
        if (filtered.length > 0) return filtered;
      }
    } else if (scope === 'ALL_BRANCHES') {
      if (excludedIds.length > 0) {
        const filtered = branches.filter((b) => !excludedIds.includes(b.id));
        if (filtered.length > 0) return filtered;
      }
    }
    return branches;
  }, [branches, selectedExam]);


  // Batch 1 (Mount): Load Branches and Exams in parallel
  useEffect(() => {
    Promise.all([
      examinationsApi.getBranches(),
      examinationsApi.getExams(isDean ? undefined : (userBranchId || undefined)),
    ]).then(([bList, examList]) => {
      if (bList && bList.length > 0) {
        setBranches(bList);
        if (userBranchId && !isDean) {
          setSelectedBranchId(userBranchId);
        } else {
          setSelectedBranchId((curr) => curr || (userBranchId && bList.some((b) => b.id === userBranchId) ? userBranchId : bList[0].id));
        }
      }
      if (examList && examList.length > 0) {
        const validRealExams = examList.filter((e) => e.id && e.id.includes('-') && !e.id.startsWith('exam-'));
        const activeList = validRealExams.length > 0 ? validRealExams : examList;
        setExams(activeList);
        setSelectedExamId(() => {
          if (initialExamId && activeList.some((e) => e.id === initialExamId)) {
            return initialExamId;
          }
          return activeList[0].id;
        });
      }

    }).catch((err) => console.error('Failed to initialize branches/exams:', err));
  }, [userBranchId, isDean, initialExamId]);

  const [allExamSubjects, setAllExamSubjects] = useState<ExamSubject[]>([]);

  // Batch 2: Load ExamSubjects and Sections in parallel when selectedExamId or selectedBranchId changes
  useEffect(() => {
    if (!selectedExamId || selectedExamId.length < 30) return;

    // Auto-align selectedBranchId to exam's target branch UUID when a SINGLE_BRANCH exam is selected
    let effectiveBranchId = selectedBranchId;
    if (selectedExam) {
      const targetBranchUuid = selectedExam.branchId || (selectedExam as any).branch_id;
      if (targetBranchUuid && isDean && selectedBranchId !== targetBranchUuid) {
        effectiveBranchId = targetBranchUuid;
        setSelectedBranchId(targetBranchUuid);
      }
    }

    const fetchBranchId = !isDean ? userBranchId : (effectiveBranchId && effectiveBranchId !== 'ALL' ? effectiveBranchId : undefined);

    Promise.all([
      examinationsApi.getExamSubjects(selectedExamId),
      fetchBranchId ? apiGet(`/branches/${fetchBranchId}/sections?exam_id=${selectedExamId}`).catch(() => []) : Promise.resolve([]),
    ]).then(([subList, secList]) => {
      setAllExamSubjects(subList || []);
      const sectionsArray = (secList || []) as SectionItem[];
      setSections(sectionsArray);
      if (sectionsArray.length > 0) {
        setSelectedSectionId((curr) => (curr && sectionsArray.some((s) => s.id === curr) ? curr : sectionsArray[0].id));
      } else {
        setSelectedSectionId('');
      }
    }).catch((err) => console.error('Failed to load exam subjects/sections:', err));
  }, [selectedExamId, selectedBranchId, isDean, userBranchId, selectedExam]);

  // Stream-Aware Section Subject Filtering
  const displaySubjects = useMemo(() => {
    if (!selectedSectionId || allExamSubjects.length === 0) return allExamSubjects;
    const activeSec = sections.find((s) => s.id === selectedSectionId);
    if (!activeSec || !activeSec.name) return allExamSubjects;

    const streamCode = activeSec.name.split('-')[0].toUpperCase();

    const allowedKeywords: Record<string, string[]> = {
      BIPC: ['BOT', 'ZOO', 'PHY', 'CHE', 'ENG', 'SAN', 'TEL', 'BOTANY', 'BOTONY', 'ZOOLOGY', 'PHYSIC', 'PHISCIS', 'CHEMIS', 'ENGLISH'],
      MPC: ['MAT', 'MATH', 'PHY', 'CHE', 'ENG', 'SAN', 'TEL', 'MATHEMATIC', 'PHYSIC', 'PHISCIS', 'CHEMIS', 'ENGLISH'],
      CEC: ['CIV', 'COM', 'ECO', 'ENG', 'SAN', 'TEL', 'CIVIC', 'COMMERCE', 'ECONOM', 'ENGLISH'],
      MEC: ['MAT', 'MATH', 'COM', 'ECO', 'ENG', 'SAN', 'TEL', 'MATHEMATIC', 'COMMERCE', 'ECONOM', 'ENGLISH'],
      HEC: ['HIS', 'ECO', 'CIV', 'ENG', 'SAN', 'TEL', 'HISTORY', 'ECONOM', 'CIVIC', 'ENGLISH'],
    };

    const keywords = allowedKeywords[streamCode];
    if (!keywords) return allExamSubjects;

    const filtered = allExamSubjects.filter((sub) => {
      const nameUpper = (sub.subjectName || '').toUpperCase();
      const codeUpper = (sub.subjectCode || '').toUpperCase();
      return keywords.some((kw) => nameUpper.includes(kw) || codeUpper.includes(kw) || kw.includes(codeUpper));
    });

    return filtered.length > 0 ? filtered : allExamSubjects;
  }, [allExamSubjects, selectedSectionId, sections]);

  // Batch 3: Load Enrolled Students & Student Exam Records in parallel when selectedSectionId changes
  useEffect(() => {
    if (!selectedSectionId || !selectedExamId) {
      setSectionStudents([]);
      setRecordsMap({});
      return;
    }

    Promise.all([
      apiGet(`/students?section_id=${selectedSectionId}`).catch(() => []),
      examinationsApi.getStudentExamRecords(selectedExamId, selectedSectionId),
    ]).then(([stList, records]) => {
      const mappedStudents = ((stList || []) as StudentApiItem[]).map((student) => ({
        id: student.id,
        enrollmentId: student.enrollmentId || student.id,
        admissionNumber: student.admissionNumber || student.studentNumber || 'STD-001',
        firstName: student.displayName ? student.displayName.split(' ')[0] : student.name || 'Student',
        lastName: student.displayName && student.displayName.split(' ').length > 1 ? student.displayName.split(' ').slice(1).join(' ') : '',
      }));
      setSectionStudents(mappedStudents);

      const map: Record<string, StudentExamRecord> = {};
      (records || []).forEach((record) => {
        if (record.studentId) {
          map[record.studentId] = record;
        }
      });
      setRecordsMap(map);
    }).catch((err) => console.error('Failed to load section students/records:', err));
  }, [selectedSectionId, selectedExamId]);


  const handleSectionSwitchAttempt = (targetSecId: string) => {
    if (targetSecId === selectedSectionId) return;
    if (isDirty) {
      setPendingTargetSectionId(targetSecId);
      setShowUnsavedWarningModal(true);
    } else {
      setSelectedSectionId(targetSecId);
    }
  };

  const confirmSwitchWithoutSaving = () => {
    if (pendingTargetSectionId) {
      setSelectedSectionId(pendingTargetSectionId);
      setPendingTargetSectionId(null);
    }
    setIsDirty(false);
    setShowUnsavedWarningModal(false);
  };

  const handleMarkInput = (studentId: string, subjectId: string, value: number, maxMarks: number) => {
    let finalVal = value;
    if (finalVal >= 0 && finalVal > maxMarks) finalVal = maxMarks;

    const targetStudent = sectionStudents.find((s) => s.id === studentId);
    const validEnrollmentId = targetStudent?.enrollmentId || studentId;

    setIsDirty(true);
    setRecordsMap((prev) => {
      const current = prev[studentId] || {
        id: `${selectedExamId}-${studentId}`,
        examId: selectedExamId,
        enrollmentId: validEnrollmentId,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.getElementById(`mark-input-${rowIndex + 1}-${colIndex}`);
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`mark-input-${rowIndex - 1}-${colIndex}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      let targetRow = rowIndex;
      let targetCol = colIndex + 1;
      if (targetCol >= displaySubjects.length) {
        targetRow = rowIndex + 1;
        targetCol = 0;
      }
      const nextInput = document.getElementById(`mark-input-${targetRow}-${targetCol}`);
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      let targetRow = rowIndex;
      let targetCol = colIndex - 1;
      if (targetCol < 0) {
        targetRow = rowIndex - 1;
        targetCol = displaySubjects.length - 1;
      }
      const prevInput = document.getElementById(`mark-input-${targetRow}-${targetCol}`);
      if (prevInput) prevInput.focus();
    }
  };

  const reloadSections = async () => {
    const fetchBranchId = !isDean ? userBranchId : (selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : undefined);
    if (!fetchBranchId || !selectedExamId) return;
    try {
      const secList = (await apiGet(`/branches/${fetchBranchId}/sections?exam_id=${selectedExamId}`)) as SectionItem[];
      if (secList) {
        setSections(secList);
      }
    } catch (err) {
      console.error('Failed to reload sections overview:', err);
    }
  };

  const handleSaveDraft = async () => {
    if (sectionStudents.length === 0) {
      setNotification('No enrolled students in this section to save.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsSavingDraft(true);
    const list = sectionStudents.map((st) => {
      const existing = recordsMap[st.id];
      const validEnrollmentId = st.enrollmentId || st.id;
      if (existing) {
        const cleanEnr = existing.enrollmentId && !existing.enrollmentId.startsWith('enr-') ? existing.enrollmentId : validEnrollmentId;
        return { ...existing, sectionId: selectedSectionId, enrollmentId: cleanEnr, status: 'DRAFT' as const };
      }
      return {
        id: `${selectedExamId}-${st.id}`,
        examId: selectedExamId,
        enrollmentId: validEnrollmentId,
        studentId: st.id,
        sectionId: selectedSectionId,
        subjectMarks: {},
        status: 'DRAFT' as const,
        enteredBy: 'Staff User',
        updatedAt: new Date().toISOString(),
      };
    });
    await examinationsApi.bulkSaveStudentExamRecords(selectedExamId, list);
    setIsDirty(false);
    setNotification('Draft class marks saved successfully!');
    setIsSavingDraft(false);
    await new Promise((r) => setTimeout(r, 250));
    await reloadSections();
    setTimeout(() => setNotification(null), 4000);
    if (showUnsavedWarningModal && pendingTargetSectionId) {
      setSelectedSectionId(pendingTargetSectionId);
      setPendingTargetSectionId(null);
      setShowUnsavedWarningModal(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (sectionStudents.length === 0) {
      setNotification('No enrolled students in this section to submit.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    if (totalUnmarked > 0) {
      setHighlightUnmarked(true);
      setNotification(`⚠️ ${totalUnmarked} unmarked cell(s) remaining. Please enter a mark score or assign [A] / [E].`);
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setIsSubmitting(true);
    const list = sectionStudents.map((st) => {
      const existing = recordsMap[st.id];
      const validEnrollmentId = st.enrollmentId || st.id;
      if (existing) {
        const cleanEnr = existing.enrollmentId && !existing.enrollmentId.startsWith('enr-') ? existing.enrollmentId : validEnrollmentId;
        return { ...existing, sectionId: selectedSectionId, enrollmentId: cleanEnr, status: 'SUBMITTED' as const };
      }
      return {
        id: `${selectedExamId}-${st.id}`,
        examId: selectedExamId,
        enrollmentId: validEnrollmentId,
        studentId: st.id,
        sectionId: selectedSectionId,
        subjectMarks: {},
        status: 'SUBMITTED' as const,
        enteredBy: 'Staff User',
        updatedAt: new Date().toISOString(),
      };
    });
    await examinationsApi.bulkSaveStudentExamRecords(selectedExamId, list);
    setIsDirty(false);

    const currentSec = sections.find((s) => s.id === selectedSectionId);
    const secName = currentSec ? currentSec.name : 'Selected Section';
    const successMsg = canPublish 
      ? `Class marks for section ${secName} locked and saved!` 
      : `Class marks for section ${secName} submitted to Principal for review!`;
    setNotification(successMsg);
    setIsSubmitting(false);
    await new Promise((r) => setTimeout(r, 250));
    await reloadSections();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUnlockSection = async () => {
    if (!selectedSectionId || sectionStudents.length === 0) return;
    setIsUnlocking(true);
    const list = sectionStudents.map((st) => {
      const existing = recordsMap[st.id];
      const validEnrollmentId = st.enrollmentId || st.id;
      if (existing) {
        const cleanEnr = existing.enrollmentId && !existing.enrollmentId.startsWith('enr-') ? existing.enrollmentId : validEnrollmentId;
        return { ...existing, sectionId: selectedSectionId, enrollmentId: cleanEnr, status: 'DRAFT' as const };
      }
      return {
        id: `${selectedExamId}-${st.id}`,
        examId: selectedExamId,
        enrollmentId: validEnrollmentId,
        studentId: st.id,
        sectionId: selectedSectionId,
        subjectMarks: {},
        status: 'DRAFT' as const,
        enteredBy: 'Staff User',
        updatedAt: new Date().toISOString(),
      };
    });
    await examinationsApi.bulkSaveStudentExamRecords(selectedExamId, list);
    setIsDirty(false);
    const currentSec = sections.find((s) => s.id === selectedSectionId);
    const secName = currentSec ? currentSec.name : 'Selected Section';
    setNotification(`🔓 Section ${secName} unlocked! All staff, Principal, and Dean can now edit marks.`);
    setIsUnlocking(false);
    await new Promise((r) => setTimeout(r, 250));
    await reloadSections();
    setTimeout(() => setNotification(null), 4000);
  };



  // Live Summary Stats
  const totalStudents = sectionStudents.length;
  let totalAbsentees = 0;
  let totalUnmarked = 0;

  sectionStudents.forEach((st) => {
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

  // Role-Based Access Control (RBAC) Scoping
  
  const activeSec = sections.find((s) => s.id === selectedSectionId);
  const activeSectionStatus = activeSec?.status || 'DRAFT';
  const isLockedForTeacher = 
    (activeSectionStatus === 'SUBMITTED' || activeSectionStatus === 'PUBLISHED') &&
    selectedExam?.status !== 'RETURNED_FOR_CORRECTION';

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

      {/* Rich Aesthetics Header Card & Campus Switcher */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-indigo-50/60 p-5 rounded-3xl border border-teal-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-teal-800 font-semibold">
              {onBack && (
                <button
                  onClick={onBack}
                  className="hover:text-teal-950 flex items-center gap-1 font-bold transition cursor-pointer bg-white/80 hover:bg-white px-2.5 py-1 rounded-xl border border-teal-200/60 shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-teal-700" />
                  <span>Exams Dashboard</span>
                </button>
              )}
              <span>/</span>
              <span className="text-teal-700 font-medium">Class Subject Marks Matrix Entry</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 pt-0.5">
              <span>{selectedExam?.name || 'Assessment Marks Entry'}</span>
              {selectedExam?.type && (
                <span className="text-sm font-bold text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-xl border border-teal-200">
                  {selectedExam.type}
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {selectedExam && (
              <span className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-wide border shadow-2xs ${
                selectedExam.status === 'PUBLISHED' ? 'bg-emerald-600 text-white border-emerald-700' :
                selectedExam.status === 'SUBMITTED' ? 'bg-blue-600 text-white border-blue-700' :
                'bg-amber-500 text-white border-amber-600'
              }`}>
                {selectedExam.status}
              </span>
            )}
          </div>
        </div>

        {selectedExam && (
          <div className="pt-3 border-t border-teal-200/60 flex flex-wrap items-center gap-4 text-xs text-slate-700 font-medium">
            <span className="flex items-center gap-1.5 font-bold text-slate-800 bg-white/80 px-2.5 py-1 rounded-xl border border-slate-200/80">
              📍 Scope: <strong className="text-teal-900 font-bold">{(selectedExam.scope || (selectedExam as any).scope) === 'SINGLE_BRANCH' ? 'Single Campus' : (selectedExam.scope || (selectedExam as any).scope) === 'SELECTED_BRANCHES' ? 'Multi-Campus' : 'All-Institution'}</strong>
            </span>

            <span className="text-teal-300">•</span>

            {/* Interactive Campus Switcher for Dean / Multi-Branch Viewers */}
            <div className="flex items-center gap-1.5 font-bold text-teal-900 bg-white px-3 py-1 rounded-xl border border-teal-300 shadow-2xs">
              <span>🏫 Campus Branch:</span>
              {branches.length > 1 ? (
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-teal-50 border border-teal-300 rounded-lg px-2.5 py-0.5 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <strong className="text-slate-900 font-black">
                  {branches.find((b) => b.id === (selectedBranchId || selectedExam.branchId))?.name || 'Main Campus'}
                </strong>
              )}
            </div>

            {selectedExam.examDate && (
              <>
                <span className="text-teal-300">•</span>
                <span className="flex items-center gap-1 font-semibold text-slate-800 bg-white/80 px-2.5 py-1 rounded-xl border border-slate-200/80">
                  📅 Exam Date: <strong className="text-teal-700 font-bold">{selectedExam.examDate}</strong>
                </span>
              </>
            )}
          </div>
        )}
      </div>


      {/* Section Overview Cards */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Exam Class Sections Overview</h2>
          <span className="text-xs text-slate-400 font-medium">Click a section card to open its marks matrix</span>
        </div>

        {/* Stream / Batch Filter Bar */}
        {sections.length > 0 && (
          <div className="flex items-center gap-2 pt-1 pb-2 border-b border-slate-100 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Filter Batch:</span>
            <button
              type="button"
              onClick={() => setSelectedStreamCode('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedStreamCode === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>All Batches</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[10px]">{sections.length}</span>
            </button>
            {availableStreamCodes.map((code) => {
              const count = sections.filter((s) => s.name && s.name.startsWith(code)).length;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedStreamCode(code)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    selectedStreamCode === code
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>📦 {code} Batch</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${selectedStreamCode === code ? 'bg-teal-700' : 'bg-slate-200 text-slate-700'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {filteredSections.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-medium">
            No class sections found matching the selected stream/batch filter.
          </div>
        ) : (
          (() => {
            const firstYearSections = filteredSections.filter(
              (sec) => sec.batchYearLevel === '1' || sec.batchYearLevel === 'First Year' || (sec.name && (sec.name.includes('-1') || sec.name.toLowerCase().includes('1st') || sec.name.toLowerCase().includes('jr')))
            );
            const secondYearSections = filteredSections.filter(
              (sec) => sec.batchYearLevel === '2' || sec.batchYearLevel === 'Second Year' || (sec.name && (sec.name.includes('-2') || sec.name.toLowerCase().includes('2nd') || sec.name.toLowerCase().includes('sr')))
            );
            const remainingSections = filteredSections.filter(
              (sec) => !firstYearSections.includes(sec) && !secondYearSections.includes(sec)
            );

            // Helper to render a section card
            const renderSectionCard = (sec: SectionItem, yearTheme: '1st' | '2nd' | 'general') => {
              const isSelected = sec.id === selectedSectionId;
              const streamCode = sec.name ? sec.name.split('-')[0] : 'General';
              const batchLabel = sec.batchName || `${streamCode} Batch`;
              const badgeThemeClass = yearTheme === '1st'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : yearTheme === '2nd'
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                : 'bg-teal-50 text-teal-800 border-teal-200';

              return (
                <div
                  key={sec.id}
                  onClick={() => handleSectionSwitchAttempt(sec.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? yearTheme === '2nd'
                        ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-300 shadow-xs'
                        : 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-300 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-sm text-slate-900">{sec.name}</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 mt-0.5 border rounded-md text-[10px] font-bold w-fit ${badgeThemeClass}`}>
                        <span>📦</span>
                        <span>{batchLabel}</span>
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (sec.studentCount ?? 0) === 0
                          ? 'bg-slate-200 text-slate-700'
                          : sec.status === 'SUBMITTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sec.status === 'DRAFT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {(sec.studentCount ?? 0) === 0 ? 'EXEMPTED' : sec.status ?? 'PENDING'}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 flex justify-between pt-2 border-t border-slate-100">
                    <span>Enrolled: <strong>{sec.studentCount ?? 0}</strong></span>
                    <span>
                      Entered:{' '}
                      <strong>
                        {(sec.studentCount ?? 0) === 0
                          ? 'N/A'
                          : `${sec.enteredCount ?? 0}/${sec.studentCount ?? 0}`}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-4">
                {/* First Year Container Box */}
                {(firstYearSections.length > 0 || (secondYearSections.length === 0 && remainingSections.length === 0)) && (
                  <div className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-200/60 space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-emerald-100">
                      <span className="p-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">🎓 1st Year</span>
                      <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">First Year Classes (Junior Intermediate)</h3>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full ml-auto">
                        {firstYearSections.length} Classroom{firstYearSections.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {firstYearSections.map((sec) => renderSectionCard(sec, '1st'))}
                      {firstYearSections.length === 0 && (
                        <div className="col-span-full py-4 text-center text-xs text-slate-400 font-medium">No 1st Year class sections provisioned.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Second Year Container Box */}
                {secondYearSections.length > 0 && (
                  <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-200/60 space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-indigo-100">
                      <span className="p-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">🎓 2nd Year</span>
                      <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Second Year Classes (Senior Intermediate)</h3>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-full ml-auto">
                        {secondYearSections.length} Classroom{secondYearSections.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {secondYearSections.map((sec) => renderSectionCard(sec, '2nd'))}
                    </div>
                  </div>
                )}

                {/* General/Unclassified Container Box (Fallback) */}
                {remainingSections.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                      <span className="p-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">🏫 General</span>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Other Classrooms</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {remainingSections.map((sec) => renderSectionCard(sec, 'general'))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>

      {/* Live Metrics Header Bar */}
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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 overflow-x-auto pb-16">
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
            {sectionStudents.map((st, rowIndex) => {
              const rec = recordsMap[st.id] || Object.values(recordsMap).find((record) => record.studentId === st.id);
              const marks = rec?.subjectMarks || {};

              return (
                <tr key={st.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-bold text-slate-500">{st.admissionNumber || st.id.slice(0, 6)}</td>
                  <td className="p-3 font-bold text-slate-900">{st.firstName} {st.lastName}</td>

                  {displaySubjects.map((sub, colIndex) => {
                    let val = marks[sub.subjectId] ?? marks[sub.subjectCode] ?? marks[sub.id];
                    if (val === undefined && marks) {
                      const matchedKey = Object.keys(marks).find(
                        (k) =>
                          k === sub.subjectId ||
                          k === sub.subjectCode ||
                          k === sub.id ||
                          k.toLowerCase() === (sub.subjectCode || '').toLowerCase()
                      );
                      if (matchedKey !== undefined) val = marks[matchedKey];
                    }

                    const isAbsent = val === -1;
                    const isExempt = val === -2;
                    const isMissing = highlightUnmarked && (val === undefined || val === null || val < -2);

                    return (
                      <td key={sub.id} className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            id={`mark-input-${rowIndex}-${colIndex}`}
                            name={`score-${st.id}-${sub.subjectId}`}
                            aria-label={`Score for ${st.firstName} ${st.lastName} in ${sub.subjectName}`}
                            type="number"
                            min={0}
                            max={sub.maximumMarks}
                            placeholder="Score"
                            value={val !== undefined && val >= 0 ? val : ''}
                            onWheel={(e) => e.currentTarget.blur()}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            onChange={(e) => {
                              const v = e.target.value === '' ? -99 : Number(e.target.value);
                              if (v >= 0) handleMarkInput(st.id, sub.subjectId || sub.id, v, sub.maximumMarks);
                            }}
                            disabled={isLockedForTeacher || isAbsent || isExempt}
                            className={`w-20 px-2.5 py-1.5 text-center text-xs font-mono font-bold rounded-xl border outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-75 ${
                              isAbsent
                                ? 'bg-amber-100 border-amber-300 text-amber-900 placeholder:text-amber-900 font-extrabold'
                                : isExempt
                                ? 'bg-blue-100 border-blue-300 text-blue-900 placeholder:text-blue-900 font-extrabold'
                                : isMissing
                                ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-200'
                                : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-slate-900'
                            }`}
                          />
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMarkInput(st.id, sub.subjectId || sub.id, isAbsent ? 0 : -1, sub.maximumMarks)}
                              disabled={isLockedForTeacher}
                              className={`px-1 py-0.5 text-[9px] font-extrabold rounded transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                isAbsent ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                              title="Mark Absent"
                            >
                              A
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkInput(st.id, sub.subjectId || sub.id, isExempt ? 0 : -2, sub.maximumMarks)}
                              disabled={isLockedForTeacher}
                              className={`px-1 py-0.5 text-[9px] font-extrabold rounded transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                isExempt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                              title="Mark Exempt"
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

            {sectionStudents.length === 0 && (
              <tr>
                <td colSpan={3 + displaySubjects.length} className="p-8 text-center text-slate-400 font-medium">
                  No enrolled students found in this section yet. Import or enroll students to enter marks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* STICKY FLOATING ACTION BAR FOR MARKS SUBMISSION */}
      <div className="fixed bottom-5 right-8 z-30 bg-white/95 backdrop-blur-md p-3 px-4 rounded-2xl border border-slate-200 shadow-2xl flex items-center gap-3">
        {isLockedForTeacher && (
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" /> {canPublish ? 'Read-Only (Locked & Saved)' : 'Read-Only (Submitted to Principal)'}
          </span>
        )}

        {canPublish && (activeSectionStatus === 'SUBMITTED' || activeSectionStatus === 'PUBLISHED') && (
          <button
            type="button"
            onClick={handleUnlockSection}
            disabled={isUnlocking}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition active:scale-95"
            title="Re-open section marks so Office Staff, Teachers, and Principals can edit"
          >
            {isUnlocking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>Unlock Section for Editing</span>
          </button>
        )}

        {isDirty && !isLockedForTeacher && (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 animate-pulse">
            ⚠️ Unsaved Changes
          </span>
        )}

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSavingDraft || isSubmitting || isLockedForTeacher}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-slate-500" />}
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          onClick={handleSubmitForReview}
          disabled={isSavingDraft || isSubmitting || isLockedForTeacher}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
        >
          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          <span>{canPublish ? 'Submit Class Marks' : 'Submit to Principal'}</span>
        </button>
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
                  const rec =
                    recordsMap[previewStudent.id] ||
                    Object.values(recordsMap).find((record) => record.studentId === previewStudent.id);
                  const marks = rec?.subjectMarks || {};
                  let m = marks[sub.subjectId] ?? marks[sub.subjectCode] ?? marks[sub.id];
                  if (m === undefined && marks) {
                    const matchedKey = Object.keys(marks).find(
                      (k) => k === sub.subjectId || k === sub.subjectCode || k === sub.id || k.toLowerCase() === (sub.subjectCode || '').toLowerCase()
                    );
                    if (matchedKey !== undefined) m = marks[matchedKey];
                  }

                  return (
                    <tr key={sub.id}>
                      <td className="p-2.5 font-semibold text-slate-800">{sub.subjectName}</td>
                      <td className="p-2.5 text-center font-mono">{sub.maximumMarks}</td>
                      <td className="p-2.5 text-center font-mono">{sub.passMarks}</td>
                      <td className="p-2.5 text-center font-bold font-mono">
                        {m === -1 ? <span className="text-amber-600 font-extrabold">ABSENT</span> : m === -2 ? <span className="text-blue-600 font-extrabold">EXEMPTED</span> : m !== undefined && m >= 0 ? m : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {(() => {
              let totalObtained = 0;
              let totalMax = 0;
              let isOverallPass = true;

              const rec =
                recordsMap[previewStudent.id] ||
                Object.values(recordsMap).find((record) => record.studentId === previewStudent.id);
              const marks = rec?.subjectMarks || {};

              displaySubjects.forEach((sub) => {
                let m = marks[sub.subjectId] ?? marks[sub.subjectCode] ?? marks[sub.id];
                if (m === undefined && marks) {
                  const matchedKey = Object.keys(marks).find(
                    (k) => k === sub.subjectId || k === sub.subjectCode || k === sub.id || k.toLowerCase() === (sub.subjectCode || '').toLowerCase()
                  );
                  if (matchedKey !== undefined) m = marks[matchedKey];
                }

                if (m !== undefined && m >= 0) {
                  totalObtained += m;
                  totalMax += sub.maximumMarks;
                  if (m < sub.passMarks) isOverallPass = false;
                }
              });

              const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

              return (
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Score</span>
                    <strong className="text-sm font-black font-mono text-slate-900">{totalObtained} / {totalMax}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Percentage</span>
                    <strong className="text-sm font-black font-mono text-teal-700">{pct.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Result</span>
                    <strong className={`text-sm font-black ${isOverallPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isOverallPass ? 'PASSED 🎉' : 'FAIL'}
                    </strong>
                  </div>
                </div>
              );
            })()}

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

      {/* UNSAVED CHANGES NAVIGATION GUARD MODAL */}
      {showUnsavedWarningModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <Save className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Unsaved Class Marks Warning</h3>
                <p className="text-xs text-slate-500">You have unsaved mark entries for the current section.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-5">
              Switching sections before saving will discard your newly typed student scores. What would you like to do?
            </p>

            <div className="flex flex-col gap-2 pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Draft & Switch Section
              </button>

              <button
                type="button"
                onClick={confirmSwitchWithoutSaving}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition cursor-pointer"
              >
                Discard Unsaved Changes & Switch
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUnsavedWarningModal(false);
                  setPendingTargetSectionId(null);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancel & Stay on Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
