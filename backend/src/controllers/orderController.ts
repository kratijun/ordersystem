import { Response } from 'express';
import { prisma } from '@/utils/database';
import { AuthRequest } from '@/types';

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, tableId } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (tableId) {
      where.tableId = tableId;
    }

    const orders = await prisma.order.findMany({
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

  } catch (error) {
    console.error('Get Orders Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Bestellungs-ID ist erforderlich'
      });
    }

    const order = await prisma.order.findUnique({
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

  } catch (error) {
    console.error('Get Order Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
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

    // Prüfen ob Tisch existiert
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Tisch nicht gefunden'
      });
    }

    // Prüfen ob alle Produkte existieren
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Ein oder mehrere Produkte wurden nicht gefunden'
      });
    }

    // Bestellung erstellen
    const order = await prisma.order.create({
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

    // Tisch als besetzt markieren
    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'OCCUPIED' }
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Bestellung erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Create Order Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
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

    // Prüfen ob Bestellung existiert
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { table: true }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Bestellung nicht gefunden'
      });
    }

    const updatedOrder = await prisma.order.update({
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

    // Wenn Bestellung bezahlt oder storniert, Tisch freigeben
    if (status === 'PAID' || status === 'CANCELLED') {
      await prisma.table.update({
        where: { id: existingOrder.tableId },
        data: { status: 'FREE' }
      });
    }

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Bestellung erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Update Order Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Bestellungs-ID ist erforderlich'
      });
    }

    // Prüfen ob Bestellung existiert
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Bestellung nicht gefunden'
      });
    }

    // Bestellung löschen (Cascade löscht auch OrderItems)
    await prisma.order.delete({
      where: { id }
    });

    // Tisch freigeben wenn nötig
    if (existingOrder.status === 'OPEN') {
      await prisma.table.update({
        where: { id: existingOrder.tableId },
        data: { status: 'FREE' }
      });
    }

    res.json({
      success: true,
      message: 'Bestellung erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Delete Order Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const addItemsToOrder = async (req: AuthRequest, res: Response) => {
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

    // Prüfen ob Bestellung existiert und offen ist
    const order = await prisma.order.findUnique({
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

    // Prüfen ob alle Produkte existieren
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Ein oder mehrere Produkte wurden nicht gefunden'
      });
    }

    // Artikel hinzufügen
    await prisma.orderItem.createMany({
      data: items.map(item => ({
        orderId: id,
        productId: item.productId,
        quantity: parseInt(item.quantity) || 1,
        status: 'ORDERED'
      }))
    });

    // Aktualisierte Bestellung laden
    const updatedOrder = await prisma.order.findUnique({
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

  } catch (error) {
    console.error('Add Items Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
}; 