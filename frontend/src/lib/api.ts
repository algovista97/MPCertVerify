import axios, { AxiosError } from "axios";

/**
 * Browser calls same-origin `/api/...`; Vite proxies to FastAPI on :8000.
 * Set VITE_API_URL (e.g. http://127.0.0.1:8000) only if not using the proxy.
 */
const baseURL = import.meta.env.VITE_API_URL || "https://certverify-backend-z4ds.onrender.com";

const api = axios.create({
  baseURL,
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
