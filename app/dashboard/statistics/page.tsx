'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  BarChart3, 
  Download, 
  FileText, 
  TrendingUp,
  Calendar,
  Euro,
  ShoppingCart,
  PieChart,
  RefreshCw
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
    quantity: number
    product: {
      name: string
      price: number
      category: string
    }
  }>
}

interface Product {
  id: string
  name: string
  price: number
  category: string
}

interface Statistics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  revenueByDay: Array<{
    date: string
    revenue: number
    orders: number
  }>
  categoryStats: Array<{
    category: string
    quantity: number
    revenue: number
  }>
}

export default function StatisticsPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Statistics States
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (orders.length > 0) {
      calculateStatistics()
    }
  }, [orders, products, dateRange])

  const fetchData = async () => {
    try {
      setIsRefreshing(true)
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products')
      ])

      const [ordersData, productsData] = await Promise.all([
        ordersRes.json(),
        productsRes.json()
      ])

      setOrders(ordersData)
      setProducts(productsData)
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const calculateStatistics = () => {
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
      return orderDate >= dateRange.from && orderDate <= dateRange.to
    })

    const paidOrders = filteredOrders.filter(order => order.status === 'PAID')
    const totalRevenue = paidOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => 
        itemSum + (item.quantity * item.product.price), 0), 0)

    // Top Products
    const productSales: { [key: string]: { quantity: number; revenue: number; name: string } } = {}
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.product.name]) {
          productSales[item.product.name] = { quantity: 0, revenue: 0, name: item.product.name }
        }
        productSales[item.product.name].quantity += item.quantity
        productSales[item.product.name].revenue += item.quantity * item.product.price
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Revenue by Day
    const revenueByDay: { [key: string]: { revenue: number; orders: number } } = {}
    paidOrders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      if (!revenueByDay[date]) {
        revenueByDay[date] = { revenue: 0, orders: 0 }
      }
      revenueByDay[date].revenue += order.items.reduce((sum, item) => 
        sum + (item.quantity * item.product.price), 0)
      revenueByDay[date].orders += 1
    })

    const revenueByDayArray = Object.entries(revenueByDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Category Stats
    const categoryStats: { [key: string]: { quantity: number; revenue: number } } = {}
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (!categoryStats[item.product.category]) {
          categoryStats[item.product.category] = { quantity: 0, revenue: 0 }
        }
        categoryStats[item.product.category].quantity += item.quantity
        categoryStats[item.product.category].revenue += item.quantity * item.product.price
      })
    })

    const categoryStatsArray = Object.entries(categoryStats)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue)

    setStatistics({
      totalOrders: paidOrders.length,
      totalRevenue,
      averageOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
      topProducts,
      revenueByDay: revenueByDayArray,
      categoryStats: categoryStatsArray
    })
  }

  const exportToPDF = async () => {
    if (!statistics) return

    try {
      const response = await fetch('/api/export/statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statistics,
          dateRange
        }),
      })

      if (response.ok) {
        const htmlContent = await response.text()
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(htmlContent)
          newWindow.document.close()
          // Der Browser öffnet automatisch den Druckdialog
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Exportieren der Statistiken')
      }
    } catch (error) {
      console.error('Fehler beim Exportieren:', error)
      alert('Fehler beim Exportieren der Statistiken')
    }
  }

  const exportToCSV = () => {
    if (!statistics) return

    const csvData = [
      ['Datum', 'Wochentag', 'Bestellungen', 'Umsatz', 'Durchschnitt pro Bestellung'],
      ...statistics.revenueByDay.map(day => [
        new Date(day.date).toLocaleDateString('de-DE'),
        new Date(day.date).toLocaleDateString('de-DE', { weekday: 'long' }),
        day.orders.toString(),
        day.revenue.toFixed(2),
        (day.revenue / day.orders).toFixed(2)
      ])
    ]

    // BOM für korrekte UTF-8 Darstellung in Excel
    const BOM = '\uFEFF'
    const csvContent = BOM + csvData.map(row => 
      row.map(cell => `"${cell}"`).join(';')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `umsatz-statistiken-${dateRange.from}-${dateRange.to}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const exportProductsToCSV = () => {
    if (!statistics) return

    const csvData = [
      ['Rang', 'Produkt', 'Verkaufte Menge', 'Umsatz (€)', 'Anteil am Gesamtumsatz (%)'],
      ...statistics.topProducts.map((product, index) => [
        (index + 1).toString(),
        product.name,
        product.quantity.toString(),
        product.revenue.toFixed(2),
        ((product.revenue / statistics.totalRevenue) * 100).toFixed(1)
      ])
    ]

    // BOM für korrekte UTF-8 Darstellung in Excel
    const BOM = '\uFEFF'
    const csvContent = BOM + csvData.map(row => 
      row.map(cell => `"${cell}"`).join(';')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `top-produkte-${dateRange.from}-${dateRange.to}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const exportCategoriesToCSV = () => {
    if (!statistics) return

    const csvData = [
      ['Kategorie', 'Verkaufte Menge', 'Umsatz (€)', 'Anteil am Gesamtumsatz (%)'],
      ...statistics.categoryStats.map(category => [
        category.category,
        category.quantity.toString(),
        category.revenue.toFixed(2),
        ((category.revenue / statistics.totalRevenue) * 100).toFixed(1)
      ])
    ]

    // BOM für korrekte UTF-8 Darstellung in Excel
    const BOM = '\uFEFF'
    const csvContent = BOM + csvData.map(row => 
      row.map(cell => `"${cell}"`).join(';')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kategorien-${dateRange.from}-${dateRange.to}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiken & Auswertungen</h1>
          <p className="text-gray-600 mt-2">
            Detaillierte Analysen und Berichte für Ihr Restaurant
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchData} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={!statistics}>
            <Download className="h-4 w-4 mr-2" />
            Umsatz CSV
          </Button>
          <Button onClick={exportToPDF} disabled={!statistics}>
            <FileText className="h-4 w-4 mr-2" />
            PDF Bericht
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Zeitraum auswählen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div>
              <Label htmlFor="dateFrom">Von</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Bis</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {statistics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bestellungen</p>
                    <p className="text-3xl font-bold text-gray-900">{statistics.totalOrders}</p>
                    <p className="text-sm text-gray-500">bezahlte Bestellungen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Euro className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gesamtumsatz</p>
                    <p className="text-3xl font-bold text-gray-900">€{statistics.totalRevenue.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">im ausgewählten Zeitraum</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ø Bestellwert</p>
                    <p className="text-3xl font-bold text-gray-900">€{statistics.averageOrderValue.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">pro Bestellung</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aktive Tage</p>
                    <p className="text-3xl font-bold text-gray-900">{statistics.revenueByDay.length}</p>
                    <p className="text-sm text-gray-500">mit Umsatz</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Top Produkte
                  </CardTitle>
                  <CardDescription>Die erfolgreichsten Produkte im ausgewählten Zeitraum</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportProductsToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Produkte CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rang</TableHead>
                    <TableHead>Produkt</TableHead>
                    <TableHead>Verkaufte Menge</TableHead>
                    <TableHead>Umsatz</TableHead>
                    <TableHead>Anteil am Gesamtumsatz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statistics.topProducts.map((product, index) => (
                    <TableRow key={product.name}>
                      <TableCell>
                        <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.quantity}x</TableCell>
                      <TableCell className="font-semibold">€{product.revenue.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(product.revenue / statistics.totalRevenue) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {((product.revenue / statistics.totalRevenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Revenue by Day */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Täglicher Umsatz
              </CardTitle>
              <CardDescription>Umsatzentwicklung über den ausgewählten Zeitraum</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Wochentag</TableHead>
                    <TableHead>Bestellungen</TableHead>
                    <TableHead>Umsatz</TableHead>
                    <TableHead>Ø pro Bestellung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statistics.revenueByDay.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">
                        {new Date(day.date).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        {new Date(day.date).toLocaleDateString('de-DE', { weekday: 'long' })}
                      </TableCell>
                      <TableCell>{day.orders}</TableCell>
                      <TableCell className="font-semibold">€{day.revenue.toFixed(2)}</TableCell>
                      <TableCell>€{(day.revenue / day.orders).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Category Stats */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Kategorien-Analyse
                  </CardTitle>
                  <CardDescription>Umsatz und Verkäufe nach Produktkategorien</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportCategoriesToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Kategorien CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Verkaufte Menge</TableHead>
                    <TableHead>Umsatz</TableHead>
                    <TableHead>Anteil am Gesamtumsatz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statistics.categoryStats.map((category) => (
                    <TableRow key={category.category}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                          <span className="font-medium">{category.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>{category.quantity}x</TableCell>
                      <TableCell className="font-semibold">€{category.revenue.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(category.revenue / statistics.totalRevenue) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {((category.revenue / statistics.totalRevenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 