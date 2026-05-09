import axios, { AxiosError } from "axios";

/**
 * Browser calls same-origin `/api/...` in production.
 * - Local dev: Vite proxies `/api` -> FastAPI (:8000)
 * - Vercel: rewrite proxies `/api` -> Render backend
 * VITE_API_URL is honored only in development.
 */
const baseURL = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || "/api") : "/api";

const api = axios.create({
  baseURL,
  timeout: 45000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("certverify_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== "/login") {
        localStorage.removeItem("certverify_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function formatApiError(error: unknown): string {
  const err = error as AxiosError<{ detail?: unknown }>;
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item: { msg?: string; type?: string }) => item?.msg || JSON.stringify(item))
      .join("; ");
  }
  if (detail != null && typeof detail === "object") {
    return JSON.stringify(detail);
  }
  return err.message || "Request failed";
}

export default api;
