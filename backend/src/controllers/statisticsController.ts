import { Response } from 'express';
import { prisma } from '@/utils/database';
import { AuthRequest } from '@/types';

export const getStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Datum-Filter vorbereiten
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Grundlegende Statistiken
    const [totalOrders, paidOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ 
        where: { 
          ...where, 
          status: 'PAID' 
        } 
      })
    ]);

    // Umsatz berechnen
    const paidOrdersWithItems = await prisma.order.findMany({
      where: { 
        ...where, 
        status: 'PAID' 
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    const totalRevenue = paidOrdersWithItems.reduce((sum, order) => {
      return sum + order.items.reduce((orderSum, item) => {
        return orderSum + (item.quantity * item.product.price);
      }, 0);
    }, 0);

    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

    // Top Produkte
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          ...where,
          status: 'PAID'
        }
      },
      include: {
        product: true
      }
    });

    const productStats = orderItems.reduce((acc, item) => {
      const productId = item.product.id;
      if (!acc[productId]) {
        acc[productId] = {
          name: item.product.name,
          category: item.product.category,
          quantity: 0,
          revenue: 0
        };
      }
      acc[productId].quantity += item.quantity;
      acc[productId].revenue += item.quantity * item.product.price;
      return acc;
    }, {} as any);

    const topProducts = Object.values(productStats)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 10);

    // Umsatz nach Tagen
    const dailyRevenue = await prisma.order.findMany({
      where: { 
        ...where, 
        status: 'PAID' 
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const revenueByDay = dailyRevenue.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      const orderRevenue = order.items.reduce((sum, item) => {
        return sum + (item.quantity * item.product.price);
      }, 0);

      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
          orders: 0
        };
      }
      acc[date].revenue += orderRevenue;
      acc[date].orders += 1;
      return acc;
    }, {} as any);

    // Kategorie-Statistiken
    const categoryStats = orderItems.reduce((acc, item) => {
      const category = item.product.category;
      if (!acc[category]) {
        acc[category] = {
          category,
          quantity: 0,
          revenue: 0
        };
      }
      acc[category].quantity += item.quantity;
      acc[category].revenue += item.quantity * item.product.price;
      return acc;
    }, {} as any);

    const statistics = {
      totalOrders,
      paidOrders,
      totalRevenue,
      averageOrderValue,
      topProducts,
      revenueByDay: Object.values(revenueByDay),
      categoryStats: Object.values(categoryStats).sort((a: any, b: any) => b.revenue - a.revenue)
    };

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Get Statistics Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const exportStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { format = 'json', type = 'overview', startDate, endDate } = req.query;

    // Datum-Filter vorbereiten
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    let data: any;

    switch (type) {
      case 'daily-revenue':
        const dailyOrders = await prisma.order.findMany({
          where: { 
            ...where, 
            status: 'PAID' 
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        });

        data = dailyOrders.reduce((acc, order) => {
          const date = order.createdAt.toISOString().split('T')[0];
          const orderRevenue = order.items.reduce((sum, item) => {
            return sum + (item.quantity * item.product.price);
          }, 0);

          if (!acc[date]) {
            acc[date] = {
              Datum: date,
              Umsatz: 0,
              Bestellungen: 0
            };
          }
          acc[date].Umsatz += orderRevenue;
          acc[date].Bestellungen += 1;
          return acc;
        }, {} as any);

        data = Object.values(data);
        break;

      case 'top-products':
        const orderItems = await prisma.orderItem.findMany({
          where: {
            order: {
              ...where,
              status: 'PAID'
            }
          },
          include: {
            product: true
          }
        });

        const productStats = orderItems.reduce((acc, item) => {
          const productId = item.product.id;
          if (!acc[productId]) {
            acc[productId] = {
              Produkt: item.product.name,
              Kategorie: item.product.category,
              Menge: 0,
              Umsatz: 0
            };
          }
          acc[productId].Menge += item.quantity;
          acc[productId].Umsatz += item.quantity * item.product.price;
          return acc;
        }, {} as any);

        data = Object.values(productStats)
          .sort((a: any, b: any) => b.Menge - a.Menge);
        break;

      case 'categories':
        const categoryItems = await prisma.orderItem.findMany({
          where: {
            order: {
              ...where,
              status: 'PAID'
            }
          },
          include: {
            product: true
          }
        });

        const categoryStats = categoryItems.reduce((acc, item) => {
          const category = item.product.category;
          if (!acc[category]) {
            acc[category] = {
              Kategorie: category,
              Menge: 0,
              Umsatz: 0
            };
          }
          acc[category].Menge += item.quantity;
          acc[category].Umsatz += item.quantity * item.product.price;
          return acc;
        }, {} as any);

        data = Object.values(categoryStats)
          .sort((a: any, b: any) => b.Umsatz - a.Umsatz);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Ungültiger Export-Typ'
        });
    }

    if (format === 'csv') {
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Keine Daten zum Exportieren'
        });
      }

      // CSV generieren
      const headers = Object.keys(data[0]);
      const csvContent = [
        '\uFEFF' + headers.join(';'), // BOM für Excel
        ...data.map(row => headers.map(header => row[header]).join(';'))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="statistiken-${type}-${Date.now()}.csv"`);
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data
      });
    }

  } catch (error) {
    console.error('Export Statistics Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
}; 