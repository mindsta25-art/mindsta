/**
 * API Client for Frontend
 * Makes HTTP requests to the Node.js backend
 */

// Determine API URL based on environment
const getApiBaseUrl = () => {
  // First check for environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, use Railway backend URL (hardcoded fallback)
  if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
    return 'https://mindstabackend2-production-d53e.up.railway.app/api';
  }
  
  // In development, use localhost
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Configuration:', {
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL,
  timestamp: new Date().toISOString()
});

/**
 * Make an API request with timeout
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
  
  // Get token from localStorage
  const token = localStorage.getItem('authToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Create timeout promise
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout - please check your internet connection')), 30000);
  });
  
  try {
    const response = await Promise.race([
      fetch(url, {
        ...options,
        headers,
      }),
      timeout
    ]) as Response;
    
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error('❌ API Error:', errorData);
      
      // Create error object with response data attached
      const error: any = new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      };
      throw error;
    }
    
    const data = await response.json();
    console.log('✅ API Success:', data);
    return data;
  } catch (error: any) {
    console.error('❌ API Request failed:', error.message);
    // If error doesn't have response (network error), add context
    if (!error.response) {
      error.response = {
        status: 0,
        statusText: 'Network Error',
        data: { message: error.message }
      };
    }
    throw error;
  }
}

/**
 * Build URL with query parameters
 */
function buildUrlWithParams(endpoint: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
    
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

export const api = {
  get: (endpoint: string, params?: Record<string, any>) => {
    const url = buildUrlWithParams(endpoint, params);
    return apiRequest(url, { method: 'GET' });
  },
  post: (endpoint: string, data: any) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data: any) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (endpoint: string, data: any) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' }),
};
