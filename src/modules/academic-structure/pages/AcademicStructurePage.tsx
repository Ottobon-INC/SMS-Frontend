import React, { useEffect, useMemo, useState } from "react";
import { BookMarked, BookOpen, CheckCircle2, Layers, RefreshCw, ShieldCheck, X } from "lucide-react";
import { academicStructureApi } from "../api/academicStructureApi";
import type { Programme, Subject } from "../types";

export function AcademicStructurePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectType, setSubjectType] = useState("CORE");
  const [subjectMaxMarks, setSubjectMaxMarks] = useState(100);
  const [subjectPassMarks, setSubjectPassMarks] = useState(35);

  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [coachingTrack, setCoachingTrack] = useState("JEE Mains");
  const [yearLevel, setYearLevel] = useState("First Year");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [showAddYearModal, setShowAddYearModal] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);
  const [matrixOfferings, setMatrixOfferings] = useState<Record<string, string[]>>({});
  const [selectedMatrixYearId, setSelectedMatrixYearId] = useState<string>("");
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

  const [yearName, setYearName] = useState("");
  const [yearCode, setYearCode] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [isDefaultYear, setIsDefaultYear] = useState(false);

  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);

  function notify(message: string) {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 4000);
  }

  async function fetchAcademicData() {
    setLoading(true);
    setError(null);
    try {
      const [nextSubjects, nextProgrammes, nextYears, branchesRes] = await Promise.all([
        academicStructureApi.getSubjects(),
        academicStructureApi.getProgrammes(),
        academicStructureApi.getAcademicYears(),
        fetch("/api/v1/branches").then((r) => (r.ok ? r.json() : [])),
      ]);
      setSubjects(nextSubjects);
      setProgrammes(nextProgrammes);
      setAcademicYears(nextYears);
      setBranches(branchesRes);

      const activeYear = nextYears.find((y: any) => y.isDefault) ?? nextYears[0];
      if (activeYear) {
        setSelectedMatrixYearId(activeYear.id);
      }

      if (branchesRes.length > 0) {
        const offeringsPromises = branchesRes.map((b: any) =>
          fetch(`/api/v1/branches/${b.id}/programmes`).then((r) => (r.ok ? r.json() : []))
        );
        const results = await Promise.all(offeringsPromises);
        const map: Record<string, string[]> = {};
        branchesRes.forEach((b: any, index: number) => {
          map[b.id] = (results[index] || []).map((p: any) => p.id);
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

  const [isEditingMatrix, setIsEditingMatrix] = useState(false);

  const handleToggleMatrixOffering = (branchId: string, programmeId: string) => {
    setMatrixOfferings((prev) => {
      const current = prev[branchId] || [];
      const updated = current.includes(programmeId)
        ? current.filter((id) => id !== programmeId)
        : [...current, programmeId];
      return { ...prev, [branchId]: updated };
    });
  };

  const handleSaveMatrix = async () => {
    setIsSavingMatrix(true);
    try {
      const savePromises = branches.map((b) =>
        fetch(`/api/v1/branches/${b.id}/programmes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programme_ids: matrixOfferings[b.id] || [] }),
        })
      );
      await Promise.all(savePromises);
      notify("Institution Branch Offering Matrix saved successfully!");
      setIsEditingMatrix(false);
    } catch (err) {
      notify("Failed to save branch offering matrix.");
    } finally {
      setIsSavingMatrix(false);
    }
  };

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
    if (!groupName.trim() || !groupCode.trim()) return;

    const created = await academicStructureApi.createProgramme({
      code: groupCode.trim().toUpperCase(),
      name: groupName.trim(),
      coachingTrack,
      yearLevel,
      subjectIds: selectedSubjectIds
    });

    setProgrammes((current) => [...current, created].sort((a, b) => a.code.localeCompare(b.code)));
    setGroupName("");
    setGroupCode("");
    setCoachingTrack("JEE Mains");
    setYearLevel("First Year");
    setSelectedSubjectIds([]);
    setShowAddGroupModal(false);
    notify(`Course Stream Group "${created.code}" created.`);
  }

  return (
    <div className="space-y-6 p-6">
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

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" /> Academic Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Govern institutional master subjects, course streams, groups, and coaching tracks for exam setup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchAcademicData()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowAddYearModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
          >
            <BookOpen className="w-4 h-4" /> Add Academic Year
          </button>
          <button
            type="button"
            onClick={() => setShowAddSubjectModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
          >
            <BookMarked className="w-4 h-4" /> Add Master Subject
          </button>
          <button
            type="button"
            onClick={() => setShowAddGroupModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
          >
            <Layers className="w-4 h-4 text-teal-400" /> Add Course Stream Group
          </button>
        </div>
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
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetDefaultYear(ay.id, ay.name)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition"
                  >
                    Set Active
                  </button>
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
                {isEditingMatrix ? "⚡ Edit Mode Active" : "🔒 Read-Only (Click Edit to Modify)"}
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
              <button
                type="button"
                onClick={() => setIsEditingMatrix(true)}
                className="mt-4 sm:mt-0 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer"
              >
                ✏️ Edit Offering Matrix
              </button>
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
                    <span className="font-bold text-slate-900 block">{prog.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-bold">
                        {prog.code}
                      </span>
                      {prog.coachingTrack && (
                        <span className="text-[10px] text-slate-500 font-medium">({prog.coachingTrack})</span>
                      )}
                    </div>
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
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold">
                            ✓ Offered
                          </span>
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
                        <span className="font-bold text-slate-900">{programme.code} - {programme.name}</span>
                        {programme.coachingTrack && (
                          <span className="ml-2 text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {programme.coachingTrack}
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 shrink-0">{programme.yearLevel}</span>
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
                <input
                  type="text"
                  required
                  placeholder="e.g. MPC or BIPC"
                  value={groupCode}
                  onChange={(event) => setGroupCode(event.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                />
              </label>

              <label className="block font-bold text-slate-700">
                Stream Name *
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics, Physics, Chemistry"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-slate-700">
                  Coaching Track
                  <select
                    value={coachingTrack}
                    onChange={(event) => setCoachingTrack(event.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  >
                    <option value="JEE Mains">JEE Mains & Advanced</option>
                    <option value="NEET">NEET Medical Track</option>
                    <option value="Regular Board">Regular Board Track</option>
                  </select>
                </label>

                <label className="block font-bold text-slate-700">
                  Year Level
                  <select
                    value={yearLevel}
                    onChange={(event) => setYearLevel(event.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  >
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                  </select>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Master Subjects</label>
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
  );
}
