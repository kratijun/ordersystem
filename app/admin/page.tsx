'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, LogOut } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  category: string
}

interface Order {
  id: string
  status: string
  createdAt: string
  table: { number: number }
  user: { name: string }
  items: Array<{
    id: string
    quantity: number
    product: { name: string; price: number }
  }>
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/login')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders')
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      })

      if (response.ok) {
        setNewProduct({ name: '', price: '', category: '' })
        setShowAddProduct(false)
        fetchData()
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Produkts:', error)
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct) return

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingProduct),
      })

      if (response.ok) {
        setEditingProduct(null)
        fetchData()
      }
    } catch (error) {
      console.error('Fehler beim Bearbeiten des Produkts:', error)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Produkt löschen möchten?')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Produkts:', error)
    }
  }

  const calculateStatistics = () => {
    const totalOrders = orders.length
    const paidOrders = orders.filter(order => order.status === 'PAID').length
    const totalRevenue = orders
      .filter(order => order.status === 'PAID')
      .reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => {
          return itemSum + (item.quantity * item.product.price)
        }, 0)
      }, 0)

    return { totalOrders, paidOrders, totalRevenue }
  }

  if (status === 'loading' || isLoading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>
  }

  const stats = calculateStatistics()

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => signOut()} variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          Abmelden
        </Button>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Gesamte Bestellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bezahlte Bestellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.paidOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gesamtumsatz</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Produktverwaltung */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Produktverwaltung</CardTitle>
            <Button onClick={() => setShowAddProduct(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Produkt hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddProduct && (
            <div className="mb-4 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Neues Produkt</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Preis</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Kategorie</Label>
                  <Input
                    id="category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4 space-x-2">
                <Button onClick={handleAddProduct}>Hinzufügen</Button>
                <Button variant="outline" onClick={() => setShowAddProduct(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {editingProduct?.id === product.id ? (
                      <Input
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      />
                    ) : (
                      product.name
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
                      `€${product.price.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingProduct?.id === product.id ? (
                      <Input
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      />
                    ) : (
                      product.category
                    )}
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
                        <Button size="sm" variant="outline" onClick={() => setEditingProduct(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
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

      {/* Bestellungsübersicht */}
      <Card>
        <CardHeader>
          <CardTitle>Aktuelle Bestellungen</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tisch</TableHead>
                <TableHead>Kellner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead>Gesamtsumme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 10).map((order) => {
                const total = order.items.reduce((sum, item) => {
                  return sum + (item.quantity * item.product.price)
                }, 0)

                return (
                  <TableRow key={order.id}>
                    <TableCell>Tisch {order.table.number}</TableCell>
                    <TableCell>{order.user.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        order.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'PAID' ? 'Bezahlt' :
                         order.status === 'OPEN' ? 'Offen' : 'Storniert'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleString('de-DE')}
                    </TableCell>
                    <TableCell>€{total.toFixed(2)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}