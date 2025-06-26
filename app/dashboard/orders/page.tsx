'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ShoppingCart, 
  Plus, 
  Eye,
  CreditCard,
  XCircle,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Trash2
} from 'lucide-react'

interface Order {
  id: string
  status: string
  createdAt: string
  table: {
    number: number
  }
  user: {
    name: string
  }
  items: Array<{
    id: string
    quantity: number
    status: string
    product: {
      name: string
      price: number
    }
  }>
}

interface Product {
  id: string
  name: string
  price: number
  category: string
}

interface Table {
  id: string
  number: number
  status: string
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewOrderForm, setShowNewOrderForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [newOrder, setNewOrder] = useState({
    tableId: '',
    items: [] as Array<{ productId: string; quantity: number }>
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter])

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, tablesRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/tables')
      ])

      const [ordersData, productsData, tablesData] = await Promise.all([
        ordersRes.json(),
        productsRes.json(),
        tablesRes.json()
      ])

      setOrders(ordersData)
      setProducts(productsData)
      setTables(tablesData)
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.table.number.toString().includes(searchTerm) ||
        order.user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Sort by creation date, newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredOrders(filtered)
  }

  const handleCreateOrder = async () => {
    if (!newOrder.tableId || newOrder.items.length === 0) return

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
      })

      if (response.ok) {
        setNewOrder({ tableId: '', items: [] })
        setShowNewOrderForm(false)
        fetchData()
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Bestellung:', error)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Bestellung:', error)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Bestellung löschen möchten?')) {
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Bestellung:', error)
    }
  }

  const addItemToNewOrder = (productId: string) => {
    const existingItem = newOrder.items.find(item => item.productId === productId)
    if (existingItem) {
      setNewOrder({
        ...newOrder,
        items: newOrder.items.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      })
    } else {
      setNewOrder({
        ...newOrder,
        items: [...newOrder.items, { productId, quantity: 1 }]
      })
    }
  }

  const removeItemFromNewOrder = (productId: string) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter(item => item.productId !== productId)
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Offen</Badge>
      case 'PAID':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Bezahlt</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Storniert</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const calculateOrderTotal = (order: Order) => {
    return order.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0)
  }

  const calculateNewOrderTotal = () => {
    return newOrder.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      return sum + (product ? product.price * item.quantity : 0)
    }, 0)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bestellungsverwaltung</h1>
          <p className="text-gray-600 mt-2">
            Verwalten Sie alle Bestellungen in Ihrem Restaurant.
          </p>
        </div>
        <Button onClick={() => setShowNewOrderForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Bestellung
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Nach Tisch oder Kellner suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Status</option>
            <option value="OPEN">Offen</option>
            <option value="PAID">Bezahlt</option>
            <option value="CANCELLED">Storniert</option>
          </select>
        </div>
      </div>

      {/* New Order Form */}
      {showNewOrderForm && (
        <Card>
          <CardHeader>
            <CardTitle>Neue Bestellung erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tableSelect">Tisch auswählen</Label>
                <select
                  id="tableSelect"
                  value={newOrder.tableId}
                  onChange={(e) => setNewOrder({ ...newOrder, tableId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tisch wählen</option>
                  {tables.filter(table => table.status === 'FREE' || table.status === 'OCCUPIED').map(table => (
                    <option key={table.id} value={table.id}>
                      Tisch {table.number} ({table.status === 'FREE' ? 'Frei' : 'Belegt'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Produkte hinzufügen</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 max-h-64 overflow-y-auto">
                  {products.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-gray-500 ml-2">€{product.price.toFixed(2)}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addItemToNewOrder(product.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {newOrder.items.length > 0 && (
                <div>
                  <Label>Ausgewählte Artikel</Label>
                  <div className="space-y-2 mt-2">
                    {newOrder.items.map(item => {
                      const product = products.find(p => p.id === item.productId)
                      return (
                        <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>{product?.name} x {item.quantity}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">€{((product?.price || 0) * item.quantity).toFixed(2)}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItemFromNewOrder(item.productId)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    <div className="text-right font-bold">
                      Gesamt: €{calculateNewOrderTotal().toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={handleCreateOrder} disabled={!newOrder.tableId || newOrder.items.length === 0}>
                  Bestellung erstellen
                </Button>
                <Button variant="outline" onClick={() => setShowNewOrderForm(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Bestellungen ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tisch</TableHead>
                <TableHead>Kellner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Artikel</TableHead>
                <TableHead>Gesamt</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <span className="font-medium">Tisch {order.table.number}</span>
                  </TableCell>
                  <TableCell>{order.user.name}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {order.items.length} Artikel ({order.items.reduce((sum, item) => sum + item.quantity, 0)} Stück)
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">€{calculateOrderTotal(order).toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString('de-DE')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === 'OPEN' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order.id, 'PAID')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Bestellungsdetails - Tisch {selectedOrder.table.number}</CardTitle>
              <CardDescription>
                Erstellt am {new Date(selectedOrder.createdAt).toLocaleString('de-DE')} von {selectedOrder.user.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Bestellte Artikel:</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.product.name}</span>
                          <span className="text-sm text-gray-600 ml-2">x {item.quantity}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">€{(item.quantity * item.product.price).toFixed(2)}</span>
                          <Badge variant="secondary" className="ml-2">
                            {item.status === 'ORDERED' ? 'Bestellt' : 
                             item.status === 'PREPARING' ? 'Zubereitung' : 
                             item.status === 'READY' ? 'Fertig' : item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Gesamtsumme:</span>
                    <span className="text-lg font-bold">€{calculateOrderTotal(selectedOrder).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span>Status:</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                    Schließen
                  </Button>
                  {selectedOrder.status === 'OPEN' && (
                    <>
                      <Button
                        onClick={() => {
                          handleUpdateOrderStatus(selectedOrder.id, 'PAID')
                          setSelectedOrder(null)
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Als bezahlt markieren
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleUpdateOrderStatus(selectedOrder.id, 'CANCELLED')
                          setSelectedOrder(null)
                        }}
                      >
                        Stornieren
                      </Button>
                    </>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteOrder(selectedOrder.id)
                      setSelectedOrder(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Offene Bestellungen</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'OPEN').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Bezahlte Bestellungen</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'PAID').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Stornierte Bestellungen</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'CANCELLED').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 