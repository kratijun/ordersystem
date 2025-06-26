'use client'

import React, { useState, useEffect } from 'react'
import { 
  ChefHat, 
  Clock, 
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { ordersApi, orderItemsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface OrderItem {
  id: string
  quantity: number
  status: string
  product: {
    name: string
    category: string
  }
  order: {
    id: string
    createdAt: string
    table: {
      number: number
    }
    user: {
      name: string
    }
  }
}

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
  items: OrderItem[]
}

export default function KitchenPage(): React.ReactElement {
  const { user } = useAuth()
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrderItems()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrderItems, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrderItems = async (): Promise<void> => {
    try {
      const response = await ordersApi.getAll()
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        const orders = (response as unknown as { data: Order[] }).data || []
        
        // Extract all order items from open orders
        const allOrderItems: OrderItem[] = []
        orders.forEach((order: Order) => {
          if (order.status === 'OPEN') {
            (order.items || []).forEach((item: OrderItem) => {
              allOrderItems.push({
                ...item,
                order: {
                  id: order.id,
                  createdAt: order.createdAt,
                  table: order.table,
                  user: order.user
                }
              })
            })
          }
        })

        // Sort by creation time (oldest first)
        allOrderItems.sort((a, b) => 
          new Date(a.order.createdAt).getTime() - new Date(b.order.createdAt).getTime()
        )

        setOrderItems(allOrderItems)
      }
    } catch (error) {
      // Fehler beim Laden der Bestellungen
      setOrderItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateItemStatus = async (itemId: string, newStatus: string): Promise<void> => {
    try {
      const response = await orderItemsApi.updateStatus(itemId, newStatus)

      if (response && typeof response === 'object' && 'success' in response && response.success) {
        void fetchOrderItems()
      }
    } catch (error) {
      // Fehler beim Aktualisieren des Artikelstatus
    }
  }

  const getStatusBadge = (status: string): React.ReactElement => {
    switch (status) {
      case 'ORDERED':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Bestellt</Badge>
      case 'PREPARING':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">In Zubereitung</Badge>
      case 'READY':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Fertig</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Vorspeisen':
        return 'border-l-blue-500'
      case 'Hauptgerichte':
        return 'border-l-green-500'
      case 'Desserts':
        return 'border-l-pink-500'
      case 'Getränke':
        return 'border-l-cyan-500'
      case 'Alkohol':
        return 'border-l-purple-500'
      default:
        return 'border-l-gray-500'
    }
  }

  const getTimeSinceOrder = (createdAt: string): string => {
    const now = new Date()
    const orderTime = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'Gerade bestellt'
    }
    if (diffInMinutes === 1) {
      return '1 Minute'
    }
    return `${diffInMinutes} Minuten`
  }

  const getUrgencyClass = (createdAt: string): string => {
    const now = new Date()
    const orderTime = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes > 30) {
      return 'bg-red-50 border-red-200'
    }
    if (diffInMinutes > 15) {
      return 'bg-orange-50 border-orange-200'
    }
    return 'bg-white border-gray-200'
  }

  const groupedItems = orderItems.reduce((groups: Record<string, { orderId: string; tableNumber: number; userName: string; createdAt: string; items: OrderItem[] }>, item) => {
    const key = `${item.order.id}-${item.order.table.number}`
    if (!groups[key]) {
      groups[key] = {
        orderId: item.order.id,
        tableNumber: item.order.table.number,
        userName: item.order.user.name,
        createdAt: item.order.createdAt,
        items: []
      }
    }
    groups[key].items.push(item)
    return groups
  }, {} as Record<string, any>)

  const stats = {
    total: orderItems.length,
    ordered: orderItems.filter(item => item.status === 'ORDERED').length,
    preparing: orderItems.filter(item => item.status === 'PREPARING').length,
    ready: orderItems.filter(item => item.status === 'READY').length
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Küche</h1>
            <p className="text-gray-600 mt-2">
              Übersicht über alle zu bereitenden Bestellungen.
            </p>
          </div>
          <Button onClick={(): void => { void fetchOrderItems() }} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Gesamt Artikel</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Bestellt</p>
                  <p className="text-2xl font-bold">{stats.ordered}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">In Zubereitung</p>
                  <p className="text-2xl font-bold">{stats.preparing}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Fertig</p>
                  <p className="text-2xl font-bold">{stats.ready}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        {Object.keys(groupedItems).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine offenen Bestellungen</h3>
              <p className="text-gray-600">Alle Bestellungen sind abgearbeitet!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.values(groupedItems).map((group) => (
              <Card key={`${group.orderId}-${group.tableNumber}`} className={`border-l-4 ${getUrgencyClass(group.createdAt)}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Tisch {group.tableNumber}</CardTitle>
                      <CardDescription>
                        Bestellt von {group.userName} • {getTimeSinceOrder(group.createdAt)} her
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {group.items.length} Artikel
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.items.map((item: OrderItem) => (
                    <div key={item.id} className={`p-3 rounded-lg border-l-4 ${getCategoryColor(item.product.category)} bg-gray-50`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">
                            {item.product.category} • Menge: {item.quantity}
                          </p>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      <div className="flex space-x-2 mt-3">
                        {item.status === 'ORDERED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(): void => { void handleUpdateItemStatus(item.id, 'PREPARING') }}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Zubereitung starten
                          </Button>
                        )}
                        
                        {item.status === 'PREPARING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(): void => { void handleUpdateItemStatus(item.id, 'READY') }}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Fertig melden
                          </Button>
                        )}
                        
                        {item.status === 'READY' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Bereit zum Servieren
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
  )
} 