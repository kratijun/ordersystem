'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { tablesApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table as TableIcon, 
  Plus, 
  Edit, 
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Phone,
  X
} from 'lucide-react'

interface Table {
  id: string
  number: number
  status: string
  reservationName?: string
  reservationPhone?: string
  reservationDate?: string
  reservationTime?: string
  reservationGuests?: number
  closedReason?: string
  _count?: {
    orders: number
  }
}

export default function TablesPage() {
  const { user } = useAuth()
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showReservationForm, setShowReservationForm] = useState<string | null>(null)
  const [showCloseForm, setShowCloseForm] = useState<string | null>(null)
  const [newTable, setNewTable] = useState({
    number: ''
  })
  const [reservationData, setReservationData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: 2
  })
  const [closeData, setCloseData] = useState({
    reason: ''
  })

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await tablesApi.getAll()
      if (response.success) {
        setTables(response.data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Tische:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTable = async () => {
    if (!newTable.number) return

    try {
      const response = await tablesApi.create({
        number: parseInt(newTable.number)
      })

      if (response.success) {
        setNewTable({ number: '' })
        setShowAddForm(false)
        fetchTables()
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Tisches:', error)
    }
  }

  const handleUpdateTableStatus = async (tableId: string, newStatus: string, additionalData = {}) => {
    try {
      const response = await tablesApi.update(tableId, { 
        status: newStatus,
        ...additionalData
      })

      if (response.success) {
        fetchTables()
        setShowReservationForm(null)
        setShowCloseForm(null)
        setReservationData({ name: '', phone: '', date: '', time: '', guests: 2 })
        setCloseData({ reason: '' })
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Tischstatus:', error)
    }
  }

  const handleReservation = async (tableId: string) => {
    if (!reservationData.name || !reservationData.date || !reservationData.time) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    await handleUpdateTableStatus(tableId, 'RESERVED', {
      reservationName: reservationData.name,
      reservationPhone: reservationData.phone,
      reservationDate: reservationData.date,
      reservationTime: reservationData.time,
      reservationGuests: reservationData.guests
    })
  }

  const handleCloseTable = async (tableId: string) => {
    if (!closeData.reason) {
      alert('Bitte geben Sie einen Grund für die Schließung an.')
      return
    }

    await handleUpdateTableStatus(tableId, 'CLOSED', {
      closedReason: closeData.reason,
      // Reservierungsdaten löschen
      reservationName: null,
      reservationPhone: null,
      reservationDate: null,
      reservationTime: null,
      reservationGuests: null
    })
  }

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Tisch löschen möchten?')) {
      return
    }

    try {
      const response = await tablesApi.delete(tableId)

      if (response.success) {
        fetchTables()
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Tisches:', error)
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
        return 'bg-green-50 border-green-200 hover:bg-green-100'
      case 'OCCUPIED':
        return 'bg-red-50 border-red-200 hover:bg-red-100'
      case 'RESERVED':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
      case 'CLOSED':
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return ''
    const dateObj = new Date(`${date}T${time}`)
    return dateObj.toLocaleString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tischverwaltung</h1>
          <p className="text-gray-600 mt-2">
            Verwalten Sie die Tische, Reservierungen und deren Status in Ihrem Restaurant.
          </p>
        </div>
        {user?.role === 'ADMIN' && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tisch hinzufügen
          </Button>
        )}
      </div>

      {/* Add Table Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Neuen Tisch hinzufügen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-4">
              <div>
                <Label htmlFor="tableNumber">Tischnummer</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  value={newTable.number}
                  onChange={(e) => setNewTable({ number: e.target.value })}
                  placeholder="z.B. 1"
                />
              </div>
              <Button onClick={handleAddTable}>
                Hinzufügen
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reservation Form */}
      {showReservationForm && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Tisch {tables.find(t => t.id === showReservationForm)?.number} reservieren</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowReservationForm(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reservationName">Name *</Label>
                <Input
                  id="reservationName"
                  value={reservationData.name}
                  onChange={(e) => setReservationData({ ...reservationData, name: e.target.value })}
                  placeholder="Name des Gastes"
                />
              </div>
              <div>
                <Label htmlFor="reservationPhone">Telefonnummer</Label>
                <Input
                  id="reservationPhone"
                  value={reservationData.phone}
                  onChange={(e) => setReservationData({ ...reservationData, phone: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="reservationDate">Datum *</Label>
                <Input
                  id="reservationDate"
                  type="date"
                  value={reservationData.date}
                  onChange={(e) => setReservationData({ ...reservationData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reservationTime">Uhrzeit *</Label>
                <Input
                  id="reservationTime"
                  type="time"
                  value={reservationData.time}
                  onChange={(e) => setReservationData({ ...reservationData, time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reservationGuests">Anzahl Gäste</Label>
                <Input
                  id="reservationGuests"
                  type="number"
                  min="1"
                  max="20"
                  value={reservationData.guests}
                  onChange={(e) => setReservationData({ ...reservationData, guests: parseInt(e.target.value) || 2 })}
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button onClick={() => handleReservation(showReservationForm)}>
                <Calendar className="mr-2 h-4 w-4" />
                Reservierung bestätigen
              </Button>
              <Button variant="outline" onClick={() => setShowReservationForm(null)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Close Table Form */}
      {showCloseForm && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Tisch {tables.find(t => t.id === showCloseForm)?.number} schließen</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCloseForm(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="closeReason">Grund für Schließung *</Label>
              <Input
                id="closeReason"
                value={closeData.reason}
                onChange={(e) => setCloseData({ reason: e.target.value })}
                placeholder="z.B. Reparatur, Reinigung, defekter Stuhl..."
              />
            </div>
            <div className="flex space-x-2 mt-4">
              <Button onClick={() => handleCloseTable(showCloseForm)} variant="destructive">
                <XCircle className="mr-2 h-4 w-4" />
                Tisch schließen
              </Button>
              <Button variant="outline" onClick={() => setShowCloseForm(null)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table) => (
          <Card 
            key={table.id} 
            className={`transition-all duration-200 ${getStatusColor(table.status)} border-2`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <TableIcon className="h-5 w-5" />
                  <span className="font-bold text-lg">Tisch {table.number}</span>
                </div>
                {user?.role === 'ADMIN' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTable(table.id)}
                    className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {getStatusBadge(table.status)}
                
                {/* Reservation Details */}
                {table.status === 'RESERVED' && table.reservationName && (
                  <div className="bg-yellow-50 p-2 rounded-md border border-yellow-200">
                    <div className="flex items-center text-sm text-yellow-800 mb-1">
                      <User className="h-3 w-3 mr-1" />
                      <span className="font-medium">{table.reservationName}</span>
                    </div>
                    {table.reservationPhone && (
                      <div className="flex items-center text-xs text-yellow-700 mb-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {table.reservationPhone}
                      </div>
                    )}
                    {table.reservationDate && table.reservationTime && (
                      <div className="flex items-center text-xs text-yellow-700 mb-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDateTime(table.reservationDate, table.reservationTime)}
                      </div>
                    )}
                    {table.reservationGuests && (
                      <div className="flex items-center text-xs text-yellow-700">
                        <Users className="h-3 w-3 mr-1" />
                        {table.reservationGuests} Gäste
                      </div>
                    )}
                  </div>
                )}

                {/* Closed Reason */}
                {table.status === 'CLOSED' && table.closedReason && (
                  <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                    <div className="flex items-center text-sm text-gray-700">
                      <XCircle className="h-3 w-3 mr-1" />
                      <span className="text-xs">{table.closedReason}</span>
                    </div>
                  </div>
                )}

                {/* Active Orders */}
                {table._count && table._count.orders > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    {table._count.orders} Bestellung(en)
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                {/* Primary Actions */}
                <div className="flex flex-wrap gap-1">
                  {table.status !== 'FREE' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateTableStatus(table.id, 'FREE', {
                        reservationName: null,
                        reservationPhone: null,
                        reservationDate: null,
                        reservationTime: null,
                        reservationGuests: null,
                        closedReason: null
                      })}
                      className="text-xs h-7 px-2 bg-green-50 hover:bg-green-100 border-green-200"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Frei
                    </Button>
                  )}
                  {table.status !== 'OCCUPIED' && table.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateTableStatus(table.id, 'OCCUPIED')}
                      className="text-xs h-7 px-2 bg-red-50 hover:bg-red-100 border-red-200"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Belegt
                    </Button>
                  )}
                </div>

                {/* Secondary Actions */}
                <div className="flex flex-wrap gap-1">
                  {table.status !== 'RESERVED' && table.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowReservationForm(table.id)}
                      className="text-xs h-7 px-2 bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Reservieren
                    </Button>
                  )}
                  {table.status !== 'CLOSED' && user?.role === 'ADMIN' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCloseForm(table.id)}
                      className="text-xs h-7 px-2 bg-gray-50 hover:bg-gray-100 border-gray-200"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Schließen
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">
                Freie Tische: {tables.filter(t => t.status === 'FREE').length}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">
                Belegte Tische: {tables.filter(t => t.status === 'OCCUPIED').length}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium">
                Reservierte Tische: {tables.filter(t => t.status === 'RESERVED').length}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-sm font-medium">
                Geschlossene Tische: {tables.filter(t => t.status === 'CLOSED').length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 