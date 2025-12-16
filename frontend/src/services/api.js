import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token JWT
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const requestUrl = error.config?.url || '';
            const isLoginRequest = requestUrl.includes('/auth/login');
            const path = window.location.pathname;
            const isOnPublicPage = path === '/external' || path === '/login' || path === '/';

            if (!isLoginRequest) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                if (!isOnPublicPage) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    me: () => api.get('/auth/me'),
    changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Dashboard API
export const dashboardAPI = {
    get: () => api.get('/dashboard'),
    getFinanceMetrics: () => api.get('/dashboard/metrics/finance'),
    getHRMetrics: () => api.get('/dashboard/metrics/hr'),
};

// Products API
export const productsAPI = {
    list: (params) => api.get('/products', { params }),
    get: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    getLowStock: () => api.get('/products/low-stock'),
    listCategories: () => api.get('/products/categories'),
    adjustStock: (id, adjustment) => api.patch(`/products/${id}/stock`, { adjustment }),
};

// Clients API
export const clientsAPI = {
    list: (params) => api.get('/clients', { params }),
    get: (id) => api.get(`/clients/${id}`),
    create: (data) => api.post('/clients', data),
    update: (id, data) => api.put(`/clients/${id}`, data),
    delete: (id) => api.delete(`/clients/${id}`),
};

// Invoices API
export const invoicesAPI = {
    list: (params) => api.get('/invoices', { params }),
    get: (id) => api.get(`/invoices/${id}`),
    create: (data) => api.post('/invoices', data),
    update: (id, data) => api.put(`/invoices/${id}`, data),
    delete: (id) => api.delete(`/invoices/${id}`),
    getPending: () => api.get('/invoices/pending'),
    addPayment: (id, paymentData) => api.post(`/invoices/${id}/payments`, paymentData),
};

// Users API
export const usersAPI = {
    list: (params) => api.get('/users', { params }),
    get: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};

// Events API
export const eventsAPI = {
    list: (params) => api.get('/events', { params }),
    get: (id) => api.get(`/events/${id}`),
    create: (data) => api.post('/events', data),
    update: (id, data) => api.put(`/events/${id}`, data),
    delete: (id) => api.delete(`/events/${id}`),
    getUpcoming: () => api.get('/events/upcoming'),
};

// Leave Requests API
export const leaveRequestsAPI = {
    list: (params) => api.get('/leave-requests', { params }),
    get: (id) => api.get(`/leave-requests/${id}`),
    create: (data) => api.post('/leave-requests', data),
    respond: (id, status, note) => api.put(`/leave-requests/${id}/respond`, { status, responseNote: note }),
};

// Tasks API
export const tasksAPI = {
    list: (params) => api.get('/tasks', { params }),
    get: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
};

// Notifications API
export const notificationsAPI = {
    list: () => api.get('/notifications'),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/read-all'),
};

// Chat API
export const chatAPI = {
    sendInternal: (message, sessionId) => api.post('/chat/internal', { message, sessionId }),
    sendExternal: (message, visitorInfo, sessionId) =>
        api.post('/chat/external', { message, ...visitorInfo, sessionId }),
};

export default api;
