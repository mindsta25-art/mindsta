import { api } from '@/lib/apiClient';

// ===== Student Notification Functions =====

export const getNotifications = async () => {
  return await api.get('/notifications');
};

export const getUnreadNotificationCount = async () => {
  return await api.get('/notifications/unread-count');
};

export const markNotificationAsRead = async (notificationId: string) => {
  return await api.post(`/notifications/${notificationId}/read`, {});
};

export const markAllNotificationsAsRead = async () => {
  return await api.post('/notifications/read-all', {});
};

// ===== Admin Notification Functions =====

export const getAllNotifications = async (params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: string;
}) => {
  return await api.get('/notifications/admin/all', params);
};

export const createNotification = async (notification: {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'announcement' | 'update';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience?: 'all' | 'grade-specific' | 'individual';
  targetGrades?: number[];
  targetUsers?: string[];
  expiresAt?: Date | null;
  metadata?: {
    icon?: string;
    color?: string;
    actionUrl?: string;
    actionLabel?: string;
  };
}) => {
  return await api.post('/notifications/admin', notification);
};

export const updateNotification = async (
  notificationId: string,
  updates: Partial<{
    title: string;
    message: string;
    type: string;
    priority: string;
    targetAudience: string;
    targetGrades: number[];
    targetUsers: string[];
    expiresAt: Date | null;
    metadata: any;
    isActive: boolean;
  }>
) => {
  return await api.put(`/notifications/admin/${notificationId}`, updates);
};

export const deleteNotification = async (notificationId: string) => {
  return await api.delete(`/notifications/admin/${notificationId}`);
};

export const toggleNotificationStatus = async (notificationId: string) => {
  return await api.patch(`/notifications/admin/${notificationId}/toggle`, {});
};

export const getNotificationStats = async () => {
  return await api.get('/notifications/admin/stats');
};

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'announcement' | 'update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: 'all' | 'grade-specific' | 'individual';
  targetGrades?: number[];
  targetUsers?: string[];
  createdBy: {
    _id: string;
    username: string;
    role: string;
  };
  isActive: boolean;
  expiresAt?: Date | null;
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  metadata?: {
    icon?: string;
    color?: string;
    actionUrl?: string;
    actionLabel?: string;
  };
  isRead?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
