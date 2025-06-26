'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'

type User = {
  id: string
  name: string
  role: 'ADMIN' | 'WAITER'
}

type AuthContextType = {
  user: User | null
  login: (name: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  updateUser: (userData: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and validate token
    const checkAuth = async (): Promise<void> => {
      const savedUser = localStorage.getItem('user')
      const token = localStorage.getItem('auth-token')
      
      if (savedUser && token) {
        try {
          // Validate token with backend
          const response = await authApi.me()
          if (response.success) {
            setUser(response.data)
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('user')
            localStorage.removeItem('auth-token')
          }
        } catch (error) {
          console.error('Auth validation error:', error)
          // Token invalid, clear storage
          localStorage.removeItem('user')
          localStorage.removeItem('auth-token')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (name: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(name, password)
      if (response.success) {
        setUser(response.data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = (): void => {
    authApi.logout()
    setUser(null)
    router.push('/login')
  }

  const updateUser = (userData: User): void => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 