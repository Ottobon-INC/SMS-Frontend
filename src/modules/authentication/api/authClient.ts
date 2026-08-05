import { apiGet, apiPost } from "../../../api/client/apiClient";
import type { CurrentUserResponse, LoginResponse, PortalKey } from "../types/authContext.types";

export async function loginWithPassword(
  loginIdentifier: string,
  password: string,
  portal: PortalKey
): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/auth/login", {
    login_identifier: loginIdentifier,
    password,
    portal
  });
}

export async function fetchCurrentUser(): Promise<CurrentUserResponse> {
  return apiGet<CurrentUserResponse>("/auth/me");
}

export async function submitSignupRequest(payload: {
  requested_portal: PortalKey;
  full_name: string;
  email: string;
  mobile?: string;
  institution_name?: string;
  branch_name?: string;
  message?: string;
}): Promise<{ request_id: string; status: string }> {
  return apiPost<{ request_id: string; status: string }>("/auth/signup-request", payload);
}

export async function selectAccessContext(assignmentId: string): Promise<CurrentUserResponse> {
  return apiPost<CurrentUserResponse>("/auth/select-context", { assignment_id: assignmentId });
}
