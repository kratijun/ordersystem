'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { usersApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ProtectedRoute from '@/components/protected-route'
import { 
  Users, 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Search,
  UserCheck,
  Shield,
  Calendar,
  Activity
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

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  
  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    password: '',
    role: 'WAITER'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    // Filter users based on search term
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [users, searchTerm])

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

  const handleCreateUser = async () => {
    try {
      const response = await usersApi.create(newUser)
      if (response.success) {
        setNewUser({ name: '', password: '', role: 'WAITER' })
        setShowAddModal(false)
        fetchUsers()
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const response = await usersApi.update(editingUser.id, {
        name: editingUser.name,
        role: editingUser.role
      })
      if (response.success) {
        setEditingUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
      return
    }

    try {
      const response = await usersApi.delete(userId)
      if (response.success) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error)
    }
  }

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
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
          <p className="text-gray-600">Benutzer werden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
            <p className="text-gray-600 mt-2">Verwalten Sie Benutzer und deren Rollen</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Neuer Benutzer
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Benutzer</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administratoren</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(user => user.role === 'ADMIN').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kellner</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(user => user.role === 'WAITER').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive Benutzer</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Alle Benutzer</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Benutzer suchen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nach Name oder Rolle suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Benutzer</CardTitle>
            <CardDescription>
              Übersicht aller registrierten Benutzer im System
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
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {editingUser?.id === user.id ? (
                        <Input
                          value={editingUser.name}
                          onChange={(e) => setEditingUser({
                            ...editingUser,
                            name: e.target.value
                          })}
                        />
                      ) : (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUser?.id === user.id ? (
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({
                            ...editingUser,
                            role: e.target.value
                          })}
                          className="border rounded px-2 py-1"
                        >
                          <option value="ADMIN">Administrator</option>
                          <option value="WAITER">Kellner</option>
                        </select>
                      ) : (
                        getRoleBadge(user.role)
                      )}
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
                      <div className="flex space-x-2">
                        {editingUser?.id === user.id ? (
                          <>
                            <Button size="sm" onClick={handleUpdateUser}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingUser(user)}
                              disabled={user.id === currentUser?.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* New User Modal */}
        {showAddModal && (
          <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <CardHeader>
                <CardTitle>Neuen Benutzer hinzufügen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        name: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPasswords.new ? "text" : "password"}
                        value={newUser.password}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          password: e.target.value
                        })}
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
                    <Label htmlFor="role">Rolle</Label>
                    <select
                      id="role"
                      value={newUser.role}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        role: e.target.value
                      })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="WAITER">Kellner</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-2 mt-6">
                  <Button onClick={handleCreateUser}>Erstellen</Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
} 