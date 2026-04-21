/**
 * API Client for Frontend
 * Makes HTTP requests to the Node.js backend
 */

// ---------------------------------------------------------------------------
// In-memory GET cache — dramatically cuts repeated round trips on navigation
// ---------------------------------------------------------------------------

/** Cache entry shape */
interface CacheEntry { data: unknown; expires: number; }

/** Keyed by `token|url` so each user gets isolated cached data */
const responseCache = new Map<string, CacheEntry>();

/** In-flight deduplication — same URL requested twice gets the same Promise */
const inFlight = new Map<string, Promise<unknown>>();

/** Default TTL: 30 seconds — fresh enough for UX, fast enough to skip refetch */
const DEFAULT_TTL_MS = 30_000;

function _cacheKey(url: string): string {
  const token = localStorage.getItem('authToken') ?? 'anon';
  return `${token}|${url}`;
}

function _fromCache(key: string): unknown | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { responseCache.delete(key); return null; }
  return entry.data;
}

function _toCache(key: string, data: unknown, ttlMs: number): void {
  responseCache.set(key, { data, expires: Date.now() + ttlMs });
  // Cap at 200 entries (LRU-style eviction) to prevent unbounded memory growth
  if (responseCache.size > 200) {
    responseCache.delete(responseCache.keys().next().value!);
  }
}

/**
 * Clear all cached GET responses.
 * Call this on sign-out so stale data never bleeds into the next session.
 */
export function clearApiCache(): void {
  responseCache.clear();
  inFlight.clear();
}

// ---------------------------------------------------------------------------
// Silent token refresh — prevents auto-logout for active users (like Udemy)
// ---------------------------------------------------------------------------

/** True while a refresh request is in flight — prevents duplicate refresh calls */
let _refreshing = false;
/**
 * Pending refresh promise shared across concurrent 401s.
 * Resolves to: true = new token stored, false = server explicitly rejected (log out),
 * null = network/server error (do NOT log out — may be transient).
 */
let _refreshPromise: Promise<boolean | null> | null = null;

/**
 * Decode the JWT exp claim (no library needed — just base-64 decode the payload).
 * Returns the expiry timestamp in ms, or 0 on error.
 */
function _jwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

/**
 * Call the /auth/refresh endpoint directly (bypasses apiRequest to avoid 401 loops).
 * Returns:
 *   true  — new token obtained and stored
 *   false — server explicitly rejected the token (401/403); caller should log the user out
 *   null  — network/server error; the token may still be valid; caller should NOT log out
 */
async function _doRefresh(): Promise<boolean | null> {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  try {
    const API_BASE = getApiBaseUrl();
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    // Server explicitly rejected the token — safe to log out
    if (res.status === 401 || res.status === 403) return false;
    // Any other non-OK status (500, 503, etc.) is a server/infra problem — don't log out
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.token) return null;
    // Persist the new token
    localStorage.setItem('authToken', data.token);
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        user.token = data.token;
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
    } catch { /* ignore */ }
    return true;
  } catch {
    // fetch() threw — network is unavailable; do NOT log the user out
    return null;
  }
}

/**
 * Shared entry-point for silent refresh.
 * Concurrent callers all await the same underlying Promise.
 */
function _refreshOnce(): Promise<boolean | null> {
  if (_refreshing && _refreshPromise) return _refreshPromise;
  _refreshing = true;
  _refreshPromise = _doRefresh().finally(() => {
    _refreshing = false;
    _refreshPromise = null;
  });
  return _refreshPromise;
}

/** Handle for the hourly refresh interval — stored so AuthContext can clear it on logout */
let _refreshIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Proactively refresh the token on app start if it expires within 7 days,
 * then schedules an hourly check so long-running sessions never expire mid-visit.
 * Call this once from AuthContext/App.tsx when a user is confirmed authenticated.
 */
export function scheduleTokenRefresh(): void {
  // Clear any prior interval to avoid duplicate timers (e.g. after re-login)
  if (_refreshIntervalId !== null) {
    clearInterval(_refreshIntervalId);
    _refreshIntervalId = null;
  }

  const _tryRefreshIfNeeded = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const expiry = _jwtExpiry(token);
    if (!expiry) return;
    const msUntilExpiry = expiry - Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
    // Refresh if expiring within 7 days OR recently expired (within 90-day grace window)
    if (msUntilExpiry < SEVEN_DAYS && msUntilExpiry > -NINETY_DAYS) {
      _refreshOnce();
    }
  };

  // Immediate check on app load
  _tryRefreshIfNeeded();

  // Hourly repeating check so long-lived sessions stay refreshed
  _refreshIntervalId = setInterval(_tryRefreshIfNeeded, 60 * 60 * 1000);
}

/** Stop the scheduled refresh — call on explicit logout */
export function cancelTokenRefresh(): void {
  if (_refreshIntervalId !== null) {
    clearInterval(_refreshIntervalId);
    _refreshIntervalId = null;
  }
}

/**
 * Bust cached entries that match a resource prefix.
 * Called automatically after every POST / PUT / PATCH / DELETE so the next
 * GET for that resource returns fresh server data.
 */
function _bustCache(endpoint: string): void {
  const resource = '/' + (endpoint.split('/').filter(Boolean)[0] ?? '');
  for (const key of responseCache.keys()) {
    if (key.includes(resource)) responseCache.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Determine API URL based on environment
// ---------------------------------------------------------------------------

// Determine API URL based on environment
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return 'https://api.mindsta.com.ng/api';
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Logging suppressed — no user/app data on console
const log = (_msg: string, ..._args: any[]) => {}; // eslint-disable-line @typescript-eslint/no-unused-vars
const warn = (_msg: string, ..._args: any[]) => {}; // eslint-disable-line @typescript-eslint/no-unused-vars
const error = (_msg: string, ..._args: any[]) => {}; // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * Make an API request with timeout
 */
async function apiRequest(endpoint: string, options: RequestInit = {}, _isRetry = false) {
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

      // On protected pages: try a silent token refresh once before redirecting
      if (!_isRetry) {
        warn('🔄 Attempting silent token refresh...');
        const refreshed = await _refreshOnce();
        if (refreshed === true) {
          // Retry the original request with the new token
          return apiRequest(endpoint, options, true);
        }
        if (refreshed === null) {
          // Network / infra error — token may still be valid; surface a network error
          // instead of logging the user out
          warn('⚠️ Refresh request failed due to network error — keeping session alive');
          const netErr: any = new Error('Network error — please check your connection and try again');
          netErr.response = { status: 0, statusText: 'Network Error', data: { message: netErr.message } };
          throw netErr;
        }
      }

      // refreshed === false (or _isRetry): server explicitly rejected our token — log out
      log('🔄 Token rejected by server, clearing session and redirecting to login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      clearApiCache();
      
      // Small delay to avoid immediate redirect during page load
      setTimeout(() => {
        window.location.href = '/auth?mode=login&reason=session-expired';
      }, 100);
      // Return here so the code below doesn't also try to parse the 401 response body
      return undefined as any;
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
      const apiError: any = new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
      apiError.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      };
      throw apiError;
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
  /**
   * GET with caching + in-flight deduplication.
   * @param ttlMs  How long to cache (ms). Pass 0 to skip cache entirely.
   */
  get: (endpoint: string, params?: Record<string, any>, ttlMs = DEFAULT_TTL_MS) => {
    const url = buildUrlWithParams(endpoint, params);
    if (ttlMs > 0) {
      const key = _cacheKey(url);
      // 1. Serve from cache if still fresh
      const cached = _fromCache(key);
      if (cached !== null) return Promise.resolve(cached);
      // 2. Dedup in-flight requests to the same URL
      if (inFlight.has(key)) return inFlight.get(key)!;
      // 3. Fetch, cache the result, clear in-flight entry
      const promise = (apiRequest(url, { method: 'GET' }) as Promise<unknown>)
        .then(data => { _toCache(key, data, ttlMs); inFlight.delete(key); return data; })
        .catch(err => { inFlight.delete(key); throw err; });
      inFlight.set(key, promise);
      return promise;
    }
    return apiRequest(url, { method: 'GET' });
  },
  post: (endpoint: string, data: any) => {
    _bustCache(endpoint);
    return apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) });
  },
  put: (endpoint: string, data: any) => {
    _bustCache(endpoint);
    return apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  },
  patch: (endpoint: string, data: any) => {
    _bustCache(endpoint);
    return apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
  },
  delete: (endpoint: string) => {
    _bustCache(endpoint);
    return apiRequest(endpoint, { method: 'DELETE' });
  },
};
