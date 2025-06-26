'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  
  // User Management States
  const [showNewUserModal, setShowNewUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    role: 'WAITER',
    password: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Sort by creation date, newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredUsers(filtered)
  }

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.password) {
      alert('Bitte füllen Sie alle Felder aus!')
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        setNewUser({ name: '', role: 'WAITER', password: '' })
        setShowNewUserModal(false)
        fetchUsers()
        alert('Benutzer erfolgreich erstellt!')
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Erstellen des Benutzers')
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error)
      alert('Fehler beim Erstellen des Benutzers')
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingUser.name,
          role: editingUser.role
        }),
      })

      if (response.ok) {
        setEditingUser(null)
        fetchUsers()
        alert('Benutzer erfolgreich aktualisiert!')
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Aktualisieren des Benutzers')
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error)
      alert('Fehler beim Aktualisieren des Benutzers')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === session?.user?.id) {
      alert('Sie können sich nicht selbst löschen!')
      return
    }

    if (!confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchUsers()
        alert('Benutzer erfolgreich gelöscht!')
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Löschen des Benutzers')
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error)
      alert('Fehler beim Löschen des Benutzers')
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Administrator</Badge>
      case 'WAITER':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Kellner</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const getOrderCount = (user: User) => {
    return user._count?.orders || 0
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
          <p className="text-gray-600 mt-2">
            Verwalten Sie alle Benutzer und deren Berechtigungen in Ihrem System.
          </p>
        </div>
        <Button onClick={() => setShowNewUserModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Benutzer
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Gesamte Benutzer</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Administratoren</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Kellner</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'WAITER').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Aktive heute</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Nach Benutzername suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Rollen</option>
            <option value="ADMIN">Administrator</option>
            <option value="WAITER">Kellner</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Benutzer ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Benutzer</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Bestellungen</TableHead>
                <TableHead>Registriert</TableHead>
                <TableHead>Status</TableHead>
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
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{user.name}</span>
                          {user.id === session?.user?.id && (
                            <span className="text-xs text-green-600 ml-2">(Sie)</span>
                          )}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingUser?.id === user.id ? (
                      <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ADMIN">Administrator</option>
                        <option value="WAITER">Kellner</option>
                      </select>
                    ) : (
                      getRoleBadge(user.role)
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm">{getOrderCount(user)} Bestellungen</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Aktiv
                    </Badge>
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
                            disabled={user.id === session?.user?.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.id !== session?.user?.id && (
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
      {showNewUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Neuen Benutzer erstellen
              </CardTitle>
              <CardDescription>
                Geben Sie die Benutzerdaten ein und wählen Sie die entsprechende Rolle aus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newUserName">Benutzername *</Label>
                <Input
                  id="newUserName"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="z.B. Max Mustermann"
                />
              </div>
              
              <div>
                <Label htmlFor="newUserRole">Rolle *</Label>
                <select
                  id="newUserRole"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WAITER">Kellner</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {newUser.role === 'ADMIN' 
                    ? 'Vollzugriff auf alle Funktionen und Einstellungen' 
                    : 'Zugriff auf Bestellverwaltung und Tischservice'
                  }
                </p>
              </div>

              <div>
                <Label htmlFor="newUserPassword">Passwort *</Label>
                <div className="relative">
                  <Input
                    id="newUserPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Sicheres Passwort eingeben"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mindestens 6 Zeichen empfohlen
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowNewUserModal(false)
                  setNewUser({ name: '', role: 'WAITER', password: '' })
                }}>
                  Abbrechen
                </Button>
                <Button 
                  onClick={handleCreateUser} 
                  disabled={!newUser.name || !newUser.password || newUser.password.length < 3}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Benutzer erstellen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 