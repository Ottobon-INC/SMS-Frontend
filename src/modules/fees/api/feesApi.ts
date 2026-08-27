import { apiGet, apiPost } from "../../../api/client/apiClient";
import type {
  FeeAccountCreatePayload,
  FeeAccountListItem,
  FeeEnrollmentOption,
  FeeLedgerResponse,
  FeePaymentCreatePayload,
  FeePaymentPostResponse
} from "../types";

export const feesApi = {
  listAccounts: () => apiGet<FeeAccountListItem[]>("/fees/accounts"),
  listSetupOptions: () => apiGet<FeeEnrollmentOption[]>("/fees/setup-options"),
  createAccount: (payload: FeeAccountCreatePayload) =>
    apiPost<FeeAccountListItem>("/fees/accounts", payload),
  getLedger: (accountId: string) => apiGet<FeeLedgerResponse>(`/fees/accounts/${accountId}/ledger`),
  postPayment: (accountId: string, payload: FeePaymentCreatePayload) =>
    apiPost<FeePaymentPostResponse>(`/fees/accounts/${accountId}/payments`, payload),
  previewReminders: (payload?: { due_date_cutoff?: string; branch_id?: string; force_resend?: boolean }) =>
    apiPost<any>("/fees/reminders/preview", payload || {}),
  dispatchReminders: (payload?: { due_date_cutoff?: string; branch_id?: string; force_resend?: boolean }) =>
    apiPost<any>("/fees/reminders/dispatch", payload || {})
} as const;
