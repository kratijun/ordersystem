'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'

export default function Home(): React.ReactElement | null {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else {
        // Weiterleitung zum Dashboard für alle authentifizierten Benutzer
        router.push('/dashboard')
      }
    }
  }, [user, loading, router])

  // Loading-Zustand anzeigen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  // Während der Weiterleitung nichts anzeigen
  return null
} 