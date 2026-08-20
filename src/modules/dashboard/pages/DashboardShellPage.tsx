import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  Zap,
  CalendarDays,
  GraduationCap,
  IndianRupee,
  FileSpreadsheet
} from "lucide-react";

import { dashboardApi } from "../api/dashboardApi";
import type { OfficeStaffDashboardResponse } from "../types/dashboard.types";
import { useAuth } from "../../authentication/providers/AuthProvider";
import {
  SummaryCard,
  QuickActionButton,
  InfoRow,
  formatDate
} from "../components/DashboardWidgets";

export function DashboardShellPage() {
  const auth = useAuth();
  const [dashboard, setDashboard] = useState<OfficeStaffDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDashboard(await dashboardApi.getOfficeStaffDashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
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
          Loading office dashboard...
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
      {/* HEADER */}
      <section id="overview" className="mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Office Staff Dashboard</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
                Daily Branch Operations
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
                {dashboard.scope.branch_name ?? "Current branch"} operations for students, imports, fees,
                attendance and examinations.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-bold text-slate-900">{auth.appUser?.display_name ?? "Office Staff"}</span>
              <span>{todayLabel}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Updated {formatDate(dashboard.generated_at)}
              </span>
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

        {/* QUICK ACTIONS */}
        <section id="quick-actions" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
          {dashboard.quick_actions.length > 0 ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {dashboard.quick_actions.map((action) => (
                <QuickActionButton key={`${action.module}-${action.route}`} action={action} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-medium text-slate-500">
              No quick actions are available for your current permissions.
            </div>
          )}
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Submitted</p>
              <p className="mt-1 text-2xl font-black text-blue-900">{dashboard.attendance.submitted_sessions}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Finalized</p>
              <p className="mt-1 text-2xl font-black text-emerald-900">{dashboard.attendance.finalized_sessions}</p>
            </div>
          </div>
        </Link>

        {/* STUDENTS + FEES */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* STUDENTS */}
          <Link to="/students" id="students" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Student Operations</h2>
            </div>
            <div className="grid gap-2">
              <InfoRow label="Current enrollments" value={dashboard.students.current_enrollments} />
              <InfoRow label="Added today" value={dashboard.students.students_created_today} />
              <InfoRow label="Missing guardian contact" value={dashboard.students.missing_guardian_contact} />
              <InfoRow label="Missing fee account" value={dashboard.students.missing_fee_accounts} />
            </div>
          </Link>

          {/* FEES */}
          <Link to="/fees" id="fees" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
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
          {/* IMPORTS */}
          <Link to="/imports" id="imports" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <FileSpreadsheet className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">Imports</h2>
            </div>
            <div className="grid gap-2">
              <InfoRow label="Pending batches" value={dashboard.imports.pending_batches} />
              <InfoRow label="Failed batches" value={dashboard.imports.failed_or_rejected_batches} danger={Number(dashboard.imports.failed_or_rejected_batches) > 0} />
            </div>
          </Link>

          {/* EXAMS */}
          <Link to="/examinations" id="exams" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <LayoutDashboard className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Exams</h2>
            </div>
            <div className="grid gap-2">
              <InfoRow label="Upcoming exams" value={dashboard.examinations.upcoming_exams} />
              <InfoRow label="Marks pending" value={dashboard.examinations.marks_entry_pending} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
