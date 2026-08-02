import axios from "axios";

export const MEDIA_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${MEDIA_URL}/api/`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle expired 401 tokens automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh");

      if (refreshToken) {
        try {
          const res = await axios.post(`${MEDIA_URL}/api/token/refresh/`, {
            refresh: refreshToken,
          });

          if (res.data && res.data.access) {
            localStorage.setItem("access", res.data.access);
            if (res.data.refresh) {
              localStorage.setItem("refresh", res.data.refresh);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          console.error("Token refresh failed:", refreshErr);
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          if (window.location.pathname.startsWith("/admin")) {
            window.location.href = "/admin/login";
          } else {
            window.location.href = "/login";
          }
        }
      } else {
        localStorage.removeItem("access");
        if (window.location.pathname.startsWith("/admin")) {
          window.location.href = "/admin/login";
        } else {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;