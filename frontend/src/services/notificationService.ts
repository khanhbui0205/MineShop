import api from '../lib/api';
import type { NotificationItem, NotificationTargetType, NotificationType } from '../types';

export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  targetType: NotificationTargetType;
  targetPlayerName?: string;
}

const getStreamUrl = () => {
  const token = localStorage.getItem('token') || '';
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  return `${baseUrl}/notifications/stream?token=${encodeURIComponent(token)}`;
};

const notificationService = {
  create: async (payload: CreateNotificationPayload): Promise<{ recipientCount: number }> => {
    const response = await api.post('/admin/notifications', payload);
    return response.data;
  },

  list: async (): Promise<NotificationItem[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  unreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return Number(response.data.unreadCount || 0);
  },

  markRead: async (id: string): Promise<NotificationItem> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async (): Promise<{ modifiedCount: number }> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  openStream: () => new EventSource(getStreamUrl()),
};

export default notificationService;
