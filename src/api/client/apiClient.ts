import { env } from "../../app/config/env";

const selectedAssignmentStorageKey = "sms.activeAccessAssignmentId";
const accessTokenStorageKey = "sms.accessToken";

export function getStoredAccessToken(): string | null {
  return window.localStorage.getItem(accessTokenStorageKey);
}

export function storeAccessToken(accessToken: string | null): void {
  if (accessToken == null) {
    window.localStorage.removeItem(accessTokenStorageKey);
    return;
  }
  window.localStorage.setItem(accessTokenStorageKey, accessToken);
}

export function getStoredAccessAssignmentId(): string | null {
  return window.localStorage.getItem(selectedAssignmentStorageKey);
}

export function storeAccessAssignmentId(assignmentId: string | null): void {
  if (assignmentId == null) {
    window.localStorage.removeItem(selectedAssignmentStorageKey);
    return;
  }
  window.localStorage.setItem(selectedAssignmentStorageKey, assignmentId);
}

async function buildHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  const accessToken = getStoredAccessToken();
  if (accessToken != null) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const assignmentId = getStoredAccessAssignmentId();
  if (assignmentId != null) {
    headers["X-Access-Assignment-ID"] = assignmentId;
  }
  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    let detail: string | null = null;
    try {
      const parsed = JSON.parse(body) as { detail?: unknown };
      if (typeof parsed.detail === "string") {
        detail = parsed.detail;
      }
    } catch {
      // Fall through to the raw safe response body below.
    }
    if (detail != null) {
      throw new Error(detail);
    }
    throw new Error(body || `API request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: await buildHeaders()
  });
  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify(body)
  });
  return parseResponse<T>(response);
}
