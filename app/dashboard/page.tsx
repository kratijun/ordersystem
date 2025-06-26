'use client'

import React, { useState, useEffect } from 'react'
import { 
  LayoutGrid, 
  ChefHat, 
  ShoppingCart, 
  Package, 
  BarChart3,
  TrendingUp,
  Clock
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Types
interface DashboardStats {
  totalTables: number
  occupiedTables: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  topProducts: Array<{ name: string; quantity: number }>
}

interface RecentOrder {
  id: string
  tableNumber: number
  items: number
  total: number
  status: string
  createdAt: string
}

export default function DashboardPage(): React.ReactElement {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalTables: 0,
    occupiedTables: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    topProducts: []
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async (): Promise<void> => {
    try {
      setLoading(true)
      
      // Simulierte Daten - später durch echte API-Calls ersetzen
      const mockStats: DashboardStats = {
        totalTables: 20,
        occupiedTables: 12,
        totalOrders: 45,
        pendingOrders: 8,
        totalRevenue: 1250.50,
        topProducts: [
          { name: 'Schnitzel Wiener Art', quantity: 12 },
          { name: 'Pizza Margherita', quantity: 8 },
          { name: 'Pasta Carbonara', quantity: 6 }
        ]
      }

      const mockOrders: RecentOrder[] = [
        {
          id: '1',
          tableNumber: 5,
          items: 3,
          total: 45.50,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          tableNumber: 12,
          items: 2,
          total: 28.00,
          status: 'PREPARING',
          createdAt: new Date().toISOString()
        }
      ]

      setStats(mockStats)
      setRecentOrders(mockOrders)
    } catch (error) {
      // Fehler beim Laden der Dashboard-Daten
      setStats({
        totalTables: 0,
        occupiedTables: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        topProducts: []
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string): React.ReactElement => {
    const statusConfig = {
      PENDING: { label: 'Wartend', variant: 'secondary' as const },
      PREPARING: { label: 'In Zubereitung', variant: 'default' as const },
      READY: { label: 'Bereit', variant: 'outline' as const },
      COMPLETED: { label: 'Abgeschlossen', variant: 'outline' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Willkommen zurück, {user?.name}! Hier ist eine Übersicht über Ihr Restaurant.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tische</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupiedTables}/{stats.totalTables}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.occupiedTables / stats.totalTables) * 100)}% belegt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bestellungen</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} wartend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Umsatz Heute</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +12% vs. gestern
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Küche</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Wartende Bestellungen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Neueste Bestellungen
            </CardTitle>
            <CardDescription>
              Die letzten Bestellungen im Überblick
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Tisch {order.tableNumber}</p>
                    <p className="text-sm text-gray-600">{order.items} Artikel • €{order.total.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Beliebte Gerichte
            </CardTitle>
            <CardDescription>
              Die meistbestellten Gerichte heute
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <Badge variant="outline">{product.quantity}x</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellzugriff</CardTitle>
          <CardDescription>
            Häufig verwendete Funktionen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <LayoutGrid className="h-6 w-6" />
              <span className="text-sm">Tische</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">Bestellungen</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <ChefHat className="h-6 w-6" />
              <span className="text-sm">Küche</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Statistiken</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 