
import axiosInstance from ".";
import { APIurls } from "../constants";
import type { NotificationType } from "../types/notification";

interface NotificationParams {
  page?: number;
  limit?: number;
  search?: string;
  filter_type?: NotificationType;
}

export const NotificationService = {
  getNotifications: async (params: NotificationParams = {}) => {
    return await axiosInstance.get(APIurls.getNotifications, { params });
  },
// export const NotificationService = {
//   getNotifications: async (type?: NotificationType) => {
//     const params = type ? { type } : {};
//     return await axiosInstance.get(APIurls.getNotifications, { params });
//   },

  markAsRead: async (notificationId: number) => {
    return await axiosInstance.post(`${APIurls.markNotificationAsRead}?id=${notificationId}`, {
      is_active: "false"
    });
  },

  markAllAsRead: async () => {
    return await axiosInstance.post(`${APIurls.markAllNotificationAsRead}`);
  },
};
