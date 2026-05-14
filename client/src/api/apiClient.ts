import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Mock interceptor for demo purposes
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired/invalid tokens globally.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      localStorage.removeItem("auth_token");

      // Avoid redirect loops and don't interfere with the login API call itself.
      if (!window.location.pathname.startsWith("/auth/login")) {
        const returnTo = window.location.pathname + window.location.search;

        // Note: this will overwrite whatever is already in the URL.
        window.location.assign(
          `/auth/login?returnTo=${encodeURIComponent(returnTo)}&error=unauthorized`,
        );
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
