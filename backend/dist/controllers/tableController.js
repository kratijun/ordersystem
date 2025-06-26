"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeTable = exports.reserveTable = exports.deleteTable = exports.updateTable = exports.createTable = exports.getTables = void 0;
const database_1 = require("@/utils/database");
const getTables = async (req, res) => {
    try {
        const tables = await database_1.prisma.table.findMany({
            orderBy: {
                number: 'asc'
            }
        });
        res.json({
            success: true,
            data: tables
        });
    }
    catch (error) {
        console.error('Get Tables Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.getTables = getTables;
const createTable = async (req, res) => {
    try {
        const { number } = req.body;
        if (!number) {
            return res.status(400).json({
                success: false,
                error: 'Tischnummer ist erforderlich'
            });
        }
        const existingTable = await database_1.prisma.table.findFirst({
            where: { number: parseInt(number) }
        });
        if (existingTable) {
            return res.status(400).json({
                success: false,
                error: 'Tischnummer bereits vergeben'
            });
        }
        const table = await database_1.prisma.table.create({
            data: {
                number: parseInt(number),
                status: 'FREE'
            }
        });
        res.status(201).json({
            success: true,
            data: table,
            message: 'Tisch erfolgreich erstellt'
        });
    }
    catch (error) {
        console.error('Create Table Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.createTable = createTable;
const updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { number, status, reservationName, reservationPhone, reservationDate, reservationTime, reservationGuests, closedReason } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Tisch-ID ist erforderlich'
            });
        }
        const existingTable = await database_1.prisma.table.findUnique({
            where: { id }
        });
        if (!existingTable) {
            return res.status(404).json({
                success: false,
                error: 'Tisch nicht gefunden'
            });
        }
        const updateData = {};
        if (number && number !== existingTable.number) {
            const numberExists = await database_1.prisma.table.findFirst({
                where: { number: parseInt(number), id: { not: id } }
            });
            if (numberExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Tischnummer bereits vergeben'
                });
            }
            updateData.number = parseInt(number);
        }
        if (status && ['FREE', 'OCCUPIED', 'RESERVED', 'CLOSED'].includes(status)) {
            updateData.status = status;
            if (status === 'FREE') {
                updateData.reservationName = null;
                updateData.reservationPhone = null;
                updateData.reservationDate = null;
                updateData.reservationTime = null;
                updateData.reservationGuests = null;
                updateData.closedReason = null;
            }
            else if (status === 'RESERVED') {
                updateData.closedReason = null;
            }
            else if (status === 'CLOSED') {
                updateData.reservationName = null;
                updateData.reservationPhone = null;
                updateData.reservationDate = null;
                updateData.reservationTime = null;
                updateData.reservationGuests = null;
            }
        }
        if (reservationName !== undefined)
            updateData.reservationName = reservationName;
        if (reservationPhone !== undefined)
            updateData.reservationPhone = reservationPhone;
        if (reservationDate !== undefined)
            updateData.reservationDate = reservationDate;
        if (reservationTime !== undefined)
            updateData.reservationTime = reservationTime;
        if (reservationGuests !== undefined)
            updateData.reservationGuests = reservationGuests ? parseInt(reservationGuests) : null;
        if (closedReason !== undefined)
            updateData.closedReason = closedReason;
        const updatedTable = await database_1.prisma.table.update({
            where: { id },
            data: updateData
        });
        res.json({
            success: true,
            data: updatedTable,
            message: 'Tisch erfolgreich aktualisiert'
        });
    }
    catch (error) {
        console.error('Update Table Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.updateTable = updateTable;
const deleteTable = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Tisch-ID ist erforderlich'
            });
        }
        const existingTable = await database_1.prisma.table.findUnique({
            where: { id }
        });
        if (!existingTable) {
            return res.status(404).json({
                success: false,
                error: 'Tisch nicht gefunden'
            });
        }
        const activeOrders = await database_1.prisma.order.findMany({
            where: {
                tableId: id,
                status: 'OPEN'
            }
        });
        if (activeOrders.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Tisch kann nicht gelöscht werden - aktive Bestellungen vorhanden'
            });
        }
        await database_1.prisma.table.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Tisch erfolgreich gelöscht'
        });
    }
    catch (error) {
        console.error('Delete Table Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.deleteTable = deleteTable;
const reserveTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { reservationName, reservationPhone, reservationDate, reservationTime, reservationGuests } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Tisch-ID ist erforderlich'
            });
        }
        if (!reservationName || !reservationPhone || !reservationDate || !reservationTime) {
            return res.status(400).json({
                success: false,
                error: 'Name, Telefon, Datum und Uhrzeit sind erforderlich'
            });
        }
        const table = await database_1.prisma.table.findUnique({
            where: { id }
        });
        if (!table) {
            return res.status(404).json({
                success: false,
                error: 'Tisch nicht gefunden'
            });
        }
        if (table.status !== 'FREE') {
            return res.status(400).json({
                success: false,
                error: 'Tisch ist nicht verfügbar'
            });
        }
        const updatedTable = await database_1.prisma.table.update({
            where: { id },
            data: {
                status: 'RESERVED',
                reservationName,
                reservationPhone,
                reservationDate,
                reservationTime,
                reservationGuests: reservationGuests ? parseInt(reservationGuests) : null
            }
        });
        res.json({
            success: true,
            data: updatedTable,
            message: 'Tisch erfolgreich reserviert'
        });
    }
    catch (error) {
        console.error('Reserve Table Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.reserveTable = reserveTable;
const closeTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { closedReason } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Tisch-ID ist erforderlich'
            });
        }
        if (!closedReason) {
            return res.status(400).json({
                success: false,
                error: 'Grund für Schließung ist erforderlich'
            });
        }
        const table = await database_1.prisma.table.findUnique({
            where: { id }
        });
        if (!table) {
            return res.status(404).json({
                success: false,
                error: 'Tisch nicht gefunden'
            });
        }
        const updatedTable = await database_1.prisma.table.update({
            where: { id },
            data: {
                status: 'CLOSED',
                closedReason,
                reservationName: null,
                reservationPhone: null,
                reservationDate: null,
                reservationTime: null,
                reservationGuests: null
            }
        });
        res.json({
            success: true,
            data: updatedTable,
            message: 'Tisch erfolgreich geschlossen'
        });
    }
    catch (error) {
        console.error('Close Table Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.closeTable = closeTable;
//# sourceMappingURL=tableController.js.map