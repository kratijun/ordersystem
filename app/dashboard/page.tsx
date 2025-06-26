'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { tablesApi, productsApi, usersApi, ordersApi } from '@/lib/api'
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
  const { user } = useAuth()
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
        tablesApi.getAll(),
        productsApi.getAll(),
        usersApi.getAll(),
        ordersApi.getAll()
      ])

      const tables = tablesRes.data || []
      const products = productsRes.data || []
      const users = usersRes.data || []
      const orders = ordersRes.data || []

      // Calculate statistics
      const occupiedTables = tables.filter((table: any) => table.status === 'OCCUPIED').length
      const today = new Date().toDateString()
      const todayOrders = orders.filter((order: any) => 
        new Date(order.createdAt).toDateString() === today
      )
      
      const todayRevenue = todayOrders.reduce((sum: number, order: any) => {
        return sum + (order.items || []).reduce((itemSum: number, item: any) => {
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
          tableNumber: order.table?.number || 0,
          userName: order.user?.name || 'Unbekannt',
          status: order.status,
          total: (order.items || []).reduce((sum: number, item: any) => {
            return sum + (item.quantity * item.product.price)
          }, 0),
          createdAt: order.createdAt,
          itemCount: (order.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0)
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
          Willkommen, {user?.name}!
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
      <Card>
        <CardHeader>
          <CardTitle>Letzte Bestellungen</CardTitle>
          <CardDescription>
            Die 5 neuesten Bestellungen in Ihrem Restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Keine Bestellungen vorhanden</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <TableIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Tisch {order.tableNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.userName} • {order.itemCount} Artikel
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        €{order.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-orange-600" />
              Offene Bestellungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.pendingOrders}</div>
            <p className="text-sm text-gray-600">Benötigen Aufmerksamkeit</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              Abgeschlossen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completedOrders}</div>
            <p className="text-sm text-gray-600">Heute bezahlt</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-blue-600" />
              Belegte Tische
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.occupiedTables}</div>
            <p className="text-sm text-gray-600">Von {stats?.totalTables} Tischen</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 