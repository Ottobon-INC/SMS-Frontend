import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  CheckCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Building2,
  Clock,
  ShieldCheck,
  Send,
  XCircle,
  PhoneCall,
  UserCheck,
  X,
  Loader2,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../authentication/providers/AuthProvider';
import { notificationsApi, NotificationLog } from '../api/notificationsApi';

function statusBadge(status: string) {
  switch (status) {
    case 'READ':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
          <CheckCheck className="w-3.5 h-3.5 text-blue-600" /> READ 🔵
        </span>
      );
    case 'DELIVERED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> DELIVERED 🟢
        </span>
      );
    case 'SENT':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          <Send className="w-3.5 h-3.5 text-slate-500" /> SENT 📤
        </span>
      );
    case 'FAILED_MISSING_PHONE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800" title="Student guardian phone number missing in profile">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> MISSING PHONE ⚠️
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> FAILED 🔴
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" /> QUEUED 🟡
        </span>
      );
  }
}

function eventTypePill(eventType: string) {
  switch (eventType) {
    case 'EXAM_PUBLISHED':
      return <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">Exam Marksheet</span>;
    case 'MARK_CORRECTION':
      return <span className="font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">Mark Correction</span>;
    case 'FEE_RECEIPT':
      return <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">Fee Receipt</span>;
    case 'ATTENDANCE_ABSENT':
      return <span className="font-semibold text-rose-900 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">Absent Alert</span>;
    default:
      return <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">{eventType}</span>;
  }
}

export const NotificationsAuditPage: React.FC = () => {
  const auth = useAuth();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');

  // Modal State for Updating Guardian Phone
  const [selectedLogForUpdate, setSelectedLogForUpdate] = useState<NotificationLog | null>(null);
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);

  const summary = auth.availableContexts?.find(c => c.assignment_id === auth.activeContext?.assignment_id);
  const userBranchId = summary?.branch?.id;
  const userRoleCode = summary?.role?.code || auth.activeContext?.role_codes?.[0] || '';
  const isSuperAdminOrDean = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ACADEMIC_DEAN', 'INSTITUTION_ADMIN'].includes(userRoleCode);
  const [selectedLogForPreview, setSelectedLogForPreview] = useState<NotificationLog | null>(null);

  const renderFormattedWhatsAppText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*.*?\*|_.*?_)/g);

      const formattedLine = parts.map((part, partIdx) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <strong key={partIdx} className="font-extrabold text-slate-900">{part.slice(1, -1)}</strong>;
        }
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
          return <em key={partIdx} className="italic text-teal-800">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      return (
        <React.Fragment key={lineIdx}>
          {formattedLine}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };


  const fetchLogs = async (isInitial: boolean = false) => {
    try {
      if (isInitial) setLoading(true);
      const branchToFetch = !isSuperAdminOrDean ? userBranchId : undefined;
      const data = await notificationsApi.getLogs(branchToFetch, 200);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load notifications audit logs:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
    const timer = setInterval(() => fetchLogs(false), 15000);
    return () => clearInterval(timer);
  }, [userBranchId, isSuperAdminOrDean]);

  const handleUpdateGuardianPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogForUpdate || !selectedLogForUpdate.student_id || !newMobileNumber.trim()) return;

    try {
      setUpdatingPhone(true);
      await notificationsApi.updateGuardianPhone(selectedLogForUpdate.student_id, newMobileNumber.trim());
      setUpdateSuccessMsg(`Updated guardian mobile for ${selectedLogForUpdate.student_name || 'student'} to ${newMobileNumber}`);
      setTimeout(() => {
        setSelectedLogForUpdate(null);
        setNewMobileNumber('');
        setUpdateSuccessMsg(null);
        fetchLogs(false);
      }, 1500);
    } catch (err) {
      alert('Failed to update phone number. Please check phone format (+91...).');
    } finally {
      setUpdatingPhone(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.student_number?.toLowerCase().includes(search.toLowerCase()) ||
      log.section_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.recipient_phone?.toLowerCase().includes(search.toLowerCase()) ||
      log.template_name.toLowerCase().includes(search.toLowerCase()) ||
      log.idempotency_key.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || log.delivery_status === statusFilter;
    const matchesEvent = eventTypeFilter === 'ALL' || log.event_type === eventTypeFilter;

    return matchesSearch && matchesStatus && matchesEvent;
  });

  const totalSent = logs.length;
  const totalDelivered = logs.filter((l) => ['DELIVERED', 'READ'].includes(l.delivery_status)).length;
  const totalRead = logs.filter((l) => l.delivery_status === 'READ').length;
  const missingPhoneCount = logs.filter((l) => l.delivery_status === 'FAILED_MISSING_PHONE').length;

  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '100.0';
  const readRate = totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(1) : '100.0';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">WhatsApp Notification Audit Hub</h1>
            <p className="text-xs text-slate-500">Real-time outbox tracking, delivery receipts & student contact auditing</p>
          </div>
        </div>
        <button
          onClick={() => fetchLogs(true)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-slate-400 transition"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Dispatches</p>
          <p className="text-2xl font-black text-slate-900">{totalSent}</p>
          <p className="text-[11px] text-slate-400">All outbound parent alerts</p>
        </div>

        <div
          onClick={() => setStatusFilter('DELIVERED')}
          className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-1 bg-emerald-50/20 cursor-pointer hover:border-emerald-400 transition"
        >
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Delivery Success Rate</p>
          <p className="text-2xl font-black text-emerald-700">{deliveryRate}%</p>
          <p className="text-[11px] text-emerald-600">{totalDelivered} messages delivered</p>
        </div>

        <div
          onClick={() => setStatusFilter('READ')}
          className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs space-y-1 bg-blue-50/20 cursor-pointer hover:border-blue-400 transition"
        >
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Parent Read Rate</p>
          <p className="text-2xl font-black text-blue-700">{readRate}%</p>
          <p className="text-[11px] text-blue-600">{totalRead} read receipts confirmed</p>
        </div>

        <div
          onClick={() => setStatusFilter('FAILED_MISSING_PHONE')}
          className="bg-white p-5 rounded-2xl border border-amber-300 shadow-xs space-y-1 bg-amber-50/40 cursor-pointer hover:border-amber-500 transition"
          title="Click to filter log table to show only missing mobile alerts"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Missing Mobile Alerts</p>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">Filter Table</span>
          </div>
          <p className="text-2xl font-black text-amber-800">{missingPhoneCount}</p>
          <p className="text-[11px] text-amber-700">Click to view & update student numbers</p>
        </div>
      </div>

      {/* FILTERS AND SEARCH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name, admission number, section, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600">Event:</span>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none"
            >
              <option value="ALL">All Events</option>
              <option value="EXAM_PUBLISHED">Exam Marksheet</option>
              <option value="MARK_CORRECTION">Mark Correction</option>
              <option value="FEE_RECEIPT">Fee Receipt</option>
              <option value="ATTENDANCE_ABSENT">Absent Alert</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="READ">READ 🔵</option>
              <option value="DELIVERED">DELIVERED 🟢</option>
              <option value="SENT">SENT 📤</option>
              <option value="FAILED_MISSING_PHONE">MISSING PHONE ⚠️</option>
              <option value="FAILED">FAILED 🔴</option>
            </select>
          </div>
        </div>
      </div>

      {/* AUDIT LOGS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs font-semibold">
            <RefreshCw className="w-5 h-5 animate-spin text-teal-600" /> Loading Outbox Audit Logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No Notification Logs Found</p>
            <p className="text-xs">Outbound parent messages will appear here once triggered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-6">Student Details</th>
                  <th className="p-3.5">Event Type</th>
                  <th className="p-3.5">Recipient Phone</th>
                  <th className="p-3.5">Meta Template</th>
                  <th className="p-3.5">Delivery Status</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 pr-6 text-right">Contact Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    {/* STUDENT DETAILS COLUMN */}
                    <td className="p-3.5 pl-6">
                      <div>
                        <p className="font-bold text-slate-900">{log.student_name || 'Unassigned Student'}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>ADM: <strong className="font-mono text-slate-700">{log.student_number || 'N/A'}</strong></span>
                          <span>•</span>
                          <span className="font-medium text-teal-700">{log.section_name || 'Default Section'}</span>
                        </p>
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">{eventTypePill(log.event_type)}</td>

                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {log.recipient_phone ? (
                        log.recipient_phone
                      ) : (
                        <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          N/A (Missing)
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-mono text-slate-600">{log.template_name}</td>

                    <td className="p-3.5 whitespace-nowrap">{statusBadge(log.delivery_status)}</td>

                    <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    {/* CONTACT ACTION COLUMN */}
                    <td className="p-3.5 pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {log.message_body && (
                          <button
                            onClick={() => setSelectedLogForPreview(log)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl font-bold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer transition"
                            title="Click to preview exact message body content sent to parent"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600" /> View Message
                          </button>
                        )}
                        {log.delivery_status === 'FAILED_MISSING_PHONE' ? (
                          <button
                            onClick={() => {
                              setSelectedLogForUpdate(log);
                              setNewMobileNumber('');
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[11px] shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <PhoneCall className="w-3.5 h-3.5" /> Update Mobile
                          </button>
                        ) : !log.message_body ? (
                          <span className="text-slate-400 text-[11px]">Logged</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK MODAL TO UPDATE GUARDIAN MOBILE */}
      {selectedLogForUpdate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Update Guardian Mobile</h3>
                  <p className="text-xs text-slate-500">Save guardian mobile to resolve failed dispatch</p>
                </div>
              </div>
              <button onClick={() => setSelectedLogForUpdate(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {updateSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{updateSuccessMsg}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p><strong>Student Name:</strong> {selectedLogForUpdate.student_name || 'N/A'}</p>
              <p><strong>Admission No:</strong> {selectedLogForUpdate.student_number || 'N/A'}</p>
              <p><strong>Section:</strong> {selectedLogForUpdate.section_name || 'Default'}</p>
              <p><strong>Trigger Event:</strong> {selectedLogForUpdate.event_type}</p>
            </div>

            <form onSubmit={handleUpdateGuardianPhone} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Guardian Mobile Phone Number (*)</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={newMobileNumber}
                  onChange={(e) => setNewMobileNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-xs outline-none focus:border-teal-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">Enter international E.164 format (+91 98765 43210)</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLogForUpdate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPhone}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {updatingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />} Save & Link Guardian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MESSAGE CONTENT PREVIEW MODAL */}
      {selectedLogForPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Outbound Message Content</h3>
                  <p className="text-xs text-slate-500">
                    To: <span className="font-bold text-slate-800">{selectedLogForPreview.student_name || 'Student Parent'}</span> ({selectedLogForPreview.recipient_phone || 'No Phone'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForPreview(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#efeae2] p-4 rounded-2xl border border-slate-200">
              <div className="bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-4 shadow-sm border border-emerald-200 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-emerald-300/60 pb-1.5 text-[10px]">
                  <span className="font-extrabold uppercase text-emerald-900 tracking-wider">
                    {selectedLogForPreview.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-emerald-800 font-semibold">
                    {selectedLogForPreview.template_name}
                  </span>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed font-medium text-slate-800">
                  {renderFormattedWhatsAppText(selectedLogForPreview.message_body || 'No message content available.')}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-emerald-300/50 text-[10px] text-emerald-800">
                  <span>Sent: {new Date(selectedLogForPreview.created_at).toLocaleString()}</span>
                  <span className="font-bold flex items-center gap-1 text-emerald-900">
                    {statusBadge(selectedLogForPreview.delivery_status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedLogForPreview(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
