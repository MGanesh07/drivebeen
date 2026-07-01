import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('drivebeen_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register') ||
      error.config?.url?.includes('/auth/password');
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('drivebeen_token');
      localStorage.removeItem('drivebeen_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// Files
export const filesAPI = {
  upload: (formData, onProgress) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
    }),
  getFiles: (params) => api.get('/files', { params }),
  getFile: (id) => api.get(`/files/${id}`),
  updateFile: (id, data) => api.put(`/files/${id}`, data),
  deleteFile: (id) => api.delete(`/files/${id}`),
  downloadFile: (id) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
  toggleFavorite: (id) => api.post(`/files/${id}/favorite`),
  getFavorites: () => api.get('/files/favorites'),
  getRecent: () => api.get('/files/recent'),
  toggleArchive: (id) => api.post(`/files/${id}/archive`),
  getArchived: () => api.get('/files/archived'),
};

// Folders
export const foldersAPI = {
  createFolder: (data) => api.post('/folders', data),
  getFolders: (params) => api.get('/folders', { params }),
  getFolder: (id) => api.get(`/folders/${id}`),
  updateFolder: (id, data) => api.put(`/folders/${id}`, data),
  deleteFolder: (id) => api.delete(`/folders/${id}`),
};

// Share
export const shareAPI = {
  shareFile: (data) => api.post('/share', data),
  getSharedByMe: () => api.get('/share/shared-by-me'),
  getSharedWithMe: () => api.get('/share/shared-with-me'),
  revokeShare: (id) => api.delete(`/share/${id}`),
};

// Trash
export const trashAPI = {
  getTrash: () => api.get('/trash'),
  restoreFile: (id) => api.post(`/trash/${id}/restore`),
  restoreFolder: (id) => api.post(`/trash/folder/${id}/restore`),
  permanentDelete: (id) => api.delete(`/trash/${id}/permanent`),
  emptyTrash: () => api.delete('/trash/empty'),
};

// Analytics
export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
  getStorageByType: () => api.get('/analytics/storage-by-type'),
  getUploadTrends: () => api.get('/analytics/upload-trends'),
  getLargestFiles: () => api.get('/analytics/largest-files'),
  getActivity: (params) => api.get('/analytics/activity', { params }),
  getFileTypes: () => api.get('/analytics/file-types'),
};

// Notifications
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
};

// Search
export const searchAPI = {
  search: (params) => api.get('/search', { params }),
};
