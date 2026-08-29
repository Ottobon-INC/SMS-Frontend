import React, { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  Layers,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { academicStructureApi } from "../api/academicStructureApi";
import { useAuth } from "../../authentication/providers/AuthProvider";
import type { AcademicSectionBatch, AcademicYear, Programme, ProgrammeOptions, Subject } from "../types";

interface BranchSummary {
  id: string;
  name: string;
  code?: string;
}

const fallbackProgrammeOptions: ProgrammeOptions = {
  streams: [
    { code: "MPC", label: "Mathematics, Physics, Chemistry", allowedTracks: ["IPE", "JEE Mains", "JEE Advanced", "AP EAPCET - Engineering"], defaultSubjects: ["Mathematics", "Physics", "Chemistry", "English"] },
    { code: "BIPC", label: "Biology, Physics, Chemistry", allowedTracks: ["IPE", "NEET-UG", "AP EAPCET - Agriculture & Pharmacy"], defaultSubjects: ["Botany", "Zoology", "Physics", "Chemistry", "English"] },
    { code: "MEC", label: "Mathematics, Economics, Commerce", allowedTracks: ["IPE", "CA Foundation", "CMA Foundation", "CSEET", "CUET-UG", "IPMAT"], defaultSubjects: ["Mathematics", "Economics", "Commerce", "English"] },
    { code: "CEC", label: "Civics, Economics, Commerce", allowedTracks: ["IPE", "CA Foundation", "CMA Foundation", "CSEET", "CUET-UG", "IPMAT"], defaultSubjects: ["Civics", "Economics", "Commerce", "English"] },
    { code: "HEC", label: "History, Economics, Civics", allowedTracks: ["IPE", "CLAT", "AILET", "CUET-UG"], defaultSubjects: ["History", "Economics", "Civics", "English"] },
  ],
  coachingTracks: [],
};

function programmeLabel(programme: Programme): string {
  return programme.displayLabel || programme.name || programme.code;
}

function programmeBaseLabel(programme: Programme): string {
  return programme.baseStreamLabel || programme.name;
}

function programmeCodeFor(streamCode: string, track: string): string {
  return `${streamCode}-${track.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function AcademicStructurePage() {
  const auth = useAuth();
  const canManageAcademicStructure = auth.hasPermission("academic_structure.manage");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null);
  const [editSubjectIds, setEditSubjectIds] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [isSavingProgrammeEdit, setIsSavingProgrammeEdit] = useState(false);

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectType, setSubjectType] = useState("CORE");
  const [subjectMaxMarks, setSubjectMaxMarks] = useState(100);
  const [subjectPassMarks, setSubjectPassMarks] = useState(35);

  const [programmeOptions, setProgrammeOptions] = useState<ProgrammeOptions>(fallbackProgrammeOptions);
  const [groupCode, setGroupCode] = useState("MPC");
  const [coachingTrack, setCoachingTrack] = useState("IPE");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [showAddYearModal, setShowAddYearModal] = useState(false);

  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [matrixOfferings, setMatrixOfferings] = useState<Record<string, string[]>>({});
  const [selectedMatrixYearId, setSelectedMatrixYearId] = useState<string>("");
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);
  const [sectionModal, setSectionModal] = useState<{
    branch: BranchSummary;
    programme: Programme;
  } | null>(null);
  const [sectionBatches, setSectionBatches] = useState<AcademicSectionBatch[]>([]);
  const [selectedSectionBatchId, setSelectedSectionBatchId] = useState("");
  const [newSectionSuffix, setNewSectionSuffix] = useState("");
  const [newSectionCapacity, setNewSectionCapacity] = useState("");
  const [loadingSections, setLoadingSections] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);

  const [yearName, setYearName] = useState("");
  const [yearCode, setYearCode] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [isDefaultYear, setIsDefaultYear] = useState(false);

  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);
  const selectedStream = programmeOptions.streams.find((stream) => stream.code === groupCode) ?? programmeOptions.streams[0];
  const allowedTracks = selectedStream?.allowedTracks ?? [];
  const generatedProgrammeCode = programmeCodeFor(groupCode, coachingTrack);
  const generatedProgrammeLabel = `${groupCode} - ${coachingTrack}`;

  function notify(message: string) {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 4000);
  }

  async function fetchAcademicData() {
    setLoading(true);
    setError(null);
    try {
      const [nextSubjects, nextProgrammes, nextYears, branchesRes, nextProgrammeOptions] = await Promise.all([
        academicStructureApi.getSubjects(),
        academicStructureApi.getProgrammes(),
        academicStructureApi.getAcademicYears(),
        academicStructureApi.getBranches(),
        academicStructureApi.getProgrammeOptions().catch(() => fallbackProgrammeOptions),
      ]);
      setSubjects(nextSubjects);
      setProgrammes(nextProgrammes);
      setAcademicYears(nextYears);
      setBranches(branchesRes);
      setProgrammeOptions(nextProgrammeOptions);

      const activeYear = nextYears.find((year) => year.isDefault) ?? nextYears[0];
      if (activeYear) {
        setSelectedMatrixYearId(activeYear.id);
      }

      if (branchesRes.length > 0) {
        const offeringsPromises = branchesRes.map((branch) =>
          academicStructureApi.getBranchProgrammes(branch.id).catch(() => []),
        );
        const results = await Promise.all(offeringsPromises);
        const map: Record<string, string[]> = {};
        branchesRes.forEach((branch, index) => {
          map[branch.id] = Array.from(
            new Set((results[index] || []).map((programme) => programme.programmeId || programme.id)),
          );
        });
        setMatrixOfferings(map);
      }
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Failed to load academic structure.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAcademicData();
  }, []);

  useEffect(() => {
    if (!selectedStream) return;
    if (!selectedStream.allowedTracks.includes(coachingTrack)) {
      setCoachingTrack(selectedStream.allowedTracks[0] ?? "IPE");
    }
    const defaultSubjectNames = new Set(selectedStream.defaultSubjects.map((name) => name.toLowerCase()));
    const matchingSubjectIds = subjects
      .filter((subject) => defaultSubjectNames.has(subject.name.toLowerCase()))
      .map((subject) => subject.id);
    setSelectedSubjectIds(matchingSubjectIds);
  }, [groupCode, selectedStream, subjects]);

  const [isEditingMatrix, setIsEditingMatrix] = useState(false);

  const handleToggleMatrixOffering = (branchId: string, programmeId: string) => {
    if (!canManageAcademicStructure) return;
    setMatrixOfferings((prev) => {
      const current = prev[branchId] || [];
      const updated = current.includes(programmeId)
        ? current.filter((id) => id !== programmeId)
        : [...current, programmeId];
      return { ...prev, [branchId]: updated };
    });
  };

  const handleSaveMatrix = async () => {
    if (!canManageAcademicStructure) {
      notify("You do not have permission to edit the offering matrix.");
      return;
    }
    setIsSavingMatrix(true);
    try {
      const savePromises = branches.map((b) =>
        academicStructureApi.assignBranchProgrammes(b.id, matrixOfferings[b.id] || [])
      );
      await Promise.all(savePromises);
      notify("Institution Branch Offering Matrix saved successfully!");
      setIsEditingMatrix(false);
    } catch {
      notify("Failed to save branch offering matrix.");
    } finally {
      setIsSavingMatrix(false);
    }
  };

  async function loadSectionsForOffering(branch: BranchSummary, programme: Programme) {
    if (!selectedMatrixYearId) {
      notify("Select an academic year before managing sections.");
      return;
    }

    setLoadingSections(true);
    try {
      const batches = await academicStructureApi.getSections({
        branchId: branch.id,
        academicYearId: selectedMatrixYearId,
        programmeId: programme.id,
      });
      setSectionBatches(batches);
      setSelectedSectionBatchId((current) => {
        if (current && batches.some((batch) => batch.id === current)) {
          return current;
        }
        return batches[0]?.id ?? "";
      });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to load sections.");
    } finally {
      setLoadingSections(false);
    }
  }

  async function openSectionManager(branch: BranchSummary, programme: Programme) {
    setSectionModal({ branch, programme });
    setNewSectionSuffix("");
    setNewSectionCapacity("");
    setSelectedSectionBatchId("");
    await loadSectionsForOffering(branch, programme);
  }

  async function handleCreateSection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageAcademicStructure) {
      notify("You do not have permission to manage sections.");
      return;
    }
    if (!sectionModal || !selectedSectionBatchId || !newSectionSuffix.trim()) {
      return;
    }

    setIsCreatingSection(true);
    try {
      const created = await academicStructureApi.createSection({
        batchId: selectedSectionBatchId,
        section: newSectionSuffix.trim().toUpperCase(),
        capacity: newSectionCapacity ? Number(newSectionCapacity) : null,
      });
      setSectionBatches((current) =>
        current.map((batch) =>
          batch.id === selectedSectionBatchId
            ? {
                ...batch,
                sections: [...batch.sections, created].sort((a, b) => a.name.localeCompare(b.name)),
              }
            : batch,
        ),
      );
      setNewSectionSuffix("");
      setNewSectionCapacity("");
      notify(`Section "${created.name}" created.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to create section.");
    } finally {
      setIsCreatingSection(false);
    }
  }

  const handleYearNameChange = (val: string) => {
    setYearName(val);
    if (val.length === 9 && val.includes("-")) {
      const parts = val.split("-");
      setYearCode(`${parts[0].slice(2)}-${parts[1].slice(2)}`);
      setStartsOn(`${parts[0]}-06-01`);
      setEndsOn(`${parts[1]}-04-30`);
    }
  };

  async function handleCreateAcademicYear(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageAcademicStructure) {
      notify("You do not have permission to manage academic years.");
      return;
    }
    if (!yearName.trim()) return;

    try {
      const created = await academicStructureApi.createAcademicYear({
        name: yearName.trim(),
        code: yearCode.trim() || yearName.trim(),
        startsOn: startsOn || `${yearName.slice(0, 4)}-06-01`,
        endsOn: endsOn || `20${yearCode.slice(-2)}-04-30`,
        isDefault: isDefaultYear,
      });

      if (isDefaultYear) {
        setAcademicYears((prev) => prev.map((y) => ({ ...y, isDefault: false })));
      }
      setAcademicYears((prev) => [created, ...prev]);
      setYearName("");
      setYearCode("");
      setStartsOn("");
      setEndsOn("");
      setIsDefaultYear(false);
      setShowAddYearModal(false);
      notify(`Academic Year "${created.name}" created successfully.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to create academic year.");
    }
  }

  async function handleSetDefaultYear(id: string, name: string) {
    if (!canManageAcademicStructure) {
      notify("You do not have permission to manage academic years.");
      return;
    }
    try {
      await academicStructureApi.setDefaultAcademicYear(id);
      setAcademicYears((prev) => prev.map((y) => ({ ...y, isDefault: y.id === id })));
      notify(`Academic Year "${name}" set as active default.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to switch default academic year.");
    }
  }

  async function handleCreateSubject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageAcademicStructure) {
      notify("You do not have permission to manage subjects.");
      return;
    }
    if (!subjectName.trim() || !subjectCode.trim()) return;

    const created = await academicStructureApi.createSubject({
      code: subjectCode.trim().toUpperCase(),
      name: subjectName.trim(),
      type: subjectType,
      maxMarks: Number(subjectMaxMarks) || 100,
      passMarks: Number(subjectPassMarks) || 35
    });

    setSubjects((current) => [...current, created].sort((a, b) => a.code.localeCompare(b.code)));
    setSubjectName("");
    setSubjectCode("");
    setSubjectType("CORE");
    setSubjectMaxMarks(100);
    setSubjectPassMarks(35);
    setShowAddSubjectModal(false);
    notify(`Master Subject "${created.name}" created.`);
  }

  async function handleCreateGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageAcademicStructure) {
      notify("You do not have permission to manage course stream groups.");
      return;
    }
    if (!groupCode || !coachingTrack) return;

    const created = await academicStructureApi.createProgramme({
      streamCode: groupCode,
      coachingTrack,
      subjectIds: selectedSubjectIds
    });

    setProgrammes((current) => [...current, created].sort((a, b) => a.code.localeCompare(b.code)));
    setGroupCode("MPC");
    setCoachingTrack("IPE");
    setSelectedSubjectIds([]);
    setShowAddGroupModal(false);
    notify(`Course Stream Group "${programmeLabel(created)}" created.`);
  }

  function openEditProgramme(programme: Programme) {
    if (!canManageAcademicStructure) {
      notify("You do not have permission to edit course stream groups.");
      return;
    }
    setEditingProgramme(programme);
    setEditSubjectIds(programme.subjectIds || []);
    setEditStatus("ACTIVE");
  }

  async function handleSaveProgrammeEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageAcademicStructure) {
      notify("You do not have permission to edit course stream groups.");
      return;
    }
    if (!editingProgramme) return;

    setIsSavingProgrammeEdit(true);
    try {
      const updated = await academicStructureApi.updateProgramme(editingProgramme.id, {
        subjectIds: editSubjectIds,
        status: editStatus,
      });
      setProgrammes((current) =>
        current
          .map((programme) => (programme.id === updated.id ? updated : programme))
          .filter((programme) => editStatus === "ACTIVE" || programme.id !== updated.id)
          .sort((a, b) => a.code.localeCompare(b.code)),
      );
      setMatrixOfferings((current) => {
        if (editStatus === "ACTIVE") return current;
        return Object.fromEntries(
          Object.entries(current).map(([branchId, programmeIds]) => [
            branchId,
            programmeIds.filter((programmeId) => programmeId !== updated.id),
          ]),
        );
      });
      setEditingProgramme(null);
      notify(`Course Stream Group "${programmeLabel(updated)}" updated.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update course stream group.");
    } finally {
      setIsSavingProgrammeEdit(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      {/* Hero Header */}
      <div className="bg-slate-900 px-6 py-8 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Academic Governance</h1>
                </div>
                <p className="text-slate-400 text-sm">
                  Govern institutional master subjects, course streams, groups, and coaching tracks for exam setup.
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Today</p>
              <p className="text-white font-semibold text-sm mt-0.5">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notification}</span>
            </div>
            <button type="button" onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchAcademicData()}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {canManageAcademicStructure && (
            <>
              <button
                type="button"
                onClick={() => setShowAddYearModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition"
              >
                <BookOpen className="w-4 h-4" /> Add Academic Year
              </button>
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(true)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition"
              >
                <BookMarked className="w-4 h-4" /> Add Master Subject
              </button>
              <button
                type="button"
                onClick={() => setShowAddGroupModal(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition"
              >
                <Layers className="w-4 h-4 text-teal-400" /> Add Course Stream Group
              </button>
            </>
          )}
        </div>

      {/* Academic Years Card Section */}
      <section className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Academic Years & Active Terms</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">{academicYears.length} Academic Years</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {academicYears.map((ay) => (
            <div
              key={ay.id}
              className={`p-4 rounded-2xl border transition-all ${
                ay.isDefault
                  ? "border-emerald-300 bg-emerald-50/50 shadow-xs"
                  : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-base font-bold text-slate-900">{ay.name}</span>
                  <span className="ml-2 text-[10px] font-mono text-slate-500">({ay.code})</span>
                </div>
                {ay.isDefault ? (
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold shadow-2xs">
                    Active Term
                  </span>
                ) : canManageAcademicStructure ? (
                  <button
                    type="button"
                    onClick={() => handleSetDefaultYear(ay.id, ay.name)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition"
                  >
                    Set Active
                  </button>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">
                    Inactive
                  </span>
                )}
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Term Duration:</span>
                  <span className="font-medium text-slate-700">
                    {ay.startsOn} to {ay.endsOn}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {academicYears.length === 0 && (
            <div className="col-span-full py-6 text-center text-xs text-slate-400">No academic years found.</div>
          )}
        </div>
      </section>

      {/* Central Institution Branch Offering Matrix */}
      <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">Institution Campus Stream Offering Matrix</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isEditingMatrix
                    ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {isEditingMatrix
                  ? "Edit Mode Active"
                  : canManageAcademicStructure
                    ? "Read-Only (Click Edit to Modify)"
                    : "Read-Only"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure active master course streams across all campus branches for the selected academic term.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Target Term</label>
              <select
                value={selectedMatrixYearId}
                onChange={(e) => setSelectedMatrixYearId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500"
              >
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name} ({ay.code}) {ay.isDefault ? "— Active" : ""}
                  </option>
                ))}
              </select>
            </div>

            {!isEditingMatrix ? (
              canManageAcademicStructure ? (
                <button
                  type="button"
                  onClick={() => setIsEditingMatrix(true)}
                  className="mt-4 sm:mt-0 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer"
                >
                  ✏️ Edit Offering Matrix
                </button>
              ) : null
            ) : (
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <button
                  type="button"
                  onClick={() => setIsEditingMatrix(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMatrix}
                  disabled={isSavingMatrix}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingMatrix ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving Matrix...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" /> Save Matrix Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Offering Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="p-3.5 min-w-[180px]">Course Stream</th>
                <th className="p-3.5 min-w-[220px]">Assigned Subjects</th>
                {branches.map((branch) => (
                  <th key={branch.id} className="p-3.5 text-center min-w-[120px]">
                    <span className="block text-slate-900 font-bold text-xs">{branch.name}</span>
                    <span className="text-[9px] font-mono text-slate-400 font-normal block">{branch.code}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {programmes.map((prog) => (
                <tr key={prog.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 block">{programmeLabel(prog)}</span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{programmeBaseLabel(prog)}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-bold">
                        {prog.code}
                      </span>
                      {prog.coachingTrack && (
                        <span className="text-[10px] text-slate-500 font-medium">Track: {prog.coachingTrack}</span>
                      )}
                    </div>
                    {canManageAcademicStructure && (
                      <button
                        type="button"
                        onClick={() => openEditProgramme(prog)}
                        className="mt-2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition"
                      >
                        Edit Group
                      </button>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {prog.subjectIds?.map((subId) => {
                        const sub = subjectById.get(subId);
                        return sub ? (
                          <span
                            key={subId}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold"
                          >
                            {sub.code || sub.name}
                          </span>
                        ) : null;
                      })}
                      {(!prog.subjectIds || prog.subjectIds.length === 0) && (
                        <span className="text-slate-400 text-[11px] italic">No subjects assigned</span>
                      )}
                    </div>
                  </td>
                  {branches.map((branch) => {
                    const isOffered = (matrixOfferings[branch.id] || []).includes(prog.id);
                    return (
                      <td key={branch.id} className="p-3.5 text-center align-middle">
                        {isEditingMatrix ? (
                          <label className="inline-flex items-center justify-center p-1.5 rounded-xl hover:bg-teal-50 cursor-pointer transition">
                            <input
                              type="checkbox"
                              checked={isOffered}
                              onChange={() => handleToggleMatrixOffering(branch.id, prog.id)}
                              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-slate-300 cursor-pointer"
                            />
                          </label>
                        ) : isOffered ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold">
                              ✓ Offered
                            </span>
                            <button
                              type="button"
                              onClick={() => void openSectionManager(branch, prog)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition"
                            >
                              Sections
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {programmes.length === 0 && (
                <tr>
                  <td colSpan={2 + branches.length} className="p-8 text-center text-slate-400 font-medium">
                    No course streams defined. Create master programmes below to configure matrix offerings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-600" /> Loading academic foundation data...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Master Subjects Catalog</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">{subjects.length} Subjects</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {subjects.map((subject) => (
                <div key={subject.id} className="py-2.5 flex justify-between items-center gap-4">
                  <div>
                    <span className="font-bold text-slate-900 block">{subject.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">Code: {subject.code}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded">
                        {subject.subjectType || "CORE"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] shrink-0">
                    <span className="text-slate-600">
                      Max: <strong>{subject.maxMarks}</strong>
                    </span>
                    <span className="text-slate-300 px-2">/</span>
                    <span className="text-slate-500">
                      Pass: <strong>{subject.passMarks}</strong>
                    </span>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && <div className="py-8 text-center text-xs font-semibold text-slate-400">No subjects found.</div>}
            </div>
          </section>

          <section className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Course Streams & Subject Groups</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">{programmes.length} Streams</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {programmes.map((programme) => {
                const linkedSubjects = (programme.subjectIds || []).map((subjectId) => subjectById.get(subjectId)).filter(Boolean) as Subject[];
                return (
                  <div key={programme.id} className="py-3 space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="font-bold text-slate-900">{programmeLabel(programme)}</span>
                        <span className="ml-2 text-[10px] text-slate-500">{programmeBaseLabel(programme)}</span>
                        {programme.coachingTrack && (
                          <span className="ml-2 text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {programme.coachingTrack}
                          </span>
                        )}
                        {canManageAcademicStructure && (
                          <button
                            type="button"
                            onClick={() => openEditProgramme(programme)}
                            className="ml-2 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 shrink-0">Both Years</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {linkedSubjects.length > 0 ? (
                        linkedSubjects.map((subject) => (
                          <span key={subject.id} className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded text-[10px] font-semibold">
                            {subject.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No master subjects linked.</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {programmes.length === 0 && <div className="py-8 text-center text-xs font-semibold text-slate-400">No course streams found.</div>}
            </div>
          </section>
        </div>
      )}

      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Add Master Subject</h3>
              <button type="button" onClick={() => setShowAddSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleCreateSubject(event)} className="space-y-3 text-xs">
              <label className="block font-bold text-slate-700">
                Subject Name *
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-slate-700">
                  Subject Code *
                  <input
                    type="text"
                    required
                    placeholder="e.g. MATH"
                    value={subjectCode}
                    onChange={(event) => setSubjectCode(event.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                  />
                </label>
                <label className="block font-bold text-slate-700">
                  Subject Type
                  <select
                    value={subjectType}
                    onChange={(event) => setSubjectType(event.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  >
                    <option value="CORE">Theory Core</option>
                    <option value="ELECTIVE">Elective Language</option>
                    <option value="LAB">Practical / Lab</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-slate-700">
                  Default Max Marks
                  <input
                    type="number"
                    min={1}
                    value={subjectMaxMarks}
                    onChange={(event) => setSubjectMaxMarks(Number(event.target.value))}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </label>
                <label className="block font-bold text-slate-700">
                  Default Pass Marks
                  <input
                    type="number"
                    min={0}
                    value={subjectPassMarks}
                    onChange={(event) => setSubjectPassMarks(Number(event.target.value))}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-2 font-bold">
                <button type="button" onClick={() => setShowAddSubjectModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-xl shadow-xs">
                  Create Master Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddGroupModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Add Course Stream Group</h3>
              <button type="button" onClick={() => setShowAddGroupModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleCreateGroup(event)} className="space-y-3 text-xs">
              <label className="block font-bold text-slate-700">
                Stream Code *
                <select
                  required
                  value={groupCode}
                  onChange={(event) => setGroupCode(event.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                >
                  {programmeOptions.streams.map((stream) => (
                    <option key={stream.code} value={stream.code}>
                      {stream.code}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <label className="block font-bold text-slate-700">
                  Coaching Track
                  <select
                    value={coachingTrack}
                    onChange={(event) => setCoachingTrack(event.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  >
                    {allowedTracks.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-3 text-xs text-teal-900 space-y-1">
                <div>
                  <span className="font-bold">Programme:</span> {generatedProgrammeLabel}
                </div>
                <div>
                  <span className="font-bold">Base Stream:</span> {selectedStream?.label}
                </div>
                <div>
                  <span className="font-bold">Code:</span>{" "}
                  <span className="font-mono">{generatedProgrammeCode}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Master Subjects</label>
                {selectedStream && selectedStream.defaultSubjects.some((name) => !subjects.some((subject) => subject.name.toLowerCase() === name.toLowerCase())) && (
                  <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                    Create missing default subjects first:{" "}
                    {selectedStream.defaultSubjects
                      .filter((name) => !subjects.some((subject) => subject.name.toLowerCase() === name.toLowerCase()))
                      .join(", ")}
                  </div>
                )}
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border">
                  {subjects.map((subject) => {
                    const isChecked = selectedSubjectIds.includes(subject.id);
                    return (
                      <label key={subject.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-white rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setSelectedSubjectIds((current) => [...current, subject.id]);
                            } else {
                              setSelectedSubjectIds((current) => current.filter((id) => id !== subject.id));
                            }
                          }}
                        />
                        <span className="font-semibold text-slate-800">
                          {subject.name} ({subject.code})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2 font-bold">
                <button type="button" onClick={() => setShowAddGroupModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-xl shadow-xs">
                  Create Course Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProgramme && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Course Stream Group</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{programmeLabel(editingProgramme)}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProgramme(null)}
                disabled={isSavingProgrammeEdit}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
              <div><span className="font-bold">Code:</span> {editingProgramme.code}</div>
              <div><span className="font-bold">Base Stream:</span> {programmeBaseLabel(editingProgramme)}</div>
              <div><span className="font-bold">Track:</span> {editingProgramme.coachingTrack || "-"}</div>
            </div>

            <form onSubmit={(event) => void handleSaveProgrammeEdit(event)} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Master Subjects</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border">
                  {subjects.map((subject) => {
                    const isChecked = editSubjectIds.includes(subject.id);
                    return (
                      <label key={subject.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-white rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setEditSubjectIds((current) => [...current, subject.id]);
                            } else {
                              setEditSubjectIds((current) => current.filter((id) => id !== subject.id));
                            }
                          }}
                        />
                        <span className="font-semibold text-slate-800">
                          {subject.name} ({subject.code})
                        </span>
                      </label>
                    );
                  })}
                  {subjects.length === 0 && (
                    <div className="py-4 text-center text-[11px] font-semibold text-slate-400">
                      Create master subjects before assigning them.
                    </div>
                  )}
                </div>
              </div>

              <label className="block font-bold text-slate-700">
                Status
                <select
                  value={editStatus}
                  onChange={(event) => setEditStatus(event.target.value as "ACTIVE" | "INACTIVE")}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive / Hide from setup</option>
                </select>
              </label>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-800">
                Stream code and coaching track are intentionally locked here. If this group already has batches,
                students, exams, or fees, create a new group instead of changing its identity.
              </div>

              <div className="flex gap-3 pt-1 font-bold">
                <button
                  type="button"
                  onClick={() => setEditingProgramme(null)}
                  disabled={isSavingProgrammeEdit}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProgrammeEdit}
                  className="flex-1 py-2 bg-teal-600 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSavingProgrammeEdit ? "Saving..." : "Save Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sectionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {canManageAcademicStructure ? "Manage Sections" : "Sections"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {programmeLabel(sectionModal.programme)} at{" "}
                  {sectionModal.branch.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSectionModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-xs text-teal-900">
              Sections are created inside the selected batch. For example, section suffix{" "}
              <strong>B</strong> creates a clean display section such as{" "}
              <strong>{sectionModal.programme.streamCode || sectionModal.programme.code.split("-")[0]}-B</strong>, while the backend keeps the
              year-aware section code for safe routing.
            </div>

            {loadingSections ? (
              <div className="py-8 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-600" /> Loading sections...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sectionBatches.map((batch) => (
                  <div key={batch.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{batch.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{batch.code}</div>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600 border border-slate-200">
                        Year {batch.yearLevel}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {batch.sections.length > 0 ? (
                        batch.sections.map((section) => (
                          <span
                            key={section.id}
                            className="rounded-lg border border-teal-200 bg-white px-2 py-1 text-[11px] font-bold text-teal-700"
                            title={section.code}
                          >
                            {section.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">
                          No active sections yet.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {sectionBatches.length === 0 && (
                  <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
                    No active batches were found. Save the offering matrix once for this stream and
                    academic year, then add sections.
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 flex justify-end gap-3 font-bold text-xs">
              {!canManageAcademicStructure && (
                <button
                  type="button"
                  onClick={() => setSectionModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
                >
                  Close
                </button>
              )}
            </div>

            {canManageAcademicStructure && (
              <form onSubmit={(event) => void handleCreateSection(event)} className="border-t border-slate-100 pt-4 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px] gap-3">
                  <label className="block font-bold text-slate-700">
                    Target Batch *
                    <select
                      required
                      value={selectedSectionBatchId}
                      onChange={(event) => setSelectedSectionBatchId(event.target.value)}
                      className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {sectionBatches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block font-bold text-slate-700">
                    Section *
                    <input
                      type="text"
                      required
                      maxLength={3}
                      placeholder="B"
                      value={newSectionSuffix}
                      onChange={(event) => setNewSectionSuffix(event.target.value.toUpperCase())}
                      className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </label>
                  <label className="block font-bold text-slate-700">
                    Capacity
                    <input
                      type="number"
                      min={1}
                      placeholder="Optional"
                      value={newSectionCapacity}
                      onChange={(event) => setNewSectionCapacity(event.target.value)}
                      className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-3 font-bold">
                  <button
                    type="button"
                    onClick={() => setSectionModal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingSection || sectionBatches.length === 0}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-50"
                  >
                    {isCreatingSection ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Add Section
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showAddYearModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Add Academic Year</h3>
              <button type="button" onClick={() => setShowAddYearModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleCreateAcademicYear(event)} className="space-y-3 text-xs">
              <label className="block font-bold text-slate-700">
                Academic Year Label (e.g. 2027-2028) *
                <input
                  type="text"
                  required
                  placeholder="e.g. 2027-2028"
                  value={yearName}
                  onChange={(event) => handleYearNameChange(event.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-slate-700">
                  Year Code
                  <input
                    type="text"
                    placeholder="e.g. 2027-28"
                    value={yearCode}
                    onChange={(event) => setYearCode(event.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                  />
                </label>
                <label className="flex items-center gap-2 pt-6 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefaultYear}
                    onChange={(e) => setIsDefaultYear(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Set Active Default</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-slate-700">
                  Start Date (Optional)
                  <input
                    type="date"
                    value={startsOn}
                    onChange={(event) => setStartsOn(event.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </label>
                <label className="block font-bold text-slate-700">
                  End Date (Optional)
                  <input
                    type="date"
                    value={endsOn}
                    onChange={(event) => setEndsOn(event.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-2 font-bold">
                <button type="button" onClick={() => setShowAddYearModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  Create Academic Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
