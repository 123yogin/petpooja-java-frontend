import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor to handle errors gracefully
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 403 Forbidden (access denied) errors
    if (error.response?.status === 403) {
      console.warn("Access denied: User doesn't have permission for this resource");
      // Return a rejected promise with a user-friendly error
      return Promise.reject({
        ...error,
        message: "You don't have permission to access this resource",
      });
    }
    
    // Handle 401 Unauthorized (token expired/invalid)
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject({
        ...error,
        message: "Your session has expired. Please login again.",
      });
    }
    
    // For other errors, just pass them through
    return Promise.reject(error);
  }
);

export default API;

