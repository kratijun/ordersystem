"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addItemsToOrder = exports.deleteOrder = exports.updateOrder = exports.createOrder = exports.getOrder = exports.getOrders = void 0;
const database_1 = require("@/utils/database");
const getOrders = async (req, res) => {
    try {
        const { status, tableId } = req.query;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (tableId) {
            where.tableId = tableId;
        }
        const orders = await database_1.prisma.order.findMany({
            where,
            include: {
                table: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                },
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: orders
        });
    }
    catch (error) {
        console.error('Get Orders Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.getOrders = getOrders;
const getOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Bestellungs-ID ist erforderlich'
            });
        }
        const order = await database_1.prisma.order.findUnique({
            where: { id },
            include: {
                table: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                },
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Bestellung nicht gefunden'
            });
        }
        res.json({
            success: true,
            data: order
        });
    }
    catch (error) {
        console.error('Get Order Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.getOrder = getOrder;
const createOrder = async (req, res) => {
    try {
        const { tableId, items } = req.body;
        if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Tisch-ID und Artikel sind erforderlich'
            });
        }
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Benutzer nicht authentifiziert'
            });
        }
        const table = await database_1.prisma.table.findUnique({
            where: { id: tableId }
        });
        if (!table) {
            return res.status(404).json({
                success: false,
                error: 'Tisch nicht gefunden'
            });
        }
        const productIds = items.map(item => item.productId);
        const products = await database_1.prisma.product.findMany({
            where: { id: { in: productIds } }
        });
        if (products.length !== productIds.length) {
            return res.status(400).json({
                success: false,
                error: 'Ein oder mehrere Produkte wurden nicht gefunden'
            });
        }
        const order = await database_1.prisma.order.create({
            data: {
                tableId,
                userId: req.user.id,
                status: 'OPEN',
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        quantity: parseInt(item.quantity) || 1,
                        status: 'ORDERED'
                    }))
                }
            },
            include: {
                table: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                },
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        await database_1.prisma.table.update({
            where: { id: tableId },
            data: { status: 'OCCUPIED' }
        });
        res.status(201).json({
            success: true,
            data: order,
            message: 'Bestellung erfolgreich erstellt'
        });
    }
    catch (error) {
        console.error('Create Order Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.createOrder = createOrder;
const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Bestellungs-ID ist erforderlich'
            });
        }
        if (!status || !['OPEN', 'PAID', 'CANCELLED'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Gültiger Status ist erforderlich'
            });
        }
        const existingOrder = await database_1.prisma.order.findUnique({
            where: { id },
            include: { table: true }
        });
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                error: 'Bestellung nicht gefunden'
            });
        }
        const updatedOrder = await database_1.prisma.order.update({
            where: { id },
            data: { status },
            include: {
                table: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                },
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        if (status === 'PAID' || status === 'CANCELLED') {
            await database_1.prisma.table.update({
                where: { id: existingOrder.tableId },
                data: { status: 'FREE' }
            });
        }
        res.json({
            success: true,
            data: updatedOrder,
            message: 'Bestellung erfolgreich aktualisiert'
        });
    }
    catch (error) {
        console.error('Update Order Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.updateOrder = updateOrder;
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Bestellungs-ID ist erforderlich'
            });
        }
        const existingOrder = await database_1.prisma.order.findUnique({
            where: { id }
        });
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                error: 'Bestellung nicht gefunden'
            });
        }
        await database_1.prisma.order.delete({
            where: { id }
        });
        if (existingOrder.status === 'OPEN') {
            await database_1.prisma.table.update({
                where: { id: existingOrder.tableId },
                data: { status: 'FREE' }
            });
        }
        res.json({
            success: true,
            message: 'Bestellung erfolgreich gelöscht'
        });
    }
    catch (error) {
        console.error('Delete Order Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.deleteOrder = deleteOrder;
const addItemsToOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Bestellungs-ID ist erforderlich'
            });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Artikel sind erforderlich'
            });
        }
        const order = await database_1.prisma.order.findUnique({
            where: { id }
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Bestellung nicht gefunden'
            });
        }
        if (order.status !== 'OPEN') {
            return res.status(400).json({
                success: false,
                error: 'Artikel können nur zu offenen Bestellungen hinzugefügt werden'
            });
        }
        const productIds = items.map(item => item.productId);
        const products = await database_1.prisma.product.findMany({
            where: { id: { in: productIds } }
        });
        if (products.length !== productIds.length) {
            return res.status(400).json({
                success: false,
                error: 'Ein oder mehrere Produkte wurden nicht gefunden'
            });
        }
        await database_1.prisma.orderItem.createMany({
            data: items.map(item => ({
                orderId: id,
                productId: item.productId,
                quantity: parseInt(item.quantity) || 1,
                status: 'ORDERED'
            }))
        });
        const updatedOrder = await database_1.prisma.order.findUnique({
            where: { id },
            include: {
                table: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                },
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: updatedOrder,
            message: 'Artikel erfolgreich zur Bestellung hinzugefügt'
        });
    }
    catch (error) {
        console.error('Add Items Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.addItemsToOrder = addItemsToOrder;
//# sourceMappingURL=orderController.js.map