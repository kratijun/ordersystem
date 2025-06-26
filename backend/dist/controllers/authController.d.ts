import { Request, Response } from 'express';
import { LoginRequest, AuthRequest } from '@/types';
export declare const login: (req: Request<{}, {}, LoginRequest>, res: Response) => Promise<void>;
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const me: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map