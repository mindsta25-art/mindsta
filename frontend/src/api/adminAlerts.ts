import { api } from '@/lib/apiClient';

export interface AdminAlert {
  _id: string;
  type: 'new_user' | 'new_purchase' | 'referral_signup' | 'referral_purchase' | 'system';
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AdminAlertsResponse {
  alerts: AdminAlert[];
  unreadCount: number;
}

export const getAdminAlerts = () =>
  api.get('/admin-alerts') as Promise<AdminAlertsResponse>;

export const markAdminAlertRead = (id: string) =>
  api.put(`/admin-alerts/${id}/read`, {}) as Promise<{ success: boolean }>;

export const markAllAdminAlertsRead = () =>
  api.put('/admin-alerts/read-all', {}) as Promise<{ success: boolean }>;

export const deleteAdminAlert = (id: string) =>
  api.delete(`/admin-alerts/${id}`) as Promise<{ success: boolean }>;
