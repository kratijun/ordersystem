'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Eye, 
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { ordersApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ProtectedRoute from '@/components/protected-route'

interface Order {
  id: string
  status: string
  total: number
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
    }
  }>
}

export default function OrdersPage(): React.ReactElement {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filterOrders = useCallback(() => {
    return orders.filter(order => {
      const matchesSearch = order.table.number.toString().includes(searchTerm) ||
                           order.user.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, searchTerm, statusFilter])

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [filterOrders])

  const loadOrders = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await ordersApi.getAll()
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setOrders((response as unknown as { data: Order[] }).data || [])
      } else {
        // Mock-Daten für Entwicklung
        const mockOrders: Order[] = [
          {
            id: '1',
            status: 'OPEN',
            total: 45.50,
            createdAt: new Date().toISOString(),
            table: { number: 5 },
            user: { name: 'Max Mustermann' },
            items: [
              {
                id: '1',
                quantity: 2,
                product: { name: 'Schnitzel', price: 18.50 }
              },
              {
                id: '2',
                quantity: 1,
                product: { name: 'Pommes', price: 8.50 }
              }
            ]
          }
        ]
        setOrders(mockOrders)
      }
    } catch (error) {
      // Fehler beim Laden der Bestellungen
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string): Promise<void> => {
    try {
      const response = await ordersApi.updateStatus(orderId, newStatus)
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        )
      }
    } catch (error) {
      // Fehler beim Aktualisieren des Status
    }
  }

  const deleteOrder = async (orderId: string): Promise<void> => {
    const confirmed = window.confirm('Möchten Sie diese Bestellung wirklich löschen?')
    if (!confirmed) {
      return
    }

    try {
      const response = await ordersApi.delete(orderId)
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setOrders(prev => prev.filter(order => order.id !== orderId))
      }
    } catch (error) {
      // Fehler beim Löschen der Bestellung
    }
  }

  const getStatusBadge = (status: string): React.ReactElement => {
    const statusConfig = {
      OPEN: { label: 'Offen', variant: 'secondary' as const, icon: Clock },
      PREPARING: { label: 'In Zubereitung', variant: 'default' as const, icon: Clock },
      READY: { label: 'Bereit', variant: 'outline' as const, icon: CheckCircle },
      PAID: { label: 'Bezahlt', variant: 'outline' as const, icon: CheckCircle },
      CANCELLED: { label: 'Storniert', variant: 'outline' as const, icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OPEN
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTimeAgo = (dateString: string): string => {
    const now = new Date()
    const orderTime = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'Gerade eben'
    }
    if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} Min`
    }
    const hours = Math.floor(diffInMinutes / 60)
    return `vor ${hours}h ${diffInMinutes % 60}m`
  }

  const filteredOrders = filterOrders()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Bestellungen...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-8 w-8" />
              Bestellungen
            </h1>
            <p className="text-gray-600">
              Übersicht aller Bestellungen
            </p>
          </div>
          
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Neue Bestellung
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Nach Tisch oder Kellner suchen..."
                value={searchTerm}
                onChange={(e): void => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={(): void => setStatusFilter('all')}
              size="sm"
            >
              Alle ({orders.length})
            </Button>
            <Button
              variant={statusFilter === 'OPEN' ? 'default' : 'outline'}
              onClick={(): void => setStatusFilter('OPEN')}
              size="sm"
            >
              Offen ({orders.filter(o => o.status === 'OPEN').length})
            </Button>
            <Button
              variant={statusFilter === 'PAID' ? 'default' : 'outline'}
              onClick={(): void => setStatusFilter('PAID')}
              size="sm"
            >
              Bezahlt ({orders.filter(o => o.status === 'PAID').length})
            </Button>
          </div>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Bestellungen gefunden</h3>
              <p className="text-gray-500 text-center">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Versuchen Sie andere Suchkriterien.'
                  : 'Es sind noch keine Bestellungen vorhanden.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CardTitle className="flex items-center gap-2">
                        Tisch {order.table.number}
                        <Badge variant="outline">#{order.id.slice(0, 8)}</Badge>
                      </CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {getTimeAgo(order.createdAt)}
                      </span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(): void => { void deleteOrder(order.id) }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <CardDescription>
                    Kellner: {order.user.name} • {order.items.length} Artikel • €{order.total.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.product.name}</span>
                        <span>€{(item.quantity * item.product.price).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-gray-500">
                        +{order.items.length - 3} weitere Artikel...
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    {order.status === 'OPEN' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(): void => { void updateOrderStatus(order.id, 'PREPARING') }}
                        >
                          In Zubereitung
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(): void => { void updateOrderStatus(order.id, 'PAID') }}
                        >
                          Als bezahlt markieren
                        </Button>
                      </>
                    )}
                    
                    {order.status === 'PREPARING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(): void => { void updateOrderStatus(order.id, 'READY') }}
                      >
                        Als bereit markieren
                      </Button>
                    )}
                    
                    {order.status === 'READY' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(): void => { void updateOrderStatus(order.id, 'PAID') }}
                      >
                        Als bezahlt markieren
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 