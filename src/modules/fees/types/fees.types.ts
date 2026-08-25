export interface FeeAccountListItem {
  id: string;
  tenant_id: string;
  branch_id: string;
  student_id: string;
  enrollment_id: string;
  academic_year_id: string;
  admission_number: string | null;
  student_name: string;
  branch_name: string | null;
  academic_year: string | null;
  year_level?: string | null;
  year_level_label?: string | null;
  programme_code?: string | null;
  programme_name: string | null;
  programme_display?: string | null;
  section_name: string | null;
  section_display?: string | null;
  currency: string;
  assigned_fee_amount: string;
  scholarship_amount: string;
  concession_amount: string;
  net_payable_amount: string;
  total_paid_amount: string;
  total_adjusted_amount: string;
  total_reversed_amount: string;
  outstanding_amount: string;
  payment_schedule_type: string;
  status: string;
}

export interface FeeEnrollmentOption {
  enrollment_id: string;
  student_id: string;
  branch_id: string;
  academic_year_id: string;
  admission_number: string | null;
  student_name: string;
  branch_name: string;
  academic_year: string;
  year_level?: string | null;
  year_level_label?: string | null;
  programme_code?: string | null;
  programme_name: string | null;
  programme_display?: string | null;
  section_name: string | null;
  section_display?: string | null;
}

export interface FeeAccountCreatePayload {
  enrollment_id: string;
  assigned_fee_amount: string;
  scholarship_amount: string;
  concession_amount: string;
  payment_schedule_type: "ONE_TIME" | "TERM_WISE" | "INSTALLMENT_WISE" | "CUSTOM";
}

export interface FeePaymentCreatePayload {
  amount: string;
  payment_mode: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "CARD" | "OTHER";
  receipt_date: string;
  external_reference?: string | null;
  payment_period_label?: string | null;
  installment_number?: number | null;
  notes?: string | null;
}

export interface FeePaymentPostResponse {
  fee_account: FeeAccountListItem;
  ledger_entry_id: string;
  receipt_number: string;
}

export interface FeeLedgerEntryItem {
  id: string;
  entry_type: string;
  balance_effect: string;
  amount: string;
  payment_mode: string | null;
  external_reference: string | null;
  receipt_number: string | null;
  receipt_date: string | null;
  payment_period_label: string | null;
  installment_number: number | null;
  entry_date: string;
  status: string;
  notes: string | null;
  collected_by_name: string | null;
  posted_by_name: string | null;
  posted_at: string;
  created_at: string;
}

export interface FeeLedgerResponse {
  fee_account: FeeAccountListItem;
  entries: FeeLedgerEntryItem[];
}
