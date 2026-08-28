import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CreditCard,
  IndianRupee,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  WalletCards,
  X
} from "lucide-react";
import { useAuth } from "../../authentication/providers/AuthProvider";
import { feesApi } from "../api/feesApi";
import type {
  FeeAccountCreatePayload,
  FeeAccountListItem,
  FeeEnrollmentOption,
  FeeLedgerEntryItem,
  FeePaymentCreatePayload
} from "../types";

function money(value: string): string {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(parsed);
}

function statusClass(status: string): string {
  if (status === "PAID") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "PARTIALLY_PAID") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "OVERDUE") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function ledgerTypeLabel(entryType: string): string {
  return entryType.replaceAll("_", " ");
}

function formatCell(value: string | null | undefined): string {
  if (value == null || value === "") {
    return "-";
  }
  return value;
}

function programmeDisplay(
  item: Pick<FeeAccountListItem | FeeEnrollmentOption, "programme_code" | "programme_name" | "programme_display">
): string {
  if (item.programme_display) {
    return item.programme_display;
  }
  if (item.programme_code && item.programme_name) {
    return `${item.programme_code} - ${item.programme_name}`;
  }
  return formatCell(item.programme_name ?? item.programme_code);
}

function sectionDisplay(
  item: Pick<FeeAccountListItem | FeeEnrollmentOption, "section_name" | "section_display">
): string {
  return formatCell(item.section_display ?? item.section_name);
}

function yearLevelDisplay(
  item: Pick<FeeAccountListItem | FeeEnrollmentOption, "year_level" | "year_level_label">
): string {
  if (item.year_level_label) {
    return item.year_level_label;
  }
  if (item.year_level === "1") {
    return "First Year";
  }
  if (item.year_level === "2") {
    return "Second Year";
  }
  return formatCell(item.year_level);
}

export function FeesPage() {
  const auth = useAuth();
  const [accounts, setAccounts] = useState<FeeAccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupOptions, setSetupOptions] = useState<FeeEnrollmentOption[]>([]);
  const [setupOptionsLoading, setSetupOptionsLoading] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [assignedFeeAmount, setAssignedFeeAmount] = useState("");
  const [scholarshipAmount, setScholarshipAmount] = useState("0");
  const [concessionAmount, setConcessionAmount] = useState("0");
  const [paymentScheduleType, setPaymentScheduleType] =
    useState<FeeAccountCreatePayload["payment_schedule_type"]>("ONE_TIME");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<FeeAccountListItem | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<FeePaymentCreatePayload["payment_mode"]>("CASH");
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [externalReference, setExternalReference] = useState("");
  const [paymentPeriodLabel, setPaymentPeriodLabel] = useState("");
  const [installmentNumber, setInstallmentNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [lastReceiptNumber, setLastReceiptNumber] = useState<string | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<FeeAccountListItem | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<FeeLedgerEntryItem[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  // Fee Reminder Modal States
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderPreview, setReminderPreview] = useState<any>(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderDispatching, setReminderDispatching] = useState(false);
  const [dueDateCutoff, setDueDateCutoff] = useState("");
  const [forceResend, setForceResend] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);

  const canSetupFeeAccount = auth.hasPermission("fee.basic_assign");
  const canRecordPayment = auth.hasPermission("fee.payment_record");

  async function fetchFeeAccounts() {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await feesApi.listAccounts());
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Failed to load fee accounts.");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadReminderPreview(cutoff?: string, force?: boolean) {
    setReminderLoading(true);
    setReminderError(null);
    try {
      const payload: any = {};
      if (cutoff) payload.due_date_cutoff = cutoff;
      if (force) payload.force_resend = true;
      const res = await feesApi.previewReminders(payload);
      setReminderPreview(res);
    } catch (exc) {
      setReminderError(exc instanceof Error ? exc.message : "Failed to load reminder preview.");
    } finally {
      setReminderLoading(false);
    }
  }

  function openReminderModal() {
    setShowReminderModal(true);
    setReminderSuccess(null);
    void loadReminderPreview(dueDateCutoff, forceResend);
  }

  async function dispatchReminders() {
    if (reminderDispatching) return;
    setReminderDispatching(true);
    setReminderError(null);
    try {
      const payload: any = {};
      if (dueDateCutoff) payload.due_date_cutoff = dueDateCutoff;
      if (forceResend) payload.force_resend = true;
      const res = await feesApi.dispatchReminders(payload);
      setReminderSuccess(`Dispatched ${res.queued_count} WhatsApp fee reminders successfully!`);
      setTimeout(() => {
        setShowReminderModal(false);
        setReminderSuccess(null);
      }, 2500);
    } catch (exc) {
      setReminderError(exc instanceof Error ? exc.message : "Failed to dispatch fee reminders.");
    } finally {
      setReminderDispatching(false);
    }
  }

  useEffect(() => {
    void fetchFeeAccounts();
  }, []);

  async function openSetupModal() {
    setShowSetupModal(true);
    setSetupError(null);
    setSetupOptionsLoading(true);
    try {
      const options = await feesApi.listSetupOptions();
      setSetupOptions(options);
      setSelectedEnrollmentId(options[0]?.enrollment_id ?? "");
    } catch (exc) {
      setSetupError(exc instanceof Error ? exc.message : "Failed to load eligible enrollments.");
      setSetupOptions([]);
      setSelectedEnrollmentId("");
    } finally {
      setSetupOptionsLoading(false);
    }
  }

  function closeSetupModal(force = false) {
    if (saving && !force) return;
    setShowSetupModal(false);
    setSetupError(null);
    setSelectedEnrollmentId("");
    setAssignedFeeAmount("");
    setScholarshipAmount("0");
    setConcessionAmount("0");
    setPaymentScheduleType("ONE_TIME");
  }

  async function createFeeAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSetupError(null);

    const assigned = Number(assignedFeeAmount);
    const scholarship = Number(scholarshipAmount || "0");
    const concession = Number(concessionAmount || "0");
    if (!selectedEnrollmentId) {
      setSetupError("Select a student enrollment.");
      return;
    }
    if (Number.isNaN(assigned) || assigned < 0) {
      setSetupError("Assigned fee must be zero or greater.");
      return;
    }
    if (Number.isNaN(scholarship) || Number.isNaN(concession) || scholarship < 0 || concession < 0) {
      setSetupError("Scholarship and concession must be zero or greater.");
      return;
    }
    if (scholarship + concession > assigned) {
      setSetupError("Scholarship and concession cannot exceed assigned fee.");
      return;
    }

    const selected = setupOptions.find((option) => option.enrollment_id === selectedEnrollmentId);
    const confirmed = window.confirm(
      `Create fee account for ${selected?.student_name ?? "selected student"} with net payable ${money(
        String(assigned - scholarship - concession)
      )}?`
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await feesApi.createAccount({
        enrollment_id: selectedEnrollmentId,
        assigned_fee_amount: assigned.toFixed(2),
        scholarship_amount: scholarship.toFixed(2),
        concession_amount: concession.toFixed(2),
        payment_schedule_type: paymentScheduleType
      });
      closeSetupModal(true);
      await fetchFeeAccounts();
    } catch (exc) {
      setSetupError(exc instanceof Error ? exc.message : "Failed to create fee account.");
    } finally {
      setSaving(false);
    }
  }

  function openPaymentModal(account: FeeAccountListItem) {
    setSelectedPaymentAccount(account);
    setPaymentAmount(account.outstanding_amount);
    setPaymentMode("CASH");
    setReceiptDate(new Date().toISOString().slice(0, 10));
    setExternalReference("");
    setPaymentPeriodLabel("");
    setInstallmentNumber("");
    setPaymentNotes("");
    setPaymentError(null);
    setLastReceiptNumber(null);
    setShowPaymentModal(true);
  }

  function closePaymentModal(force = false) {
    if (paymentSaving && !force) return;
    setShowPaymentModal(false);
    setSelectedPaymentAccount(null);
    setPaymentError(null);
    setPaymentAmount("");
    setLastReceiptNumber(null);
  }

  async function postPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPaymentAccount) return;
    setPaymentError(null);

    const amount = Number(paymentAmount);
    const outstanding = Number(selectedPaymentAccount.outstanding_amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setPaymentError("Payment amount must be greater than zero.");
      return;
    }
    if (amount > outstanding) {
      setPaymentError("Payment amount cannot exceed outstanding amount.");
      return;
    }
    if (!receiptDate) {
      setPaymentError("Receipt date is required.");
      return;
    }

    const confirmed = window.confirm(
      `Post payment of ${money(amount.toFixed(2))} for ${selectedPaymentAccount.student_name}? This will create a receipt ledger entry.`
    );
    if (!confirmed) return;

    setPaymentSaving(true);
    try {
      const response = await feesApi.postPayment(selectedPaymentAccount.id, {
        amount: amount.toFixed(2),
        payment_mode: paymentMode,
        receipt_date: receiptDate,
        external_reference: externalReference.trim() || null,
        payment_period_label: paymentPeriodLabel.trim() || null,
        installment_number: installmentNumber ? Number(installmentNumber) : null,
        notes: paymentNotes.trim() || null
      });
      setLastReceiptNumber(response.receipt_number);
      closePaymentModal(true);
      await fetchFeeAccounts();
      window.alert(`Payment posted successfully. Receipt No: ${response.receipt_number}`);
    } catch (exc) {
      setPaymentError(exc instanceof Error ? exc.message : "Failed to post payment.");
    } finally {
      setPaymentSaving(false);
    }
  }

  async function openLedgerModal(account: FeeAccountListItem) {
    setSelectedLedgerAccount(account);
    setLedgerEntries([]);
    setLedgerError(null);
    setLedgerLoading(true);
    setShowLedgerModal(true);
    try {
      const response = await feesApi.getLedger(account.id);
      setSelectedLedgerAccount(response.fee_account);
      setLedgerEntries(response.entries);
    } catch (exc) {
      setLedgerError(exc instanceof Error ? exc.message : "Failed to load fee ledger.");
    } finally {
      setLedgerLoading(false);
    }
  }

  function closeLedgerModal() {
    setShowLedgerModal(false);
    setSelectedLedgerAccount(null);
    setLedgerEntries([]);
    setLedgerError(null);
  }

  const filteredAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((account) =>
      [
        account.admission_number,
        account.student_name,
        account.branch_name,
        account.academic_year,
        account.year_level_label,
        account.programme_code,
        account.programme_display,
        account.programme_name,
        account.section_display,
        account.section_name,
        account.status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [accounts, searchQuery]);

  const totals = useMemo(
    () =>
      accounts.reduce(
        (current, account) => ({
          net: current.net + Number(account.net_payable_amount),
          paid: current.paid + Number(account.total_paid_amount),
          outstanding: current.outstanding + Number(account.outstanding_amount)
        }),
        { net: 0, paid: 0, outstanding: 0 }
      ),
    [accounts]
  );

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      {/* Hero Header */}
      <div className="bg-slate-900 px-6 py-8 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Fee Management</h1>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/30">
                    Accounts: {accounts.length}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  View assigned fees, scholarships, concessions, payments and outstanding dues. Use Imports for bulk fee setup.
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Today</p>
              <p className="text-white font-semibold text-sm mt-0.5">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchFeeAccounts()}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
            title="Refresh fee accounts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => openReminderModal()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
          >
            <WalletCards className="h-4 w-4" />
            📲 Send Fee Reminders
          </button>
          {canSetupFeeAccount && (
            <button
              type="button"
              onClick={() => void openSetupModal()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Manual Fee Setup
            </button>
          )}
        </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Net Payable</p>
          <p className="mt-2 text-lg font-bold text-slate-950">{money(String(totals.net))}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Paid</p>
          <p className="mt-2 text-lg font-bold text-emerald-700">{money(String(totals.paid))}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outstanding</p>
          <p className="mt-2 text-lg font-bold text-rose-700">{money(String(totals.outstanding))}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-xs md:max-w-md">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by student, admission no, stream or status..."
          className="w-full bg-transparent text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs font-semibold text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin text-teal-600" />
            Loading fee accounts...
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <WalletCards className="h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-900">No Fee Accounts Found</p>
            <p className="mt-1 max-w-md text-xs text-slate-400">
              Fee account creation, payment receipts, scholarship posting and adjustment approvals will be implemented in the next fee phases.
            </p>
          </div>
        ) : (
          <div className="max-h-[560px] overflow-auto">
            <table className="min-w-[1440px] w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">Admission No</th>
                  <th className="border-b border-slate-200 px-4 py-3">Student</th>
                  <th className="border-b border-slate-200 px-4 py-3">Academic Year</th>
                  <th className="border-b border-slate-200 px-4 py-3">Year Level</th>
                  <th className="border-b border-slate-200 px-4 py-3">Programme / Stream</th>
                  <th className="border-b border-slate-200 px-4 py-3">Section</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Assigned</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Scholarship</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Concession</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Net Payable</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Paid</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Outstanding</th>
                  <th className="border-b border-slate-200 px-4 py-3">Schedule</th>
                  <th className="border-b border-slate-200 px-4 py-3">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-teal-700">{account.admission_number ?? "-"}</td>
                    <td className="px-4 py-3 font-bold text-slate-950">{account.student_name}</td>
                    <td className="px-4 py-3 text-slate-700">{account.academic_year ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{yearLevelDisplay(account)}</td>
                    <td className="px-4 py-3 text-slate-700">{programmeDisplay(account)}</td>
                    <td className="px-4 py-3 text-slate-700">{sectionDisplay(account)}</td>
                    <td className="px-4 py-3 text-right font-mono">{money(account.assigned_fee_amount)}</td>
                    <td className="px-4 py-3 text-right font-mono">{money(account.scholarship_amount)}</td>
                    <td className="px-4 py-3 text-right font-mono">{money(account.concession_amount)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-950">{money(account.net_payable_amount)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">{money(account.total_paid_amount)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">{money(account.outstanding_amount)}</td>
                    <td className="px-4 py-3 text-slate-700">{account.payment_schedule_type.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClass(account.status)}`}>
                        {account.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void openLedgerModal(account)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          <ReceiptText className="h-3 w-3" />
                          View Ledger
                        </button>
                        {canRecordPayment && Number(account.outstanding_amount) > 0 && (
                        <button
                          type="button"
                          onClick={() => openPaymentModal(account)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-slate-800"
                        >
                          <CreditCard className="h-3 w-3" />
                          Record Payment
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Manual Fee Setup</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Create the first fee account for one active enrollment. Use Imports for bulk setup; payments and receipts are handled in the next phase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => closeSetupModal()}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {setupError && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4" />
                {setupError}
              </div>
            )}

            {setupOptionsLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs font-semibold text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin text-teal-600" />
                Loading eligible enrollments...
              </div>
            ) : setupOptions.length === 0 ? (
              <div className="py-10 text-center">
                <WalletCards className="mx-auto h-9 w-9 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-900">No Eligible Enrollments</p>
                <p className="mt-1 text-xs text-slate-400">
                  Every active enrollment in your current context already has a fee account, or no active enrollments exist.
                </p>
              </div>
            ) : (
              <form onSubmit={(event) => void createFeeAccount(event)} className="mt-5 space-y-4">
                <label className="block text-xs font-bold text-slate-700">
                  Student Enrollment
                  <select
                    value={selectedEnrollmentId}
                    onChange={(event) => setSelectedEnrollmentId(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                  >
                    {setupOptions.map((option) => (
                      <option key={option.enrollment_id} value={option.enrollment_id}>
                        {option.student_name} - {option.admission_number ?? "No Admission No"} - {option.academic_year}
                        {option.year_level_label ? ` - ${option.year_level_label}` : ""}
                        {` - ${programmeDisplay(option)}`}
                        {` - ${sectionDisplay(option)}`}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Assigned Fee
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={assignedFeeAmount}
                      onChange={(event) => setAssignedFeeAmount(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-teal-500"
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-700">
                    Government Scholarship
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={scholarshipAmount}
                      onChange={(event) => setScholarshipAmount(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-teal-500"
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-700">
                    Concession
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={concessionAmount}
                      onChange={(event) => setConcessionAmount(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-teal-500"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Schedule Type
                    <select
                      value={paymentScheduleType}
                      onChange={(event) =>
                        setPaymentScheduleType(event.target.value as FeeAccountCreatePayload["payment_schedule_type"])
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-teal-500"
                    >
                      <option value="ONE_TIME">One Time</option>
                      <option value="TERM_WISE">Term Wise</option>
                      <option value="INSTALLMENT_WISE">Installment Wise</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Net Payable</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {money(
                        String(
                          Math.max(
                            0,
                            Number(assignedFeeAmount || "0") -
                              Number(scholarshipAmount || "0") -
                              Number(concessionAmount || "0")
                          )
                        )
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => closeSetupModal()}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Creating..." : "Create Fee Account"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showPaymentModal && selectedPaymentAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Record Payment</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedPaymentAccount.student_name} - {selectedPaymentAccount.admission_number ?? "No Admission No"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => closePaymentModal()}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs md:grid-cols-3">
              <div>
                <p className="font-bold uppercase tracking-wide text-slate-400">Net Payable</p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-950">{money(selectedPaymentAccount.net_payable_amount)}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wide text-slate-400">Already Paid</p>
                <p className="mt-1 font-mono text-sm font-bold text-emerald-700">{money(selectedPaymentAccount.total_paid_amount)}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wide text-slate-400">Outstanding</p>
                <p className="mt-1 font-mono text-sm font-bold text-rose-700">{money(selectedPaymentAccount.outstanding_amount)}</p>
              </div>
            </div>

            {paymentError && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4" />
                {paymentError}
              </div>
            )}

            {lastReceiptNumber && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                Last receipt generated: {lastReceiptNumber}
              </div>
            )}

            <form onSubmit={(event) => void postPayment(event)} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-xs font-bold text-slate-700">
                  Payment Amount
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-teal-500"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Payment Mode
                  <select
                    value={paymentMode}
                    onChange={(event) => setPaymentMode(event.target.value as FeePaymentCreatePayload["payment_mode"])}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-teal-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CARD">Card</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Receipt Date
                  <input
                    type="date"
                    required
                    value={receiptDate}
                    onChange={(event) => setReceiptDate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-teal-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-xs font-bold text-slate-700">
                  Reference No
                  <input
                    value={externalReference}
                    onChange={(event) => setExternalReference(event.target.value)}
                    placeholder="UPI / cheque / bank ref"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-teal-500"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Period Label
                  <input
                    value={paymentPeriodLabel}
                    onChange={(event) => setPaymentPeriodLabel(event.target.value)}
                    placeholder="Term 1 / Installment 2"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-teal-500"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Installment No
                  <input
                    type="number"
                    min="1"
                    value={installmentNumber}
                    onChange={(event) => setInstallmentNumber(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-teal-500"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-slate-700">
                Notes
                <textarea
                  value={paymentNotes}
                  onChange={(event) => setPaymentNotes(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-teal-500"
                />
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => closePaymentModal()}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSaving}
                  className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paymentSaving ? "Posting..." : "Post Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLedgerModal && selectedLedgerAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Fee Ledger</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedLedgerAccount.student_name} -{" "}
                  {selectedLedgerAccount.admission_number ?? "No Admission No"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => closeLedgerModal()}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs md:grid-cols-4">
              <div>
                <p className="font-bold uppercase tracking-wide text-slate-400">Assigned</p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-950">
                  {money(selectedLedgerAccount.assigned_fee_amount)}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wide text-slate-400">Discounts</p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-950">
                  {money(
                    String(
                      Number(selectedLedgerAccount.scholarship_amount) +
                        Number(selectedLedgerAccount.concession_amount)
                    )
                  )}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wide text-slate-400">Paid</p>
                <p className="mt-1 font-mono text-sm font-bold text-emerald-700">
                  {money(selectedLedgerAccount.total_paid_amount)}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wide text-slate-400">Outstanding</p>
                <p className="mt-1 font-mono text-sm font-bold text-rose-700">
                  {money(selectedLedgerAccount.outstanding_amount)}
                </p>
              </div>
            </div>

            {ledgerError && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4" />
                {ledgerError}
              </div>
            )}

            <div className="mt-5 min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200">
              {ledgerLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-xs font-semibold text-slate-400">
                  <RefreshCw className="h-5 w-5 animate-spin text-teal-600" />
                  Loading ledger...
                </div>
              ) : ledgerEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ReceiptText className="h-9 w-9 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-900">No Ledger Entries Found</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Ledger entries appear after fee assignment, scholarship, concession or payment posting.
                  </p>
                </div>
              ) : (
                <div className="max-h-[420px] overflow-auto">
                  <table className="min-w-[1180px] w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="border-b border-slate-200 px-4 py-3">Date</th>
                        <th className="border-b border-slate-200 px-4 py-3">Type</th>
                        <th className="border-b border-slate-200 px-4 py-3">Effect</th>
                        <th className="border-b border-slate-200 px-4 py-3 text-right">Amount</th>
                        <th className="border-b border-slate-200 px-4 py-3">Receipt</th>
                        <th className="border-b border-slate-200 px-4 py-3">Mode</th>
                        <th className="border-b border-slate-200 px-4 py-3">Period</th>
                        <th className="border-b border-slate-200 px-4 py-3">Reference</th>
                        <th className="border-b border-slate-200 px-4 py-3">Posted By</th>
                        <th className="border-b border-slate-200 px-4 py-3">Status</th>
                        <th className="border-b border-slate-200 px-4 py-3">WhatsApp Notice</th>
                        <th className="border-b border-slate-200 px-4 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledgerEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-slate-700">
                            {entry.receipt_date ?? entry.entry_date}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-950">
                            {ledgerTypeLabel(entry.entry_type)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {ledgerTypeLabel(entry.balance_effect)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-950">
                            {money(entry.amount)}
                          </td>
                          <td className="px-4 py-3 font-mono text-teal-700">
                            {entry.receipt_number ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {entry.payment_mode ? ledgerTypeLabel(entry.payment_mode) : "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {entry.payment_period_label ?? "-"}
                            {entry.installment_number ? ` / ${entry.installment_number}` : ""}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {entry.external_reference ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {entry.posted_by_name ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {entry.entry_type === 'PAYMENT' ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800" title="Dispatched to parent via Meta WhatsApp API">
                                🟢 WhatsApp Receipt Sent
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{entry.notes ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => closeLedgerModal()}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Reminder Dispatch Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <span>📲 Send WhatsApp Fee Due Reminders</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Preview targeted students, skipped paid accounts, and live WhatsApp template message.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reminderError && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4" />
                {reminderError}
              </div>
            )}

            {reminderSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 animate-fade-in">
                <span className="text-base">✅</span>
                {reminderSuccess}
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Due Date Cutoff (Optional)
                </label>
                <input
                  type="date"
                  value={dueDateCutoff}
                  onChange={(e) => {
                    setDueDateCutoff(e.target.value);
                    void loadReminderPreview(e.target.value);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Preview Metrics Breakdown */}
              {reminderLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs font-semibold text-slate-400">
                  <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
                  Calculating eligible fee accounts...
                </div>
              ) : reminderPreview ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Targeted</p>
                      <p className="mt-1 text-lg font-bold text-emerald-700">{reminderPreview.targeted_count}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reminded Today</p>
                      <p className="mt-1 text-lg font-bold text-amber-700">{reminderPreview.skipped_reminded_today_count}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paid (Skipped)</p>
                      <p className="mt-1 text-lg font-bold text-slate-500">{reminderPreview.skipped_paid_count}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Overdue</p>
                      <p className="mt-1 text-lg font-bold text-rose-700">₹{reminderPreview.total_overdue_amount?.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {/* Live WhatsApp Chat Bubble Preview */}
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <span>💬 Live WhatsApp Template Message</span>
                        <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[9px]">fee_due_reminder_v1</span>
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600">Meta Compliant</span>
                    </div>
                    <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                      <p className="text-xs text-slate-800 leading-relaxed font-sans">
                        Dear <strong className="text-slate-950">{reminderPreview.eligible_students?.[0]?.guardian_name ?? "-"}</strong>,<br /><br />
                        A gentle reminder that fee dues for <strong className="text-slate-950">{reminderPreview.eligible_students?.[0]?.student_name ?? "-"}</strong> (Adm No: <span className="font-mono text-slate-600">{reminderPreview.eligible_students?.[0]?.admission_number ?? "-"}</span>, Session: <strong className="text-slate-950">{reminderPreview.eligible_students?.[0]?.academic_year_name ?? "-"}</strong>) of <strong className="text-rose-700">Rs. {reminderPreview.eligible_students?.[0]?.outstanding_amount ? reminderPreview.eligible_students[0].outstanding_amount.toLocaleString("en-IN") : "-"}</strong> are due on <strong className="text-slate-950">{reminderPreview.eligible_students?.[0]?.due_date ?? "-"}</strong>.<br /><br />
                        Please clear the pending fee dues at your earliest convenience. Please ignore if already paid.<br />
                        - <strong className="text-slate-950">{reminderPreview.eligible_students?.[0]?.sender_signature ?? "-"}</strong>
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reminderDispatching || reminderLoading || (reminderPreview && reminderPreview.targeted_count === 0)}
                onClick={() => void dispatchReminders()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {reminderDispatching ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>⏳ Dispatching Reminders...</span>
                  </>
                ) : (
                  <>
                    <WalletCards className="h-4 w-4" />
                    <span>Confirm & Dispatch WhatsApp Reminders ({reminderPreview?.targeted_count || 0})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
