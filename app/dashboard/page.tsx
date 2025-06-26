'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Table as TableIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface DashboardStats {
  totalTables: number
  occupiedTables: number
  totalProducts: number
  totalUsers: number
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  completedOrders: number
}

interface RecentOrder {
  id: string
  tableNumber: number
  userName: string
  status: string
  total: number
  createdAt: string
  itemCount: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [tablesRes, productsRes, usersRes, ordersRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/products'),
        fetch('/api/users'),
        fetch('/api/orders')
      ])

      const [tables, products, users, orders] = await Promise.all([
        tablesRes.json(),
        productsRes.json(),
        usersRes.json(),
        ordersRes.json()
      ])

      // Calculate statistics
      const occupiedTables = tables.filter((table: any) => table.status === 'OCCUPIED').length
      const today = new Date().toDateString()
      const todayOrders = orders.filter((order: any) => 
        new Date(order.createdAt).toDateString() === today
      )
      
      const todayRevenue = todayOrders.reduce((sum: number, order: any) => {
        return sum + order.items.reduce((itemSum: number, item: any) => {
          return itemSum + (item.quantity * item.product.price)
        }, 0)
      }, 0)

      const pendingOrders = orders.filter((order: any) => order.status === 'OPEN').length
      const completedOrders = orders.filter((order: any) => order.status === 'PAID').length

      setStats({
        totalTables: tables.length,
        occupiedTables,
        totalProducts: products.length,
        totalUsers: users.length,
        todayOrders: todayOrders.length,
        todayRevenue,
        pendingOrders,
        completedOrders
      })

      // Prepare recent orders
      const recent = orders
        .slice(0, 5)
        .map((order: any) => ({
          id: order.id,
          tableNumber: order.table.number,
          userName: order.user.name,
          status: order.status,
          total: order.items.reduce((sum: number, item: any) => {
            return sum + (item.quantity * item.product.price)
          }, 0),
          createdAt: order.createdAt,
          itemCount: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        }))

      setRecentOrders(recent)
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Willkommen, {session?.user.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Hier ist eine Übersicht über Ihr Restaurant heute.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tische Gesamt</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTables}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.occupiedTables} belegt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bestellungen Heute</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingOrders} offen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Umsatz Heute</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedOrders} abgeschlossen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produkte</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Verfügbare Artikel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Aktuelle Bestellungen
            </CardTitle>
            <CardDescription>
              Die letzten 5 Bestellungen in Ihrem Restaurant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Keine aktuellen Bestellungen
                </p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {order.tableNumber}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">Tisch {order.tableNumber}</p>
                        <p className="text-sm text-gray-600">
                          {order.userName} • {order.itemCount} Artikel
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">€{order.total.toFixed(2)}</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Schnellaktionen
            </CardTitle>
            <CardDescription>
              Häufig verwendete Funktionen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button 
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                onClick={() => window.location.href = '/dashboard/tables'}
              >
                <TableIcon className="h-6 w-6 text-blue-600 mb-2" />
                <p className="font-medium">Tische verwalten</p>
                <p className="text-sm text-gray-600">Status ändern</p>
              </button>

              <button 
                className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
                onClick={() => window.location.href = '/dashboard/orders'}
              >
                <ShoppingCart className="h-6 w-6 text-green-600 mb-2" />
                <p className="font-medium">Neue Bestellung</p>
                <p className="text-sm text-gray-600">Bestellung aufnehmen</p>
              </button>

              <button 
                className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors"
                onClick={() => window.location.href = '/dashboard/kitchen'}
              >
                <AlertCircle className="h-6 w-6 text-orange-600 mb-2" />
                <p className="font-medium">Küche</p>
                <p className="text-sm text-gray-600">Offene Bestellungen</p>
              </button>

              {session?.user.role === 'ADMIN' && (
                <button 
                  className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
                  onClick={() => window.location.href = '/dashboard/products'}
                >
                  <Package className="h-6 w-6 text-purple-600 mb-2" />
                  <p className="font-medium">Produkte</p>
                  <p className="text-sm text-gray-600">Speisekarte bearbeiten</p>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 