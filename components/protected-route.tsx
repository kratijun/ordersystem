'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'ADMIN' | 'WAITER'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps): React.ReactElement | null {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
        return
      }

      if (requiredRole && user.role !== requiredRole) {
        // Wenn spezifische Rolle erforderlich ist und User sie nicht hat
        router.push('/dashboard')
        return
      }
    }
  }, [user, loading, requiredRole, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Zugriff verweigert</h1>
          <p className="mt-2 text-gray-600">Sie haben nicht die erforderlichen Berechtigung für diese Seite.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 