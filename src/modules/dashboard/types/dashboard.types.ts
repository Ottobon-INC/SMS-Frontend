export interface DashboardScope {
  tenant_id: string;
  branch_id: string | null;
  branch_name: string | null;
  role_codes: string[];
}

export interface DashboardSummaryCard {
  key: string;
  label: string;
  value: number | string;
  helper: string | null;
  tone: "neutral" | "success" | "warning" | "danger" | string;
  route: string | null;
}

export interface DashboardQuickAction {
  label: string;
  description: string;
  route: string;
  module: string;
  permission: string | null;
}

export interface DashboardAttendanceSummary {
  today: string;
  sessions_today: number;
  draft_sessions: number;
  submitted_sessions: number;
  finalized_sessions: number;
  total_sections: number;
  sections_without_session: number;
  recent_sessions: Array<Record<string, unknown>>;
}

export interface DashboardFeeSummary {
  active_accounts: number;
  net_payable: string;
  paid: string;
  outstanding: string;
  payments_today: string;
  accounts_with_due: number;
  recent_payments: Array<Record<string, unknown>>;
}

export interface DashboardStudentSummary {
  active_students: number;
  current_enrollments: number;
  students_created_today: number;
  students_created_this_week: number;
  missing_guardian_contact: number;
  missing_fee_accounts: number;
  recent_students: Array<Record<string, unknown>>;
}

export interface DashboardImportSummary {
  total_recent_batches: number;
  pending_batches: number;
  failed_or_rejected_batches: number;
  latest_batches: Array<Record<string, unknown>>;
}

export interface DashboardExamSummary {
  upcoming_exams: number;
  draft_exams: number;
  returned_exams: number;
  marks_entry_pending: number;
  latest_exams: Array<Record<string, unknown>>;
}

export interface OfficeStaffDashboardResponse {
  scope: DashboardScope;
  generated_at: string;
  summary_cards: DashboardSummaryCard[];
  quick_actions: DashboardQuickAction[];
  students: DashboardStudentSummary;
  attendance: DashboardAttendanceSummary;
  fees: DashboardFeeSummary;
  imports: DashboardImportSummary;
  examinations: DashboardExamSummary;
}

export interface DashboardBranchSummary {
  branch_id: string;
  branch_name: string;
  active_students: number;
  sessions_today: number;
  sections_without_session: number;
  fee_outstanding: string;
}

export interface InstitutionDashboardResponse extends OfficeStaffDashboardResponse {
  branch_summaries: DashboardBranchSummary[];
}
