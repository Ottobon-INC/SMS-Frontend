import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck,
  FileSpreadsheet,
  IndianRupee,
  ReceiptText,
  UsersRound
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  DashboardQuickAction,
  DashboardSummaryCard
} from "../types/dashboard.types";

const cardIconMap: Record<string, ReactNode> = {
  active_students: <UsersRound className="h-5 w-5 text-indigo-600" />,
  attendance_today: <CalendarCheck className="h-5 w-5 text-teal-600" />,
  fee_outstanding: <IndianRupee className="h-5 w-5 text-rose-600" />,
  payments_today: <ReceiptText className="h-5 w-5 text-emerald-600" />,
  pending_imports: <FileSpreadsheet className="h-5 w-5 text-amber-600" />,
  exam_work: <BookOpenCheck className="h-5 w-5 text-blue-600" />
};

const toneClassMap: Record<string, string> = {
  neutral: "border-slate-200 bg-white text-slate-900",
  success: "border-emerald-100 bg-emerald-50/60 text-emerald-900",
  warning: "border-amber-100 bg-amber-50/70 text-amber-900",
  danger: "border-rose-100 bg-rose-50/70 text-rose-900"
};

export function formatCurrency(value: number | string | null | undefined): string {
  const parsed = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

export function formatNumber(value: number | string | null | undefined): string {
  const parsed = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN").format(Number.isFinite(parsed) ? parsed : 0);
}

export function formatDate(value: unknown): string {
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

export function SummaryCard({ card }: { card: DashboardSummaryCard }) {
  const navigate = useNavigate();
  const isCurrency = ["fee_outstanding", "payments_today"].includes(card.key);
  const content = isCurrency ? formatCurrency(card.value) : formatNumber(card.value);
  const toneClasses = toneClassMap[card.tone] ?? toneClassMap.neutral;

  return (
    <button
      type="button"
      onClick={() => card.route && navigate(card.route)}
      className={`group rounded-2xl border p-3 sm:p-4 text-left transition-all hover:-translate-y-0.5 hover:border-teal-200/60 h-full min-h-[105px] flex flex-col justify-between ${toneClasses}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-500 truncate">{card.label}</p>
          <p className="mt-1 text-sm sm:text-lg font-extrabold text-slate-900 truncate tracking-tight" title={content}>
            {content}
          </p>
        </div>
        <span className="rounded-lg bg-white p-1.5 sm:p-2 shadow-xs ring-1 ring-slate-100 transition-transform group-hover:scale-105 shrink-0">
          {cardIconMap[card.key] ?? <ArrowRight className="h-3.5 w-3.5 text-slate-400" />}
        </span>
      </div>
      {card.helper ? (
        <p className="mt-1.5 text-[10px] font-medium text-slate-500 truncate">{card.helper}</p>
      ) : null}
    </button>
  );
}

export function QuickActionButton({ action }: { action: DashboardQuickAction }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(action.route)}
      className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{action.label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{action.description}</p>
        </div>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      </div>
    </button>
  );
}

export function EmptyList({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-medium text-slate-400">
      {message}
    </div>
  );
}

export function InfoRow({
  label,
  value,
  danger = false
}: {
  label: string;
  value: number | string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-white px-3 py-2 transition-colors hover:bg-slate-50">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={`text-sm font-bold ${danger ? "text-rose-600" : "text-slate-900"}`}>
        {typeof value === "number" ? formatNumber(value) : value}
      </span>
    </div>
  );
}

export function RecentList({
  title,
  rows,
  primaryKey,
  secondaryKey,
  tertiaryKey,
  dateKey,
  emptyMessage
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  primaryKey: string;
  secondaryKey: string;
  tertiaryKey?: string;
  dateKey: string;
  emptyMessage: string;
}) {
  return (
    <div className="mt-4">
      {title && <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</p>}
      {rows.length === 0 ? (
        <EmptyList message={emptyMessage} />
      ) : (
        <div className="grid gap-1.5">
          {rows.map((row, index) => (
            <div
              key={`${readString(row, primaryKey)}-${index}`}
              className="rounded-lg border border-slate-100 bg-white px-3 py-2.5 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{readString(row, primaryKey)}</p>
                  <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                    {readString(row, secondaryKey)}
                    {tertiaryKey && row[tertiaryKey] ? ` • ${row[tertiaryKey]}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-right text-xs font-semibold text-slate-400">
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
