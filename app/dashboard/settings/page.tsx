'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { usersApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ProtectedRoute from '@/components/protected-route'
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

export default function SettingsPage() {
  const { user: currentUser, updateUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Profile States
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
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
    if (currentUser?.role === 'ADMIN') {
      fetchUsers()
    } else {
      setIsLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser?.name) {
      setProfileData(prev => ({
        ...prev,
        name: currentUser.name || ''
      }))
    }
  }, [currentUser])

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getAll()
      if (response.success) {
        setUsers(response.data || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    if (!currentUser) return

    try {
      const updateData: any = {
        name: profileData.name
      }

      // Only include password if provided
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          alert('Die neuen Passwörter stimmen nicht überein!')
          return
        }
        updateData.password = profileData.newPassword
      }

      const response = await usersApi.update(currentUser.id, updateData)
      
      if (response.success) {
        // Update local user state
        updateUser({
          ...currentUser,
          name: profileData.name
        })
        
        // Clear password fields
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
        
        alert('Profil erfolgreich aktualisiert!')
      } else {
        alert('Fehler beim Aktualisieren des Profils')
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Profils:', error)
      alert('Fehler beim Aktualisieren des Profils')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('Sie können sich nicht selbst löschen!')
      return
    }

    if (!confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
      return
    }

    try {
      const response = await usersApi.delete(userId)
      if (response.success) {
        fetchUsers()
        alert('Benutzer erfolgreich gelöscht!')
      } else {
        alert('Fehler beim Löschen des Benutzers')
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error)
      alert('Fehler beim Löschen des Benutzers')
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Administrator</Badge>
      case 'WAITER':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Kellner</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Einstellungen werden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Einstellungen</h1>
            <p className="text-gray-600">Verwalten Sie Ihr Profil und Systemeinstellungen</p>
          </div>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <UserCircle className="h-5 w-5" />
              <CardTitle>Profil Einstellungen</CardTitle>
            </div>
            <CardDescription>
              Aktualisieren Sie Ihre persönlichen Informationen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Grundinformationen</h3>
                
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      name: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label>Rolle</Label>
                  <div className="mt-1">
                    {getRoleBadge(currentUser?.role || '')}
                  </div>
                </div>
              </div>

              {/* Password Change */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Passwort ändern</span>
                </h3>
                
                <div>
                  <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        currentPassword: e.target.value
                      })}
                      placeholder="Aktuelles Passwort eingeben"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        newPassword: e.target.value
                      })}
                      placeholder="Neues Passwort eingeben"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        confirmPassword: e.target.value
                      })}
                      placeholder="Neues Passwort bestätigen"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleProfileUpdate}>
                <Save className="mr-2 h-4 w-4" />
                Änderungen speichern
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Management - Only for Admins */}
        {currentUser?.role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <CardTitle>Benutzerverwaltung</CardTitle>
              </div>
              <CardDescription>
                Übersicht aller Benutzer im System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead>Bestellungen</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">
                            {user.name}
                            {user.id === currentUser?.id && (
                              <span className="text-xs text-green-600 ml-2">(Sie)</span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(user.createdAt).toLocaleDateString('de-DE')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {user._count?.orders || 0} Bestellungen
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.id !== currentUser?.id && (
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* System Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>System Information</CardTitle>
            </div>
            <CardDescription>
              Übersicht über das Orderman System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                <p className="text-sm text-gray-600">Registrierte Benutzer</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.role === 'ADMIN').length}
                </p>
                <p className="text-sm text-gray-600">Administratoren</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <UserCircle className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'WAITER').length}
                </p>
                <p className="text-sm text-gray-600">Kellner</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}