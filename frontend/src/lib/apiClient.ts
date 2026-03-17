/**
 * API Client for Frontend
 * Makes HTTP requests to the Node.js backend
 */

// Determine API URL based on environment
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return 'https://api.mindsta.com.ng/api';
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();
const IS_DEV = import.meta.env.DEV;

// Only log in development
const log = IS_DEV ? console.log.bind(console) : () => {};
const warn = IS_DEV ? console.warn.bind(console) : () => {};
const error = console.error.bind(console); // always log real errors

/**
 * Make an API request with timeout
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
  
  // Get token from localStorage
  const token = localStorage.getItem('authToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  // Only add Authorization header if token exists
  // This prevents sending empty Bearer tokens
  if (token && token.trim().length > 0) {
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
    
    log(`📡 API Response: ${response.status} ${response.statusText}`);
    
    // Handle 401 Unauthorized - clear invalid token
    if (response.status === 401) {
      warn('⚠️ 401 Unauthorized - Token may be invalid or expired');
      
      // Get the current path
      const currentPath = window.location.pathname;
      const isPublicPage = currentPath === '/' || 
                          currentPath.includes('/auth') || 
                          currentPath.includes('/admin-auth') || 
                          currentPath.includes('/referral-auth') ||
                          currentPath.includes('/verify-email') ||
                          currentPath.includes('/faq') ||
                          currentPath.includes('/about') ||
                          currentPath.includes('/privacy') ||
                          currentPath.includes('/terms') ||
                          currentPath.includes('/cookies') ||
                          currentPath.includes('/help') ||
                          currentPath.includes('/support');
      
      // On public/auth pages, read the real server error and throw it (don't override with "session expired")
      if (isPublicPage) {
        const errorData = await response.json().catch(() => ({ error: 'Invalid credentials' }));
        const error: any = new Error(errorData.error || errorData.message || 'Invalid email or password');
        error.response = { status: 401, data: errorData };
        throw error;
      }

      // Only clear token and redirect if on a protected page
      log('🔄 Clearing expired token and redirecting to login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      
      // Small delay to avoid immediate redirect during page load
      setTimeout(() => {
        window.location.href = '/auth?mode=login&reason=session-expired';
      }, 100);
    }
    
    // Handle 304 Not Modified - return empty array or cached data
    if (response.status === 304) {
      log('⚡ 304 Not Modified');
      return [];
    }
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      error('❌ API Error:', errorData);
      
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
    return data;
  } catch (err: any) {
    if (!err.response) {
      // network / timeout error — always log
      error('❌ API Request failed:', err.message);
      err.response = { status: 0, statusText: 'Network Error', data: { message: err.message } };
    } else {
      // HTTP error already logged above
      log('❌ API Request failed:', err.message);
    }
    throw err;
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
