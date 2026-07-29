import { env } from "../../app/config/env";

export async function apiGet(path: string): Promise<Response> {
  return fetch(`${env.apiBaseUrl}${path}`, {
    headers: {
      Accept: "application/json"
    }
  });
}
