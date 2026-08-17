import React from "react";
import { useNavigate } from "react-router-dom";
import { useAttendanceSessions } from "../hooks/useAttendance";
import { AlertCircle, Loader2, Calendar, ArrowRight, CheckCircle2, Clock, FileCheck } from "lucide-react";

const statusConfig = {
  SUBMITTED: {
    label: "Awaiting Review",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  FINALIZED: {
    label: "Finalized",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  DRAFT: {
    label: "Draft",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    icon: <FileCheck className="w-3.5 h-3.5" />,
  },
};

export const PrincipalInbox: React.FC = () => {
  const navigate = useNavigate();
  const { data: sessions, isLoading, error } = useAttendanceSessions("SUBMITTED");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-4" />
        <p className="text-sm font-medium">Loading pending reviews…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 border border-red-200 p-6 rounded-2xl flex items-start gap-4">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Failed to load inbox</p>
          <p className="text-sm mt-1 opacity-80">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 text-center">
        <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 border border-violet-100">
          <CheckCircle2 className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">All Clear!</h3>
        <p className="text-slate-500 text-sm max-w-sm">
          No attendance sessions are pending your review right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Review</h2>
        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {sessions.map((session) => {
        const cfg = statusConfig[session.status as keyof typeof statusConfig] ?? statusConfig.DRAFT;
        const dateObj = new Date(session.attendanceDate + "T00:00:00");
        return (
          <div
            key={session.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-slate-300 group"
          >
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Date Block */}
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex flex-col items-center justify-center text-white shadow-sm flex-shrink-0">
                  <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">
                    {dateObj.toLocaleDateString("en-IN", { month: "short" })}
                  </span>
                  <span className="text-xl font-black leading-none">
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
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${cfg.badge}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    {session.programmeName && (
                      <span className="text-xs text-slate-500">{session.programmeName}</span>
                    )}
                    <span className="text-xs text-slate-400">
                      {dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/attendance/session/${session.id}`)}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md group-hover:gap-3 active:scale-[0.98]"
              >
                Review
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
