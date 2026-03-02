import { api } from '@/lib/apiClient';

// Submit issue report (authenticated)
export const submitIssue = async (issueData: {
  category: string;
  subject: string;
  message: string;
}) => {
  return await api.post('/tickets/submit', {
    type: 'issue',
    ...issueData
  });
};

// Submit support message (public - no auth)
export const submitSupportMessage = async (supportData: {
  name: string;
  email: string;
  category: string;
  subject?: string;
  message: string;
}) => {
  return await api.post('/tickets/support', supportData);
};

// Get user's tickets
export const getMyTickets = async () => {
  return await api.get('/tickets/my-tickets');
};

// Get single ticket details
export const getTicketDetails = async (ticketNumber: string) => {
  return await api.get(`/tickets/${ticketNumber}`);
};

// Add reply to ticket
export const addTicketReply = async (ticketNumber: string, message: string) => {
  return await api.post(`/tickets/${ticketNumber}/reply`, { message });
};

// ========== ADMIN FUNCTIONS ==========

// Get all tickets (admin)
export const getAllTickets = async (filters?: {
  status?: string;
  type?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) => {
  return await api.get('/tickets/admin/all', filters);
};

// Get ticket statistics (admin)
export const getTicketStats = async () => {
  return await api.get('/tickets/admin/stats');
};

// Update ticket (admin)
export const updateTicket = async (
  ticketNumber: string,
  updates: {
    status?: string;
    priority?: string;
    assignedTo?: string | null;
  }
) => {
  return await api.patch(`/tickets/admin/${ticketNumber}`, updates);
};

// Delete ticket (admin)
export const deleteTicket = async (ticketNumber: string) => {
  return await api.delete(`/tickets/admin/${ticketNumber}`);
};
