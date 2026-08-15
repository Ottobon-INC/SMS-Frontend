import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Filter, CheckCircle2, X, RefreshCw, GraduationCap, Phone, AlertCircle } from 'lucide-react';
import { studentsApi, type StudentListItem } from '../api/studentsApi';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [streamFilter, setStreamFilter] = useState<string>('ALL');
  const [loadError, setLoadError] = useState<string | null>(null);

  // 3-Tab Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'stream' | 'guardian'>('identity');
  const [modalError, setModalError] = useState<string | null>(null);

  // Tab 1: Identity
  const [fullName, setFullName] = useState<string>('');
  const [admissionNumber, setAdmissionNumber] = useState<string>('');
  const [gender, setGender] = useState<string>('MALE');
  const [dob, setDob] = useState<string>('2008-05-15');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');

  // Tab 2: Stream & Section
  const [stream, setStream] = useState<string>('MPC');
  const [sectionName, setSectionName] = useState<string>('Sec-A');

  // Tab 3: Guardian Details
  const [fatherName, setFatherName] = useState<string>('');
  const [motherName, setMotherName] = useState<string>('');
  const [guardianPhone, setGuardianPhone] = useState<string>('');
  const [guardianEmail, setGuardianEmail] = useState<string>('');

  const [notification, setNotification] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await studentsApi.list();
      setStudents(data);
    } catch (err: unknown) {
      console.error('Failed to fetch students:', err);
      setLoadError(err instanceof Error ? err.message : 'Failed to load students.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!fullName.trim()) {
      setModalError('Student Full Name is required on Tab 1 (Identity)!');
      setActiveTab('identity');
      return;
    }

    setSubmitting(true);
    try {
      const newStu = await studentsApi.create({
        name: fullName.trim(),
        admissionNumber: admissionNumber.trim() || undefined,
        gender,
        date_of_birth: dob,
        blood_group: bloodGroup,
        stream,
        section: sectionName,
        guardian: {
          father_name: fatherName,
          mother_name: motherName,
          guardian_phone: guardianPhone,
          guardian_email: guardianEmail,
        },
      });
      setStudents((prev) => [newStu, ...prev]);
      setShowAddModal(false);
      resetForm();
      setNotification(`Student "${newStu.name}" enrolled successfully!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      console.error('Failed to enroll student:', err);
      setModalError(`Connection error: ${err instanceof Error ? err.message : 'Server error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setAdmissionNumber('');
    setGender('MALE');
    setFatherName('');
    setMotherName('');
    setGuardianPhone('');
    setGuardianEmail('');
    setModalError(null);
    setActiveTab('identity');
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStream = streamFilter === 'ALL' || s.stream === streamFilter;
    return matchesSearch && matchesStream;
  });

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

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-teal-600" /> Student Directory & Enrollment Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage student enrollments, course stream assignments, and guardian contact profiles connected to PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStudents}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition"
          >
            <UserPlus className="w-4 h-4" /> Enroll New Student
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by student name or admission no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Stream:
          </span>
          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Streams</option>
            <option value="MPC">MPC Stream</option>
            <option value="BiPC">BiPC Stream</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-600" /> Loading Student Roster from PostgreSQL...
        </div>
      ) : loadError != null ? (
        <div className="bg-white p-8 rounded-3xl border border-red-200 text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-sm font-bold text-red-700">Unable To Load Students</p>
          <p className="text-xs text-red-500">{loadError}</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Students Found</p>
          <p className="text-xs text-slate-400">Click "Enroll New Student" to add student records.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Admission No</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Gender</th>
                <th className="py-3.5 px-4">Stream</th>
                <th className="py-3.5 px-4">Guardian Contact</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono text-[11px] text-teal-700 font-bold">{s.admissionNumber}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 text-slate-500">{s.gender}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-bold">
                      {s.stream} ({s.section})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="text-[11px]">
                      <span className="font-bold block text-slate-800">
                        {s.father_name || 'N/A'}
                        {s.guardian_relationship && (
                          <span className="text-slate-400 font-normal ml-1 capitalize">({s.guardian_relationship.toLowerCase()})</span>
                        )}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3" /> {s.guardian_phone || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3-TAB ENROLL STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" /> Enroll New Student
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Tab Navigation Header */}
            <div className="flex border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('identity')}
                className={`py-2 px-4 border-b-2 transition ${
                  activeTab === 'identity'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                1. Identity *
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stream')}
                className={`py-2 px-4 border-b-2 transition ${
                  activeTab === 'stream'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                2. Stream & Section
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('guardian')}
                className={`py-2 px-4 border-b-2 transition ${
                  activeTab === 'guardian'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                3. Parent & Guardian
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4 text-xs">
              {/* TAB 1: IDENTITY */}
              <div className={activeTab === 'identity' ? 'space-y-3' : 'hidden'}>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admission Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SVIC-2026-005 (Auto-generated if empty)"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                    >
                      <option value="O+">O positive (O+)</option>
                      <option value="A+">A positive (A+)</option>
                      <option value="B+">B positive (B+)</option>
                      <option value="AB+">AB positive (AB+)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TAB 2: STREAM & SECTION */}
              <div className={activeTab === 'stream' ? 'space-y-3' : 'hidden'}>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Stream *</label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  >
                    <option value="MPC">MPC (Maths, Physics, Chemistry)</option>
                    <option value="BiPC">BiPC (Biology, Physics, Chemistry)</option>
                    <option value="CEC">CEC (Civics, Economics, Commerce)</option>
                    <option value="MEC">MEC (Maths, Economics, Commerce)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class Section</label>
                  <select
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  >
                    <option value="Sec-A">Section A (Regular)</option>
                    <option value="Sec-B">Section B (Coaching)</option>
                  </select>
                </div>
              </div>

              {/* TAB 3: GUARDIAN DETAILS */}
              <div className={activeTab === 'guardian' ? 'space-y-3' : 'hidden'}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Father's Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Sharma"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mother's Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sunita Sharma"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guardian Mobile Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 12345"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. parent@svic.edu"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t font-bold">
                <div className="flex gap-2">
                  {activeTab !== 'identity' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'guardian' ? 'stream' : 'identity')}
                      className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl"
                    >
                      Back
                    </button>
                  )}
                  {activeTab !== 'guardian' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'identity' ? 'stream' : 'guardian')}
                      className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl"
                    >
                      Next
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Enrolling...' : 'Enroll Student'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
