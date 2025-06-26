import { Response } from 'express';
import { AuthRequest } from '@/types';
export declare const getStatistics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const exportStatistics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=statisticsController.d.ts.map