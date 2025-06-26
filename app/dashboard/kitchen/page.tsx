'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChefHat, 
  Clock, 
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

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

export default function KitchenPage() {
  const { data: session } = useSession()
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrderItems()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrderItems, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrderItems = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const orders = await response.json()
        
        // Extract all order items from open orders
        const allOrderItems: OrderItem[] = []
        orders.forEach((order: any) => {
          if (order.status === 'OPEN') {
            order.items.forEach((item: any) => {
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
      console.error('Fehler beim Laden der Bestellungen:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/order-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchOrderItems()
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Artikelstatus:', error)
    }
  }

  const getStatusBadge = (status: string) => {
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

  const getCategoryColor = (category: string) => {
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

  const getTimeSinceOrder = (createdAt: string) => {
    const now = new Date()
    const orderTime = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Gerade bestellt'
    if (diffInMinutes === 1) return '1 Minute'
    return `${diffInMinutes} Minuten`
  }

  const getUrgencyClass = (createdAt: string) => {
    const now = new Date()
    const orderTime = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes > 30) return 'bg-red-50 border-red-200'
    if (diffInMinutes > 15) return 'bg-orange-50 border-orange-200'
    return 'bg-white border-gray-200'
  }

  const groupedItems = orderItems.reduce((groups, item) => {
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
        <Button onClick={fetchOrderItems} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Aktualisieren
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-gray-600" />
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
                <p className="text-sm font-medium">Wartend</p>
                <p className="text-2xl font-bold">{stats.ordered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-5 w-5 text-orange-600" />
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

      {/* Orders */}
      {Object.keys(groupedItems).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine offenen Bestellungen</h3>
            <p className="text-gray-600">Alle Bestellungen sind abgearbeitet!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.values(groupedItems).map((group: any) => (
            <Card 
              key={group.orderId} 
              className={`border-l-4 ${getUrgencyClass(group.createdAt)}`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Tisch {group.tableNumber}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {getTimeSinceOrder(group.createdAt)}
                  </Badge>
                </div>
                <CardDescription>
                  Kellner: {group.userName} • {new Date(group.createdAt).toLocaleTimeString('de-DE')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.items.map((item: OrderItem) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-lg border-l-4 ${getCategoryColor(item.product.category)} bg-gray-50`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">
                            {item.quantity}x • {item.product.category}
                          </p>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      <div className="flex space-x-2 mt-2">
                        {item.status === 'ORDERED' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateItemStatus(item.id, 'PREPARING')}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Zubereitung starten
                          </Button>
                        )}
                        
                        {item.status === 'PREPARING' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateItemStatus(item.id, 'READY')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Als fertig markieren
                          </Button>
                        )}
                        
                        {item.status === 'READY' && (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Bereit zum Servieren
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 