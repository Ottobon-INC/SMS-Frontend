import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../authentication/providers/AuthProvider";
import {
  useAttendanceSession,
  useSaveDraftAttendance,
  useSubmitAttendance,
  useFinalizeAttendance,
  useReturnAttendanceSession,
} from "../hooks/useAttendance";
import { StudentRosterTable } from "../components/StudentRosterTable";
import type { AttendanceStatus, SessionStatus } from "../types/attendance.types";
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  Send,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Search,
  Users,
  CheckCheck,
  Undo2,
} from "lucide-react";

export const AttendanceSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const auth = useAuth();

  const { data: session, isLoading, refetch } = useAttendanceSession(sessionId || null);
  const saveDraftMutation = useSaveDraftAttendance();
  const submitMutation = useSubmitAttendance();
  const finalizeMutation = useFinalizeAttendance();
  const returnMutation = useReturnAttendanceSession();

  const [localState, setLocalState] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [showUnmarkedWarning, setShowUnmarkedWarning] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (session) {
      const initial: Record<string, AttendanceStatus> = {};
      session.students.forEach((s) => {
        initial[s.enrollmentId] = s.attendanceStatus === "UNMARKED" && session.status === "DRAFT" ? "PRESENT" : s.attendanceStatus;
      });
      setLocalState(initial);
    }
  }, [session]);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeydown);
    return () => window.removeEventListener("keydown", handleGlobalKeydown);
  }, []);

  const handleMarkStudent = (enrollmentId: string, status: AttendanceStatus) => {
    if (session?.status !== "DRAFT") return;
    setLocalState((prev) => ({ ...prev, [enrollmentId]: status }));
    if (showUnmarkedWarning) setShowUnmarkedWarning(false);
  };

  const handleMarkAllPresent = () => {
    if (session?.status !== "DRAFT") return;
    setLocalState((prev) => {
      const next = { ...prev };
      session.students.forEach((s) => {
        next[s.enrollmentId] = "PRESENT";
      });
      return next;
    });
    if (showUnmarkedWarning) setShowUnmarkedWarning(false);
  };

  const handleClearAll = () => {
    if (session?.status !== "DRAFT") return;
    setLocalState((prev) => {
      const next = { ...prev };
      session.students.forEach((s) => {
        next[s.enrollmentId] = "UNMARKED";
      });
      return next;
    });
  };

  const handleSaveDraft = () => {
    if (!session || session.status !== "DRAFT") return;
    setError(null);
    setSuccessMsg(null);
    const records = Object.entries(localState).map(([enrollmentId, attendanceStatus]) => ({
      enrollmentId,
      attendanceStatus,
    }));
    saveDraftMutation.mutate(
      { sessionId: session.id, payload: { records } },
      {
        onSuccess: () => {
          setSuccessMsg("Draft saved.");
          setLastSaved(new Date());
          setTimeout(() => setSuccessMsg(null), 3000);
        },
        onError: (err: unknown) => handleApiError(err, "Failed to save draft"),
      }
    );
  };

  const handleSubmitConfirmed = () => {
    if (!session || session.status !== "DRAFT") return;
    setConfirmSubmit(false);
    setError(null);
    setSuccessMsg(null);
    const records = Object.entries(localState).map(([enrollmentId, attendanceStatus]) => ({
      enrollmentId,
      attendanceStatus,
    }));
    saveDraftMutation.mutate(
      { sessionId: session.id, payload: { records } },
      {
        onSuccess: () => {
          submitMutation.mutate(session.id, {
            onSuccess: () => {
              setSuccessMsg("Attendance submitted for review.");
              refetch();
            },
            onError: (err: unknown) => handleApiError(err, "Failed to submit"),
          });
        },
        onError: (err: unknown) => handleApiError(err, "Failed to save before submitting"),
      }
    );
  };

  const handleFinalizeConfirmed = () => {
    if (!session || session.status !== "SUBMITTED") return;
    setConfirmFinalize(false);
    setError(null);
    setSuccessMsg(null);
    finalizeMutation.mutate(session.id, {
      onSuccess: () => {
        setSuccessMsg("Session finalized successfully.");
        refetch();
      },
      onError: (err: unknown) => handleApiError(err, "Failed to finalize"),
    });
  };

  const handleApiError = (err: unknown, fallback: string) => {
    setError(err instanceof Error ? err.message : fallback);
  };

  const counts = useMemo(() => {
    let present = 0, absent = 0, leave = 0, unmarked = 0;
    Object.values(localState).forEach((status) => {
      if (status === "PRESENT") present++;
      else if (status === "ABSENT") absent++;
      else if (status === "LEAVE") leave++;
      else unmarked++;
    });
    return { present, absent, leave, unmarked, total: Object.keys(localState).length };
  }, [localState]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm font-medium">Loading session…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-700 p-8 rounded-2xl border border-red-200 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Session Not Found</h2>
          <p className="text-sm mb-4 opacity-80">This session does not exist or you don't have access.</p>
          <button onClick={() => navigate("/attendance")} className="text-red-700 font-semibold text-sm hover:underline">
            ← Back to Attendance
          </button>
        </div>
      </div>
    );
  }

  const isDraft = session.status === "DRAFT";
  const isSubmitted = session.status === "SUBMITTED";
  const isFinalized = session.status === "FINALIZED";

  const canMark = auth.hasPermission("attendance.mark");
  const canSubmit = auth.hasPermission("attendance.submit");
  const canFinalize = auth.hasPermission("attendance.finalize");

  const isEditable = isDraft && canMark;
  const isPrincipalView = !canMark && canFinalize;

  const progress = counts.total > 0 ? Math.round(((counts.total - counts.unmarked) / counts.total) * 100) : 0;

  const statusStyles: Record<SessionStatus, { bar: string; badge: string; label: string }> = {
    DRAFT: {
      bar: "from-slate-400 to-slate-500",
      badge: "bg-slate-100 text-slate-600 border-slate-200",
      label: "Draft",
    },
    SUBMITTED: {
      bar: "from-amber-400 to-orange-500",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      label: "Submitted",
    },
    FINALIZED: {
      bar: "from-emerald-400 to-teal-500",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      label: "Finalized",
    },
  };
  const sStyle = statusStyles[session.status as SessionStatus] ?? statusStyles.DRAFT;

  return (
    <div className="min-h-full bg-slate-50 pb-32">
      {/* Top Header */}
      <div className="bg-slate-900 px-4 md:px-10 pt-6 pb-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate("/attendance")}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Attendance
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {isPrincipalView && isSubmitted ? "Review Attendance" : isFinalized ? "Finalized Session" : "Attendance Session"}
                </h1>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${sStyle.badge}`}>
                  {sStyle.label}
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                {new Date(session.attendanceDate + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Stats overview */}
            <div className="flex items-center gap-4 text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
              <StatPill label="Present" count={counts.present} color="text-emerald-400" />
              <StatPill label="Absent" count={counts.absent} color="text-red-400" />
              <StatPill label="Leave" count={counts.leave} color="text-amber-400" />
              {isDraft && <StatPill label="Unmarked" count={counts.unmarked} color={counts.unmarked > 0 ? "text-rose-400" : "text-slate-400"} />}
            </div>
          </div>

          {/* Progress bar (only for draft) */}
          {isDraft && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Marking progress</span>
                <span className="font-semibold text-white">{progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${sStyle.bar} rounded-full transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-6 space-y-4">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}
        {isPrincipalView && isDraft && (
          <div className="bg-blue-50 text-blue-700 border border-blue-200 p-4 rounded-xl flex items-start gap-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>This session is still being prepared by Office Staff and has not been submitted yet.</p>
          </div>
        )}
        {isDraft && session.revisionReason && (
          <div className="bg-amber-50 text-amber-800 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-sm shadow-sm">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-bold mb-1">Returned for Revision</p>
              <p className="text-amber-700">{session.revisionReason}</p>
            </div>
          </div>
        )}
        {isFinalized && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>This attendance session has been finalized and is locked.</p>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search student by name or roll number… (Cmd+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm"
            />
          </div>
          {isEditable && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-stretch sm:justify-end">
              <button
                onClick={handleClearAll}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
                Clear All
              </button>
              <button
                onClick={handleMarkAllPresent}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Present
              </button>
            </div>
          )}
        </div>

        {/* Roster */}
        <StudentRosterTable
          students={session.students}
          localState={localState}
          onMarkStudent={handleMarkStudent}
          editable={isEditable}
          searchQuery={searchQuery}
          showUnmarkedWarning={showUnmarkedWarning}
        />

        {/* Session meta for finalized/submitted */}
        {!isDraft && (session.submittedBy || session.finalizedBy) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Session Trail
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {session.submittedBy && (
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <span className="text-slate-500">Submitted by</span>
                  <span className="font-semibold text-slate-900">{session.submittedBy}</span>
                </div>
              )}
              {session.finalizedBy && (
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <span className="text-slate-500">Finalized by</span>
                  <span className="font-semibold text-slate-900">{session.finalizedBy}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-[60px] lg:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_20px_-4px_rgb(0,0,0,0.08)] z-30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          {/* Count pills */}
          <div className="flex items-center gap-2 text-sm overflow-x-auto no-scrollbar">
            <CountPill label="Total" count={counts.total} cls="bg-slate-100 text-slate-700" />
            <CountPill label="P" count={counts.present} cls="bg-emerald-100 text-emerald-700" />
            <CountPill label="A" count={counts.absent} cls="bg-red-100 text-red-700" />
            <CountPill label="L" count={counts.leave} cls="bg-amber-100 text-amber-700" />
            {isDraft && (
              <CountPill
                label="?"
                count={counts.unmarked}
                cls={counts.unmarked > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-400"}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditable && (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={saveDraftMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {saveDraftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span className="hidden sm:inline">Save</span>
                </button>
                {lastSaved && (
                  <span className="hidden sm:inline-block text-xs font-medium text-slate-400 italic mr-2">
                    Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {canSubmit && (
                  <button
                    onClick={() => {
                      if (counts.unmarked > 0) {
                        setShowUnmarkedWarning(true);
                        setError(`${counts.unmarked} student(s) are still unmarked. Please review the highlighted rows.`);
                        setTimeout(() => {
                          const firstUnmarked = document.querySelector(".unmarked-row");
                          if (firstUnmarked) {
                            firstUnmarked.scrollIntoView({ behavior: "smooth", block: "center" });
                          }
                        }, 100);
                        return;
                      }
                      setConfirmSubmit(true);
                    }}
                    disabled={submitMutation.isPending || saveDraftMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-md"
                  >
                    {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit
                  </button>
                )}
              </>
            )}

            {isSubmitted && canFinalize && (
              <>
                <button
                  onClick={() => setConfirmReturn(true)}
                  disabled={returnMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm"
                >
                  {returnMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                  Return for Revision
                </button>
                <button
                  onClick={() => setConfirmFinalize(true)}
                  disabled={finalizeMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-md"
                >
                  {finalizeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Finalize
                </button>
              </>
            )}

            {isFinalized && (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold cursor-default">
                <ShieldCheck className="w-4 h-4" />
                Finalized
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {confirmSubmit && (
        <ConfirmModal
          title="Submit Attendance?"
          description="Once submitted, you cannot edit this attendance session. The Principal will be notified to review."
          confirmLabel="Yes, Submit"
          confirmClass="bg-teal-600 hover:bg-teal-700 text-white"
          onConfirm={handleSubmitConfirmed}
          onCancel={() => setConfirmSubmit(false)}
        />
      )}

      {/* Finalize Confirmation Modal */}
      {confirmFinalize && (
        <ConfirmModal
          title="Finalize Attendance?"
          description="Finalizing locks this session permanently. This action cannot be undone."
          confirmLabel="Yes, Finalize"
          confirmClass="bg-violet-600 hover:bg-violet-700 text-white"
          onConfirm={handleFinalizeConfirmed}
          onCancel={() => setConfirmFinalize(false)}
        />
      )}

      {/* Return Confirmation Modal */}
      {confirmReturn && (
        <ConfirmModal
          title="Return Attendance for Revision?"
          description="Office Staff will be able to edit this attendance and submit it again."
          confirmLabel="Return to Staff"
          confirmClass="bg-red-600 hover:bg-red-700 text-white"
          onConfirm={() => {
            setConfirmReturn(false);
            returnMutation.mutate({ sessionId: session.id, reason: returnReason || undefined }, {
              onSuccess: () => {
                setSuccessMsg("Session returned to Draft status.");
                setReturnReason("");
                refetch();
              },
              onError: (err: unknown) => handleApiError(err, "Failed to return session"),
            });
          }}
          onCancel={() => {
            setConfirmReturn(false);
            setReturnReason("");
          }}
        >
          <div className="mt-4 mb-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Revision Reason (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
              rows={3}
              placeholder="E.g. Please verify attendance for Roll No. 18"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            />
          </div>
        </ConfirmModal>
      )}
    </div>
  );
};

/* ── Helpers ── */

const StatPill: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
  <div className="flex flex-col items-center">
    <span className={`text-lg font-black ${color}`}>{count}</span>
    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">{label}</span>
  </div>
);

const CountPill: React.FC<{ label: string; count: number; cls: string }> = ({ label, count, cls }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${cls}`}>
    <span className="opacity-70">{label}</span>
    {count}
  </span>
);

const ConfirmModal: React.FC<{
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}> = ({ title, description, confirmLabel, confirmClass, onConfirm, onCancel, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm mb-4">{description}</p>
      {children}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${confirmClass}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
