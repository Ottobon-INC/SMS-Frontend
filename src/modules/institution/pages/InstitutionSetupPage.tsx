import React, { useState, useEffect } from 'react';
import { Building, GitBranch, BookOpen, Plus, X, CheckCircle2, ShieldCheck, Layers, BookMarked, Award, RefreshCw } from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
  subjectType?: string;
  maxMarks: number;
  passMarks: number;
}

interface Programme {
  id: string;
  code: string;
  name: string;
  coachingTrack?: string;
  yearLevel: string;
  subjectIds?: string[];
}

export const InstitutionSetupPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Controls
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);

  // Subject Form State (Dean Only)
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState('CORE');
  const [subjectMaxMarks, setSubjectMaxMarks] = useState<number>(100);
  const [subjectPassMarks, setSubjectPassMarks] = useState<number>(35);

  // Group / Stream Form State
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [coachingTrack, setCoachingTrack] = useState('JEE Mains');
  const [yearLevel, setYearLevel] = useState<string>('First Year');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchAcademicData = async () => {
    setLoading(true);
    try {
      const [subRes, progRes] = await Promise.all([
        fetch('/api/v1/academic-structure/subjects'),
        fetch('/api/v1/academic-structure/programmes'),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubjects(subData);
      }
      if (progRes.ok) {
        const progData = await progRes.json();
        setProgrammes(progData);
      }
    } catch (err) {
      console.error('Failed to fetch academic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim()) return;

    try {
      const res = await fetch('/api/v1/academic-structure/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: subjectCode.trim().toUpperCase(),
          name: subjectName.trim(),
          type: subjectType,
          maxMarks: Number(subjectMaxMarks) || 100,
          passMarks: Number(subjectPassMarks) || 35,
        }),
      });

      if (res.ok) {
        const newSub = await res.json();
        setSubjects((prev) => [...prev, newSub]);
        setSubjectName('');
        setSubjectCode('');
        setSubjectMaxMarks(100);
        setSubjectPassMarks(35);
        setShowAddSubjectModal(false);
        triggerNotify(`Master Subject "${newSub.name}" created by Dean!`);
      }
    } catch (err) {
      console.error('Failed to create subject:', err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !groupCode.trim()) return;

    try {
      const res = await fetch('/api/v1/academic-structure/programmes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: groupCode.trim().toUpperCase(),
          name: groupName.trim(),
          coachingTrack,
          yearLevel,
          subjectIds: selectedSubjectIds,
        }),
      });

      if (res.ok) {
        const newGroup = await res.json();
        setProgrammes((prev) => [...prev, { ...newGroup, subjectIds: selectedSubjectIds, coachingTrack }]);
        setGroupName('');
        setGroupCode('');
        setSelectedSubjectIds([]);
        setShowAddGroupModal(false);
        triggerNotify(`Course Stream Group "${newGroup.code}" created!`);
      }
    } catch (err) {
      console.error('Failed to create stream:', err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" /> Academic Governance (Dean Console)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Govern institutional Master Subjects, configure Course Streams / Groups, and define coaching tracks persisted in PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAcademicData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition"
          >
            <BookMarked className="w-4 h-4" /> Add Master Subject
          </button>
          <button
            onClick={() => setShowAddGroupModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition"
          >
            <Layers className="w-4 h-4 text-teal-400" /> Add Course Stream Group
          </button>
        </div>
      </div>

      {/* Grid of Sections */}
      {loading ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-600" /> Loading Academic Foundation Data from PostgreSQL...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Master Subjects List */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Master Subjects Catalog</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">{subjects.length} Subjects</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {subjects.map((sub) => (
                <div key={sub.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">{sub.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">Code: {sub.code}</span>
                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[9px] font-bold rounded">
                        {sub.subjectType || 'CORE'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <span className="text-slate-600">Max: <strong>{sub.maxMarks}</strong></span> • <span className="text-slate-500">Pass: <strong>{sub.passMarks}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Course Streams / Subject Groups */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Course Streams & Subject Groups</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">{programmes.length} Streams</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs space-y-3">
              {programmes.map((prog) => {
                const assignedSubs = subjects.filter((s) => (prog.subjectIds || []).includes(s.id));
                return (
                  <div key={prog.id} className="pt-3 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">{prog.code} - {prog.name}</span>
                        {prog.coachingTrack && (
                          <span className="ml-2 text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {prog.coachingTrack}
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">{prog.yearLevel}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {assignedSubs.length > 0 ? (
                        assignedSubs.map((s) => (
                          <span key={s.id} className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded text-[10px] font-semibold">
                            {s.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">5 Master Subjects Linked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ADD MASTER SUBJECT MODAL */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Add Master Subject</h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics 1A"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MATH-1A"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject Type</label>
                  <select
                    value={subjectType}
                    onChange={(e) => setSubjectType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  >
                    <option value="CORE">Theory (Core)</option>
                    <option value="ELECTIVE">Elective Language</option>
                    <option value="LAB">Practical / Lab</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Max Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={subjectMaxMarks}
                    onChange={(e) => setSubjectMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Pass Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={subjectPassMarks}
                    onChange={(e) => setSubjectPassMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  />
                </div>
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

      {/* ADD COURSE STREAM GROUP MODAL */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Add Course Stream Group</h3>
              <button onClick={() => setShowAddGroupModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Stream Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MPC or BiPC"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Stream Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maths, Physics, Chemistry"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coaching Track</label>
                  <select
                    value={coachingTrack}
                    onChange={(e) => setCoachingTrack(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  >
                    <option value="JEE Mains">JEE Mains & Advanced</option>
                    <option value="NEET">NEET Medical Track</option>
                    <option value="Regular Board">Regular Board Track</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Year Level</label>
                  <select
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  >
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Master Subjects</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border">
                  {subjects.map((sub) => {
                    const isChecked = selectedSubjectIds.includes(sub.id);
                    return (
                      <label key={sub.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-white rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                            } else {
                              setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== sub.id));
                            }
                          }}
                        />
                        <span className="font-semibold text-slate-800">{sub.name} ({sub.code})</span>
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
    </div>
  );
};
