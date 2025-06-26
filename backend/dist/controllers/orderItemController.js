"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markReady = exports.startPreparation = exports.getKitchenItems = exports.deleteOrderItem = exports.updateOrderItem = exports.getOrderItems = void 0;
const database_1 = require("@/utils/database");
const getOrderItems = async (req, res) => {
    try {
        const { status, orderId } = req.query;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (orderId) {
            where.orderId = orderId;
        }
        const orderItems = await database_1.prisma.orderItem.findMany({
            where,
            include: {
                product: true,
                order: {
                    include: {
                        table: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                id: 'asc'
            }
        });
        res.json({
            success: true,
            data: orderItems
        });
    }
    catch (error) {
        console.error('Get OrderItems Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.getOrderItems = getOrderItems;
const updateOrderItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, quantity } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'OrderItem-ID ist erforderlich'
            });
        }
        const existingOrderItem = await database_1.prisma.orderItem.findUnique({
            where: { id },
            include: {
                order: true
            }
        });
        if (!existingOrderItem) {
            return res.status(404).json({
                success: false,
                error: 'Bestellartikel nicht gefunden'
            });
        }
        if (existingOrderItem.order.status !== 'OPEN' && quantity !== undefined) {
            return res.status(400).json({
                success: false,
                error: 'Menge kann nur bei offenen Bestellungen geändert werden'
            });
        }
        const updateData = {};
        if (status && ['ORDERED', 'PREPARING', 'READY', 'SERVED'].includes(status)) {
            updateData.status = status;
        }
        if (quantity !== undefined) {
            const qty = parseInt(quantity);
            if (qty <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Menge muss größer als 0 sein'
                });
            }
            updateData.quantity = qty;
        }
        const updatedOrderItem = await database_1.prisma.orderItem.update({
            where: { id },
            data: updateData,
            include: {
                product: true,
                order: {
                    include: {
                        table: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });
        res.json({
            success: true,
            data: updatedOrderItem,
            message: 'Bestellartikel erfolgreich aktualisiert'
        });
    }
    catch (error) {
        console.error('Update OrderItem Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.updateOrderItem = updateOrderItem;
const deleteOrderItem = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'OrderItem-ID ist erforderlich'
            });
        }
        const existingOrderItem = await database_1.prisma.orderItem.findUnique({
            where: { id },
            include: {
                order: true
            }
        });
        if (!existingOrderItem) {
            return res.status(404).json({
                success: false,
                error: 'Bestellartikel nicht gefunden'
            });
        }
        if (existingOrderItem.order.status !== 'OPEN') {
            return res.status(400).json({
                success: false,
                error: 'Artikel können nur aus offenen Bestellungen entfernt werden'
            });
        }
        await database_1.prisma.orderItem.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Bestellartikel erfolgreich entfernt'
        });
    }
    catch (error) {
        console.error('Delete OrderItem Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.deleteOrderItem = deleteOrderItem;
const getKitchenItems = async (req, res) => {
    try {
        const kitchenItems = await database_1.prisma.orderItem.findMany({
            where: {
                status: {
                    in: ['ORDERED', 'PREPARING']
                },
                order: {
                    status: 'OPEN'
                }
            },
            include: {
                product: true,
                order: {
                    include: {
                        table: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { status: 'asc' },
                { id: 'asc' }
            ]
        });
        res.json({
            success: true,
            data: kitchenItems
        });
    }
    catch (error) {
        console.error('Get Kitchen Items Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.getKitchenItems = getKitchenItems;
const startPreparation = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'OrderItem-ID ist erforderlich'
            });
        }
        const orderItem = await database_1.prisma.orderItem.findUnique({
            where: { id },
            include: {
                order: true
            }
        });
        if (!orderItem) {
            return res.status(404).json({
                success: false,
                error: 'Bestellartikel nicht gefunden'
            });
        }
        if (orderItem.status !== 'ORDERED') {
            return res.status(400).json({
                success: false,
                error: 'Artikel ist nicht zur Zubereitung bereit'
            });
        }
        if (orderItem.order.status !== 'OPEN') {
            return res.status(400).json({
                success: false,
                error: 'Bestellung ist nicht mehr aktiv'
            });
        }
        const updatedOrderItem = await database_1.prisma.orderItem.update({
            where: { id },
            data: { status: 'PREPARING' },
            include: {
                product: true,
                order: {
                    include: {
                        table: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });
        res.json({
            success: true,
            data: updatedOrderItem,
            message: 'Zubereitung gestartet'
        });
    }
    catch (error) {
        console.error('Start Preparation Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.startPreparation = startPreparation;
const markReady = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'OrderItem-ID ist erforderlich'
            });
        }
        const orderItem = await database_1.prisma.orderItem.findUnique({
            where: { id },
            include: {
                order: true
            }
        });
        if (!orderItem) {
            return res.status(404).json({
                success: false,
                error: 'Bestellartikel nicht gefunden'
            });
        }
        if (orderItem.status !== 'PREPARING') {
            return res.status(400).json({
                success: false,
                error: 'Artikel wird nicht zubereitet'
            });
        }
        if (orderItem.order.status !== 'OPEN') {
            return res.status(400).json({
                success: false,
                error: 'Bestellung ist nicht mehr aktiv'
            });
        }
        const updatedOrderItem = await database_1.prisma.orderItem.update({
            where: { id },
            data: { status: 'READY' },
            include: {
                product: true,
                order: {
                    include: {
                        table: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });
        res.json({
            success: true,
            data: updatedOrderItem,
            message: 'Artikel ist fertig'
        });
    }
    catch (error) {
        console.error('Mark Ready Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.markReady = markReady;
//# sourceMappingURL=orderItemController.js.map