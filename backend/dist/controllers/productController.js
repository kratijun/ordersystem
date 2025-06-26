"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductCategories = exports.getProducts = void 0;
const database_1 = require("@/utils/database");
const getProducts = async (req, res) => {
    try {
        const { category, search } = req.query;
        const where = {};
        if (category) {
            where.category = category;
        }
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive'
            };
        }
        const products = await database_1.prisma.product.findMany({
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
    }
    catch (error) {
        console.error('Get Products Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.getProducts = getProducts;
const getProductCategories = async (req, res) => {
    try {
        const categories = await database_1.prisma.product.findMany({
            select: {
                category: true
            },
            distinct: ['category'],
            orderBy: {
                category: 'asc'
            }
        });
        const categoryList = categories.map(p => p.category);
        res.json({
            success: true,
            data: categoryList
        });
    }
    catch (error) {
        console.error('Get Categories Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.getProductCategories = getProductCategories;
const createProduct = async (req, res) => {
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
        const existingProduct = await database_1.prisma.product.findFirst({
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
        const product = await database_1.prisma.product.create({
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
    }
    catch (error) {
        console.error('Create Product Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, category } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Produkt-ID ist erforderlich'
            });
        }
        const existingProduct = await database_1.prisma.product.findUnique({
            where: { id }
        });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                error: 'Produkt nicht gefunden'
            });
        }
        const updateData = {};
        if (name && name.trim() !== existingProduct.name) {
            const nameExists = await database_1.prisma.product.findFirst({
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
        const updatedProduct = await database_1.prisma.product.update({
            where: { id },
            data: updateData
        });
        res.json({
            success: true,
            data: updatedProduct,
            message: 'Produkt erfolgreich aktualisiert'
        });
    }
    catch (error) {
        console.error('Update Product Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Produkt-ID ist erforderlich'
            });
        }
        const existingProduct = await database_1.prisma.product.findUnique({
            where: { id }
        });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                error: 'Produkt nicht gefunden'
            });
        }
        const activeOrderItems = await database_1.prisma.orderItem.findMany({
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
        await database_1.prisma.product.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Produkt erfolgreich gelöscht'
        });
    }
    catch (error) {
        console.error('Delete Product Fehler:', error);
        res.status(500).json({
            success: false,
            error: 'Interner Serverfehler'
        });
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=productController.js.map