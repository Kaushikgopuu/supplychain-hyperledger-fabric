import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  getUsersByRole: (role) => api.get(`/users/role/${role}`),
};

// Products API
export const productsAPI = {
  createProduct: (data) => api.post('/products', data),
  getAllProducts: () => api.get('/products'),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductsByOwner: (ownerId) => api.get(`/products/owner/${ownerId}`),
  getMyProducts: () => api.get('/products/my/products'),
  transferProduct: (id, data) => api.put(`/products/${id}/transfer`, data),
  updateProductStatus: (id, data) => api.put(`/products/${id}/status`, data),
  getProductHistory: (id) => api.get(`/products/${id}/history`),
};

// Orders API
export const ordersAPI = {
  createOrder: (data) => api.post('/orders', data),
  getAllOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  getOrdersByStatus: (status) => api.get(`/orders/status/${status}`),
  getMyPurchases: () => api.get('/orders/my/purchases'),
  getMySales: () => api.get('/orders/my/sales'),
  cancelOrder: (id) => api.delete(`/orders/${id}`),
};

// QR Code API
export const qrAPI = {
  validateQRCode: (qrCode) => api.post('/qr/validate', { qrCode }),
  generateQRCode: (data) => api.post('/qr/generate', data),
  scanQRCode: (qrData) => api.post('/qr/scan', { qrData }),
  getProductQR: (productId) => api.get(`/qr/product/${productId}`),
  verifyProduct: (qrData, expectedProductId) => 
    api.post('/qr/verify', { qrData, expectedProductId }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  sendTestNotification: () => api.post('/notifications/test'),
  clearAllNotifications: () => api.delete('/notifications'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;