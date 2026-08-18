import React, { useState, useEffect } from 'react';
import { examinationsApi } from '../api/examinationsApi';
import { Exam, ExamSubject, Subject, Programme, Branch } from '../types';
import { GraduationCap, ShieldCheck, History, Plus, Calendar, CheckCircle2, X, Filter, AlertTriangle, FileWarning, XCircle } from 'lucide-react';

export const ExamsPage: React.FC<{ onNavigateToMarksEntry?: () => void }> = ({
  onNavigateToMarksEntry,
}) => {
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

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [academicYearId, setAcademicYearId] = useState<string>('');

  const [branches, setBranches] = useState<Branch[]>([
    { id: '11111111-1111-1111-1111-111111111111', name: 'Hyderabad Main Campus', code: 'HYD-MAIN' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Vijayawada City Campus', code: 'VJY-CITY' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Visakhapatnam Campus', code: 'VIZAG' },
  ]);

  const [programmes, setProgrammes] = useState<Programme[]>([
    { id: '55555555-5555-5555-5555-555555555555', code: 'MPC', name: 'Maths, Physics, Chemistry', yearLevel: 'First Year', subjectIds: ['77777777-7777-7777-7777-777777777771', '77777777-7777-7777-7777-777777777772', '77777777-7777-7777-7777-777777777773', '77777777-7777-7777-7777-777777777774', '77777777-7777-7777-7777-777777777775'] },
    { id: '66666666-6666-6666-6666-666666666666', code: 'BiPC', name: 'Biology, Physics, Chemistry', yearLevel: 'First Year', subjectIds: ['77777777-7777-7777-7777-777777777771', '77777777-7777-7777-7777-777777777772', '77777777-7777-7777-7777-777777777774', '77777777-7777-7777-7777-777777777775'] },
  ]);

  const [allSubjects, setAllSubjects] = useState<Subject[]>([
    { id: '77777777-7777-7777-7777-777777777771', code: 'ENG-101', name: 'English 1', maxMarks: 100, passMarks: 35 },
    { id: '77777777-7777-7777-7777-777777777772', code: 'SAN-101', name: 'Sanskrit 1', maxMarks: 100, passMarks: 35 },
    { id: '77777777-7777-7777-7777-777777777773', code: 'MATH-1A', name: 'Mathematics 1A', maxMarks: 75, passMarks: 26 },
    { id: '77777777-7777-7777-7777-777777777774', code: 'PHY-101', name: 'Physics 1', maxMarks: 60, passMarks: 21 },
    { id: '77777777-7777-7777-7777-777777777775', code: 'CHEM-101', name: 'Chemistry 1', maxMarks: 60, passMarks: 21 },
  ]);

  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Dynamic Master Data Loading from Live Backend APIs
  useEffect(() => {
    examinationsApi.getBranches().then((b) => {
      if (b && b.length > 0) {
        setBranches(b);
        setSelectedBranchId((current) => b.some((branch) => branch.id === current) ? current : b[0].id);
        setSelectedBranchIds((current) => current.length > 0 && current.every((id) => b.some((branch) => branch.id === id)) ? current : [b[0].id]);
      }
    });
    examinationsApi.getProgrammes().then((p) => {
      if (p && p.length > 0) {
        setProgrammes(p);
        setSelectedProgrammeIds((current) => current.length > 0 && p.some((programme) => programme.id === current[0]) ? current : [p[0].id]);
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
  }, []);

  // Modal State for New Exam Creation
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('Quarterly Exam');
  const [examDate, setExamDate] = useState('2026-08-20');
  const [examScope, setExamScope] = useState<'ALL_BRANCHES' | 'SELECTED_BRANCHES' | 'SINGLE_BRANCH'>('SINGLE_BRANCH');
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || '11111111-1111-1111-1111-111111111111');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([branches[0]?.id || '11111111-1111-1111-1111-111111111111']);
  const [selectedProgrammeIds, setSelectedProgrammeIds] = useState<string[]>([programmes[0]?.id || '55555555-5555-5555-5555-555555555555']);
  const [notification, setNotification] = useState<string | null>(null);
  const [overlapError, setOverlapError] = useState<string | null>(null);

  const [subjectConfigs, setSubjectConfigs] = useState<Record<string, { maxMarks: number; passMarks: number }>>({});
  const [optedOutSubjectIds, setOptedOutSubjectIds] = useState<string[]>([]);

  // Dynamically re-filter available programmes based on selected audience scope & branches
  useEffect(() => {
    let fetchPromises: Promise<Programme[]>[];

    if (examScope === 'ALL_BRANCHES') {
      fetchPromises = [
        fetch('/api/v1/branches/ALL/programmes').then((res) => (res.ok ? res.json() : [])),
      ];
    } else if (examScope === 'SELECTED_BRANCHES') {
      if (selectedBranchIds.length === 0) return;
      fetchPromises = selectedBranchIds.map((bId) =>
        fetch(`/api/v1/branches/${bId}/programmes`).then((res) => (res.ok ? res.json() : []))
      );
    } else {
      if (!selectedBranchId) return;
      fetchPromises = [
        fetch(`/api/v1/branches/${selectedBranchId}/programmes`).then((res) => (res.ok ? res.json() : [])),
      ];
    }

    Promise.all(fetchPromises)
      .then((results) => {
        const combined = results.flat();
        const uniqueProgsMap = new Map<string, Programme>();
        combined.forEach((p) => {
          if (p && p.id && !uniqueProgsMap.has(p.id)) {
            uniqueProgsMap.set(p.id, p);
          }
        });
        const branchProgs = Array.from(uniqueProgsMap.values());

        if (branchProgs.length > 0) {
          setProgrammes(branchProgs);
          setSelectedProgrammeIds((prev) => {
            const valid = prev.filter((id) => branchProgs.some((bp) => bp.id === id));
            return valid.length > 0 ? valid : branchProgs.map((bp) => bp.id);
          });
        }
      })
      .catch((err) => console.error('Failed to load branch-scoped programmes:', err));
  }, [examScope, selectedBranchId, selectedBranchIds]);

  // Simulated Dean role
  const isDean = true;
  const isPrincipalOrDean = true;
  void selectedExam;
  void showHistoryModal;
  void isPrincipalOrDean;

  const loadExams = async () => {
    setLoading(true);
    const data = await examinationsApi.getExams(selectedBranchFilter);
    setExams(data);
    setLoading(false);
  };

  useEffect(() => {
    loadExams();
  }, [selectedBranchFilter]);

  // Aggregate subjects for selected course streams
  const getSubjectsForSelectedProgrammes = () => {
    const selectedProgs = programmes.filter((p) => selectedProgrammeIds.includes(p.id));
    const subIds = Array.from(new Set(selectedProgs.flatMap((p) => p.subjectIds || [])));
    return allSubjects.filter((s) => subIds.includes(s.id));
  };

  const availableProgrammeSubjects = getSubjectsForSelectedProgrammes();

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
    setOverlapError(null);
    if (!examName.trim()) return;
    if (!academicYearId) {
      setOverlapError('Academic year is still loading. Please wait and try again.');
      return;
    }

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

    const newExamPayload: Partial<Exam> = {
      name: examName.trim(),
      type: examType,
      scope: examScope,
      branchId: examScope === 'SINGLE_BRANCH' ? selectedBranchId : undefined,
      branchIds: targetBranchIds,
      academicYearId,
      programmeId: selectedProgrammeIds[0] || 'prog-mpc',
      programmeIds: selectedProgrammeIds,
      examDate: examDate,
      marksEntryDeadline: '2026-08-25',
      status: 'DRAFT',
    };

    await examinationsApi.createExam(newExamPayload, examSubjects);
    setExamName('');
    setShowCreateExamModal(false);
    loadExams();

    setNotification(`New assessment "${newExamPayload.name}" created! Staff can now enter class subject marks.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePublishExamResults = async () => {
    if (!examToPublish) return;
    setPublishError(null);
    try {
      await examinationsApi.publishExam(examToPublish);
      setShowPublishModal(false);
      setExamToPublish(null);
      setPublishError(null);
      loadExams();
      setNotification('Assessment results published! WhatsApp parent notifications dispatched on server.');
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setPublishError(err.message || 'Cannot publish assessment until all active student sections submit marks.');
    }
  };

  const handleReturnExam = async () => {
    if (!examToReturn || !returnReason.trim()) return;
    await examinationsApi.returnForCorrection(examToReturn, returnReason.trim());
    setShowReturnModal(false);
    setExamToReturn(null);
    setReturnReason('');
    loadExams();
    setNotification('Exam returned to staff for correction.');
    setTimeout(() => setNotification(null), 5000);
  };

  const handleExemptBranch = async () => {
    if (!examToExempt || !exemptReason.trim()) return;
    await examinationsApi.exemptBranch(examToExempt, exemptBranchId, exemptReason.trim());
    setShowExemptBranchModal(false);
    setExamToExempt(null);
    setExemptReason('');
    loadExams();
    setNotification('Campus exempted successfully!');
    setTimeout(() => setNotification(null), 5000);
  };

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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateExamModal(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Assessment
            </button>

            {onNavigateToMarksEntry && (
              <button
                onClick={onNavigateToMarksEntry}
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
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onNavigateToMarksEntry && (
                    <button
                      onClick={onNavigateToMarksEntry}
                      className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs flex items-center gap-1.5"
                    >
                      <GraduationCap className="w-4 h-4 text-teal-600" /> Enter Marks
                    </button>
                  )}

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

                  {exam.status === 'SUBMITTED' && (
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

                  {(exam.status === 'SUBMITTED' || exam.status === 'DRAFT') && (
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

              {/* Course Streams Multi-Select */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-700">Target Course Streams (Multi-Stream Assessment)</label>
                <p className="text-[11px] text-slate-500">Select streams taking this assessment. Shared subjects will aggregate automatically.</p>
                <div className="flex flex-wrap gap-2">
                  {programmes.map((prog) => {
                    const isSelected = selectedProgrammeIds.includes(prog.id);
                    return (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() => handleProgrammeToggle(prog.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{prog.code}</span>
                        <span className="text-[10px] opacity-80 font-normal">({prog.yearLevel})</span>
                      </button>
                    );
                  })}
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
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-sm cursor-pointer"
                >
                  Create Assessment
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
              <button onClick={handlePublishExamResults} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer">
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
