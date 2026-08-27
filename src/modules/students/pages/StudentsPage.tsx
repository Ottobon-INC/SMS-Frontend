import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Filter, CheckCircle2, X, RefreshCw, GraduationCap, AlertCircle, Edit3, Save, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../authentication/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useStudents, STUDENT_KEYS } from '../hooks/useStudents';
import { studentsApi, type StudentInlineUpdatePayload, type StudentListItem } from '../api/studentsApi';
import { useAttendanceBranches } from '../../attendance/hooks/useAttendance';
import { StudentProfileSidePanel } from '../components/StudentProfileSidePanel';

type StudentColumn = {
  key: string;
  label: string;
  value: (student: StudentListItem) => unknown;
  editValue?: (student: StudentListItem) => unknown;
  className?: string;
  updateKey?: keyof StudentInlineUpdatePayload;
  inputType?: 'text' | 'date' | 'select';
  options?: string[];
};

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

function formatDateForDisplay(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const raw = String(value).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) {
    return String(value);
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatDateForEdit(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return String(value).slice(0, 10);
}

function formatRelationship(value: unknown): string {
  const raw = formatCellValue(value);
  if (raw === '-') {
    return raw;
  }
  return raw
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getProgrammeDisplay(student: StudentListItem): string {
  if (student.programmeDisplay) {
    return student.programmeDisplay;
  }
  if (student.programmeCode && student.programmeName) {
    return `${student.programmeCode} - ${student.programmeName}`;
  }
  return formatCellValue(student.programmeName ?? student.stream);
}

function getSectionDisplay(student: StudentListItem): string {
  return formatCellValue(student.sectionDisplay ?? student.sectionName ?? student.section);
}

function getYearLevelDisplay(student: StudentListItem): string {
  if (student.yearLevelLabel) {
    return student.yearLevelLabel;
  }
  if (student.yearLevel === '1') {
    return 'First Year';
  }
  if (student.yearLevel === '2') {
    return 'Second Year';
  }
  return formatCellValue(student.yearLevel);
}

const studentColumns: StudentColumn[] = [
  { key: 'admissionNumber', label: 'Admission No', value: (s) => s.admissionNumber, className: 'font-mono text-teal-700 font-bold' },
  { key: 'studentName', label: 'Student Name', value: (s) => s.displayName ?? s.legalName ?? s.name, className: 'font-bold text-slate-900', updateKey: 'student_name' },
  { key: 'programmeName', label: 'Programme / Stream', value: getProgrammeDisplay },
  { key: 'sectionName', label: 'Section', value: getSectionDisplay },
  { key: 'studentMobile', label: 'Student Mobile', value: (s) => s.studentMobile, updateKey: 'student_mobile' },
  { key: 'guardianPhone', label: 'Guardian Phone', value: (s) => s.guardianPhone ?? s.guardian_phone, updateKey: 'guardian_phone' },
];

const editableStudentColumns: StudentColumn[] = [
  { key: 'admissionNumber', label: 'Admission No', value: (s) => s.admissionNumber, className: 'font-mono text-teal-700 font-bold' },
  { key: 'studentName', label: 'Student Name', value: (s) => s.displayName ?? s.legalName ?? s.name, className: 'font-bold text-slate-900', updateKey: 'student_name' },
  { key: 'studentNumber', label: 'Student No', value: (s) => s.studentNumber },
  {
    key: 'gender',
    label: 'Gender',
    value: (s) => s.gender,
    updateKey: 'gender',
    inputType: 'select',
    options: ['MALE', 'FEMALE', 'OTHER'],
  },
  {
    key: 'dateOfBirth',
    label: 'Date Of Birth',
    value: (s) => formatDateForDisplay(s.dateOfBirth ?? s.dob),
    editValue: (s) => formatDateForEdit(s.dateOfBirth ?? s.dob),
    updateKey: 'date_of_birth',
    inputType: 'date',
  },
  { key: 'programmeName', label: 'Programme / Stream', value: getProgrammeDisplay },
  { key: 'yearLevel', label: 'Year Level', value: getYearLevelDisplay },
  { key: 'batchName', label: 'Batch', value: (s) => s.batchName },
  { key: 'sectionName', label: 'Section', value: getSectionDisplay },
  { key: 'academicYearName', label: 'Academic Year', value: (s) => s.academicYearName ?? s.academicYearCode },
  { key: 'rollNumber', label: 'Roll No', value: (s) => s.rollNumber ?? s.rollNo, updateKey: 'roll_number' },
  {
    key: 'joiningDate',
    label: 'Joining Date',
    value: (s) => formatDateForDisplay(s.joiningDate),
    editValue: (s) => formatDateForEdit(s.joiningDate),
    updateKey: 'joining_date',
    inputType: 'date',
  },
  {
    key: 'endingDate',
    label: 'Ending Date',
    value: (s) => formatDateForDisplay(s.endingDate),
    editValue: (s) => formatDateForEdit(s.endingDate),
    updateKey: 'ending_date',
    inputType: 'date',
  },
  { key: 'studentMobile', label: 'Student Mobile', value: (s) => s.studentMobile, updateKey: 'student_mobile' },
  { key: 'studentEmail', label: 'Student Email', value: (s) => s.studentEmail, updateKey: 'student_email' },
  { key: 'guardianName', label: 'Guardian Name', value: (s) => s.guardianName ?? s.father_name, updateKey: 'guardian_name' },
  {
    key: 'guardianRelationship',
    label: 'Relationship',
    value: (s) => formatRelationship(s.guardianRelationship ?? s.guardian_relationship),
    editValue: (s) => s.guardianRelationship ?? s.guardian_relationship,
    updateKey: 'guardian_relationship',
    inputType: 'select',
    options: ['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'RELATIVE', 'SPONSOR', 'OTHER'],
  },
  { key: 'guardianPhone', label: 'Guardian Phone', value: (s) => s.guardianPhone ?? s.guardian_phone, updateKey: 'guardian_phone' },
  { key: 'guardianEmail', label: 'Guardian Email', value: (s) => s.guardianEmail, updateKey: 'guardian_email' },
  { key: 'enrollmentStatus', label: 'Enrollment Status', value: (s) => s.enrollmentStatus ?? s.status },
  { key: 'studentCreatedAt', label: 'Created At', value: (s) => formatDateForDisplay(s.studentCreatedAt) },
  { key: 'studentUpdatedAt', label: 'Updated At', value: (s) => formatDateForDisplay(s.studentUpdatedAt) },
  { key: 'portalAccessEnabled', label: 'Portal Access', value: (s) => s.portalAccessEnabled },
  { key: 'notificationEnabled', label: 'Notifications', value: (s) => s.notificationEnabled },
  { key: 'paymentEnabled', label: 'Payments', value: (s) => s.paymentEnabled },
];

function getHeaderCellClass(column: StudentColumn, editMode: boolean): string {
  if (editMode) {
    return 'py-3.5 px-4 whitespace-nowrap border-r border-slate-200 last:border-r-0';
  }
  const stickyClass =
    column.key === 'admissionNumber'
      ? 'sticky left-0 z-20 bg-slate-50'
      : column.key === 'studentName'
        ? 'sticky left-[150px] z-20 bg-slate-50'
        : '';
  return `py-3.5 px-4 whitespace-nowrap border-r border-slate-200 last:border-r-0 ${stickyClass}`;
}

function getBodyCellClass(column: StudentColumn, editMode: boolean): string {
  if (editMode) {
    const widthClass =
      column.key === 'admissionNumber'
        ? 'min-w-[150px]'
        : column.key === 'studentName'
          ? 'min-w-[210px]'
          : '';
    const readonlyClass = column.updateKey == null ? 'bg-slate-50/40 text-slate-500' : '';
    return `py-3 px-4 max-w-[260px] whitespace-nowrap border-r border-slate-100 last:border-r-0 ${widthClass} ${readonlyClass} ${column.className ?? 'text-slate-600'}`;
  }
  const stickyClass =
    column.key === 'admissionNumber'
      ? 'sticky left-0 z-10 bg-white group-hover:bg-slate-50'
      : column.key === 'studentName'
        ? 'sticky left-[150px] z-10 bg-white group-hover:bg-slate-50'
        : '';
  const widthClass =
    column.key === 'admissionNumber'
      ? 'min-w-[150px]'
      : column.key === 'studentName'
        ? 'min-w-[210px]'
        : '';
  return `py-3 px-4 max-w-[260px] whitespace-nowrap border-r border-slate-100 last:border-r-0 ${stickyClass} ${widthClass} ${column.className ?? 'text-slate-600'}`;
}

const SearchableBranchSelect = ({
  branches,
  value,
  onChange
}: {
  branches: { id: string, name: string }[],
  value: string,
  onChange: (val: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedBranch = branches.find(b => b.id === value);
  const filteredBranches = branches.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 min-w-[200px] bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-teal-500 flex justify-between items-center gap-2 transition"
      >
        <span className="truncate">{selectedBranch ? selectedBranch.name : 'Select Branch...'}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-[280px] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                autoFocus
                type="text"
                placeholder="Search branches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-teal-500"
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1">
            {filteredBranches.length > 0 ? filteredBranches.map(b => (
              <button
                key={b.id}
                onClick={() => { onChange(b.id); setIsOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${b.id === value ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                {b.name}
              </button>
            )) : (
              <div className="px-3 py-4 text-center text-xs text-slate-500">No branches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const isTenantLevel = !auth.activeContext?.branch_id;
  const { data: branches = [] } = useAttendanceBranches();

  const [branchFilter, setBranchFilter] = useState<string>(isTenantLevel ? 'PENDING' : 'ALL');

  // Set default branch for Tenant Level users once branches load
  useEffect(() => {
    if (isTenantLevel && branchFilter === 'PENDING' && branches.length > 0) {
      setBranchFilter(branches[0].id);
    }
  }, [isTenantLevel, branchFilter, branches]);

  const fetchBranchId = isTenantLevel ? (branchFilter === 'PENDING' ? undefined : branchFilter) : undefined;
  const shouldFetch = !isTenantLevel || branchFilter !== 'PENDING';

  const { data: students = [], isLoading: loading, refetch } = useStudents(fetchBranchId, shouldFetch);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [streamFilter, setStreamFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [savingEdits, setSavingEdits] = useState<boolean>(false);
  const [draftChanges, setDraftChanges] = useState<Record<string, StudentInlineUpdatePayload>>({});
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);

  // Pagination
  const PAGE_SIZE = 50;
  const [currentPage, setCurrentPage] = useState<number>(1);

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
  const canEditStudents = auth.hasAnyPermission(['student.update_basic', 'student.update_sensitive']);

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
      queryClient.invalidateQueries({ queryKey: STUDENT_KEYS.lists() });
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

  const toggleEditMode = () => {
    setEditMode((current) => !current);
    setDraftChanges({});
  };

  const updateDraftCell = (studentId: string, key: keyof StudentInlineUpdatePayload, value: string) => {
    setDraftChanges((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        [key]: value,
      },
    }));
  };

  const getDraftValue = (student: StudentListItem, column: StudentColumn): string => {
    if (column.updateKey == null) {
      return formatCellValue(column.value(student));
    }
    const draft = draftChanges[student.id]?.[column.updateKey];
    if (draft !== undefined && draft !== null) {
      return String(draft);
    }
    const currentValue = column.editValue ? column.editValue(student) : column.value(student);
    return currentValue === '-' ? '' : formatCellValue(currentValue);
  };

  const saveEdits = async () => {
    const changedEntries = Object.entries(draftChanges).filter(([, changes]) => Object.keys(changes).length > 0);
    if (changedEntries.length === 0) {
      setEditMode(false);
      return;
    }
    const confirmed = window.confirm(`Save changes for ${changedEntries.length} student record(s)?`);
    if (!confirmed) {
      return;
    }

    setSavingEdits(true);
    setLoadError(null);
    try {
      for (const [studentId, changes] of changedEntries) {
        await studentsApi.updateInline(studentId, changes);
      }
      queryClient.invalidateQueries({ queryKey: STUDENT_KEYS.lists() });
      setDraftChanges({});
      setEditMode(false);
      setNotification('Student changes saved successfully.');
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to save student changes.');
    } finally {
      setSavingEdits(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProgrammeDisplay(s).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSectionDisplay(s).toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatCellValue(s.rollNumber ?? s.rollNo).toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatCellValue(s.guardianName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatCellValue(s.guardianPhone).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStream =
      streamFilter === 'ALL' ||
      s.stream === streamFilter ||
      s.programmeCode === streamFilter ||
      s.streamCode === streamFilter ||
      getProgrammeDisplay(s).toLowerCase().startsWith(`${streamFilter.toLowerCase()} -`);
    const matchesBranch =
      branchFilter === 'ALL' ||
      branchFilter === 'PENDING' ||
      s.branchId === branchFilter || // use API branch ID if available
      s.branchName === branchFilter ||
      s.branchCode === branchFilter;

    const matchesYear =
      yearFilter === 'ALL' ||
      (yearFilter === '1' && (
        s.batchName?.toLowerCase().includes('1st') ||
        s.batchName?.toLowerCase().includes('jr') ||
        s.batchName?.toLowerCase().includes('first') ||
        s.section?.toLowerCase().includes('jr') ||
        s.section?.toLowerCase().includes('1st') ||
        s.sectionName?.toLowerCase().includes('jr') ||
        s.sectionName?.toLowerCase().includes('1st')
      )) ||
      (yearFilter === '2' && (
        s.batchName?.toLowerCase().includes('2nd') ||
        s.batchName?.toLowerCase().includes('sr') ||
        s.batchName?.toLowerCase().includes('second') ||
        s.section?.toLowerCase().includes('sr') ||
        s.section?.toLowerCase().includes('2nd') ||
        s.sectionName?.toLowerCase().includes('sr') ||
        s.sectionName?.toLowerCase().includes('2nd')
      ));

    return matchesSearch && matchesStream && matchesBranch && matchesYear;
  });

  // Reset pagination if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, streamFilter, branchFilter, yearFilter]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeColumns = editMode ? editableStudentColumns : studentColumns;

  // Force branch selection for Dean (no "All Branches") - handled at top level

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
            <GraduationCap className="w-6 h-6 text-teal-600" /> Student Directory
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 ml-2">
              {filteredStudents.length} {filteredStudents.length === 1 ? 'Student' : 'Students'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage student enrollments, course stream assignments, and guardian contact profiles connected to PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canEditStudents && (
            editMode ? (
              <>
                <button
                  onClick={saveEdits}
                  disabled={savingEdits}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {savingEdits ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={toggleEditMode}
                  disabled={savingEdits}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition disabled:opacity-50"
                >
                  Cancel Edit
                </button>
              </>
            ) : (
              <button
                onClick={toggleEditMode}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition"
              >
                <Edit3 className="w-4 h-4" /> Edit Student Data
              </button>
            )
          )}
          <button
            onClick={() => navigate('/imports/manual')}
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

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {isTenantLevel && branches.length > 0 && (
            <div className="flex items-center gap-1 z-50">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Branch:
              </span>
              <SearchableBranchSelect
                branches={branches}
                value={branchFilter}
                onChange={setBranchFilter}
              />
            </div>
          )}

          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Stream:
            </span>
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-teal-500"
            >
              <option value="ALL">All Streams</option>
              <option value="MPC">MPC Stream</option>
              <option value="BIPC">BiPC Stream</option>
              <option value="MEC">MEC Stream</option>
              <option value="CEC">CEC Stream</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Year:
            </span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-teal-500"
            >
              <option value="ALL">All Years</option>
              <option value="1">1st Year (Jr)</option>
              <option value="2">2nd Year (Sr)</option>
            </select>
          </div>
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="max-h-[64vh] overflow-auto">
            <table className={`${editMode ? 'min-w-[3200px]' : 'min-w-[900px]'} w-full text-left text-xs border-collapse`}>
              <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                {activeColumns.map((column) => (
                  <th key={column.key} className={getHeaderCellClass(column, editMode)}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedStudents.map((s) => (
                <tr
                  key={s.id}
                  className={`group hover:bg-slate-50/80 transition ${!editMode ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                  onClick={() => !editMode && setSelectedStudent(s)}
                >
                  {activeColumns.map((column) => (
                    <td
                      key={`${s.id}-${column.key}`}
                      className={getBodyCellClass(column, editMode)}
                      title={formatCellValue(column.value(s))}
                    >
                      {editMode && column.updateKey != null ? (
                        column.inputType === 'select' ? (
                          <select
                            value={getDraftValue(s, column)}
                            onChange={(event) => updateDraftCell(s.id, column.updateKey!, event.target.value)}
                            className="min-w-[150px] rounded-lg border border-teal-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none focus:border-teal-500"
                          >
                            {column.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={column.inputType ?? 'text'}
                            value={getDraftValue(s, column)}
                            onChange={(event) => updateDraftCell(s.id, column.updateKey!, event.target.value)}
                            className="min-w-[150px] rounded-lg border border-teal-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none focus:border-teal-500"
                          />
                        )
                      ) : (
                        formatCellValue(column.value(s))
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-500">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length} students
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                >
                  Previous
                </button>
                <div className="flex items-center px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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

      {/* Side Panel */}
      <StudentProfileSidePanel
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
};
