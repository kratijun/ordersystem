"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("@/utils/database");
const jwt_1 = require("@/utils/jwt");
const login = async (req, res) => {
    try {
        const { name, password } = req.body;
        if (!name || !password) {
            res.status(400).json({
                success: false,
                error: 'Name und Passwort sind erforderlich'
            });
            return;
        }
        const user = await database_1.prisma.user.findFirst({
            where: { name }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Ungültige Anmeldedaten'
            });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: 'Ungültige Anmeldedaten'
            });
            return;
        }
        const authUser = {
            id: user.id,
            name: user.name,
            role: user.role
        };
        const token = (0, jwt_1.generateToken)(authUser);
        res.json({
            success: true,
            data: {
                user: authUser,
                token
            },
            message: 'Erfolgreich angemeldet'
        });
    }
    catch (error) {
        console.error('Login Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { name, password, role = 'WAITER' } = req.body;
        if (!name || !password) {
            res.status(400).json({
                success: false,
                error: 'Name und Passwort sind erforderlich'
            });
            return;
        }
        if (!['ADMIN', 'WAITER'].includes(role)) {
            res.status(400).json({
                success: false,
                error: 'Ungültige Rolle'
            });
            return;
        }
        const existingUser = await database_1.prisma.user.findFirst({
            where: { name }
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                error: 'Benutzername bereits vergeben'
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await database_1.prisma.user.create({
            data: {
                name,
                password: hashedPassword,
                role
            },
            select: {
                id: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        res.status(201).json({
            success: true,
            data: user,
            message: 'Benutzer erfolgreich erstellt'
        });
    }
    catch (error) {
        console.error('Registrierung Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.register = register;
const me = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Nicht authentifiziert'
            });
            return;
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'Benutzer nicht gefunden'
            });
            return;
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Me Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.me = me;
//# sourceMappingURL=authController.js.map