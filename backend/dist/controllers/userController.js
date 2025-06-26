"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("@/utils/database");
const getUsers = async (req, res) => {
    try {
        const users = await database_1.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                role: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        console.error('Get Users Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res) => {
    try {
        const { name, password, role = 'WAITER' } = req.body;
        if (!name || !password) {
            return res.status(400).json({
                success: false,
                error: 'Name und Passwort sind erforderlich'
            });
        }
        if (!['ADMIN', 'WAITER'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Ungültige Rolle'
            });
        }
        const existingUser = await database_1.prisma.user.findFirst({
            where: { name }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Benutzername bereits vergeben'
            });
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
        console.error('Create User Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, password } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Benutzer-ID ist erforderlich'
            });
        }
        const existingUser = await database_1.prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: 'Benutzer nicht gefunden'
            });
        }
        const updateData = {};
        if (name && name !== existingUser.name) {
            const nameExists = await database_1.prisma.user.findFirst({
                where: { name, id: { not: id } }
            });
            if (nameExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Benutzername bereits vergeben'
                });
            }
            updateData.name = name;
        }
        if (role && ['ADMIN', 'WAITER'].includes(role)) {
            updateData.role = role;
        }
        if (password) {
            updateData.password = await bcryptjs_1.default.hash(password, 12);
        }
        const updatedUser = await database_1.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        res.json({
            success: true,
            data: updatedUser,
            message: 'Benutzer erfolgreich aktualisiert'
        });
    }
    catch (error) {
        console.error('Update User Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Benutzer-ID ist erforderlich'
            });
        }
        const existingUser = await database_1.prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: 'Benutzer nicht gefunden'
            });
        }
        if (req.user?.id === id) {
            return res.status(400).json({
                success: false,
                error: 'Sie können sich nicht selbst löschen'
            });
        }
        await database_1.prisma.user.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Benutzer erfolgreich gelöscht'
        });
    }
    catch (error) {
        console.error('Delete User Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.deleteUser = deleteUser;
const updateProfile = async (req, res) => {
    try {
        const { name, currentPassword, newPassword } = req.body;
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Nicht authentifiziert'
            });
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Benutzer nicht gefunden'
            });
        }
        const updateData = {};
        if (name && name !== user.name) {
            const nameExists = await database_1.prisma.user.findFirst({
                where: { name, id: { not: req.user.id } }
            });
            if (nameExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Benutzername bereits vergeben'
                });
            }
            updateData.name = name;
        }
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Aktuelles Passwort ist erforderlich'
                });
            }
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Aktuelles Passwort ist falsch'
                });
            }
            updateData.password = await bcryptjs_1.default.hash(newPassword, 12);
        }
        const updatedUser = await database_1.prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        res.json({
            success: true,
            data: updatedUser,
            message: 'Profil erfolgreich aktualisiert'
        });
    }
    catch (error) {
        console.error('Update Profile Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=userController.js.map