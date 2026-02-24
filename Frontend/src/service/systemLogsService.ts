import axiosInstance from ".";
import { APIurls } from "../constants";

export const SystemLogsService = {
  getSystemLogs: async (params?: { search?: string; page?: number }) => {
    return await axiosInstance.get(APIurls.getSystemLogs, { params });
  },
};
