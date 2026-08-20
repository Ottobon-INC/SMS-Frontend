import React from "react";
import { useNavigate } from "react-router-dom";
import { useAttendanceSessions } from "../hooks/useAttendance";
import { AlertCircle, Loader2, CheckCircle2, Clock, FileCheck, ArrowRight, History } from "lucide-react";
import type { AttendanceSessionListItem } from "../types/attendance.types";

const statusConfig = {
  SUBMITTED: {
    label: "Awaiting Review",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  FINALIZED: {
    label: "Finalized",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  DRAFT: {
    label: "Draft",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    icon: <FileCheck className="w-3.5 h-3.5" />,
  },
};

export const OfficeStaffRecentSessions: React.FC = () => {
  const navigate = useNavigate();
  const { data: sessions, isLoading, error } = useAttendanceSessions();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm mt-8">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
        <p className="text-sm font-medium">Loading recent sessions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 border border-red-200 p-6 rounded-2xl flex items-start gap-4 mt-8">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Failed to load recent sessions</p>
          <p className="text-sm mt-1 opacity-80">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const recentSessions = sessions || [];

  if (recentSessions.length === 0) {
    return null;
  }

  const renderSessionCard = (session: AttendanceSessionListItem) => {
    const cfg = statusConfig[session.status as keyof typeof statusConfig] ?? statusConfig.DRAFT;
    const dateObj = new Date(session.attendanceDate + "T00:00:00");
    const isFinalized = session.status === "FINALIZED";
    
    return (
      <div
        key={session.id}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-slate-300 group"
      >
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Date Block */}
            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white shadow-sm flex-shrink-0 ${isFinalized ? "bg-slate-300 text-slate-700" : "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isFinalized ? "opacity-100 text-slate-500" : "opacity-80"}`}>
                {dateObj.toLocaleDateString("en-IN", { month: "short" })}
              </span>
              <span className={`text-xl font-black leading-none ${isFinalized ? "text-slate-700" : ""}`}>
                {dateObj.getDate()}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900">{session.sectionName}</h3>
                <span className="text-slate-400 text-sm">·</span>
                <span className="text-slate-500 text-sm">{session.batchName}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${cfg.badge}`}>
                  {cfg.icon}
                  {cfg.label}
                </span>
                {session.programmeName && (
                  <span className="text-xs font-medium text-slate-500">{session.programmeName}</span>
                )}
                <span className="text-xs font-medium text-slate-400">
                  {dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/attendance/session/${session.id}`)}
            className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] group-hover:gap-3 ${
              isFinalized 
                ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300" 
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {isFinalized ? "View Record" : session.status === "DRAFT" ? "Resume Draft" : "View Session"}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-4 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <History className="w-5 h-5 text-slate-400" />
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Sessions History</h2>
      </div>

      <div className="space-y-3">
        {recentSessions.map(session => renderSessionCard(session))}
      </div>
    </section>
  );
};
