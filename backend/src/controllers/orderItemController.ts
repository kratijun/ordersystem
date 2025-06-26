import { Response } from 'express';
import { prisma } from '@/utils/database';
import { AuthRequest } from '@/types';

export const getOrderItems = async (req: AuthRequest, res: Response) => {
  try {
    const { status, orderId } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    const orderItems = await prisma.orderItem.findMany({
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

  } catch (error) {
    console.error('Get OrderItems Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const updateOrderItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, quantity } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'OrderItem-ID ist erforderlich'
      });
    }

    // Prüfen ob OrderItem existiert
    const existingOrderItem = await prisma.orderItem.findUnique({
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

    // Prüfen ob Bestellung noch offen ist (für bestimmte Updates)
    if (existingOrderItem.order.status !== 'OPEN' && quantity !== undefined) {
      return res.status(400).json({
        success: false,
        error: 'Menge kann nur bei offenen Bestellungen geändert werden'
      });
    }

    const updateData: any = {};

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

    const updatedOrderItem = await prisma.orderItem.update({
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

  } catch (error) {
    console.error('Update OrderItem Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const deleteOrderItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'OrderItem-ID ist erforderlich'
      });
    }

    // Prüfen ob OrderItem existiert
    const existingOrderItem = await prisma.orderItem.findUnique({
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

    // Prüfen ob Bestellung noch offen ist
    if (existingOrderItem.order.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: 'Artikel können nur aus offenen Bestellungen entfernt werden'
      });
    }

    await prisma.orderItem.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Bestellartikel erfolgreich entfernt'
    });

  } catch (error) {
    console.error('Delete OrderItem Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const getKitchenItems = async (req: AuthRequest, res: Response) => {
  try {
    // Alle Artikel die in der Küche zubereitet werden müssen
    const kitchenItems = await prisma.orderItem.findMany({
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
        { status: 'asc' }, // ORDERED vor PREPARING
        { id: 'asc' }     // Älteste zuerst
      ]
    });

    res.json({
      success: true,
      data: kitchenItems
    });

  } catch (error) {
    console.error('Get Kitchen Items Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const startPreparation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'OrderItem-ID ist erforderlich'
      });
    }

    // Prüfen ob OrderItem existiert und den Status ORDERED hat
    const orderItem = await prisma.orderItem.findUnique({
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

    const updatedOrderItem = await prisma.orderItem.update({
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

  } catch (error) {
    console.error('Start Preparation Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const markReady = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'OrderItem-ID ist erforderlich'
      });
    }

    // Prüfen ob OrderItem existiert und den Status PREPARING hat
    const orderItem = await prisma.orderItem.findUnique({
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

    const updatedOrderItem = await prisma.orderItem.update({
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

  } catch (error) {
    console.error('Mark Ready Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
}; 