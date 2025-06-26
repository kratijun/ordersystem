'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, RefreshCw } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  status: 'ORDERED' | 'CANCELLED' | 'PREPARED'
  product: {
    id: string
    name: string
    price: number
    category: string
  }
  order: {
    id: string
    table: {
      number: number
    }
    createdAt: string
  }
}

export default function KitchenPage() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchOrderItems()
    
    // Aktualisiere alle 10 Sekunden
    const interval = setInterval(fetchOrderItems, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrderItems = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const orders = await response.json()
        
        // Extrahiere alle Bestellpositionen aus offenen Bestellungen
        const allOrderItems: OrderItem[] = []
        orders
          .filter((order: any) => order.status === 'OPEN')
          .forEach((order: any) => {
            order.items
              .filter((item: any) => item.status === 'ORDERED')
              .forEach((item: any) => {
                allOrderItems.push({
                  ...item,
                  order: {
                    id: order.id,
                    table: order.table,
                    createdAt: order.createdAt
                  }
                })
              })
          })
        
        // Sortiere nach Erstellungszeit (älteste zuerst)
        allOrderItems.sort((a, b) => 
          new Date(a.order.createdAt).getTime() - new Date(b.order.createdAt).getTime()
        )
        
        setOrderItems(allOrderItems)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bestellpositionen:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsPrepared = async (itemId: string) => {
    setIsUpdating(itemId)
    try {
      const response = await fetch(`/api/order-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PREPARED' }),
      })

      if (response.ok) {
        fetchOrderItems()
      }
    } catch (error) {
      console.error('Fehler beim Markieren als zubereitet:', error)
    } finally {
      setIsUpdating(null)
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

  const getUrgencyColor = (createdAt: string) => {
    const now = new Date()
    const orderTime = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 5) return 'bg-green-100 border-green-200'
    if (diffInMinutes < 15) return 'bg-yellow-100 border-yellow-200'
    return 'bg-red-100 border-red-200'
  }

  const groupedItems = orderItems.reduce((groups, item) => {
    const tableNumber = item.order.table.number
    if (!groups[tableNumber]) {
      groups[tableNumber] = []
    }
    groups[tableNumber].push(item)
    return groups
  }, {} as Record<number, OrderItem[]>)

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Küchen-Ansicht</h1>
          <p className="text-gray-600">
            {orderItems.length} offene Bestellpositionen
          </p>
        </div>
        <Button onClick={fetchOrderItems} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {orderItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Alle Bestellungen abgearbeitet!</h2>
            <p className="text-gray-600">Derzeit gibt es keine offenen Bestellpositionen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([tableNumber, items]) => (
              <Card key={tableNumber} className={`border-2 ${getUrgencyColor(items[0].order.createdAt)}`}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">
                      Tisch {tableNumber}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {getTimeSinceOrder(items[0].order.createdAt)}
                      </Badge>
                      <Badge variant="secondary">
                        {items.length} Artikel
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <Card key={item.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{item.product.name}</h4>
                              <p className="text-sm text-gray-600">{item.product.category}</p>
                            </div>
                            <Badge variant="outline">
                              {item.quantity}x
                            </Badge>
                          </div>
                          <Button
                            onClick={() => markAsPrepared(item.id)}
                            disabled={isUpdating === item.id}
                            className="w-full"
                            size="sm"
                          >
                            {isUpdating === item.id ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Wird markiert...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Als zubereitet markieren
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Legende */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Legende</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span>Neue Bestellung (unter 5 Min.)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span>In Bearbeitung (5-15 Min.)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span>Dringend (über 15 Min.)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 