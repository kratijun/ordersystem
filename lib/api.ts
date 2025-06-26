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
    // Client-side: Basierend auf der aktuellen Domain
    const { protocol, hostname, port } = window.location;
    
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
): Promise<any> => {
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
  login: async (credentials: { name: string; password: string }) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData: { name: string; password: string; role?: string }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },
};

// Users API
export const usersApi = {
  getAll: async () => {
    return apiRequest('/users');
  },

  create: async (userData: { name: string; password: string; role: string }) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: string, userData: { name?: string; password?: string; role?: string }) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  updateProfile: async (userData: { name?: string; password?: string }) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
};

// Tables API
export const tablesApi = {
  getAll: async () => {
    return apiRequest('/tables');
  },

  getById: async (id: string) => {
    return apiRequest(`/tables/${id}`);
  },

  create: async (tableData: { number: number }) => {
    return apiRequest('/tables', {
      method: 'POST',
      body: JSON.stringify(tableData),
    });
  },

  update: async (id: string, tableData: any) => {
    return apiRequest(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tableData),
    });
  },

  delete: async (id: string) => {
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
  }) => {
    return apiRequest(`/tables/${id}/reserve`, {
      method: 'PUT',
      body: JSON.stringify(reservationData),
    });
  },

  close: async (id: string, reason?: string) => {
    return apiRequest(`/tables/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify({ closedReason: reason }),
    });
  },
};

// Products API
export const productsApi = {
  getAll: async () => {
    return apiRequest('/products');
  },

  getCategories: async () => {
    return apiRequest('/products/categories');
  },

  create: async (productData: { name: string; price: number; category: string }) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  update: async (id: string, productData: { name?: string; price?: number; category?: string }) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Orders API
export const ordersApi = {
  getAll: async () => {
    return apiRequest('/orders');
  },

  getById: async (id: string) => {
    return apiRequest(`/orders/${id}`);
  },

  create: async (orderData: { tableId: string; items: Array<{ productId: string; quantity: number }> }) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  update: async (id: string, orderData: any) => {
    return apiRequest(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/orders/${id}`, {
      method: 'DELETE',
    });
  },
};

// Order Items API
export const orderItemsApi = {
  getAll: async () => {
    return apiRequest('/order-items');
  },

  updateStatus: async (id: string, status: string) => {
    return apiRequest(`/order-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/order-items/${id}`, {
      method: 'DELETE',
    });
  },
};

// Statistics API
export const statisticsApi = {
  get: async () => {
    return apiRequest('/statistics');
  },

  export: async (format: 'csv' | 'pdf' = 'csv') => {
    return apiRequest('/statistics/export', {
      method: 'POST',
      body: JSON.stringify({ format }),
    });
  },
};

// Health Check
export const healthApi = {
  check: async () => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return await response.json();
    } catch (error) {
      throw new Error('Backend nicht erreichbar');
    }
  },
};

// Debug Information
export const getApiInfo = () => {
  return {
    baseUrl: API_BASE_URL,
    environment: process.env.NODE_ENV,
    isClient: typeof window !== 'undefined',
  };
}; 