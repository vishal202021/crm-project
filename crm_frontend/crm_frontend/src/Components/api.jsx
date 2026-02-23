import axios from "axios";
import { toast } from "react-toastify";
import { getToken, logout } from "./auth";

/*
  API BASE URL
  Uses:
  - .env (VITE_API_URL) for production
  - localhost fallback for local development
*/
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:8080",
  timeout: 15000,
});

/* ===============================
   REQUEST INTERCEPTOR
   Attach JWT token automatically
================================ */
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Something went wrong";

    const isAuthCall =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register");

    if (status === 401 && !isAuthCall) {
      if (!isRedirecting) {
        isRedirecting = true;

        toast.error("Session expired. Please login again");

        logout();

        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    }

    if (status === 403 && !isAuthCall) {
      toast.error(errorMsg || "Access denied");
    }

    if (
      status >= 400 &&
      status < 500 &&
      status !== 401 &&
      status !== 403 &&
      !isAuthCall
    ) {
      toast.error(errorMsg);
    }

    if (!status) {
      toast.error("Server unreachable");
    }

    return Promise.reject(error);
  }
);

export default api;