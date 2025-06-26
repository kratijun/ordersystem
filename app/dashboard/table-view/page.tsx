'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { tablesApi, productsApi, ordersApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table as TableIcon, 
  Users, 
  Plus,
  Minus,
  ShoppingCart,
  X,
  Check,
  Clock
} from 'lucide-react'

interface Table {
  id: string
  number: number
  status: string
  orders?: Order[]
}

interface Product {
  id: string
  name: string
  price: number
  category: string
}

interface Order {
  id: string
  status: string
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    product: {
      name: string
      price: number
    }
  }>
}

interface OrderItem {
  productId: string
  quantity: number
}

export default function TableViewPage() {
  const { user } = useAuth()
  const [tables, setTables] = useState<Table[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = ['Alle', 'Vorspeisen', 'Hauptgerichte', 'Desserts', 'Getränke', 'Alkohol']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tablesRes, productsRes] = await Promise.all([
        tablesApi.getAll(),
        productsApi.getAll()
      ])

      if (tablesRes && typeof tablesRes === 'object' && 'success' in tablesRes && tablesRes.success &&
          productsRes && typeof productsRes === 'object' && 'success' in productsRes && productsRes.success) {
        setTables((tablesRes as unknown as { data: Table[] }).data)
        setProducts((productsRes as unknown as { data: Product[] }).data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTableClick = (table: Table) => {
    setSelectedTable(table)
    setCurrentOrder([])
    
    // Wenn Tisch belegt ist, lade aktuelle Bestellungen
    if (table.status === 'OCCUPIED') {
      fetchTableOrders(table.id)
    }
  }

  const fetchTableOrders = async (tableId: string) => {
    try {
      const response = await ordersApi.getAll({ tableId })
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        // Hier könnten wir die aktuellen Bestellungen anzeigen
      }
    } catch (error) {
      console.error('Fehler beim Laden der Tischbestellungen:', error)
    }
  }

  const addToOrder = (productId: string) => {
    const existingItem = currentOrder.find(item => item.productId === productId)
    
    if (existingItem) {
      setCurrentOrder(currentOrder.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCurrentOrder([...currentOrder, { productId, quantity: 1 }])
    }
  }

  const removeFromOrder = (productId: string) => {
    const existingItem = currentOrder.find(item => item.productId === productId)
    
    if (existingItem && existingItem.quantity > 1) {
      setCurrentOrder(currentOrder.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ))
    } else {
      setCurrentOrder(currentOrder.filter(item => item.productId !== productId))
    }
  }

  const submitOrder = async () => {
    if (!selectedTable || currentOrder.length === 0) return

    try {
      // Erst Tisch auf OCCUPIED setzen
      await tablesApi.update(selectedTable.id, { status: 'OCCUPIED' })

      // Dann Bestellung erstellen
      const response = await ordersApi.create({
        tableId: selectedTable.id,
        items: currentOrder
      })

      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setCurrentOrder([])
        setSelectedTable(null)
        fetchData() // Daten neu laden
        alert('Bestellung erfolgreich aufgenommen!')
      }
    } catch (error) {
      console.error('Fehler beim Aufnehmen der Bestellung:', error)
      alert('Fehler beim Aufnehmen der Bestellung')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FREE':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Frei</Badge>
      case 'OCCUPIED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Belegt</Badge>
      case 'RESERVED':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Reserviert</Badge>
      case 'CLOSED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Geschlossen</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FREE':
        return 'bg-green-100 border-green-300 hover:bg-green-200'
      case 'OCCUPIED':
        return 'bg-red-100 border-red-300 hover:bg-red-200'
      case 'RESERVED':
        return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200'
      case 'CLOSED':
        return 'bg-gray-100 border-gray-300 hover:bg-gray-200'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === '' || selectedCategory === 'Alle' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const calculateTotal = () => {
    return currentOrder.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId)
      return total + (product ? product.price * item.quantity : 0)
    }, 0)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tischübersicht & Bestellungsaufnahme</h1>
        <p className="text-gray-600 mt-2">
          Klicken Sie auf einen Tisch, um eine Bestellung aufzunehmen.
        </p>
      </div>

      {!selectedTable ? (
        /* Tischübersicht */
        <div>
          <h2 className="text-xl font-semibold mb-4">Verfügbare Tische</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((table) => (
              <Card 
                key={table.id} 
                className={`cursor-pointer transition-all duration-200 ${getStatusColor(table.status)}`}
                onClick={() => handleTableClick(table)}
              >
                <CardContent className="p-4 text-center">
                  <TableIcon className="h-8 w-8 mx-auto mb-2" />
                  <h3 className="font-semibold text-lg">Tisch {table.number}</h3>
                  {getStatusBadge(table.status)}
                  {table.status === 'OCCUPIED' && (
                    <div className="mt-2 flex items-center justify-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Aktive Bestellung
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Bestellungsaufnahme */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Produktauswahl */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Bestellung für Tisch {selectedTable.number}</CardTitle>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTable(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Abbrechen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Suche und Filter */}
                <div className="flex space-x-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Produkt suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-48">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category === 'Alle' ? '' : category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Produktliste */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => {
                    const orderItem = currentOrder.find(item => item.productId === product.id)
                    
                    return (
                      <div key={product.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-600">{product.category}</p>
                            <p className="text-lg font-semibold text-blue-600">€{product.price.toFixed(2)}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {orderItem && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromOrder(product.id)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {orderItem.quantity}
                                </span>
                              </>
                            )}
                            <Button
                              size="sm"
                              onClick={() => addToOrder(product.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bestellungsübersicht */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Aktuelle Bestellung
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentOrder.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Keine Artikel ausgewählt
                  </p>
                ) : (
                  <div className="space-y-3">
                    {currentOrder.map((item) => {
                      const product = products.find(p => p.id === item.productId)
                      if (!product) return null
                      
                      return (
                        <div key={item.productId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              €{product.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">
                              €{(product.price * item.quantity).toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromOrder(item.productId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Gesamt:</span>
                        <span>€{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      onClick={submitOrder}
                      size="lg"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Bestellung aufnehmen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
} 