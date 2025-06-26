'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Plus, CreditCard, X } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  status: 'ORDERED' | 'CANCELLED' | 'PREPARED'
  product: {
    id: string
    name: string
    price: number
  }
}

interface Order {
  id: string
  status: 'OPEN' | 'PAID' | 'CANCELLED'
  createdAt: string
  items: OrderItem[]
}

interface TableData {
  id: string
  number: number
  status: string
  orders: Order[]
}

export default function TableOrderPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const tableId = params.id as string

  const [table, setTable] = useState<TableData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchTableData()
  }, [tableId])

  const fetchTableData = async () => {
    try {
      const response = await fetch('/api/tables')
      if (response.ok) {
        const tables = await response.json()
        const currentTable = tables.find((t: TableData) => t.id === tableId)
        setTable(currentTable)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Tischdaten:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentOrder = table?.orders.find(order => order.status === 'OPEN')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ORDERED':
        return 'bg-yellow-100 text-yellow-800'
      case 'PREPARED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ORDERED':
        return 'Bestellt'
      case 'PREPARED':
        return 'Zubereitet'
      case 'CANCELLED':
        return 'Storniert'
      default:
        return status
    }
  }

  const cancelOrderItem = async (itemId: string) => {
    if (!confirm('Möchten Sie diesen Artikel wirklich stornieren?')) {
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/order-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (response.ok) {
        fetchTableData()
      }
    } catch (error) {
      console.error('Fehler beim Stornieren des Artikels:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const markOrderAsPaid = async () => {
    if (!currentOrder) return

    if (!confirm('Möchten Sie diese Bestellung als bezahlt markieren?')) {
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${currentOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PAID' }),
      })

      if (response.ok) {
        router.push('/waiter')
      }
    } catch (error) {
      console.error('Fehler beim Markieren als bezahlt:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const addMoreItems = () => {
    router.push(`/waiter/table/${tableId}/add-items`)
  }

  const calculateTotal = () => {
    if (!currentOrder) return 0
    return currentOrder.items
      .filter(item => item.status !== 'CANCELLED')
      .reduce((sum, item) => sum + (item.quantity * item.product.price), 0)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>
  }

  if (!table || !currentOrder) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Tisch {table?.number}</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Keine aktive Bestellung für diesen Tisch gefunden.</p>
            <Button 
              onClick={() => router.push(`/waiter/table/${tableId}/new-order`)}
              className="mt-4"
            >
              Neue Bestellung erstellen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tisch {table.number}</h1>
            <p className="text-gray-600">
              Bestellung vom {new Date(currentOrder.createdAt).toLocaleString('de-DE')}
            </p>
          </div>
        </div>
        <div className="space-x-2">
          <Button onClick={addMoreItems} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Artikel hinzufügen
          </Button>
          <Button onClick={markOrderAsPaid} disabled={isUpdating}>
            <CreditCard className="h-4 w-4 mr-2" />
            Als bezahlt markieren
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bestelldetails */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Bestellte Artikel</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artikel</TableHead>
                    <TableHead>Menge</TableHead>
                    <TableHead>Preis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentOrder.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>€{(item.quantity * item.product.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.status === 'ORDERED' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => cancelOrderItem(item.id)}
                            disabled={isUpdating}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Zusammenfassung */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Bestellzusammenfassung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Artikel gesamt:</span>
                  <span>{currentOrder.items.filter(item => item.status !== 'CANCELLED').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stornierte Artikel:</span>
                  <span>{currentOrder.items.filter(item => item.status === 'CANCELLED').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Zubereitete Artikel:</span>
                  <span>{currentOrder.items.filter(item => item.status === 'PREPARED').length}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Gesamtsumme:</span>
                  <span>€{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 