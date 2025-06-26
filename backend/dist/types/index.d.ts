import { Request } from 'express';
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
export interface AuthRequest extends Request {
    user?: AuthUser;
}
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
export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
}
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
export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    status: 'ORDERED' | 'PREPARING' | 'READY' | 'SERVED';
    order?: Order;
    product?: Product;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
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
export interface LoginRequest {
    name: string;
    password: string;
}
export interface LoginResponse {
    user: AuthUser;
    token: string;
}
export interface JwtPayload {
    userId: string;
    name: string;
    role: 'ADMIN' | 'WAITER';
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=index.d.ts.map