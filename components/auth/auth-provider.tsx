"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, removeAuthTokens } from '@/lib/auth-utils'
import { useToast } from '@/components/ui/use-toast'

// Define the authentication context
type AuthContextType = {
  isLoggedIn: boolean
  logout: () => Promise<void>
  checkAuth: () => boolean
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  logout: async () => {},
  checkAuth: () => false,
})

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext)

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Check authentication status on mount and when pathname changes
  useEffect(() => {
    const checkAuthentication = () => {
      const authenticated = isAuthenticated()
      setIsLoggedIn(authenticated)

      // Handle redirects based on authentication status
      const isPublicPath = pathname === '/login' || pathname === '/register' || pathname === '/'

      if (!authenticated && !isPublicPath) {
        // Redirect to login if not authenticated and trying to access protected route
        router.push('/login')
        toast({
          title: "Authentication required",
          description: "Please log in to access this page.",
          variant: "destructive",
        })
      } else if (authenticated && isPublicPath && pathname !== '/') {
        // Redirect to dashboard if authenticated and trying to access login/register
        router.push('/dashboard')
      }
    }

    // Only run on client-side
    if (typeof window !== 'undefined') {
      checkAuthentication()
    }
  }, [pathname, router, toast])

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Import auth functions
      const { authApi } = await import('@/lib/api-auth')
      await authApi.logout()

      // Remove tokens
      removeAuthTokens()

      // Update state
      setIsLoggedIn(false)

      // Show success message
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })

      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)

      // Remove tokens even if API call fails
      removeAuthTokens()
      setIsLoggedIn(false)

      // Show message
      toast({
        title: "Logged out",
        description: "You have been logged out.",
      })

      // Redirect to login
      router.push('/login')
    }
  }

  // Function to check authentication status
  const checkAuth = (): boolean => {
    const authenticated = isAuthenticated()
    setIsLoggedIn(authenticated)
    return authenticated
  }

  // Provide the auth context to children
  return (
    <AuthContext.Provider value={{ isLoggedIn, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
