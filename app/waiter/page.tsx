'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Users, Clock, CheckCircle } from 'lucide-react'

interface Table {
  id: string
  number: number
  status: 'FREE' | 'OCCUPIED' | 'CLOSED'
  orders: Array<{
    id: string
    status: string
    items: Array<{
      id: string
      quantity: number
      product: { name: string; price: number }
    }>
  }>
}

export default function WaiterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'WAITER') {
      router.push('/login')
      return
    }

    fetchTables()
    
    // Aktualisiere alle 30 Sekunden
    const interval = setInterval(fetchTables, 30000)
    return () => clearInterval(interval)
  }, [session, status, router])

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables')
      if (response.ok) {
        const data = await response.json()
        setTables(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Tische:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'FREE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'OCCUPIED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CLOSED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTableStatusText = (status: string) => {
    switch (status) {
      case 'FREE':
        return 'Frei'
      case 'OCCUPIED':
        return 'Besetzt'
      case 'CLOSED':
        return 'Geschlossen'
      default:
        return 'Unbekannt'
    }
  }

  const getTableStatusIcon = (status: string) => {
    switch (status) {
      case 'FREE':
        return <CheckCircle className="h-6 w-6" />
      case 'OCCUPIED':
        return <Users className="h-6 w-6" />
      case 'CLOSED':
        return <Clock className="h-6 w-6" />
      default:
        return null
    }
  }

  const handleTableClick = (table: Table) => {
    if (table.status === 'FREE') {
      router.push(`/waiter/table/${table.id}/new-order`)
    } else if (table.status === 'OCCUPIED') {
      router.push(`/waiter/table/${table.id}`)
    }
  }

  if (status === 'loading' || isLoading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kellner Dashboard</h1>
          <p className="text-gray-600">Willkommen, {session?.user.name}</p>
        </div>
        <Button onClick={() => signOut()} variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          Abmelden
        </Button>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Freie Tische</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {tables.filter(table => table.status === 'FREE').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Besetzte Tische</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {tables.filter(table => table.status === 'OCCUPIED').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Geschlossene Tische</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {tables.filter(table => table.status === 'CLOSED').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tischübersicht */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => {
          const currentOrder = table.orders.find(order => order.status === 'OPEN')
          const orderTotal = currentOrder ? currentOrder.items.reduce((sum, item) => {
            return sum + (item.quantity * item.product.price)
          }, 0) : 0

          return (
            <Card
              key={table.id}
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${getTableStatusColor(table.status)}`}
              onClick={() => handleTableClick(table)}
            >
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center space-y-2">
                  {getTableStatusIcon(table.status)}
                  <h3 className="text-lg font-bold">Tisch {table.number}</h3>
                  <p className="text-sm font-medium">
                    {getTableStatusText(table.status)}
                  </p>
                  {currentOrder && (
                    <div className="text-xs space-y-1">
                      <p>{currentOrder.items.length} Artikel</p>
                      <p className="font-bold">€{orderTotal.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Anweisungen */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Anweisungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>🟢 <strong>Freie Tische:</strong> Klicken Sie, um eine neue Bestellung zu erstellen</p>
            <p>🟡 <strong>Besetzte Tische:</strong> Klicken Sie, um die aktuelle Bestellung zu verwalten</p>
            <p>🔴 <strong>Geschlossene Tische:</strong> Tisch ist vorübergehend nicht verfügbar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 