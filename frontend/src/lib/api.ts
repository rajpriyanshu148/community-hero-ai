import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = '';

// ========================
// Axios Instance
// ========================
const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// ========================
// Token Management
// ========================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

const setToken = (token: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', token);
};

const removeTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('access_token');
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

// ========================
// Request Interceptor
// ========================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ========================
// Response Interceptor
// ========================
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        removeTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        setToken(accessToken);
        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        removeTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract error message
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    error.userMessage = errorMessage;
    return Promise.reject(error);
  }
);

// ========================
// Typed HTTP Methods
// ========================
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get<T>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.post<T>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.patch<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.put<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete<T>(url, config).then((res) => res.data),

  upload: <T>(url: string, formData: FormData, onProgress?: (pct: number) => void): Promise<T> =>
    api
      .post<T>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (onProgress && evt.total) {
            onProgress(Math.round((evt.loaded * 100) / evt.total));
          }
        },
      })
      .then((res) => res.data),
};

// ========================
// API Route Helpers
// ========================
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: unknown) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  refresh: (token: string) => apiClient.post('/auth/refresh', { refreshToken: token }),
  me: () => apiClient.get('/auth/me'),
  googleAuth: () => `/api/v1/auth/google`,
};

export const issuesApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get('/issues', { params }),
  getById: (id: string) => apiClient.get(`/issues/${id}`),
  create: (data: FormData) => apiClient.upload('/issues', data),
  updateStatus: (id: string, data: unknown) => apiClient.patch(`/issues/${id}/status`, data),
  upvote: (id: string) => apiClient.post(`/issues/${id}/upvote`),
  verify: (id: string, data: unknown) => apiClient.post(`/issues/${id}/verify`, data),
  analyzeMedia: (formData: FormData) => apiClient.upload('/issues/analyze', formData),
  getTimeline: (id: string) => apiClient.get(`/issues/${id}/timeline`),
  getByWard: (ward: number) => apiClient.get(`/issues/ward/${ward}`),
};

export const usersApi = {
  getProfile: (id?: string) => apiClient.get(id ? `/users/${id}` : '/users/me'),
  updateProfile: (data: unknown) => apiClient.patch('/users/me', data),
  getLeaderboard: (params?: Record<string, unknown>) => apiClient.get('/users/leaderboard', { params }),
  getMyMissions: () => apiClient.get('/users/me/missions'),
  acceptMission: (id: string) => apiClient.post(`/missions/${id}/accept`),
  completeMission: (id: string) => apiClient.post(`/missions/${id}/complete`),
  getNotifications: () => apiClient.get('/users/me/notifications'),
  markNotificationRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.patch('/notifications/read-all'),
  banUser: (id: string) => apiClient.patch(`/users/${id}/ban`),
  unbanUser: (id: string) => apiClient.patch(`/users/${id}/unban`),
};

export const predictionsApi = {
  getByWard: (ward: number) => apiClient.get(`/predictions/ward/${ward}`),
  getAll: () => apiClient.get('/predictions'),
  getWeatherAlerts: (lat: number, lng: number) => apiClient.get('/predictions/weather', { params: { lat, lng } }),
};

export const departmentsApi = {
  getAll: () => apiClient.get('/departments'),
  getById: (id: string) => apiClient.get(`/departments/${id}`),
  create: (data: unknown) => apiClient.post('/departments', data),
  update: (id: string, data: unknown) => apiClient.patch(`/departments/${id}`, data),
  delete: (id: string) => apiClient.delete(`/departments/${id}`),
};

export const adminApi = {
  getStats: () => apiClient.get('/admin/stats'),
  getFraudQueue: () => apiClient.get('/admin/fraud-queue'),
  approveIssue: (id: string) => apiClient.patch(`/admin/fraud/${id}/approve`),
  rejectIssue: (id: string) => apiClient.patch(`/admin/fraud/${id}/reject`),
  getAllUsers: (params?: Record<string, unknown>) => apiClient.get('/admin/users', { params }),
  getAnalytics: (params?: Record<string, unknown>) => apiClient.get('/admin/analytics', { params }),
};

export { getToken, setToken, removeTokens };
export default api;
