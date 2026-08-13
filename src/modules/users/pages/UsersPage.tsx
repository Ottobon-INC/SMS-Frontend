import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Shield, CheckCircle2, X, RefreshCw, Phone, Mail, Building, ShieldCheck, AlertCircle } from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  branch: string;
  status: string;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // 2-Tab Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'rbac'>('profile');
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [role, setRole] = useState<string>('BRANCH_ADMIN');
  const [branch, setBranch] = useState<string>('Hyderabad Main Campus');

  const [notification, setNotification] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!fullName.trim()) {
      setModalError('Full Name is required on Tab 1 (User Profile)!');
      setActiveTab('profile');
      return;
    }

    if (!email.trim()) {
      setModalError('Email Address is required on Tab 1 (User Profile)!');
      setActiveTab('profile');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          mobile: mobile.trim() || '+91 98765 00000',
          role,
          branch,
        }),
      });

      if (res.ok) {
        const newUser = await res.json();
        setUsers((prev) => [newUser, ...prev]);
        setShowAddModal(false);
        setFullName('');
        setEmail('');
        setMobile('');
        setModalError(null);
        setNotification(`User "${newUser.name}" created with role ${newUser.role}!`);
        setTimeout(() => setNotification(null), 4000);
      } else {
        const errText = await res.text();
        setModalError(`Failed to create user: ${errText || res.statusText}`);
      }
    } catch (err: any) {
      console.error('Failed to add user:', err);
      setModalError(`Connection error: ${err.message || 'Server error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleLabels: Record<string, string> = {
    INSTITUTION_ADMIN: 'Dean',
    BRANCH_ADMIN: 'Principal',
    OFFICE_STAFF: 'Office Staff',
    PARENT_GUARDIAN: 'Parent',
    SAAS_SUPER_ADMIN: 'Super Admin',
    PLATFORM: 'Platform',
    TENANT: 'Unassigned',
    UNASSIGNED: 'Unassigned',
  };

  const roleStyles = (roleCode: string) => {
    if (roleCode === 'INSTITUTION_ADMIN') return 'bg-purple-50 text-purple-800 border-purple-200';
    if (roleCode === 'BRANCH_ADMIN') return 'bg-teal-50 text-teal-800 border-teal-200';
    if (roleCode === 'OFFICE_STAFF') return 'bg-sky-50 text-sky-800 border-sky-200';
    if (roleCode === 'PARENT_GUARDIAN') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
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

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" /> User Accounts & RBAC Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage institutional staff accounts, Deans, Principals, and Teachers with role-based access scoping.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setModalError(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition"
          >
            <UserPlus className="w-4 h-4" /> Create User Account
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span>Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="INSTITUTION_ADMIN">Dean (Institution Admin)</option>
            <option value="BRANCH_ADMIN">Principal (Branch Admin)</option>
            <option value="TEACHER">Teacher / Staff</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-600" /> Loading Users from PostgreSQL...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No User Accounts Found</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">RBAC Role</th>
                <th className="py-3.5 px-4">Assigned Campus</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{u.mobile}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${roleStyles(u.role)}`}
                    >
                      {roleLabels[u.role] || u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.branch}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2-TAB CREATE USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" /> Create User Account
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

            {/* Tab Header */}
            <div className="flex border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-4 border-b-2 transition ${
                  activeTab === 'profile' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400'
                }`}
              >
                1. User Profile *
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rbac')}
                className={`py-2 px-4 border-b-2 transition ${
                  activeTab === 'rbac' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400'
                }`}
              >
                2. Role & Access
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              {/* TAB 1: PROFILE */}
              <div className={activeTab === 'profile' ? 'space-y-3' : 'hidden'}>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. K. V. Rao"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. principal@svic.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium outline-none"
                  />
                </div>
              </div>

              {/* TAB 2: RBAC */}
              <div className={activeTab === 'rbac' ? 'space-y-3' : 'hidden'}>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned RBAC Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  >
                    <option value="BRANCH_ADMIN">Principal (Branch Admin)</option>
                    <option value="INSTITUTION_ADMIN">Dean (Institution Admin)</option>
                    <option value="TEACHER">Teacher / Subject Faculty</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Campus Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                  >
                    <option value="Hyderabad Main Campus">Hyderabad Main Campus</option>
                    <option value="Vijayawada City Campus">Vijayawada City Campus</option>
                    <option value="Visakhapatnam Campus">Visakhapatnam Campus</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t font-bold">
                {activeTab === 'profile' ? (
                  <button type="button" onClick={() => setActiveTab('rbac')} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl">
                    Next
                  </button>
                ) : (
                  <button type="button" onClick={() => setActiveTab('profile')} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl">
                    Back
                  </button>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create User'}
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
