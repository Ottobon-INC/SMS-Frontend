import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  FileSpreadsheet,
  GraduationCap,
  IndianRupee,
  Loader2,
  RefreshCw,
  Building2,
  CalendarDays,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";
import { dashboardApi } from "../../dashboard/api/dashboardApi";
import type { InstitutionDashboardResponse } from "../../dashboard/types/dashboard.types";
import { useAuth } from "../../authentication/providers/AuthProvider";
import {
  SummaryCard,
  InfoRow,
  formatCurrency,
  formatDate,
  formatNumber
} from "../../dashboard/components/DashboardWidgets";

export function InstitutionDashboardShellPage() {
  const auth = useAuth();
  const [dashboard, setDashboard] = useState<InstitutionDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDashboard(await dashboardApi.refreshInstitutionDashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load institution dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    dashboardApi.getInstitutionDashboard()
      .then((response) => {
        if (!cancelled) setDashboard(response);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load institution dashboard.");
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
          Loading institution oversight...
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
    <div className="mx-auto max-w-7xl pb-12">
      {/* 1. Institution Overview Header */}
      <section id="overview" className="mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Dean / Institution Admin</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
                Institution Overview
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Monitoring global operations and performance across all authorized branches.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-bold text-slate-900">{auth.appUser?.display_name ?? "Dean"}</span>
              <span>{todayLabel}</span>
              <div className="mt-1 flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Updated {formatDate(dashboard.generated_at)}
                </span>
                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-300"
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

        {/* ATTENDANCE TODAY */}
        <Link to="/attendance" id="attendance" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
            <CalendarDays className="h-5 w-5 text-teal-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Attendance Today</h2>
              <p className="text-xs font-medium text-slate-500">{formatDate(dashboard.attendance.today)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sessions</p>
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
        <div id="students-financial" className="grid gap-6 lg:grid-cols-2">
          {/* STUDENTS */}
          <Link to="/students" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Student Operations</h2>
            </div>
            <div className="grid gap-2">
              <InfoRow label="Active students" value={dashboard.students.active_students} />
              <InfoRow label="Current enrollments" value={dashboard.students.current_enrollments} />
              <InfoRow label="Added today" value={dashboard.students.students_created_today} />
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

        {/* BRANCH PERFORMANCE (FULL WIDTH) */}
        <section id="branches" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-700" />
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">Branch Performance</h2>
                <p className="text-xs font-medium text-slate-500">Cross-branch metric comparison.</p>
              </div>
            </div>
          </div>
          
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Branch Name</th>
                  <th className="px-6 py-4 text-right">Active Students</th>
                  <th className="px-6 py-4 text-right">Attendance Today</th>
                  <th className="px-6 py-4 text-right">Unmarked Sections</th>
                  <th className="px-6 py-4 text-right">Fee Outstanding</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dashboard.branch_summaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                      No branch performance data available.
                    </td>
                  </tr>
                ) : (
                  dashboard.branch_summaries.map((bp) => (
                    <tr key={bp.branch_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{bp.branch_name}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatNumber(bp.active_students)}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        <span className="inline-flex items-center justify-center min-w-[3rem] rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                          {bp.sessions_today}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {bp.sections_without_session > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600 border border-rose-100">
                            {bp.sections_without_session}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600">
                        {formatCurrency(bp.fee_outstanding)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/institution/branch/${bp.branch_id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          View Branch
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
