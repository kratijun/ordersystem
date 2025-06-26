import { Response } from 'express';
import { AuthRequest } from '@/types';
export declare const getProducts: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProductCategories: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createProduct: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProduct: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteProduct: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=productController.d.ts.map