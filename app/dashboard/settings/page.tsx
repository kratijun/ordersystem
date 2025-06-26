'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Settings, 
  User, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  X,
  Shield,
  Users,
  Eye,
  EyeOff,
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Calendar,
  Euro,
  ShoppingCart,
  PieChart,
  Lock,
  UserCircle
} from 'lucide-react'

interface User {
  id: string
  name: string
  role: string
  createdAt: string
  _count?: {
    orders: number
  }
}

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

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Profile States
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (session?.user?.name) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || ''
      }))
    }
  }, [session])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      alert('Die neuen Passwörter stimmen nicht überein!')
      return
    }

    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        
        // Session mit neuem Namen aktualisieren
        await updateSession({ 
          name: updatedUser.name,
          role: updatedUser.role 
        })
        
        // Formular zurücksetzen
        setProfileData({
          name: updatedUser.name, // Aktualisierter Name
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // Benutzer-Liste neu laden für die Kontoinformationen
        await fetchUsers()
        
        alert('Profil erfolgreich aktualisiert!')
        
        // Kurze Verzögerung und dann Seite neu laden für vollständige Session-Aktualisierung
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Aktualisieren des Profils')
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Profils:', error)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Benutzereinstellungen</h1>
        <p className="text-gray-600 mt-2">
          Verwalten Sie Ihr Profil und persönliche Einstellungen.
        </p>
      </div>

      {/* Profile Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Profil bearbeiten
            </CardTitle>
            <CardDescription>
              Aktualisieren Sie Ihre persönlichen Informationen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="role">Rolle</Label>
              <Input
                id="role"
                value={session?.user?.role === 'ADMIN' ? 'Administrator' : 'Kellner'}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Passwort ändern
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleUpdateProfile} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Profil speichern
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Kontoinformationen
            </CardTitle>
            <CardDescription>
              Ihre aktuellen Kontoinformationen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Benutzername:</span>
              <span className="text-sm">{session?.user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Rolle:</span>
              <Badge variant={session?.user?.role === 'ADMIN' ? 'default' : 'secondary'}>
                {session?.user?.role === 'ADMIN' ? 'Administrator' : 'Kellner'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Registriert seit:</span>
              <span className="text-sm">
                {users.find(u => u.id === session?.user?.id)?.createdAt 
                  ? new Date(users.find(u => u.id === session?.user?.id)!.createdAt).toLocaleDateString('de-DE')
                  : 'Unbekannt'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Systemeinstellungen
          </CardTitle>
          <CardDescription>Allgemeine Systemkonfiguration und Informationen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Systemstatus</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">System Version:</span>
                  <span className="text-sm">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Datenbank:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Verbunden</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Letzte Aktualisierung:</span>
                  <span className="text-sm">{new Date().toLocaleDateString('de-DE')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Hilfe & Support</h4>
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Schnellstart:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Neue Bestellungen über "Tischübersicht" erstellen</li>
                  <li>• Bestellungen in der "Küche" verwalten</li>
                  <li>• Zahlungen über "Bestellungen" abwickeln</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}