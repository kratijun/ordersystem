'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { productsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Filter
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  category: string
  _count?: {
    orderItems: number
  }
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: ''
  })

  const categories = ['Vorspeisen', 'Hauptgerichte', 'Desserts', 'Getränke', 'Alkohol']

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll()
      if (response.success) {
        setProducts(response.data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Produkte:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    setFilteredProducts(filtered)
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) return

    try {
      const response = await productsApi.create({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        category: newProduct.category
      })

      if (response.success) {
        setNewProduct({ name: '', price: '', category: '' })
        setShowAddForm(false)
        fetchProducts()
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Produkts:', error)
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct) return

    try {
      const response = await productsApi.update(editingProduct.id, {
        name: editingProduct.name,
        price: editingProduct.price,
        category: editingProduct.category
      })

      if (response.success) {
        setEditingProduct(null)
        fetchProducts()
      }
    } catch (error) {
      console.error('Fehler beim Bearbeiten des Produkts:', error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Produkt löschen möchten?')) {
      return
    }

    try {
      const response = await productsApi.delete(productId)

      if (response.success) {
        fetchProducts()
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Produkts:', error)
    }
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Vorspeisen':
        return 'bg-blue-100 text-blue-800'
      case 'Hauptgerichte':
        return 'bg-green-100 text-green-800'
      case 'Desserts':
        return 'bg-pink-100 text-pink-800'
      case 'Getränke':
        return 'bg-cyan-100 text-cyan-800'
      case 'Alkohol':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produktverwaltung</h1>
          <p className="text-gray-600 mt-2">
            Verwalten Sie Ihre Speisekarte und Getränke.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Produkt hinzufügen
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Produkte durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Kategorien</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Neues Produkt hinzufügen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="productName">Name</Label>
                <Input
                  id="productName"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="z.B. Schnitzel Wiener Art"
                />
              </div>
              <div>
                <Label htmlFor="productPrice">Preis (€)</Label>
                <Input
                  id="productPrice"
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="z.B. 12.50"
                />
              </div>
              <div>
                <Label htmlFor="productCategory">Kategorie</Label>
                <select
                  id="productCategory"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Kategorie wählen</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 space-x-2">
              <Button onClick={handleAddProduct}>
                Hinzufügen
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produkte ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead>Verkäufe</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {editingProduct?.id === product.id ? (
                      <Input
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      />
                    ) : (
                      <span className="font-medium">{product.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingProduct?.id === product.id ? (
                      <select
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="secondary" className={getCategoryBadgeColor(product.category)}>
                        {product.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingProduct?.id === product.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                      />
                    ) : (
                      <span className="font-semibold">€{product.price.toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {product._count?.orderItems || 0}x verkauft
                    </span>
                  </TableCell>
                  <TableCell>
                    {editingProduct?.id === product.id ? (
                      <div className="space-x-2">
                        <Button size="sm" onClick={handleEditProduct}>
                          Speichern
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingProduct(null)}>
                          Abbrechen
                        </Button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {categories.map(category => {
          const count = products.filter(p => p.category === category).length
          return (
            <Card key={category}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{category}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <Badge variant="secondary" className={getCategoryBadgeColor(category)}>
                    {category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 