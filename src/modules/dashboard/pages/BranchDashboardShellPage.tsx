import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  FileSpreadsheet,
  GraduationCap,
  IndianRupee,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  CalendarCheck
} from "lucide-react";
import { dashboardApi } from "../api/dashboardApi";
import type { OfficeStaffDashboardResponse } from "../types/dashboard.types";
import { useAuth } from "../../authentication/providers/AuthProvider";
import {
  SummaryCard,
  InfoRow,
  formatCurrency,
  formatDate
} from "../components/DashboardWidgets";
import { PrincipalInbox } from "../../attendance/components/PrincipalInbox";

export function BranchDashboardShellPage() {
  const auth = useAuth();
  const [dashboard, setDashboard] = useState<OfficeStaffDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // The Principal operates at the branch level, so we reuse the office staff API
      // which returns exactly the branch-scoped operational data we need to review.
      setDashboard(await dashboardApi.refreshOfficeStaffDashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branch dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    dashboardApi.getOfficeStaffDashboard()
      .then((response) => {
        if (!cancelled) setDashboard(response);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load branch dashboard.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.activeContext?.assignment_id]);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
    []
  );

  if (isLoading) {
    return (
      <section className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
          Loading branch overview...
        </div>
      </section>
    );
  }

  if (error || dashboard == null) {
    return (
      <section className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-rose-700">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <p className="font-semibold">{error ?? "Dashboard unavailable."}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      {/* Hero Header */}
      <div className="bg-slate-900 px-6 py-8 md:px-10 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Branch Overview</h1>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-sky-500/20 text-sky-300 border-sky-500/30">
                    Principal
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  Reviewing operations and performance for {dashboard.scope.branch_name ?? "the current branch"}.
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Welcome back,</p>
              <p className="text-white font-semibold text-sm mt-0.5">
                {auth.appUser?.display_name ?? "Principal"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex justify-end items-center">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Updated {formatDate(dashboard.generated_at)}
            </span>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

      <div className="grid gap-6">
        {/* KPI STRIP */}
        <section className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {dashboard.summary_cards.map((card) => (
            <SummaryCard key={card.key} card={card} />
          ))}
        </section>

        {/* ATTENDANCE REVIEW & INBOX */}
        <section id="attendance-review" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Attendance Review</h2>
                <p className="text-xs font-medium text-slate-500">Review and finalize attendance sessions.</p>
              </div>
            </div>
          </div>
          
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{dashboard.attendance.sessions_today}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Draft</p>
              <p className="mt-1 text-2xl font-black text-amber-900">{dashboard.attendance.draft_sessions}</p>
            </div>
            {/* "To Review" gets the strongest visual emphasis */}
            <div className="rounded-xl bg-blue-600 p-4 border border-blue-700 shadow-md text-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">To Review</p>
              <p className="mt-1 text-2xl font-black text-white">{dashboard.attendance.submitted_sessions}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Finalized</p>
              <p className="mt-1 text-2xl font-black text-emerald-900">{dashboard.attendance.finalized_sessions}</p>
            </div>
          </div>

          {/* Principal Inbox Component */}
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Principal Inbox</p>
            <PrincipalInbox />
          </div>
        </section>

        {/* STUDENTS + FINANCIAL */}
        <div id="students-financial" className="grid gap-6 lg:grid-cols-2">
          {/* STUDENTS */}
          <Link to="/students" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Students</h2>
            </div>
            <div className="grid gap-2">
              <InfoRow label="Total active students" value={dashboard.students.active_students} />
              <InfoRow label="Admissions today" value={dashboard.students.students_created_today} />
              <InfoRow label="Missing guardian contacts" value={dashboard.students.missing_guardian_contact} danger={Number(dashboard.students.missing_guardian_contact) > 0} />
              <InfoRow label="Missing fee accounts" value={dashboard.students.missing_fee_accounts} danger={Number(dashboard.students.missing_fee_accounts) > 0} />
            </div>
          </Link>

          {/* FINANCIAL */}
          <Link to="/fees" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Financial Overview</h2>
            </div>
            <div className="grid gap-2">
              <InfoRow label="Net payable" value={formatCurrency(dashboard.fees.net_payable)} />
              <InfoRow label="Paid" value={formatCurrency(dashboard.fees.paid)} />
              <InfoRow label="Outstanding" value={formatCurrency(dashboard.fees.outstanding)} danger={Number(dashboard.fees.outstanding) > 0} />
              <InfoRow label="Payments today" value={formatCurrency(dashboard.fees.payments_today)} />
            </div>
          </Link>
        </div>

        {/* EXAMS + IMPORTS */}
        <div id="exams-imports" className="grid gap-6 lg:grid-cols-2">
          {/* EXAMS */}
          <Link to="/examinations" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <LayoutDashboard className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Exams</h2>
            </div>
            <div className="grid gap-2">
              <InfoRow label="Upcoming exams" value={dashboard.examinations.upcoming_exams} />
              <InfoRow label="Marks pending" value={dashboard.examinations.marks_entry_pending} danger={Number(dashboard.examinations.marks_entry_pending) > 0} />
            </div>
          </Link>

          {/* IMPORTS */}
          <Link to="/imports" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <FileSpreadsheet className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">Imports</h2>
            </div>
            <div className="grid gap-2">
              <InfoRow label="Pending batches" value={dashboard.imports.pending_batches} />
              <InfoRow label="Failed batches" value={dashboard.imports.failed_or_rejected_batches} danger={Number(dashboard.imports.failed_or_rejected_batches) > 0} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  </div>
  );
}
