'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
// import ProtectedRoute from '@/components/protected-route'
import { 
  LayoutGrid, 
  ChefHat, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  BarChart3,
  UserCheck,
  Eye
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid, roles: ['ADMIN', 'WAITER'] },
    { name: 'Tischübersicht', href: '/dashboard/table-view', icon: Eye, roles: ['ADMIN', 'WAITER'] },
    { name: 'Tischverwaltung', href: '/dashboard/tables', icon: LayoutGrid, roles: ['ADMIN', 'WAITER'] },
    { name: 'Bestellungen', href: '/dashboard/orders', icon: ShoppingCart, roles: ['ADMIN', 'WAITER'] },
    { name: 'Küche', href: '/dashboard/kitchen', icon: ChefHat, roles: ['ADMIN', 'WAITER'] },
    { name: 'Produkte', href: '/dashboard/products', icon: Package, roles: ['ADMIN'] },
    { name: 'Statistiken', href: '/dashboard/statistics', icon: BarChart3, roles: ['ADMIN', 'WAITER'] },
    { name: 'Benutzer', href: '/dashboard/users', icon: Users, roles: ['ADMIN'] },
    { name: 'Einstellungen', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN', 'WAITER'] },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  )

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-6 border-b">
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Orderman</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t px-4 py-4 flex-shrink-0">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Kellner'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b px-4 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center">
              <ChefHat className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-lg font-bold text-gray-900">Orderman</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 