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
  RecentList,
  formatCurrency,
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
      setDashboard(await dashboardApi.getOfficeStaffDashboard(branchId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load branch dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
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
    <div className="mx-auto max-w-7xl pb-12">
      {/* Sticky Breadcrumb */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex items-center gap-2 border-b border-slate-200/50 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-500 shadow-sm backdrop-blur-md sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
        <Link
          to="/dashboard/institution"
          className="transition-colors hover:text-teal-700 hover:underline"
        >
          Institution Overview
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-bold text-slate-900">
          {dashboard.scope.branch_name}
        </span>
      </div>

      {/* 1. Branch Overview Header */}
      <section className="mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                Branch Overview
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
                {dashboard.scope.branch_name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Monitoring branch operations and current status.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Updated {formatDate(dashboard.generated_at)}
                </span>
                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-300"
                >
                  <RefreshCw className="h-3 w-3" />
                  REFRESH
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

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
  );
}
