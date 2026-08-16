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
    apiPost<FeePaymentPostResponse>(`/fees/accounts/${accountId}/payments`, payload)
} as const;
