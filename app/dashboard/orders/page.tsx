'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { ordersApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ProtectedRoute from '@/components/protected-route'
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle,
  XCircle,
  Euro,
  User,
  Calendar,
  RefreshCw,
  Eye
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
    product: {
      name: string
      price: number
      category: string
    }
  }>
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, statusFilter])

  const fetchOrders = async () => {
    try {
      const response = await ordersApi.getAll()
      if (response.success) {
        const ordersData = response.data || []
        // Sort by creation date, newest first
        ordersData.sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setOrders(ordersData)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter)
    }
    setFilteredOrders(filtered)
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await ordersApi.updateStatus(orderId, newStatus)
      if (response.success) {
        fetchOrders()
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null)
        }
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Bestellstatus:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Offen</Badge>
      case 'PAID':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Bezahlt</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Storniert</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const calculateOrderTotal = (order: Order) => {
    return (order.items || []).reduce((sum, item) => {
      return sum + (item.quantity * item.product.price)
    }, 0)
  }

  const getOrderStats = () => {
    const total = orders.length
    const open = orders.filter(order => order.status === 'OPEN').length
    const paid = orders.filter(order => order.status === 'PAID').length
    const cancelled = orders.filter(order => order.status === 'CANCELLED').length
    const totalRevenue = orders
      .filter(order => order.status === 'PAID')
      .reduce((sum, order) => sum + calculateOrderTotal(order), 0)

    return { total, open, paid, cancelled, totalRevenue }
  }

  const stats = getOrderStats()

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bestellungen</h1>
            <p className="text-gray-600 mt-2">
              Übersicht über alle Bestellungen im Restaurant
            </p>
          </div>
          <Button onClick={fetchOrders} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Gesamt</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Offen</p>
                  <p className="text-2xl font-bold">{stats.open}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Bezahlt</p>
                  <p className="text-2xl font-bold">{stats.paid}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Storniert</p>
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Euro className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Umsatz</p>
                  <p className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Alle Status</option>
                <option value="OPEN">Offen</option>
                <option value="PAID">Bezahlt</option>
                <option value="CANCELLED">Storniert</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bestellungen ({filteredOrders.length})</CardTitle>
            <CardDescription>
              Alle Bestellungen mit Details und Aktionen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bestellnummer</TableHead>
                  <TableHead>Tisch</TableHead>
                  <TableHead>Kellner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Artikel</TableHead>
                  <TableHead>Gesamt</TableHead>
                  <TableHead>Zeit</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {order.table?.number || 'N/A'}
                          </span>
                        </div>
                        <span>Tisch {order.table?.number || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{order.user?.name || 'Unbekannt'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {(order.items || []).reduce((sum, item) => sum + item.quantity, 0)} Artikel
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold">
                        €{calculateOrderTotal(order).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(order.createdAt).toLocaleString('de-DE')}</span>
                      </div>
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
                        
                        {order.status === 'OPEN' && user?.role === 'ADMIN' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateOrderStatus(order.id, 'PAID')}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              Als bezahlt markieren
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Stornieren
                            </Button>
                          </>
                        )}
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
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Bestelldetails</CardTitle>
                    <CardDescription>
                      Tisch {selectedOrder.table?.number} • {selectedOrder.user?.name}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(null)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Erstellt am</p>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedOrder.createdAt).toLocaleString('de-DE')}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Bestellte Artikel</h4>
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.product.category} • {item.quantity}x €{item.product.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-bold">
                          €{(item.quantity * item.product.price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Gesamtsumme:</span>
                    <span>€{calculateOrderTotal(selectedOrder).toFixed(2)}</span>
                  </div>
                </div>

                {selectedOrder.status === 'OPEN' && user?.role === 'ADMIN' && (
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PAID')}
                      className="flex-1"
                    >
                      Als bezahlt markieren
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CANCELLED')}
                      className="flex-1"
                    >
                      Stornieren
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 