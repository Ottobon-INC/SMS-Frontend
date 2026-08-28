import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  FileSpreadsheet,
  GraduationCap,
  IndianRupee,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  ChevronRight,
  CalendarCheck
} from "lucide-react";
import { dashboardApi } from "../../dashboard/api/dashboardApi";
import type { OfficeStaffDashboardResponse } from "../../dashboard/types/dashboard.types";
import {
  SummaryCard,
  InfoRow,
  formatDate,
} from "../../dashboard/components/DashboardWidgets";

export function DeanBranchViewPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const [dashboard, setDashboard] =
    useState<OfficeStaffDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!branchId) return;
    setIsLoading(true);
    setError(null);
    try {
      setDashboard(await dashboardApi.refreshOfficeStaffDashboard(branchId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load branch dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!branchId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    dashboardApi.getOfficeStaffDashboard(branchId)
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
  }, [branchId]);

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
      <section className="grid gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Link to="/dashboard/institution" className="hover:text-teal-700">
            Institution Overview
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900">Branch</span>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-rose-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-semibold">
              {error ?? "Branch data unavailable."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      {/* Sticky Breadcrumb */}
      <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-800 px-6 py-3 text-sm font-medium text-slate-400 shadow-sm backdrop-blur-md flex items-center gap-2">
        <Link
          to="/dashboard/institution"
          className="transition-colors hover:text-white hover:underline"
        >
          Institution Overview
        </Link>
        <span className="text-slate-600">/</span>
        <span className="font-bold text-white">
          {dashboard.scope.branch_name}
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-slate-900 px-6 pb-8 pt-4 md:px-10 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{dashboard.scope.branch_name}</h1>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-sky-500/20 text-sky-300 border-sky-500/30">
                    Branch Overview
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  Monitoring branch operations and current status.
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Updated</p>
              <p className="text-white font-semibold text-sm mt-0.5">
                {formatDate(dashboard.generated_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex justify-end items-center">
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      <div className="grid gap-6">
        {/* KPI STRIP */}
        <section className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {dashboard.summary_cards.map((card) => (
            <SummaryCard key={card.key} card={card} />
          ))}
        </section>

        {/* ATTENDANCE OVERVIEW (READ-ONLY) */}
        <Link to="/attendance" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
            <CalendarCheck className="h-5 w-5 text-teal-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Attendance</h2>
              <p className="text-xs font-medium text-slate-500">Branch-level attendance status.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Sessions</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{dashboard.attendance.sessions_today}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Not Started</p>
              <p className="mt-1 text-2xl font-black text-amber-900">{dashboard.attendance.sections_without_session}</p>
            </div>
            <div className="rounded-xl bg-purple-50 p-4 border border-purple-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Draft</p>
              <p className="mt-1 text-2xl font-black text-purple-900">{dashboard.attendance.draft_sessions}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Pending Review</p>
              <p className="mt-1 text-2xl font-black text-blue-900">{dashboard.attendance.submitted_sessions}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Finalized</p>
              <p className="mt-1 text-2xl font-black text-emerald-900">{dashboard.attendance.finalized_sessions}</p>
            </div>
          </div>
        </Link>

        {/* STUDENTS + FINANCIAL */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* STUDENTS */}
          <Link to="/students" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Student Operations</h2>
            </div>
            <div className="grid gap-2">
              <InfoRow label="Active students" value={dashboard.students.active_students} />
              <InfoRow label="Admissions today" value={dashboard.students.students_created_today} />
              <InfoRow label="Missing guardian contacts" value={dashboard.students.missing_guardian_contact} />
              <InfoRow label="Missing fee accounts" value={dashboard.students.missing_fee_accounts} />
            </div>
          </Link>

          {/* FINANCIAL */}
          <Link to="/fees" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Financial Overview</h2>
            </div>
            <div className="grid gap-2">
              <InfoRow label="Net payable" value={dashboard.fees.net_payable} />
              <InfoRow label="Paid" value={dashboard.fees.paid} />
              <InfoRow label="Outstanding" value={dashboard.fees.outstanding} danger={Number(dashboard.fees.outstanding) > 0} />
              <InfoRow label="Payments today" value={dashboard.fees.payments_today} />
            </div>
          </Link>
        </div>

        {/* EXAMS + IMPORTS */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* EXAMS */}
          <Link to="/examinations" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <LayoutDashboard className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Exams</h2>
            </div>
            <div className="grid gap-2">
              <InfoRow label="Upcoming exams" value={dashboard.examinations.upcoming_exams} />
              <InfoRow label="Marks pending" value={dashboard.examinations.marks_entry_pending} />
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
