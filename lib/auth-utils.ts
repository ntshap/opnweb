// Client-side authentication utilities

// Check if the user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check localStorage first (primary storage)
  const token = localStorage.getItem('token')
  if (token) return true
  
  // Fallback to cookies
  const cookieToken = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1")
  return !!cookieToken
}

// Set authentication tokens
export const setAuthTokens = (token: string, refreshToken?: string): void => {
  if (typeof window === 'undefined') return
  
  // Store in localStorage
  localStorage.setItem('token', token)
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }
  
  // Store in cookies
  document.cookie = `token=${token};path=/;max-age=2592000;SameSite=Strict` // 30 days
  if (refreshToken) {
    document.cookie = `refreshToken=${refreshToken};path=/;max-age=2592000;SameSite=Strict` // 30 days
  }
}

// Remove authentication tokens
export const removeAuthTokens = (): void => {
  if (typeof window === 'undefined') return
  
  // Remove from localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  
  // Remove from cookies
  document.cookie = "token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"
  document.cookie = "refreshToken=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"
}

// Get the authentication token
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  
  // Check localStorage first
  const token = localStorage.getItem('token')
  if (token) return token
  
  // Fallback to cookies
  return document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1") || null
}

// Get the refresh token
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  
  // Check localStorage first
  const refreshToken = localStorage.getItem('refreshToken')
  if (refreshToken) return refreshToken
  
  // Fallback to cookies
  return document.cookie.replace(/(?:(?:^|.*;\s*)refreshToken\s*\=\s*([^;]*).*$)|^.*$/, "$1") || null
}
