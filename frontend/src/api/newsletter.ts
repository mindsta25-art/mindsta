import axios from 'axios';

const getBaseUrl = () => {
  // Use the same env var as the rest of the app (apiClient.ts)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    return 'https://mindsta-backend2.onrender.com/api';
  }
  return 'http://localhost:3000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Newsletter subscription
export const subscribeToNewsletter = async (email: string, source: string = 'home') => {
  const response = await api.post('/newsletter/subscribe', { email, source });
  return response.data;
};

// Newsletter unsubscribe
export const unsubscribeFromNewsletter = async (email: string) => {
  const response = await api.post('/newsletter/unsubscribe', { email });
  return response.data;
};

// Get newsletter subscription status
export const getNewsletterStatus = async (email: string) => {
  const response = await api.get('/newsletter/status', { params: { email } });
  return response.data;
};

// Get all newsletter subscribers (admin only)
export const getAllSubscribers = async () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const response = await api.get('/newsletter/subscribers', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Delete newsletter subscriber (admin only)
export const deleteSubscriber = async (subscriberId: string) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const response = await api.delete(`/newsletter/subscribers/${subscriberId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Send newsletter to all active subscribers (admin only)
export const sendNewsletter = async (subject: string, message: string) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const response = await api.post('/newsletter/send', 
    { subject, message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Get all sent newsletters (admin only)
export const getSentNewsletters = async () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const response = await api.get('/newsletter/sent', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get single sent newsletter details (admin only)
export const getSentNewsletterById = async (id: string) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const response = await api.get(`/newsletter/sent/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Delete account
export const deleteAccount = async (userId: string, password: string, confirmText: string) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const response = await api.delete(`/auth/account/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: { password, confirmText },
  });
  return response.data;
};
