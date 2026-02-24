import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { apiBasePath } from "../constants";

const apiService = axios.create({
  baseURL: apiBasePath,
  timeout: 60000,
});

// Flag to prevent multiple redirects
let isRedirecting = false;

apiService.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    const isFormData = config.data instanceof FormData;
    
    // Instead of replacing headers, set them individually
    config.headers.set("Accept", "application/json, text/plain, */*");
    config.headers.set("Authorization", token ? `Bearer ${token}` : "");
    config.headers.set(
      "Content-Type",
      isFormData ? "multipart/form-data" : "application/json"
    );

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors globally
apiService.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      
      // Remove invalid token
      localStorage.removeItem("token");
      
     // Only redirect if not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      
      // Reset flag after a delay
      setTimeout(() => {
        isRedirecting = false;
      }, 1000);
    }else if (error.response?.status === 503) {
        //isRedirecting = true;
        window.location.href = "/maintenance";
        setTimeout(() => (isRedirecting = false), 1000);
      }
    
    return Promise.reject(error);
  }
);

export default apiService;