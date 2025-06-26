import { Response } from 'express';
import { AuthRequest } from '@/types';
export declare const getOrderItems: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateOrderItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteOrderItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getKitchenItems: (req: AuthRequest, res: Response) => Promise<void>;
export declare const startPreparation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markReady: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=orderItemController.d.ts.map