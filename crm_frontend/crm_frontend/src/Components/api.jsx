import axios from "axios";
import { toast } from "react-toastify";
import { getToken, logout } from "./auth";

const api = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 15000
});



api.interceptors.request.use(config => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});



let isRedirecting = false;

api.interceptors.response.use(
  res => res,
  err => {

    const status = err.response?.status;
    const errorMsg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      "Something went wrong";

    const isAuthCall =
      err.config?.url?.includes("/auth/login") ||
      err.config?.url?.includes("/auth/register");

    
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

   
    if (status >= 400 && status < 500 && !isAuthCall) {
      toast.error(errorMsg);
    }

    return Promise.reject(err);
  }
);

export default api;
