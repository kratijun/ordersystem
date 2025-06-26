"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Zugriff verweigert. Kein Token bereitgestellt.'
        });
    }
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET nicht konfiguriert');
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = {
            id: decoded.userId,
            name: decoded.name,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Ungültiger Token'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentifizierung erforderlich'
        });
    }
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Administrator-Rechte erforderlich'
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentifizierung erforderlich'
        });
    }
    next();
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=auth.js.map