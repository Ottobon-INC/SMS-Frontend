import React, { useState, useEffect, useMemo } from 'react';
import { examinationsApi } from '../api/examinationsApi';
import { Exam, ExamSubject, Subject, Programme, Branch } from '../types';
import { GraduationCap, ShieldCheck, History, Plus, Calendar, CheckCircle2, X, Filter, AlertTriangle, FileWarning, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../authentication/providers/AuthProvider';
import { useNotificationProgress } from '../../notifications/hooks/useNotificationProgress';

function ExamDispatchPill({ examId }: { examId: string }) {
  const auth = useAuth();
  const canViewNotifs = auth.hasPermission('notification.view');
  const { progress } = useNotificationProgress(canViewNotifs ? examId : undefined);
  if (!canViewNotifs || !progress || progress.total_notifications === 0) return null;

  if (progress.is_ongoing) {
    return (
      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>
            🟡 WhatsApp Notifications Dispatching: {progress.completed_notifications}/{progress.total_notifications} Sent ({progress.progress_percentage}%)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-medium flex items-center justify-between">
      <span>
        ✅ WhatsApp Dispatches Complete: {progress.completed_notifications}/{progress.total_notifications} Delivered ({progress.progress_percentage}%)
      </span>
    </div>
  );
}

function programmeLabel(programme: Programme): string {
  return programme.displayLabel || programme.name || programme.code;
}

export const ExamsPage: React.FC<{ onNavigateToMarksEntry?: (examId?: string) => void }> = ({
  onNavigateToMarksEntry,
}) => {

  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showExemptBranchModal, setShowExemptBranchModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [examToPublish, setExamToPublish] = useState<string | null>(null);
  const [examToReturn, setExamToReturn] = useState<string | null>(null);
  const [examToExempt, setExamToExempt] = useState<string | null>(null);
  const [exemptBranchId, setExemptBranchId] = useState<string>('branch-hyd-main');
  const [exemptReason, setExemptReason] = useState('');

  const auth = useAuth();
  const currentSummary = auth.availableContexts?.find(
    (c) => c.assignment_id === auth.activeContext?.assignment_id
  );
  
  const isDean = auth.activeContext?.scope_type === 'TENANT';
  const canManage = auth.hasPermission('exam.manage');
  const canPublish = auth.hasPermission('exam.publish');
  
  const userBranchId = auth.activeContext?.branch_id || currentSummary?.branch?.id;
  const userBranchName = currentSummary?.branch?.name;

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(
    isDean ? 'ALL' : (userBranchId || '11111111-1111-1111-1111-111111111111')
  );
  const [academicYearId, setAcademicYearId] = useState<string>('');

  const [branches, setBranches] = useState<Branch[]>([
    { id: '11111111-1111-1111-1111-111111111111', name: 'Hyderabad Main Campus', code: 'HYD-MAIN' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Vijayawada City Campus', code: 'VJY-CITY' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Visakhapatnam Campus', code: 'VIZAG' },
  ]);

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loadingProgrammes, setLoadingProgrammes] = useState<boolean>(true);

  const [allSubjects, setAllSubjects] = useState<Subject[]>([
    { id: '77777777-7777-7777-7777-777777777771', code: 'ENG-101', name: 'English 1', maxMarks: 100, passMarks: 35 },
    { id: '77777777-7777-7777-7777-777777777772', code: 'SAN-101', name: 'Sanskrit 1', maxMarks: 100, passMarks: 35 },
    { id: '77777777-7777-7777-7777-777777777773', code: 'MATH-1A', name: 'Mathematics 1A', maxMarks: 75, passMarks: 26 },
    { id: '77777777-7777-7777-7777-777777777774', code: 'PHY-101', name: 'Physics 1', maxMarks: 60, passMarks: 21 },
    { id: '77777777-7777-7777-7777-777777777775', code: 'CHEM-101', name: 'Chemistry 1', maxMarks: 60, passMarks: 21 },
  ]);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  // Dynamic Master Data Loading from Live Backend APIs
  useEffect(() => {
    examinationsApi.getBranches().then((b) => {
      if (b && b.length > 0) {
        setBranches(b);
        if (userBranchId && !isDean) {
          setSelectedBranchId(userBranchId);
        } else {
          setSelectedBranchId((current) => (current && b.some((branch) => branch.id === current)) ? current : (userBranchId && b.some(branch => branch.id === userBranchId) ? userBranchId : b[0].id));
        }
        setSelectedBranchIds((current) => current.length > 0 && current.every((id) => b.some((branch) => branch.id === id)) ? current : [b[0].id]);
      }
    });
    examinationsApi.getSubjects().then((s) => {
      if (s && s.length > 0) setAllSubjects(s);
    });
    examinationsApi.getAcademicYears().then((years) => {
      if (years && years.length > 0) {
        setAcademicYears(years);
        const activeYear = years.find((year) => year.isDefault) ?? years[0];
        if (activeYear) setAcademicYearId(activeYear.id);
      }
    });
  }, [userBranchId, isDean]);

  useEffect(() => {
    const fetchBranchId = !isDean ? userBranchId : (selectedBranchFilter !== 'ALL' ? selectedBranchFilter : undefined);
    examinationsApi.getExams(fetchBranchId || undefined).then((list) => {
      setExams(list);
      setLoading(false);
    });
  }, [userBranchId, isDean, selectedBranchFilter]);

  // Modal State for New Exam Creation
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('Quarterly Exam');
  const [examDate, setExamDate] = useState('2026-08-20');
  const [examScope, setExamScope] = useState<'ALL_BRANCHES' | 'SELECTED_BRANCHES' | 'SINGLE_BRANCH'>('SINGLE_BRANCH');
  const [selectedBranchId, setSelectedBranchId] = useState(userBranchId || branches[0]?.id || '11111111-1111-1111-1111-111111111111');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([userBranchId || branches[0]?.id || '11111111-1111-1111-1111-111111111111']);
  const [selectedProgrammeIds, setSelectedProgrammeIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [overlapError, setOverlapError] = useState<string | null>(null);

  const [subjectConfigs, setSubjectConfigs] = useState<Record<string, { maxMarks: number; passMarks: number }>>({});
  const [optedOutSubjectIds, setOptedOutSubjectIds] = useState<string[]>([]);

  // Dynamically re-filter available programmes based on selected audience scope, branches & academic year
  useEffect(() => {
    let fetchPromises: Promise<Programme[]>[];

    setLoadingProgrammes(true);
    if (examScope === 'ALL_BRANCHES') {
      fetchPromises = [
        examinationsApi.getBranchProgrammes('ALL', academicYearId || undefined),
      ];
    } else if (examScope === 'SELECTED_BRANCHES') {
      if (selectedBranchIds.length === 0) {
        setLoadingProgrammes(false);
        return;
      }
      fetchPromises = selectedBranchIds.map((bId) =>
        examinationsApi.getBranchProgrammes(bId, academicYearId || undefined)
      );
    } else {
      if (!selectedBranchId) {
        setLoadingProgrammes(false);
        return;
      }
      fetchPromises = [
        examinationsApi.getBranchProgrammes(selectedBranchId, academicYearId || undefined),
      ];
    }

    Promise.all(fetchPromises)
      .then((results) => {
        const combined = results.flat();
        const uniqueProgsMap = new Map<string, Programme>();
        combined.forEach((p) => {
          if (p && (p.code || p.id)) {
            const yl = p.yearLevel || (p as any).year_level || (p as any).yearLevel || 'First Year';
            const key = `${p.code || p.name}-${yl}`;
            if (!uniqueProgsMap.has(key)) {
              uniqueProgsMap.set(key, { ...p, id: key, yearLevel: yl });
            }
          }
        });
        const branchProgs = Array.from(uniqueProgsMap.values());

        if (branchProgs.length > 0) {
          setProgrammes(branchProgs);
          setSelectedProgrammeIds((prev) => {
            const valid = prev.filter((id) => branchProgs.some((bp) => bp.id === id));
            return valid.length > 0 ? valid : [branchProgs[0].id];
          });
        }
        setLoadingProgrammes(false);
      })
      .catch((err) => {
        console.error('Failed to load branch-scoped programmes:', err);
        setLoadingProgrammes(false);
      });
  }, [examScope, selectedBranchId, selectedBranchIds, academicYearId]);

  // Simulated Dean role
  const canPublishOrDean = true;
  void selectedExam;
  void showHistoryModal;
  void canPublishOrDean;

  const loadExams = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    const data = await examinationsApi.getExams(selectedBranchFilter);
    setExams(data);
    if (showLoadingSpinner) setLoading(false);
  };

  useEffect(() => {
    loadExams(true);
  }, [selectedBranchFilter]);


  // Aggregate subjects for selected course streams
  const getSubjectsForSelectedProgrammes = () => {
    const selectedProgs = programmes.filter((p) => selectedProgrammeIds.includes(p.id));
    const subIds = Array.from(new Set(selectedProgs.flatMap((p) => p.subjectIds || [])));
    return allSubjects.filter((s) => subIds.includes(s.id));
  };

  const availableProgrammeSubjects = getSubjectsForSelectedProgrammes();

  const firstYearProgrammes = useMemo(() => {
    return programmes.filter((p: Programme) => {
      const yl = (p.yearLevel || (p as any).year_level || '').toLowerCase();
      const name = (p.name || p.code || '').toLowerCase();
      return yl.includes('first') || yl.includes('1st') || name.includes('1st') || name.includes('first');
    });
  }, [programmes]);

  const secondYearProgrammes = useMemo(() => {
    return programmes.filter((p: Programme) => {
      const yl = (p.yearLevel || (p as any).year_level || '').toLowerCase();
      const name = (p.name || p.code || '').toLowerCase();
      return yl.includes('second') || yl.includes('2nd') || name.includes('2nd') || name.includes('second');
    });
  }, [programmes]);

  const otherProgrammes = useMemo(() => {
    return programmes.filter((p: Programme) => !firstYearProgrammes.includes(p) && !secondYearProgrammes.includes(p));
  }, [programmes, firstYearProgrammes, secondYearProgrammes]);

  const firstYearSelectedCount = useMemo(() => {
    return firstYearProgrammes.filter((p: Programme) => selectedProgrammeIds.includes(p.id)).length;
  }, [firstYearProgrammes, selectedProgrammeIds]);

  const secondYearSelectedCount = useMemo(() => {
    return secondYearProgrammes.filter((p: Programme) => selectedProgrammeIds.includes(p.id)).length;
  }, [secondYearProgrammes, selectedProgrammeIds]);

  const handleSelectAllFirstYear = () => {
    const fyIds = firstYearProgrammes.map((p: Programme) => p.id);
    const allSelected = fyIds.length > 0 && fyIds.every((id: string) => selectedProgrammeIds.includes(id));
    if (allSelected) {
      const remaining = selectedProgrammeIds.filter((id: string) => !fyIds.includes(id));
      setSelectedProgrammeIds(remaining.length > 0 ? remaining : selectedProgrammeIds);
    } else {
      const newSet = new Set([...selectedProgrammeIds, ...fyIds]);
      setSelectedProgrammeIds(Array.from(newSet));
    }
  };

  const handleSelectAllSecondYear = () => {
    const syIds = secondYearProgrammes.map((p: Programme) => p.id);
    const allSelected = syIds.length > 0 && syIds.every((id: string) => selectedProgrammeIds.includes(id));
    if (allSelected) {
      const remaining = selectedProgrammeIds.filter((id: string) => !syIds.includes(id));
      setSelectedProgrammeIds(remaining.length > 0 ? remaining : selectedProgrammeIds);
    } else {
      const newSet = new Set([...selectedProgrammeIds, ...syIds]);
      setSelectedProgrammeIds(Array.from(newSet));
    }
  };

  const handleProgrammeToggle = (progId: string) => {
    let nextIds: string[];
    if (selectedProgrammeIds.includes(progId)) {
      if (selectedProgrammeIds.length === 1) return;
      nextIds = selectedProgrammeIds.filter((id) => id !== progId);
    } else {
      nextIds = [...selectedProgrammeIds, progId];
    }
    setSelectedProgrammeIds(nextIds);
  };

  const handleToggleOptOutSubject = (subId: string) => {
    if (optedOutSubjectIds.includes(subId)) {
      setOptedOutSubjectIds(optedOutSubjectIds.filter((id) => id !== subId));
    } else {
      setOptedOutSubjectIds([...optedOutSubjectIds, subId]);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingExam) return;
    setOverlapError(null);
    if (!examName.trim()) return;
    if (!academicYearId) {
      setOverlapError('Academic year is still loading. Please wait and try again.');
      return;
    }

    setIsCreatingExam(true);
    try {
      const targetBranchIds =
        examScope === 'ALL_BRANCHES'
          ? branches.map((b) => b.id)
          : examScope === 'SELECTED_BRANCHES'
          ? selectedBranchIds
          : [selectedBranchId];

      const overlapResult = await examinationsApi.checkOverlap({
        examDate,
        targetBranchIds,
        programmeId: selectedProgrammeIds[0] || 'prog-mpc',
      });

      if (overlapResult.hasOverlap) {
        setOverlapError(
          `Overlap Lock Triggered: Exam "${overlapResult.conflictingExamName || 'Scheduled Exam'}" is already scheduled on ${examDate} for this stream.`
        );
        return;
      }

      const activeSubjects = availableProgrammeSubjects.filter((s) => !optedOutSubjectIds.includes(s.id));
      if (activeSubjects.length === 0) {
        setOverlapError('Please include at least one subject for this assessment.');
        return;
      }

      const examSubjects: Partial<ExamSubject>[] = activeSubjects.map((sub) => {
        const cfg = subjectConfigs[sub.id] || { maxMarks: sub.maxMarks, passMarks: sub.passMarks };
        return {
          subjectId: sub.id,
          subjectName: sub.name,
          subjectCode: sub.code,
          maximumMarks: Number(cfg.maxMarks) || 100,
          passMarks: Number(cfg.passMarks) || 35,
        };
      });

      // Resolve valid UUID strings for backend Pydantic payload validation (prefer specific batchId over master programmeId)
      const validProgrammeUUIDs = Array.from(
        new Set(
          selectedProgrammeIds
            .map((selId) => {
              const progObj = programmes.find((p) => p.id === selId || (p as any).key === selId);
              const candidate = (progObj as any)?.batchId || (progObj as any)?.programmeId || (progObj?.id && progObj.id.length === 36 ? progObj.id : undefined);
              return typeof candidate === 'string' && candidate.length > 20 && candidate.includes('-') ? candidate : undefined;
            })
            .filter((val): val is string => Boolean(val))
        )
      );

      const defaultFallbackUuid = (programmes[0] as any)?.batchId || (programmes[0] as any)?.programmeId || '55555555-5555-5555-5555-555555555555';
      const targetProgrammeId = validProgrammeUUIDs[0] || (defaultFallbackUuid.length > 20 ? defaultFallbackUuid : '55555555-5555-5555-5555-555555555555');

      const newExamPayload: Partial<Exam> = {
        name: examName.trim(),
        type: examType,
        scope: examScope,
        branchId: examScope === 'SINGLE_BRANCH' ? selectedBranchId : undefined,
        branchIds: targetBranchIds,
        academicYearId,
        programmeId: targetProgrammeId,
        programmeIds: validProgrammeUUIDs.length > 0 ? validProgrammeUUIDs : [targetProgrammeId],
        examDate: examDate,
        marksEntryDeadline: '2026-08-25',
        status: 'DRAFT',
      };

      const createdExam = await examinationsApi.createExam(newExamPayload, examSubjects);
      setExamName('');
      setViewMode('list');
      setShowCreateExamModal(false);
      await loadExams();

      setNotification(`New assessment "${newExamPayload.name}" created! Staff can now enter class subject marks.`);
      setTimeout(() => setNotification(null), 5000);

      if (createdExam && createdExam.id && onNavigateToMarksEntry) {
        onNavigateToMarksEntry(createdExam.id);
      }
    } catch (err) {
      setOverlapError(err instanceof Error ? err.message : 'Failed to create assessment.');
    } finally {
      setIsCreatingExam(false);
    }
  };

  const handlePublishExamResults = async () => {
    if (!examToPublish || isPublishing) return;
    setPublishError(null);
    setIsPublishing(true);
    try {
      await examinationsApi.publishExam(examToPublish);
      setExams((prev) => prev.map((ex) => (ex.id === examToPublish ? { ...ex, status: 'PUBLISHED' } : ex)));
      setShowPublishModal(false);
      setExamToPublish(null);
      setPublishError(null);
      loadExams(false);
      setNotification('Assessment results published! WhatsApp parent notifications dispatched on server.');
      setTimeout(() => setNotification(null), 5000);
    } catch (err: unknown) {
      setPublishError(
        err instanceof Error
          ? err.message
          : 'Cannot publish assessment until all active student sections submit marks.',
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReturnExam = async () => {
    if (!examToReturn || !returnReason.trim()) return;
    await examinationsApi.returnForCorrection(examToReturn, returnReason.trim());
    setExams((prev) =>
      prev.map((ex) =>
        ex.id === examToReturn ? { ...ex, status: 'RETURNED_FOR_CORRECTION' } : ex,
      ),
    );
    setShowReturnModal(false);
    setExamToReturn(null);
    setReturnReason('');
    loadExams(false);
    setNotification('Exam returned to staff for correction.');
    setTimeout(() => setNotification(null), 5000);
  };

  const handleExemptBranch = async () => {
    if (!examToExempt || !exemptReason.trim()) return;
    await examinationsApi.exemptBranch(examToExempt, exemptBranchId, exemptReason.trim());
    setShowExemptBranchModal(false);
    setExamToExempt(null);
    setExemptReason('');
    loadExams(false);
    setNotification('Campus exempted successfully!');
    setTimeout(() => setNotification(null), 5000);
  };

  if (viewMode === 'create') {
    return (
      <div className="space-y-6 p-6 max-w-6xl mx-auto pb-24">
        {/* Header Breadcrumbs Card */}
        <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-indigo-50/60 p-6 rounded-3xl border border-teal-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setViewMode('list');
                  setOverlapError(null);
                }}
                className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4 text-teal-600" />
                <span>Back to Examinations</span>
              </button>
              <span className="text-slate-400 text-xs">/</span>
              <span className="text-xs font-bold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full">
                Setup New Exam
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight pt-1">Create New Assessment</h1>
            <p className="text-xs text-slate-600 font-medium">
              Configure audience scopes, schedule, target year-level batches, and custom subject max & pass mark overrides.
            </p>
          </div>
        </div>

        {overlapError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{overlapError}</span>
          </div>
        )}

        <form onSubmit={handleCreateExam} className="space-y-6">
          {/* CARD 1: GENERAL EXAM DETAILS & CAMPUS SCOPE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">1. Basic Details & Campus Scope</h2>
                <p className="text-[11px] text-slate-500">Specify assessment title, academic year, schedule, and institution branch scope.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assessment / Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit Test 1 or Mid-Term Exam 2026"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Academic Year *</label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} ({ay.code}) {ay.isDefault ? '— Active Term' : ''}
                    </option>
                  ))}
                  {academicYears.length === 0 && (
                    <option value="2026-2027">2026–2027 Academic Year</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Exam Type</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Unit Test">Unit Test</option>
                  <option value="Monthly Test">Monthly Test</option>
                  <option value="Mid-Term">Mid-Term</option>
                  <option value="Quarterly Exam">Quarterly Exam</option>
                  <option value="Grand Test">Grand Test</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Exam Date (Lock Schedule)</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => {
                    setExamDate(e.target.value);
                    setOverlapError(null);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Audience Scope */}
            <div className="pt-2">
              <label className="block font-bold text-slate-700 mb-2">Audience Scope & Campuses</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setExamScope('SINGLE_BRANCH')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs border cursor-pointer transition ${
                    examScope === 'SINGLE_BRANCH'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Single Campus
                </button>
                {isDean && (
                  <button
                    type="button"
                    onClick={() => setExamScope('ALL_BRANCHES')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs border cursor-pointer transition ${
                      examScope === 'ALL_BRANCHES'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    All Campuses (Dean)
                  </button>
                )}
                {isDean && (
                  <button
                    type="button"
                    onClick={() => setExamScope('SELECTED_BRANCHES')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs border cursor-pointer transition ${
                      examScope === 'SELECTED_BRANCHES'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Selected Campuses
                  </button>
                )}
              </div>

              {examScope === 'SINGLE_BRANCH' && (
                <div className="pt-3">
                  {isDean ? (
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full sm:w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 max-w-md">
                      <span>🏫 Campus Branch: {branches.find((b) => b.id === userBranchId)?.name || userBranchName || 'Assigned Campus'}</span>
                      <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-semibold">Locked to Branch</span>
                    </div>
                  )}
                </div>
              )}

              {examScope === 'SELECTED_BRANCHES' && (
                <div className="pt-3 flex flex-wrap gap-2.5">
                  {branches.map((b) => {
                    const isSelected = selectedBranchIds.includes(b.id);
                    return (
                      <label key={b.id} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBranchIds([...selectedBranchIds, b.id]);
                            } else {
                              setSelectedBranchIds(selectedBranchIds.filter((id) => id !== b.id));
                            }
                          }}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="font-bold text-slate-800 text-xs">{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: TARGET STUDENT BATCHES GROUPED BY YEAR LEVEL */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">2. Target Student Batches (Multi-Batch Selection)</h2>
                <p className="text-[11px] text-slate-500">
                  Select target student streams for 1st Year (Junior) and 2nd Year (Senior). Classroom sections under selected batches will be included.
                </p>
              </div>
              {selectedProgrammeIds.length > 0 && (
                <span className="px-3 py-1 bg-teal-100 text-teal-900 border border-teal-200 rounded-full text-xs font-black shadow-2xs self-start sm:self-auto">
                  {selectedProgrammeIds.length} Batches Selected ({firstYearSelectedCount} Junior, {secondYearSelectedCount} Senior)
                </span>
              )}
            </div>

            {loadingProgrammes ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="h-10 animate-pulse rounded-xl bg-slate-200" />
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {/* 🟢 1ST YEAR BATCHES CARD */}
                <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black tracking-wide">
                        🎓 1st Year Classes (Junior Intermediate)
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        ({firstYearSelectedCount}/{firstYearProgrammes.length} Selected)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSelectAllFirstYear}
                      className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      {firstYearSelectedCount === firstYearProgrammes.length ? '✓ Deselect All 1st Year' : '+ Select All 1st Year'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {firstYearProgrammes.map((prog: Programme) => {
                      const isSelected = selectedProgrammeIds.includes(prog.id);
                      return (
                        <button
                          key={prog.id}
                          type="button"
                          onClick={() => handleProgrammeToggle(prog.id)}
                          className={`px-3.5 py-2 rounded-xl font-extrabold text-xs border flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300 scale-102'
                              : 'bg-white text-slate-700 border-emerald-200/80 hover:bg-emerald-100/50 shadow-2xs'
                          }`}
                        >
                          <span>{programmeLabel(prog)}</span>
                          <span className="text-[10px] opacity-90 font-mono font-semibold">(1st Year)</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 🔵 2ND YEAR BATCHES CARD */}
                <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-200/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-black tracking-wide">
                        🎓 2nd Year Classes (Senior Intermediate)
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        ({secondYearSelectedCount}/{secondYearProgrammes.length} Selected)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSelectAllSecondYear}
                      className="px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      {secondYearSelectedCount === secondYearProgrammes.length ? '✓ Deselect All 2nd Year' : '+ Select All 2nd Year'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {secondYearProgrammes.map((prog: Programme) => {
                      const isSelected = selectedProgrammeIds.includes(prog.id);
                      return (
                        <button
                          key={prog.id}
                          type="button"
                          onClick={() => handleProgrammeToggle(prog.id)}
                          className={`px-3.5 py-2 rounded-xl font-extrabold text-xs border flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-700 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300 scale-102'
                              : 'bg-white text-slate-700 border-indigo-200/80 hover:bg-indigo-100/50 shadow-2xs'
                          }`}
                        >
                          <span>{programmeLabel(prog)}</span>
                          <span className="text-[10px] opacity-90 font-mono font-semibold">(2nd Year)</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {otherProgrammes.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="font-bold text-xs text-slate-700">Other Streams</span>
                    <div className="flex flex-wrap gap-2">
                      {otherProgrammes.map((prog: Programme) => {
                        const isSelected = selectedProgrammeIds.includes(prog.id);
                        return (
                          <button
                            key={prog.id}
                            type="button"
                            onClick={() => handleProgrammeToggle(prog.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>{programmeLabel(prog)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CARD 3: SUBJECT MARKS OVERRIDE & OPT-OUT GRID */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">3. Exam Subject Marks Override & Opt-Out</h2>
                <p className="text-[11px] text-slate-500">Configure subject maximum marks, passing marks, or opt-out specific subjects for this assessment.</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                {availableProgrammeSubjects.length - optedOutSubjectIds.length} of {availableProgrammeSubjects.length} subjects included
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {availableProgrammeSubjects.map((sub) => {
                const isOptedOut = optedOutSubjectIds.includes(sub.id);
                const cfg = subjectConfigs[sub.id] || { maxMarks: sub.maxMarks, passMarks: sub.passMarks };
                return (
                  <div
                    key={sub.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isOptedOut
                        ? 'bg-slate-100/70 border-slate-200 opacity-60'
                        : 'bg-slate-50/80 border-slate-200 shadow-2xs hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleOptOutSubject(sub.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                          isOptedOut
                            ? 'bg-slate-200 text-slate-600 border-slate-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {isOptedOut ? '🚫 Opted Out' : '✓ Included'}
                      </button>
                      <div>
                        <span className={`font-extrabold block text-xs ${isOptedOut ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                          {sub.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">Code: {sub.code}</span>
                      </div>
                    </div>

                    {!isOptedOut && (
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-extrabold text-center uppercase">Max</span>
                          <input
                            type="number"
                            min={1}
                            value={cfg.maxMarks}
                            onChange={(e) => {
                              const maxM = Number(e.target.value);
                              setSubjectConfigs({
                                ...subjectConfigs,
                                [sub.id]: { ...cfg, maxMarks: maxM },
                              });
                            }}
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-black text-xs outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-extrabold text-center uppercase">Pass</span>
                          <input
                            type="number"
                            min={1}
                            value={cfg.passMarks}
                            onChange={(e) => {
                              const passM = Number(e.target.value);
                              setSubjectConfigs({
                                ...subjectConfigs,
                                [sub.id]: { ...cfg, passMarks: passM },
                              });
                            }}
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-black text-xs outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* STICKY FLOATING ACTION DOCK */}
          <div className="fixed bottom-5 right-8 z-30 bg-white/95 backdrop-blur-md p-3 px-5 rounded-2xl border border-slate-200 shadow-2xl flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setOverlapError(null);
              }}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreatingExam}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 transition"
            >
              {isCreatingExam ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Create Assessment & Publish</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Examinations & Result Publishing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure audience scopes, custom subject max marks, enter class mark matrices, and publish report cards.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          {isDean ? (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Campus Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>🏫 Assigned Campus: {branches.find(b => b.id === userBranchId)?.name || userBranchName || 'Assigned Campus'}</span>
              <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-semibold">Locked</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {(isDean || canPublish) && (
              <button
                onClick={() => {
                  if (canPublish && userBranchId) {
                    setExamScope('SINGLE_BRANCH');
                    setSelectedBranchId(userBranchId);
                  }
                  setOverlapError(null);
                  setViewMode('create');
                }}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Assessment
              </button>
            )}

            {onNavigateToMarksEntry && (
              <button
                onClick={() => onNavigateToMarksEntry(exams.length > 0 ? exams[0].id : undefined)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-teal-400" /> Enter Class Marks
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Examinations List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-xs flex justify-between items-center">
          <span>Academic Term Assessments (2026–2027)</span>
          <span className="text-slate-400 font-normal">Total: {exams.length} Exams</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading examinations...</div>
          ) : exams.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No exams found for the selected criteria.</div>
          ) : (
            exams.map((exam) => (
              <div key={exam.id} className="p-5 hover:bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{exam.name}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        exam.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : exam.status === 'SUBMITTED'
                          ? 'bg-teal-100 text-teal-800 border border-teal-200 font-extrabold shadow-2xs'
                          : exam.status === 'RETURNED_FOR_CORRECTION'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {exam.status === 'SUBMITTED' ? 'READY TO PUBLISH' : exam.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold border border-slate-200">
                      Scope: {exam.scope || 'SINGLE_BRANCH'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Academic Year: <strong className="text-slate-800 font-semibold">{academicYears.find((y) => y.id === exam.academicYearId)?.name || '2026–2027'}</strong> • Type: {exam.type} • Date: {exam.examDate}
                  </p>
                  {exam.excludedBranchIds && exam.excludedBranchIds.length > 0 && (
                    <div className="mt-1.5 p-2 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-[11px] font-semibold flex items-center gap-1.5">
                      <span>🚫 <strong>Campus Exemptions:</strong> {exam.excludedBranchIds.map(id => {
                        const bName = branches.find(b => b.id === id)?.name || id;
                        const r = exam.exemptionReasons?.[id];
                        return `${bName}${r ? ` (${r})` : ''}`;
                      }).join(', ')}</span>
                    </div>
                  )}
                  {exam.returnReason && (
                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-medium flex items-center gap-2">
                      <FileWarning className="w-4 h-4 text-rose-600 shrink-0" />
                      <span><strong>Return Note:</strong> {exam.returnReason}</span>
                    </div>
                  )}
                  <ExamDispatchPill examId={exam.id} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onNavigateToMarksEntry && (
                    <button
                      onClick={() => onNavigateToMarksEntry(exam.id)}
                      className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs flex items-center gap-1.5"
                    >
                      <GraduationCap className="w-4 h-4 text-teal-600" /> Enter Marks
                    </button>
                  )}


                  {isDean && (
                    <button
                      onClick={() => {
                        setExamToExempt(exam.id);
                        setShowExemptBranchModal(true);
                      }}
                      className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                      title="Exempt or opt-out a campus branch from this assessment"
                    >
                      <AlertTriangle className="w-4 h-4 text-purple-600" /> Exempt / Opt-Out Campus
                    </button>
                  )}

                  {(isDean || canPublish) && exam.status === 'SUBMITTED' && (
                    <button
                      onClick={() => {
                        setExamToReturn(exam.id);
                        setShowReturnModal(true);
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <FileWarning className="w-4 h-4 text-rose-600" /> Return for Correction
                    </button>
                  )}

                  {(
                    isDean ||
                    (canPublish && (exam.scope === 'SINGLE_BRANCH' && (!exam.branchId || exam.branchId === userBranchId)))
                  ) && (exam.status === 'SUBMITTED' || exam.status === 'DRAFT') && (
                    <button
                      onClick={() => {
                        setExamToPublish(exam.id);
                        setShowPublishModal(true);
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" /> Approve & Publish
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedExam(exam);
                      setShowHistoryModal(true);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <History className="w-4 h-4" /> History
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FULL ASSESSMENT CREATION MODAL */}
      {showCreateExamModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Assessment</h3>
                  <p className="text-xs text-slate-500">Configure scope, schedule, custom subject max & pass marks</p>
                </div>
              </div>
              <button onClick={() => setShowCreateExamModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {overlapError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{overlapError}</span>
              </div>
            )}

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assessment / Exam Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit Test 1 or Mid-Term Exam 2026"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Academic Year *</label>
                  <select
                    value={academicYearId}
                    onChange={(e) => setAcademicYearId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name} ({ay.code}) {ay.isDefault ? '— Active Term' : ''}
                      </option>
                    ))}
                    {academicYears.length === 0 && (
                      <option value="2026-2027">2026–2027 Academic Year</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Audience Scope */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-700">Audience Scope & Campuses</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setExamScope('SINGLE_BRANCH')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer ${
                      examScope === 'SINGLE_BRANCH'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Single Campus
                  </button>
                  {isDean && (
                    <button
                      type="button"
                      onClick={() => setExamScope('ALL_BRANCHES')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer ${
                        examScope === 'ALL_BRANCHES'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      All Campuses (Dean)
                    </button>
                  )}
                  {isDean && (
                    <button
                      type="button"
                      onClick={() => setExamScope('SELECTED_BRANCHES')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer ${
                        examScope === 'SELECTED_BRANCHES'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Selected Campuses
                    </button>
                  )}
                </div>

                {examScope === 'SINGLE_BRANCH' && (
                  <div className="pt-2">
                    {isDean ? (
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>🏫 Campus Branch: {branches.find((b) => b.id === userBranchId)?.name || userBranchName || 'Assigned Campus'}</span>
                        <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-semibold">Locked to your Branch</span>
                      </div>
                    )}
                  </div>
                )}

                {examScope === 'SELECTED_BRANCHES' && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {branches.map((b) => {
                      const isSelected = selectedBranchIds.includes(b.id);
                      return (
                        <label key={b.id} className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBranchIds([...selectedBranchIds, b.id]);
                              } else {
                                setSelectedBranchIds(selectedBranchIds.filter((id) => id !== b.id));
                              }
                            }}
                          />
                          <span className="font-semibold text-slate-800">{b.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Target Student Batches Multi-Select */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-slate-800 text-xs">Target Student Batches (Multi-Batch Assessment)</label>
                  {selectedProgrammeIds.length > 0 && (
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-[10px] font-bold">
                      {selectedProgrammeIds.length} Batch{selectedProgrammeIds.length > 1 ? "es" : ""} Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Select target student batches taking this assessment. All classroom sections (e.g. Section MPC-1A, MPC-1B) under selected batches will be automatically included.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {loadingProgrammes ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="h-8 w-32 animate-pulse rounded-xl bg-slate-200" />
                    ))
                  ) : (
                    programmes.map((prog) => {
                      const isSelected = selectedProgrammeIds.includes(prog.id);
                      return (
                        <button
                          key={prog.id}
                          type="button"
                          onClick={() => handleProgrammeToggle(prog.id)}
                          className={`px-3 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs'
                          }`}
                        >
                          <span>{programmeLabel(prog)}</span>
                          <span className="text-[10px] opacity-80 font-normal">({prog.yearLevel})</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Type</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Unit Test">Unit Test</option>
                    <option value="Monthly Test">Monthly Test</option>
                    <option value="Mid-Term">Mid-Term</option>
                    <option value="Quarterly Exam">Quarterly Exam</option>
                    <option value="Grand Test">Grand Test</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Date (Lock)</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => {
                      setExamDate(e.target.value);
                      setOverlapError(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Subject Max / Pass Marks Config List with Opt-Out Support */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">Exam Subject Marks Override & Opt-Out</label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {availableProgrammeSubjects.length - optedOutSubjectIds.length} of {availableProgrammeSubjects.length} subjects included
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 max-h-48 overflow-y-auto">
                  {availableProgrammeSubjects.map((sub) => {
                    const isOptedOut = optedOutSubjectIds.includes(sub.id);
                    const cfg = subjectConfigs[sub.id] || { maxMarks: sub.maxMarks, passMarks: sub.passMarks };
                    return (
                      <div
                        key={sub.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl border transition-all gap-2 ${
                          isOptedOut
                            ? 'bg-slate-100/70 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleOptOutSubject(sub.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                              isOptedOut
                                ? 'bg-slate-200 text-slate-600 border-slate-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {isOptedOut ? '🚫 Opted Out' : '✓ Included'}
                          </button>
                          <div>
                            <span className={`font-bold block ${isOptedOut ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                              {sub.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Code: {sub.code}</span>
                          </div>
                        </div>

                        {!isOptedOut && (
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">Max</span>
                              <input
                                type="number"
                                min={1}
                                value={cfg.maxMarks}
                                onChange={(e) => {
                                  const maxM = Number(e.target.value);
                                  setSubjectConfigs({
                                    ...subjectConfigs,
                                    [sub.id]: { ...cfg, maxMarks: maxM },
                                  });
                                }}
                                className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-bold text-xs outline-none"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">Pass</span>
                              <input
                                type="number"
                                min={1}
                                value={cfg.passMarks}
                                onChange={(e) => {
                                  const passM = Number(e.target.value);
                                  setSubjectConfigs({
                                    ...subjectConfigs,
                                    [sub.id]: { ...cfg, passMarks: passM },
                                  });
                                }}
                                className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-bold text-xs outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateExamModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingExam}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingExam ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    'Create Assessment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXEMPT BRANCH MODAL */}
      {showExemptBranchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Exempt Campus Branch</h3>
            <p className="text-xs text-slate-500">Exempt a branch from taking this assessment with an audit reason.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Campus Branch</label>
                <select
                  value={exemptBranchId}
                  onChange={(e) => setExemptBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Exemption *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Visakhapatnam Campus exempted due to local cyclone heavy rainfall."
                  value={exemptReason}
                  onChange={(e) => setExemptReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2 text-xs font-bold">
              <button onClick={() => setShowExemptBranchModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl">
                Cancel
              </button>
              <button onClick={handleExemptBranch} className="flex-1 py-2 bg-purple-600 text-white rounded-xl">
                Confirm Exemption
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN FOR CORRECTION MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Return Exam for Correction</h3>
            <p className="text-xs text-slate-500">Provide feedback notes to staff explaining required mark corrections.</p>

            <textarea
              required
              rows={3}
              placeholder="e.g. Section B Sanskrit marks have 3 missing absentees. Please verify."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs outline-none"
            />

            <div className="flex gap-3 pt-2 text-xs font-bold">
              <button onClick={() => setShowReturnModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl">
                Cancel
              </button>
              <button onClick={handleReturnExam} className="flex-1 py-2 bg-rose-600 text-white rounded-xl">
                Return to Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH CONFIRMATION MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Approve & Publish Results</h3>
            <p className="text-xs text-slate-500">Publishing makes report cards visible on the Parent Portal.</p>

            {publishError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Publish Blocked</span>
                </div>
                <p className="text-[11px] leading-relaxed font-normal">{publishError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2 text-xs font-bold">
              <button
                onClick={() => {
                  setShowPublishModal(false);
                  setPublishError(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishExamResults}
                disabled={isPublishing}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  'Approve & Publish'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
interface AcademicYear {
  id: string;
  code: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: string;
  isDefault: boolean;
}
