"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (user) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET nicht konfiguriert');
    }
    const payload = {
        userId: user.id,
        name: user.name,
        role: user.role
    };
    const options = {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET nicht konfiguriert');
    }
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
const generateRefreshToken = (userId) => {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_REFRESH_SECRET nicht konfiguriert');
    }
    const options = {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    };
    return jsonwebtoken_1.default.sign({ userId }, secret, options);
};
exports.generateRefreshToken = generateRefreshToken;
//# sourceMappingURL=jwt.js.map