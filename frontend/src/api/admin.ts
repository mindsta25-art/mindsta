/**
 * Admin API (MongoDB via Node.js Backend)
 * Handles admin-specific operations
 */

import { api } from '@/lib/apiClient';

export interface CreateAdminInput {
	email: string;
	password: string;
	fullName: string;
	userType?: string; // Optional, defaults to 'admin' if not specified
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

export interface SalesStats {
	totalSales: number;
	totalRevenue: number;
	totalItems: number;
	lastSaleDate: string | null;
	monthlySales: number;
	monthlyRevenue: number;
	formattedTotalRevenue: string;
	formattedMonthlyRevenue: string;
	averageOrderValue: string | number;
}

export const getSalesStats = async (): Promise<SalesStats> => {
	try {
		const res = await api.get('/admin/sales-stats');
		return res;
	} catch (error) {
		console.error('Error fetching sales stats:', error);
		return {
			totalSales: 0,
			totalRevenue: 0,
			totalItems: 0,
			lastSaleDate: null,
			monthlySales: 0,
			monthlyRevenue: 0,
			formattedTotalRevenue: '₦0',
			formattedMonthlyRevenue: '₦0',
			averageOrderValue: 0,
		};
	}
};
