import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CalendarCheck,
  FileSpreadsheet,
  GraduationCap,
  IndianRupee,
  Loader2,
  RefreshCw,
  ReceiptText,
  UsersRound
} from "lucide-react";

import { dashboardApi } from "../api/dashboardApi";
import type {
  DashboardQuickAction,
  DashboardSummaryCard,
  OfficeStaffDashboardResponse
} from "../types/dashboard.types";
import { useAuth } from "../../authentication/providers/AuthProvider";

const cardIconMap: Record<string, ReactNode> = {
  active_students: <UsersRound className="h-5 w-5" />,
  attendance_today: <CalendarCheck className="h-5 w-5" />,
  fee_outstanding: <IndianRupee className="h-5 w-5" />,
  payments_today: <ReceiptText className="h-5 w-5" />,
  pending_imports: <FileSpreadsheet className="h-5 w-5" />,
  exam_work: <BookOpenCheck className="h-5 w-5" />
};

const toneClassMap: Record<string, string> = {
  neutral: "border-slate-200 bg-white text-slate-900",
  success: "border-emerald-100 bg-emerald-50/60 text-emerald-900",
  warning: "border-amber-100 bg-amber-50/70 text-amber-900",
  danger: "border-rose-100 bg-rose-50/70 text-rose-900"
};

function formatCurrency(value: number | string | null | undefined): string {
  const parsed = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

function formatNumber(value: number | string | null | undefined): string {
  const parsed = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN").format(Number.isFinite(parsed) ? parsed : 0);
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return "-";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value === "string" && value.trim().length > 0) return value;
  return "-";
}

function SummaryCard({ card }: { card: DashboardSummaryCard }) {
  const navigate = useNavigate();
  const isCurrency = ["fee_outstanding", "payments_today"].includes(card.key);
  const content = isCurrency ? formatCurrency(card.value) : formatNumber(card.value);
  const toneClasses = toneClassMap[card.tone] ?? toneClassMap.neutral;

  return (
    <button
      type="button"
      onClick={() => card.route && navigate(card.route)}
      className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClasses}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{card.label}</p>
          <p className="mt-3 text-2xl font-extrabold text-slate-950">{content}</p>
          {card.helper ? <p className="mt-2 text-xs font-medium text-slate-500">{card.helper}</p> : null}
        </div>
        <span className="rounded-xl bg-white/80 p-2 text-teal-700 shadow-sm">
          {cardIconMap[card.key] ?? <ArrowRight className="h-5 w-5" />}
        </span>
      </div>
    </button>
  );
}

function QuickActionButton({ action }: { action: DashboardQuickAction }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(action.route)}
      className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-200 hover:bg-teal-50/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-slate-950">{action.label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{action.description}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-slate-400" />
      </div>
    </button>
  );
}

function EmptyList({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs font-medium text-slate-400">
      {message}
    </div>
  );
}

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
          className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Office Staff Dashboard</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
              Daily Branch Operations
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              {dashboard.scope.branch_name ?? "Current branch"} operations for students, imports, fees,
              attendance and examinations.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-bold text-slate-900">{auth.appUser?.display_name ?? "Office Staff"}</span>
            <span>{todayLabel}</span>
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Updated {formatDate(dashboard.generated_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboard.summary_cards.map((card) => (
          <SummaryCard key={card.key} card={card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Quick Actions</p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-950">Start Common Workflows</h2>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
          {dashboard.quick_actions.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {dashboard.quick_actions.map((action) => (
                <QuickActionButton key={`${action.module}-${action.route}`} action={action} />
              ))}
            </div>
          ) : (
            <EmptyList message="No quick actions are available for the current permissions." />
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Attendance Today</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-950">{formatDate(dashboard.attendance.today)}</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Sessions</p>
              <p className="mt-2 text-2xl font-extrabold">{dashboard.attendance.sessions_today}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase text-amber-600">Not Started</p>
              <p className="mt-2 text-2xl font-extrabold">{dashboard.attendance.sections_without_session}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase text-blue-600">Submitted</p>
              <p className="mt-2 text-2xl font-extrabold">{dashboard.attendance.submitted_sessions}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase text-emerald-600">Finalized</p>
              <p className="mt-2 text-2xl font-extrabold">{dashboard.attendance.finalized_sessions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-teal-700" />
            <h2 className="text-lg font-extrabold text-slate-950">Student Operations</h2>
          </div>
          <div className="grid gap-3 text-sm">
            <InfoRow label="Current enrollments" value={dashboard.students.current_enrollments} />
            <InfoRow label="Added today" value={dashboard.students.students_created_today} />
            <InfoRow label="Missing guardian contact" value={dashboard.students.missing_guardian_contact} />
            <InfoRow label="Missing fee account" value={dashboard.students.missing_fee_accounts} />
          </div>
          <RecentList
            title="Recently Added"
            rows={dashboard.students.recent_students}
            primaryKey="student_name"
            secondaryKey="admission_number"
            dateKey="created_at"
            emptyMessage="No recent student records."
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-teal-700" />
            <h2 className="text-lg font-extrabold text-slate-950">Fees</h2>
          </div>
          <div className="grid gap-3 text-sm">
            <InfoRow label="Net payable" value={formatCurrency(dashboard.fees.net_payable)} />
            <InfoRow label="Paid" value={formatCurrency(dashboard.fees.paid)} />
            <InfoRow label="Outstanding" value={formatCurrency(dashboard.fees.outstanding)} danger />
            <InfoRow label="Payments today" value={formatCurrency(dashboard.fees.payments_today)} />
          </div>
          <RecentList
            title="Recent Payments"
            rows={dashboard.fees.recent_payments}
            primaryKey="student_name"
            secondaryKey="receipt_number"
            dateKey="receipt_date"
            emptyMessage="No payments posted yet."
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-teal-700" />
            <h2 className="text-lg font-extrabold text-slate-950">Imports & Exams</h2>
          </div>
          <div className="grid gap-3 text-sm">
            <InfoRow label="Pending imports" value={dashboard.imports.pending_batches} />
            <InfoRow label="Failed imports" value={dashboard.imports.failed_or_rejected_batches} danger />
            <InfoRow label="Upcoming exams" value={dashboard.examinations.upcoming_exams} />
            <InfoRow label="Marks pending" value={dashboard.examinations.marks_entry_pending} />
          </div>
          <RecentList
            title="Latest Exams"
            rows={dashboard.examinations.latest_exams}
            primaryKey="name"
            secondaryKey="status"
            dateKey="exam_date"
            emptyMessage="No examination activity yet."
          />
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  danger = false
}: {
  label: string;
  value: number | string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className={`font-extrabold ${danger ? "text-rose-600" : "text-slate-950"}`}>
        {typeof value === "number" ? formatNumber(value) : value}
      </span>
    </div>
  );
}

function RecentList({
  title,
  rows,
  primaryKey,
  secondaryKey,
  dateKey,
  emptyMessage
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  primaryKey: string;
  secondaryKey: string;
  dateKey: string;
  emptyMessage: string;
}) {
  return (
    <div className="mt-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
      {rows.length === 0 ? (
        <EmptyList message={emptyMessage} />
      ) : (
        <div className="grid gap-2">
          {rows.map((row, index) => (
            <div
              key={`${readString(row, primaryKey)}-${index}`}
              className="rounded-xl border border-slate-100 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-slate-950">{readString(row, primaryKey)}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{readString(row, secondaryKey)}</p>
                </div>
                <span className="text-right text-xs font-semibold text-slate-400">
                  {formatDate(row[dateKey])}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
