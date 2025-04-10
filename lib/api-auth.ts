import axios from "axios"
import { API_CONFIG } from './config'
import { setAuthTokens, removeAuthTokens } from './auth-utils'

// Auth API service
export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; refreshToken: string }> => {
    try {
      // Create form data as expected by the backend
      const formData = new URLSearchParams()
      formData.append("username", email)
      formData.append("password", password)
      formData.append("grant_type", "password")

      console.log("Sending login request to:", `${API_CONFIG.BASE_URL}/auth/token`)

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Login failed:", response.status, errorData)

        if (response.status === 401) {
          throw new Error("Email atau password salah")
        } else if (response.status === 403) {
          throw new Error("Akun Anda tidak memiliki izin untuk masuk")
        } else {
          throw new Error("Gagal masuk. Silakan coba lagi nanti.")
        }
      }

      const data = await response.json()
      const authData = {
        token: data.access_token,
        refreshToken: data.refresh_token,
      }
      
      // Store tokens
      setAuthTokens(authData.token, authData.refreshToken)
      
      return authData
    } catch (error) {
      console.error("Login error:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Terjadi kesalahan saat login")
    }
  },

  register: async (userData: RegisterFormData): Promise<{ message: string }> => {
    try {
      const response = await axios.post<{ message: string }>(
        `${API_CONFIG.BASE_URL}/auth/register`, 
        userData
      )
      return response.data
    } catch (error) {
      console.error('Error registering user:', error)
      throw error
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      const response = await axios.get<User>(
        `${API_CONFIG.BASE_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error fetching current user:', error)
      throw error
    }
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    try {
      const response = await axios.post<{ token: string }>(
        `${API_CONFIG.BASE_URL}/auth/refresh`, 
        { refreshToken }
      )
      
      // Update stored token
      setAuthTokens(response.data.token)
      
      return response.data
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    }
  },

  logout: async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await axios.post(
          `${API_CONFIG.BASE_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      }
      
      // Always remove tokens
      removeAuthTokens()
    } catch (error) {
      console.error('Error logging out:', error)
      // Still remove tokens even if the API call fails
      removeAuthTokens()
      throw error
    }
  },
}

// Types
export interface User {
  id: number
  username: string
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
}

export interface RegisterFormData {
  username: string
  email: string
  password: string
  full_name: string
}
