import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { apiBasePath } from "../constants";

const apiService = axios.create();
apiService.defaults.baseURL = apiBasePath;
// apiService.defaults.timeout = 350000;

apiService.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access-token");

    // Use config.headers.set() to avoid header type errors
    config.headers.set("Accept", "application/json, text/plain, */*");
    config.headers.set("Authorization", token ? `Bearer ${token}` : "");
    config.headers.set("Content-Type", "multipart/form-data");
    config.headers.set("Access-Control-Allow-Origin", "*");
    config.headers.set("access-control-allow-headers", "*");
    config.headers.set("access-control-allow-methods", "*");
    config.headers.set("access-control-allow-origin", "*");

    return config;
  },
  (error) => Promise.reject(error)
);

export default apiService;
