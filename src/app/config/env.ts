export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1",
  appEnv: import.meta.env.VITE_APP_ENV ?? "local"
};
