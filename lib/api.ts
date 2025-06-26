// API Client für das Express.js Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Token aus localStorage holen
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth-token');
  }
  return null;
};

// Headers mit Authorization
const getHeaders = () => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Basis API-Funktion
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: getHeaders(),
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authApi = {
  login: async (name: string, password: string) => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem('auth-token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  logout: () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
  },

  me: () => apiCall('/auth/me'),

  register: (userData: { name: string; password: string; role?: string }) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

// Users API
export const usersApi = {
  getAll: () => apiCall('/users'),
  
  create: (userData: { name: string; password: string; role: string }) =>
    apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  update: (id: string, userData: { name?: string; role?: string; password?: string }) =>
    apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  delete: (id: string) =>
    apiCall(`/users/${id}`, {
      method: 'DELETE',
    }),

  updateProfile: (userData: { name?: string; currentPassword?: string; newPassword?: string }) =>
    apiCall('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
};

// Tables API
export const tablesApi = {
  getAll: () => apiCall('/tables'),
  
  getById: (id: string) => apiCall(`/tables/${id}`),
  
  create: (tableData: { number: number }) =>
    apiCall('/tables', {
      method: 'POST',
      body: JSON.stringify(tableData),
    }),

  update: (id: string, tableData: any) =>
    apiCall(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tableData),
    }),

  delete: (id: string) =>
    apiCall(`/tables/${id}`, {
      method: 'DELETE',
    }),

  reserve: (id: string, reservationData: {
    reservationName: string;
    reservationPhone: string;
    reservationDate: string;
    reservationTime: string;
    reservationGuests?: number;
  }) =>
    apiCall(`/tables/${id}/reserve`, {
      method: 'PUT',
      body: JSON.stringify(reservationData),
    }),

  close: (id: string, closedReason: string) =>
    apiCall(`/tables/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify({ closedReason }),
    }),
};

// Products API
export const productsApi = {
  getAll: (params?: { category?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString();
    return apiCall(`/products${query ? `?${query}` : ''}`);
  },

  getCategories: () => apiCall('/products/categories'),
  
  create: (productData: { name: string; price: number; category: string }) =>
    apiCall('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  update: (id: string, productData: { name?: string; price?: number; category?: string }) =>
    apiCall(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),

  delete: (id: string) =>
    apiCall(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// Orders API
export const ordersApi = {
  getAll: (params?: { status?: string; tableId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.tableId) searchParams.append('tableId', params.tableId);
    
    const query = searchParams.toString();
    return apiCall(`/orders${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => apiCall(`/orders/${id}`),
  
  create: (orderData: { tableId: string; items: Array<{ productId: string; quantity: number }> }) =>
    apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  update: (id: string, orderData: { status?: string }) =>
    apiCall(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    }),

  updateStatus: (id: string, status: string) =>
    apiCall(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    apiCall(`/orders/${id}`, {
      method: 'DELETE',
    }),

  addItems: (id: string, items: Array<{ productId: string; quantity: number }>) =>
    apiCall(`/orders/${id}/items`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
};

// Order Items API
export const orderItemsApi = {
  getAll: (params?: { status?: string; orderId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.orderId) searchParams.append('orderId', params.orderId);
    
    const query = searchParams.toString();
    return apiCall(`/order-items${query ? `?${query}` : ''}`);
  },

  getKitchenItems: () => apiCall('/order-items/kitchen'),

  update: (id: string, itemData: { status?: string; quantity?: number }) =>
    apiCall(`/order-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    }),

  updateStatus: (id: string, status: string) =>
    apiCall(`/order-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  startPreparation: (id: string) =>
    apiCall(`/order-items/${id}/start-preparation`, {
      method: 'PUT',
    }),

  markReady: (id: string) =>
    apiCall(`/order-items/${id}/mark-ready`, {
      method: 'PUT',
    }),

  delete: (id: string) =>
    apiCall(`/order-items/${id}`, {
      method: 'DELETE',
    }),
};

// Statistics API
export const statisticsApi = {
  get: (params?: { startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const query = searchParams.toString();
    return apiCall(`/statistics${query ? `?${query}` : ''}`);
  },

  export: (params: { format: 'csv' | 'json'; type: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });
    
    return apiCall(`/statistics/export?${searchParams.toString()}`);
  },
};

// Health Check
export const healthCheck = () => 
  fetch(`${API_BASE_URL.replace('/api', '')}/health`).then(res => res.json()); 