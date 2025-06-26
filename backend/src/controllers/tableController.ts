import { Response } from 'express';
import { prisma } from '@/utils/database';
import { AuthRequest } from '@/types';

export const getTables = async (req: AuthRequest, res: Response) => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: {
        number: 'asc'
      }
    });

    res.json({
      success: true,
      data: tables
    });

  } catch (error) {
    console.error('Get Tables Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const createTable = async (req: AuthRequest, res: Response) => {
  try {
    const { number } = req.body;

    if (!number) {
      return res.status(400).json({
        success: false,
        error: 'Tischnummer ist erforderlich'
      });
    }

    // Prüfen ob Tischnummer bereits existiert
    const existingTable = await prisma.table.findFirst({
      where: { number: parseInt(number) }
    });

    if (existingTable) {
      return res.status(400).json({
        success: false,
        error: 'Tischnummer bereits vergeben'
      });
    }

    const table = await prisma.table.create({
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

  } catch (error) {
    console.error('Create Table Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const updateTable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      number, 
      status, 
      reservationName, 
      reservationPhone, 
      reservationDate, 
      reservationTime, 
      reservationGuests,
      closedReason 
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tisch-ID ist erforderlich'
      });
    }

    // Prüfen ob Tisch existiert
    const existingTable = await prisma.table.findUnique({
      where: { id }
    });

    if (!existingTable) {
      return res.status(404).json({
        success: false,
        error: 'Tisch nicht gefunden'
      });
    }

    // Update-Daten vorbereiten
    const updateData: any = {};

    if (number && number !== existingTable.number) {
      // Prüfen ob neue Tischnummer bereits vergeben
      const numberExists = await prisma.table.findFirst({
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

      // Status-spezifische Datenbereinigung
      if (status === 'FREE') {
        updateData.reservationName = null;
        updateData.reservationPhone = null;
        updateData.reservationDate = null;
        updateData.reservationTime = null;
        updateData.reservationGuests = null;
        updateData.closedReason = null;
      } else if (status === 'RESERVED') {
        updateData.closedReason = null;
      } else if (status === 'CLOSED') {
        updateData.reservationName = null;
        updateData.reservationPhone = null;
        updateData.reservationDate = null;
        updateData.reservationTime = null;
        updateData.reservationGuests = null;
      }
    }

    // Reservierungsdaten
    if (reservationName !== undefined) updateData.reservationName = reservationName;
    if (reservationPhone !== undefined) updateData.reservationPhone = reservationPhone;
    if (reservationDate !== undefined) updateData.reservationDate = reservationDate;
    if (reservationTime !== undefined) updateData.reservationTime = reservationTime;
    if (reservationGuests !== undefined) updateData.reservationGuests = reservationGuests ? parseInt(reservationGuests) : null;
    if (closedReason !== undefined) updateData.closedReason = closedReason;

    const updatedTable = await prisma.table.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedTable,
      message: 'Tisch erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Update Table Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const deleteTable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tisch-ID ist erforderlich'
      });
    }

    // Prüfen ob Tisch existiert
    const existingTable = await prisma.table.findUnique({
      where: { id }
    });

    if (!existingTable) {
      return res.status(404).json({
        success: false,
        error: 'Tisch nicht gefunden'
      });
    }

    // Prüfen ob Tisch aktive Bestellungen hat
    const activeOrders = await prisma.order.findMany({
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

    await prisma.table.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Tisch erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Delete Table Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const reserveTable = async (req: AuthRequest, res: Response) => {
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

    // Prüfen ob Tisch existiert und verfügbar ist
    const table = await prisma.table.findUnique({
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

    const updatedTable = await prisma.table.update({
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

  } catch (error) {
    console.error('Reserve Table Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const closeTable = async (req: AuthRequest, res: Response) => {
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

    // Prüfen ob Tisch existiert
    const table = await prisma.table.findUnique({
      where: { id }
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Tisch nicht gefunden'
      });
    }

    const updatedTable = await prisma.table.update({
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

  } catch (error) {
    console.error('Close Table Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};