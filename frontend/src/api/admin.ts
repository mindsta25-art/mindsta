/**
 * Admin API (MongoDB via Node.js Backend)
 * Handles admin-specific operations
 */

import { api } from '@/lib/apiClient';

export interface CreateAdminInput {
	email: string;
	password: string;
	fullName: string;
}

export interface AdminUser {
	id: string;
	email: string;
	fullName: string;
	userType: 'admin';
	createdAt?: string;
}

// Create another admin (admin-only)
export const createAdmin = async (input: CreateAdminInput): Promise<AdminUser> => {
	const res = await api.post('/admin/admins', input);
	return res;
};

export interface UpdateUserInput {
	userType?: string;
	status?: string;
	fullName?: string;
}

export const updateUser = async (id: string, input: UpdateUserInput) => {
	return api.patch(`/admin/users/${id}`, input);
};

export const resetUserPassword = async (id: string, newPassword: string) => {
	return api.post(`/admin/users/${id}/reset-password`, { newPassword });
};

export const deactivateUser = async (id: string) => {
	return api.post(`/admin/users/${id}/deactivate`, {});
};

export const deleteUser = async (id: string) => {
	return api.delete(`/admin/users/${id}`);
};
