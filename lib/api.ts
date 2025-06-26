// API Client für das Orderman System
// Alle API-Calls sollten über diese Funktionen laufen

// Automatische API Base URL Erkennung
const getApiBaseUrl = (): string => {
  // In Development: Aus Environment Variable
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  // In Production: Automatische Erkennung basierend auf der aktuellen Domain
  if (typeof window !== 'undefined') {
    // Wenn explizite API URL gesetzt ist, diese verwenden
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Standard: Relative URL (Backend läuft auf derselben Domain)
    return '/api';
  }

  // Server-side: Fallback
  return process.env.NEXT_PUBLIC_API_URL || '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper Funktion für API-Requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Wenn Response nicht OK, versuche JSON Error zu parsen
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Fallback wenn JSON parsing fehlschlägt
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    throw error;
  }
};

// Authentication API
export const authApi = {
  login: async (credentials: { name: string; password: string }): Promise<unknown> => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData: { name: string; password: string; role?: string }): Promise<unknown> => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getCurrentUser: async (): Promise<unknown> => {
    return apiRequest('/auth/me');
  },

  me: async (): Promise<unknown> => {
    return apiRequest('/auth/me');
  },

  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
    }
  },
};

// Users API
export const usersApi = {
  getAll: async (): Promise<unknown> => {
    return apiRequest('/users');
  },

  create: async (userData: { name: string; password: string; role: string }): Promise<unknown> => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: string, userData: { name?: string; password?: string; role?: string }): Promise<unknown> => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: string): Promise<unknown> => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  updateProfile: async (userData: { name?: string; password?: string }): Promise<unknown> => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
};

// Tables API
export const tablesApi = {
  getAll: async (): Promise<unknown> => {
    return apiRequest('/tables');
  },

  getById: async (id: string): Promise<unknown> => {
    return apiRequest(`/tables/${id}`);
  },

  create: async (tableData: { number: number }): Promise<unknown> => {
    return apiRequest('/tables', {
      method: 'POST',
      body: JSON.stringify(tableData),
    });
  },

  update: async (id: string, tableData: Record<string, unknown>): Promise<unknown> => {
    return apiRequest(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tableData),
    });
  },

  delete: async (id: string): Promise<unknown> => {
    return apiRequest(`/tables/${id}`, {
      method: 'DELETE',
    });
  },

  reserve: async (id: string, reservationData: {
    reservationName: string;
    reservationPhone?: string;
    reservationDate: string;
    reservationTime: string;
    reservationGuests: number;
  }): Promise<unknown> => {
    return apiRequest(`/tables/${id}/reserve`, {
      method: 'PUT',
      body: JSON.stringify(reservationData),
    });
  },

  close: async (id: string, reason?: string): Promise<unknown> => {
    return apiRequest(`/tables/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify({ closedReason: reason }),
    });
  },
};

// Products API
export const productsApi = {
  getAll: async (params?: { category?: string; search?: string }): Promise<unknown> => {
    const searchParams = new URLSearchParams();
    if (params?.category) {
      searchParams.append('category', params.category);
    }
    if (params?.search) {
      searchParams.append('search', params.search);
    }
    
    const query = searchParams.toString();
    return apiRequest(`/products${query ? `?${query}` : ''}`);
  },

  getCategories: async (): Promise<unknown> => {
    return apiRequest('/products/categories');
  },

  create: async (productData: { name: string; price: number; category: string }): Promise<unknown> => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  update: async (id: string, productData: { name?: string; price?: number; category?: string }): Promise<unknown> => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  delete: async (id: string): Promise<unknown> => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Orders API
export const ordersApi = {
  getAll: async (params?: { status?: string; tableId?: string }): Promise<unknown> => {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    if (params?.tableId) {
      searchParams.append('tableId', params.tableId);
    }
    
    const query = searchParams.toString();
    return apiRequest(`/orders${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<unknown> => {
    return apiRequest(`/orders/${id}`);
  },

  create: async (orderData: { tableId: string; items: Array<{ productId: string; quantity: number }> }): Promise<unknown> => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  update: async (id: string, orderData: Record<string, unknown>): Promise<unknown> => {
    return apiRequest(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  updateStatus: async (id: string, status: string): Promise<unknown> => {
    return apiRequest(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string): Promise<unknown> => {
    return apiRequest(`/orders/${id}`, {
      method: 'DELETE',
    });
  },

  addItems: async (id: string, items: Array<{ productId: string; quantity: number }>): Promise<unknown> => {
    return apiRequest(`/orders/${id}/items`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },
};

// Order Items API
export const orderItemsApi = {
  getAll: async (params?: { status?: string; orderId?: string }): Promise<unknown> => {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    if (params?.orderId) {
      searchParams.append('orderId', params.orderId);
    }
    
    const query = searchParams.toString();
    return apiRequest(`/order-items${query ? `?${query}` : ''}`);
  },

  getKitchenItems: async (): Promise<unknown> => {
    return apiRequest('/order-items/kitchen');
  },

  updateStatus: async (id: string, status: string): Promise<unknown> => {
    return apiRequest(`/order-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// Statistics API
export const statisticsApi = {
  getOverview: async (): Promise<unknown> => {
    return apiRequest('/statistics');
  },

  getOrderStats: async (params?: { 
    startDate?: string; 
    endDate?: string; 
    groupBy?: 'day' | 'week' | 'month' 
  }): Promise<unknown> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) {
      searchParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      searchParams.append('endDate', params.endDate);
    }
    if (params?.groupBy) {
      searchParams.append('groupBy', params.groupBy);
    }
    
    const query = searchParams.toString();
    return apiRequest(`/statistics/orders${query ? `?${query}` : ''}`);
  },

  getProductStats: async (): Promise<unknown> => {
    return apiRequest('/statistics/products');
  },

  getRevenueStats: async (params?: { 
    startDate?: string; 
    endDate?: string; 
  }): Promise<unknown> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) {
      searchParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      searchParams.append('endDate', params.endDate);
    }
    
    const query = searchParams.toString();
    return apiRequest(`/statistics/revenue${query ? `?${query}` : ''}`);
  },
};

// API Info für Debugging
export const getApiInfo = (): { baseUrl: string; environment: string } => {
  return {
    baseUrl: API_BASE_URL,
    environment: process.env.NODE_ENV || 'development'
  };
}; 