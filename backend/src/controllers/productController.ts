import { Response } from 'express';
import { prisma } from '@/utils/database';
import { AuthRequest } from '@/types';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { category, search } = req.query;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.name = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Get Products Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const getProductCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.product.findMany({
      select: {
        category: true
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc'
      }
    });

    const categoryList = categories.map((p: { category: string }) => p.category);

    res.json({
      success: true,
      data: categoryList
    });

  } catch (error) {
    console.error('Get Categories Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, category } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name, Preis und Kategorie sind erforderlich'
      });
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Preis muss eine positive Zahl sein'
      });
    }

    // Prüfen ob Produkt bereits existiert
    const existingProduct = await prisma.product.findFirst({
      where: { 
        name: name.trim(),
        category: category.trim()
      }
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'Produkt mit diesem Namen existiert bereits in der Kategorie'
      });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        price: parseFloat(price),
        category: category.trim()
      }
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Produkt erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Create Product Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, category } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Produkt-ID ist erforderlich'
      });
    }

    // Prüfen ob Produkt existiert
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nicht gefunden'
      });
    }

    // Update-Daten vorbereiten
    const updateData: any = {};

    if (name && name.trim() !== existingProduct.name) {
      // Prüfen ob neuer Name bereits in der Kategorie existiert
      const nameExists = await prisma.product.findFirst({
        where: { 
          name: name.trim(),
          category: category?.trim() || existingProduct.category,
          id: { not: id }
        }
      });

      if (nameExists) {
        return res.status(400).json({
          success: false,
          error: 'Produkt mit diesem Namen existiert bereits in der Kategorie'
        });
      }

      updateData.name = name.trim();
    }

    if (price !== undefined) {
      if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Preis muss eine positive Zahl sein'
        });
      }
      updateData.price = parseFloat(price);
    }

    if (category && category.trim() !== existingProduct.category) {
      updateData.category = category.trim();
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Produkt erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Update Product Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Produkt-ID ist erforderlich'
      });
    }

    // Prüfen ob Produkt existiert
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nicht gefunden'
      });
    }

    // Prüfen ob Produkt in aktiven Bestellungen verwendet wird
    const activeOrderItems = await prisma.orderItem.findMany({
      where: {
        productId: id,
        order: {
          status: 'OPEN'
        }
      }
    });

    if (activeOrderItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Produkt kann nicht gelöscht werden - wird in aktiven Bestellungen verwendet'
      });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Produkt erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Delete Product Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
}; 