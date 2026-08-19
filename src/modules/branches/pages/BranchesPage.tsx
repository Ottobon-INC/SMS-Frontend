/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, Phone, Mail, CheckCircle2, X, RefreshCw, UserCheck, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../../authentication/providers/AuthProvider';

  interface Branch {
    id: string;
    code: string;
    name: string;
    legal_name?: string;
    status: string;
    timezone?: string;
    phone?: string;
    email?: string;
    address?: string;
    contact?: any;
    contact_person?: string;
    principal_user_id?: string;

  address_data?: {
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  contact_data?: {
    primary_phone?: string;
    email?: string;
    contact_person_name?: string;
    contact_person_role?: string;
  };
}

interface SystemUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
  branch?: string;
  status?: string;
}

export const BranchesPage: React.FC = () => {
  const { activeContext } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isDeanOrAdmin =
    activeContext?.role_codes.includes('INSTITUTION_ADMIN') ||
    activeContext?.role_codes.includes('PLATFORM_ADMIN') ||
    activeContext?.scope_type === 'TENANT' ||
    activeContext?.scope_type === 'PLATFORM';
  
  // Modal state for Add Branch
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [, setActiveTab] = useState<'basic' | 'location' | 'contact'>('basic');
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [branchCode, setBranchCode] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [legalName, setLegalName] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
  
  // Location Fields
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [stateName, setStateName] = useState<string>('Telangana');
  const [pincode, setPincode] = useState<string>('');

  // Contact & Admin Fields
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [contactPersonName, setContactPersonName] = useState<string>('');
  const [contactPersonRole] = useState<string>('Campus Principal');

  // Assign Principal Modal State
  const [showAssignPrincipalModal, setShowAssignPrincipalModal] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [principalUserId, setPrincipalUserId] = useState<string>('');

  // Manage Programme Offerings Modal State
  const [showProgrammesModal, setShowProgrammesModal] = useState<boolean>(false);
  const [programmesBranch, setProgrammesBranch] = useState<Branch | null>(null);
  const [allMasterProgrammes, setAllMasterProgrammes] = useState<any[]>([]);
  const [assignedProgIds, setAssignedProgIds] = useState<string[]>([]);
  const [loadingProgrammesData, setLoadingProgrammesData] = useState<boolean>(false);
  
  const [notification, setNotification] = useState<string | null>(null);

  const fetchMasterProgrammes = async () => {
    try {
      const res = await fetch('/api/v1/academic-structure/programmes');
      if (res.ok) {
        const data = await res.json();
        setAllMasterProgrammes(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch master programmes:', err);
    }
    return [];
  };

  const handleOpenProgrammesModal = async (branch: Branch) => {
    setProgrammesBranch(branch);
    setShowProgrammesModal(true);
    setLoadingProgrammesData(true);
    setAssignedProgIds([]);

    try {
      if (allMasterProgrammes.length === 0) {
        await fetchMasterProgrammes();
      }
      const branchRes = await fetch(`/api/v1/branches/${branch.id}/programmes`);

      if (branchRes.ok) {
        const data = await branchRes.json();
        setAssignedProgIds(data.map((p: any) => p.id));
      }
    } catch (err) {
      console.error('Failed to fetch assigned branch programmes:', err);
    } finally {
      setLoadingProgrammesData(false);
    }
  };

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/users');
      if (res.ok) {
        const data = await res.json();
        setSystemUsers(data);
        if (data.length > 0) {
          setContactPersonName(data[0].name);
          setPrincipalUserId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchUsers();
    fetchMasterProgrammes();
  }, []);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!branchCode.trim()) {
      setModalError('Campus Code is required on Tab 1 (Basic Info)!');
      setActiveTab('basic');
      return;
    }

    if (!branchName.trim()) {
      setModalError('Campus Name is required on Tab 1 (Basic Info)!');
      setActiveTab('basic');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: branchCode.trim().toUpperCase(),
          name: branchName.trim(),
          legal_name: legalName.trim() || `${branchName.trim()} Educational Campus`,
          timezone,
          address: {
            street: streetAddress,
            city,
            district,
            state: stateName,
            pincode,
          },
          contact: {
            primary_phone: phone || '+91 98765 43210',
            email: email || 'branch@svic.edu',
            contact_person_name: contactPersonName || 'Unassigned',
            contact_person_role: contactPersonRole || 'Principal',
          },
        }),
      });

      if (res.ok) {
        const newBranch = await res.json();
        setBranches((prev) => [newBranch, ...prev]);
        setShowAddModal(false);
        resetForm();
        setNotification(`Campus Branch "${newBranch.name}" created successfully!`);
        setTimeout(() => setNotification(null), 4000);
      } else {
        const errTxt = await res.text();
        setModalError(`Failed to create branch: ${errTxt || res.statusText}`);
      }
    } catch (err: any) {
      console.error('Failed to create branch:', err);
      setModalError(`Connection error: ${err.message || 'Server error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignPrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || !principalUserId) return;

    const selectedUser = systemUsers.find((u) => u.id === principalUserId);
    if (!selectedUser) return;

    const currentAssignmentName = getUserAssignment(selectedUser);

    if (isAssignedElsewhere(selectedUser, selectedBranch)) {
      const confirmed = window.confirm(
        `${selectedUser.name} is already assigned to ${currentAssignmentName}. Assigning this user to ${selectedBranch.name} will move their campus assignment. Do you want to proceed?`
      );
      if (!confirmed) return;
    }

    try {
      const res = await fetch(`/api/v1/branches/${selectedBranch.id}/assign-principal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          user_name: selectedUser.name,
        }),
      });

      if (res.ok) {
        await Promise.all([fetchBranches(), fetchUsers()]);
        setShowAssignPrincipalModal(false);
        setNotification(`Principal "${selectedUser.name}" assigned to ${selectedBranch.name}!`);
        setTimeout(() => setNotification(null), 4000);
      } else {
        const errTxt = await res.text();
        alert(`Failed to assign principal: ${errTxt}`);
      }
    } catch (err: any) {
      console.error('Failed to assign principal:', err);
      alert(`Connection error: ${err.message || 'Server error'}`);
    }
  };


  const resetForm = () => {
    setBranchCode('');
    setBranchName('');
    setLegalName('');
    setStreetAddress('');
    setCity('');
    setDistrict('');
    setStateName('Telangana');
    setPincode('');
    setPhone('');
    setEmail('');
    setModalError(null);
    if (systemUsers.length > 0) {
      setContactPersonName(systemUsers[0].name);
      setPrincipalUserId(systemUsers[0].id);
    }
    setActiveTab('basic');
  };

  const filteredBranches = branches.filter(
    (b) =>
      ((b.name || (b as any).displayName || '') as string).toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((b.code || (b as any).branchCode || '') as string).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleLabels: Record<string, string> = {
    INSTITUTION_ADMIN: 'Institution Admin / Dean',
    BRANCH_ADMIN: 'Principal / Campus Admin',
    OFFICE_STAFF: 'Office Staff',
    TEACHER: 'Teacher',
    PARENT_GUARDIAN: 'Parent / Guardian',
  };

  const principalCandidates = systemUsers.filter(
    (u) => (u.status ?? 'ACTIVE') === 'ACTIVE' && u.role !== 'INSTITUTION_ADMIN' && u.role !== 'PARENT_GUARDIAN'
  );

  const branchNames = branches.map((b) => b.name);

  const getUserAssignment = (user: SystemUser) => {
    const idMatch = branches.find((b) => b.principal_user_id === user.id);
    if (idMatch) return idMatch.name;
    const nameMatch = user.branch && branchNames.includes(user.branch) ? user.branch : '';
    return nameMatch || '';
  };


  const getAssignmentLabel = (user: SystemUser, targetBranch?: Branch | null) => {
    const assignedBranchName = getUserAssignment(user);
    if (!assignedBranchName) return 'Unassigned';
    if (targetBranch && assignedBranchName === targetBranch.name) return `Assigned to this campus: ${assignedBranchName}`;
    return `Assigned elsewhere: ${assignedBranchName}`;
  };

  const isAssignedElsewhere = (user: SystemUser, targetBranch?: Branch | null) => {
    const assignedBranchName = getUserAssignment(user);
    return Boolean(targetBranch && assignedBranchName && assignedBranchName !== targetBranch.name);
  };

  const renderUserPicker = (
    selectedUserId: string,
    onSelectUser: (user: SystemUser) => void,
    targetBranch?: Branch | null
  ) => (
    <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 space-y-2">
      {principalCandidates.length === 0 ? (
        <div className="p-3 text-[11px] font-semibold text-slate-500">No registered users available.</div>
      ) : (
        principalCandidates.map((u) => {
          const isSelected = selectedUserId === u.id;
          const assignedBranchName = getUserAssignment(u);
          const assignedElsewhere = isAssignedElsewhere(u, targetBranch);
          const assignedToTarget = Boolean(targetBranch && assignedBranchName === targetBranch.name);
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => onSelectUser(u)}
              className={`w-full text-left rounded-xl border p-3 transition-colors ${
                isSelected ? 'border-teal-500 bg-white shadow-sm ring-2 ring-teal-100' : 'border-slate-200 bg-white hover:border-teal-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-5 break-words">{u.name}</p>
                  <p className="text-[11px] font-medium text-slate-500 leading-4">
                    {roleLabels[u.role || ''] || u.role || 'User'}{u.email ? ` - ${u.email}` : ''}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 leading-4 break-words">{getAssignmentLabel(u, targetBranch)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                    !assignedBranchName
                      ? 'bg-emerald-100 text-emerald-700'
                      : assignedElsewhere
                      ? 'bg-amber-100 text-amber-700'
                      : assignedToTarget
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {!assignedBranchName ? 'Unassigned' : assignedToTarget ? 'This Campus' : 'Assigned'}
                </span>
              </div>
            </button>
          );
        })
      )}
    </div>
  );

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
            <Building2 className="w-6 h-6 text-teal-600" /> Institutional Campus Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage regional campus branches, location details, contact numbers, and assign pre-created system users as Principals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBranches}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Refresh Branches"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isDeanOrAdmin ? (
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition"
            >
              <Plus className="w-4 h-4" /> Add Campus Branch
            </button>
          ) : (
            <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-[11px] font-semibold flex items-center gap-1.5" title="Branch creation is restricted to Institution Administrators (Deans)">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Dean / Institution Admin Only
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by campus name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-teal-500 transition"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredBranches.length} of {branches.length} Campuses
        </span>
      </div>

      {/* Branch Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-600" /> Loading Campus Branches from PostgreSQL...
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Campus Branches Found</p>
          <p className="text-xs text-slate-400">Click "Add Campus Branch" to create your first institutional campus branch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map((b) => (
            <div key={b.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3.5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2.5 py-1 bg-teal-50 text-teal-800 font-mono text-[10px] font-bold rounded-lg border border-teal-200">
                    {b.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{b.name}</h3>
                  {b.legal_name && (
                    <p className="text-[11px] text-slate-400 font-medium">{b.legal_name}</p>
                  )}
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    b.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100 font-medium">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {typeof b.address === 'string'
                      ? b.address
                      : b.address && typeof b.address === 'object'
                      ? [ (b.address as any).line1, (b.address as any).city, (b.address as any).state ].filter(Boolean).join(', ')
                      : 'Telangana / AP Region'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {typeof b.phone === 'string'
                      ? b.phone
                      : (b.contact && typeof (b.contact as any).phone === 'string')
                      ? (b.contact as any).phone
                      : '+91 98765 43210'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {typeof b.email === 'string'
                      ? b.email
                      : (b.contact && typeof (b.contact as any).email === 'string')
                      ? (b.contact as any).email
                      : 'branch@svic.edu'}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <UserCheck className={`w-3.5 h-3.5 ${b.contact_person && b.contact_person !== 'Not Assigned' ? 'text-teal-600' : 'text-slate-400'} shrink-0`} />
                  <span className={b.contact_person && b.contact_person !== 'Not Assigned' ? "text-slate-800 font-bold" : "text-slate-500 font-semibold"}>
                    {b.contact_person && b.contact_person !== 'Not Assigned' ? `Assigned User: ${b.contact_person}` : 'Not Assigned'}
                  </span>
                </div>

              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedBranch(b);
                    const assignedUser = systemUsers.find((u) => u.name === b.contact_person);
                    setPrincipalUserId(assignedUser?.id || systemUsers[0]?.id || '');
                    setShowAssignPrincipalModal(true);
                  }}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" /> Assign Principal
                </button>
                <button
                  onClick={() => handleOpenProgrammesModal(b)}
                  className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Offered Streams
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3-TAB ADD BRANCH MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" /> Add New Campus Branch
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

            {/* Single Scrollable Form Container */}
            <form onSubmit={handleAddBranch} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* SECTION 1: BASIC INFO */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
                  <Building2 className="w-4 h-4 text-teal-600" /> 1. Basic Campus Information
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Campus Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HYD-MAIN or VIZAG-COAST"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border rounded-xl font-medium outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Display Campus Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hyderabad Main Campus"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border rounded-xl font-medium outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Legal Registered Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sri Vignan Educational Trust - Hyd Campus"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border rounded-xl font-medium outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Operational Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border rounded-xl font-medium outline-none focus:border-teal-500"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                      <option value="UTC">UTC Standard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: LOCATION & ADDRESS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
                  <MapPin className="w-4 h-4 text-teal-600" /> 2. Location & Address
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Road No. 12, Banjara Hills"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white border rounded-xl font-medium outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white border rounded-xl font-medium focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">District</label>
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad Urban"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-white border rounded-xl font-medium focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <select
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border rounded-xl font-medium focus:border-teal-500"
                    >
                      <option value="Telangana">Telangana</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Karnataka">Karnataka</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      placeholder="e.g. 500034"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border rounded-xl font-medium focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: CONTACT & COMMUNICATION */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
                  <UserCheck className="w-4 h-4 text-teal-600" /> 3. Contact & Communication
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Primary Campus Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border rounded-xl font-medium outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Campus Email</label>
                    <input
                      type="email"
                      placeholder="e.g. hyd.campus@svic.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border rounded-xl font-medium outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl text-slate-600 text-[11px] font-medium flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    Principal status defaults to <strong className="text-slate-900">Unassigned</strong>. You can assign or reassign a Principal anytime after creation.
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t font-bold sticky bottom-0 bg-white p-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Campus Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN PRINCIPAL MODAL */}
      {showAssignPrincipalModal && selectedBranch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" /> Assign Campus Principal
              </h3>
              <button onClick={() => setShowAssignPrincipalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select a pre-registered system user (<span className="font-mono font-bold text-slate-700">BRANCH_ADMIN</span>) to head operations for <strong className="text-slate-900">{selectedBranch.name}</strong>.
            </p>

            <form onSubmit={handleAssignPrincipal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Registered System User *</label>
                {systemUsers.length > 0 ? renderUserPicker(
                  principalUserId,
                  (user) => setPrincipalUserId(user.id),
                  selectedBranch
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-800">
                    Create or load a registered system user before assigning a campus principal.
                  </div>
                )}
                {principalUserId && (() => {
                  const user = systemUsers.find((u) => u.id === principalUserId);
                  if (!user) return null;
                  const assignedElsewhere = isAssignedElsewhere(user, selectedBranch);
                  return (
                    <div className={`mt-3 rounded-xl border p-3 text-[11px] font-medium leading-5 ${
                      assignedElsewhere
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    }`}>
                      {assignedElsewhere
                        ? `${user.name} is already assigned to ${getUserAssignment(user)}. Confirming will reassign them to ${selectedBranch.name}.`
                        : `${user.name} is ready to assign to ${selectedBranch.name}.`}
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-3 pt-3 font-bold">
                <button
                  type="button"
                  onClick={() => setShowAssignPrincipalModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!principalUserId}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Principal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAMPUS PROGRAMME OFFERINGS SUMMARY MODAL (READ-ONLY) */}
      {showProgrammesModal && programmesBranch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" /> Active Campus Stream Offerings
              </h3>
              <button onClick={() => setShowProgrammesModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Read-only overview of course streams offered at <strong className="text-slate-900">{programmesBranch.name}</strong> for the current Academic Term. Master offerings are managed centrally in the <strong className="text-indigo-600">Academic Structure Matrix</strong>.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200 min-h-[140px] flex flex-col justify-center">
              {loadingProgrammesData ? (
                <div className="py-8 text-center text-xs font-semibold text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> Loading campus streams...
                </div>
              ) : (
                allMasterProgrammes.map((p) => {
                  const isOffered = assignedProgIds.includes(p.id);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{p.code} — {p.name}</span>
                        {p.coachingTrack && (
                          <span className="text-[10px] text-slate-500 font-medium">Coaching: {p.coachingTrack}</span>
                        )}
                      </div>
                      {isOffered ? (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-lg flex items-center gap-1">
                          ✓ Offered
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-medium rounded-lg">
                          Not Offered
                        </span>
                      )}
                    </div>
                  );
                })
              )}
              {!loadingProgrammesData && allMasterProgrammes.length === 0 && (
                <div className="text-center py-4 text-slate-400">No master programmes found.</div>
              )}
            </div>

            <div className="pt-2 font-bold">
              <button
                type="button"
                onClick={() => setShowProgrammesModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
