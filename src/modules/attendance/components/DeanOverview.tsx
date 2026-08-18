import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAttendanceSessions, useAttendanceBranches } from "../hooks/useAttendance";
import { AlertCircle, Loader2, Building2, ArrowRight, CheckCircle2, Clock, FileText, Search, Filter } from "lucide-react";
import type { SessionStatus } from "../types/attendance.types";

const statusConfig: Record<SessionStatus, { label: string; badge: string; dot: string }> = {
  DRAFT: {
    label: "Draft",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  SUBMITTED: {
    label: "Submitted",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  FINALIZED: {
    label: "Finalized",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

const SummaryCard: React.FC<{
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = ({ label, count, icon, color, bg }) => (
  <div className={`rounded-2xl border p-4 flex items-center gap-3 ${bg}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-white/80 shadow-sm`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-black text-slate-900">{count}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

export const DeanOverview: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SessionStatus | "ALL">("ALL");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const { data: rawSessions, isLoading, error } = useAttendanceSessions();
  const { data: branches = [] } = useAttendanceBranches();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-bold">Loading institution overview…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 border border-red-200 p-6 rounded-2xl flex items-start gap-4">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold">Failed to load overview</p>
          <p className="text-sm mt-1 opacity-80">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const sessions = rawSessions || [];

  // Stats - Real counts derived from the API response
  const draft = sessions.filter((s) => s.status === "DRAFT").length;
  const submitted = sessions.filter((s) => s.status === "SUBMITTED").length;
  const finalized = sessions.filter((s) => s.status === "FINALIZED").length;

  // Filter + Search
  const filtered = sessions.filter((s) => {
    const matchStatus = filterStatus === "ALL" || s.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.sectionName.toLowerCase().includes(q) ||
      s.batchName.toLowerCase().includes(q) ||
      (s.programmeName && s.programmeName.toLowerCase().includes(q)) ||
      s.attendanceDate.includes(q);
    const matchBranch = branchFilter === "ALL" || s.branchId === branchFilter;
    return matchStatus && matchSearch && matchBranch;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Stats Structure - Always visible even if 0 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Draft"
          count={draft}
          icon={<FileText className="w-5 h-5 text-slate-600" />}
          color="text-slate-600"
          bg="bg-slate-50 border-slate-200 hover:border-slate-300 transition-colors"
        />
        <SummaryCard
          label="Submitted"
          count={submitted}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          color="text-amber-600"
          bg="bg-amber-50 border-amber-200 hover:border-amber-300 transition-colors"
        />
        <SummaryCard
          label="Finalized"
          count={finalized}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          color="text-emerald-600"
          bg="bg-emerald-50 border-emerald-200 hover:border-emerald-300 transition-colors"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
          Attendance Activity
        </h2>

        {sessions.length === 0 ? (
          // Professional Empty State for the entire collection
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No attendance activity</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              No attendance sessions are currently available for the selected context. As staff record attendance, they will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Filters (only show if there's actual data to search/filter) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search sessions…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                {branches.length > 0 && (
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl px-3">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="ALL">All Branches</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {(["ALL", "DRAFT", "SUBMITTED", "FINALIZED"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        filterStatus === s
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 text-sm font-medium shadow-sm">
                  No sessions match your current filter.
                </div>
              ) : (
                filtered.map((session) => {
                  const cfg = statusConfig[session.status as SessionStatus] ?? statusConfig.DRAFT;
                  const dateObj = new Date(session.attendanceDate + "T00:00:00");
                  return (
                    <div
                      key={session.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
                    >
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          {/* Date block */}
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex flex-col items-center justify-center text-white shadow-sm flex-shrink-0">
                            <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
                              {dateObj.toLocaleDateString("en-IN", { month: "short" })}
                            </span>
                            <span className="text-lg font-black leading-none">{dateObj.getDate()}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-900 text-sm">{session.sectionName}</span>
                              <span className="text-slate-400 text-xs">·</span>
                              <span className="text-slate-500 text-xs font-medium">{session.batchName}</span>
                              {session.programmeName && (
                                <>
                                  <span className="text-slate-400 text-xs">·</span>
                                  <span className="text-slate-400 text-xs">{session.programmeName}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${cfg.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                              <span className="text-xs font-medium text-slate-400">
                                {dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/attendance/session/${session.id}`)}
                          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-900 hover:text-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all group-hover:border-slate-900 active:scale-[0.98]"
                        >
                          View Details
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
