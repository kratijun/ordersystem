import { Request } from 'express';

// User Types
export interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'WAITER';
  password: string;
  createdAt: Date;
}

export interface AuthUser {
  id: string;
  name: string;
  role: 'ADMIN' | 'WAITER';
}

// Request Types mit authentifiziertem User
export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Table Types
export interface Table {
  id: string;
  number: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLOSED';
  reservationName?: string;
  reservationPhone?: string;
  reservationDate?: string;
  reservationTime?: string;
  reservationGuests?: number;
  closedReason?: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

// Order Types
export interface Order {
  id: string;
  tableId: string;
  userId: string;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  createdAt: Date;
  table?: Table;
  user?: User;
  items?: OrderItem[];
}

// OrderItem Types
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  status: 'ORDERED' | 'PREPARING' | 'READY' | 'SERVED';
  order?: Order;
  product?: Product;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Statistics Types
export interface Statistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  categoryStats: Array<{
    category: string;
    quantity: number;
    revenue: number;
  }>;
}

// Auth Types
export interface LoginRequest {
  name: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  name: string;
  role: 'ADMIN' | 'WAITER';
  iat?: number;
  exp?: number;
} 