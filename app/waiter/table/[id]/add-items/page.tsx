'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  category: string
}

interface OrderItem {
  productId: string
  quantity: number
  product: Product
}

export default function AddItemsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const tableId = params.id as string

  const [products, setProducts] = useState<Product[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Produkte:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const addToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setOrderItems([...orderItems, {
        productId: product.id,
        quantity: 1,
        product
      }])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter(item => item.productId !== productId))
    } else {
      setOrderItems(orderItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const getTotalPrice = () => {
    return orderItems.reduce((sum, item) => {
      return sum + (item.quantity * item.product.price)
    }, 0)
  }

  const submitAdditionalItems = async () => {
    if (orderItems.length === 0) {
      alert('Bitte fügen Sie mindestens ein Produkt hinzu.')
      return
    }

    setIsSubmitting(true)

    try {
      // Finde die aktuelle Bestellung für den Tisch
      const tablesResponse = await fetch('/api/tables')
      if (!tablesResponse.ok) {
        throw new Error('Fehler beim Laden der Tischdaten')
      }
      
      const tables = await tablesResponse.json()
      const currentTable = tables.find((t: any) => t.id === tableId)
      const currentOrder = currentTable?.orders.find((order: any) => order.status === 'OPEN')
      
      if (!currentOrder) {
        alert('Keine offene Bestellung für diesen Tisch gefunden.')
        return
      }

      // Füge die neuen Artikel zur bestehenden Bestellung hinzu
      const response = await fetch(`/api/orders/${currentOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        }),
      })

      if (response.ok) {
        router.push(`/waiter/table/${tableId}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Hinzufügen der Artikel')
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Artikel:', error)
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>
  }

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
        <h1 className="text-3xl font-bold">Artikel hinzufügen</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produktauswahl */}
        <div className="lg:col-span-2">
          {/* Kategorie-Filter */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'Alle' : category}
                </Button>
              ))}
            </div>
          </div>

          {/* Produktliste */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>
                    <p className="font-bold text-lg">€{product.price.toFixed(2)}</p>
                  </div>
                  <Button
                    onClick={() => addToOrder(product)}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Hinzufügen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Zusätzliche Artikel */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Zusätzliche Artikel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Keine Artikel ausgewählt
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {orderItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-600">
                            €{item.product.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold">Zusätzliche Kosten:</span>
                      <span className="font-bold text-lg">€{getTotalPrice().toFixed(2)}</span>
                    </div>
                    <Button
                      onClick={submitAdditionalItems}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? 'Wird hinzugefügt...' : 'Artikel hinzufügen'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 