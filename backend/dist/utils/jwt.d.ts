import { AuthUser, JwtPayload } from '@/types';
export declare const generateToken: (user: AuthUser) => string;
export declare const verifyToken: (token: string) => JwtPayload;
export declare const generateRefreshToken: (userId: string) => string;
//# sourceMappingURL=jwt.d.ts.map