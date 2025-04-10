import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios"
import { API_CONFIG } from './config'
import { getAuthToken, setAuthTokens, removeAuthTokens } from './auth-utils'

// Log API configuration on startup
console.log('API Configuration:', {
  API_BASE_URL: API_CONFIG?.BASE_URL || 'API_CONFIG not loaded',
  MAX_RETRIES: API_CONFIG?.RETRY?.ATTEMPTS || 3,
  RETRY_DELAY: API_CONFIG?.RETRY?.DELAY || 1000
})

// Create Axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT.DEFAULT,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (error && typeof error === 'object' && 'isAxiosError' in error) {
      const axiosError = error as AxiosError<{
        detail?: string;
        message?: string;
        errors?: Record<string, string[]>;
      }>

      // Handle request cancellation
      if (axios.isCancel(error)) {
        console.log('Request canceled:', axiosError.message)
        return Promise.reject(error)
      }

      const originalRequest = axiosError.config as AxiosRequestConfig & { _retry?: boolean }

      // Handle 401 Unauthorized - Token expired
      if (axiosError.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          // Attempt to refresh token
          const refreshToken = localStorage.getItem("refreshToken")
          if (!refreshToken) {
            removeAuthTokens()
            window.location.href = "/login"
            return Promise.reject(error)
          }

          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refreshToken,
          }, {
            headers: {
              "Content-Type": "application/json"
            }
          })

          const { token } = response.data
          setAuthTokens(token)

          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return axios(originalRequest)
        } catch (refreshError) {
          removeAuthTokens()
          window.location.href = "/login"
          return Promise.reject(error)
        }
      }
    }

    return Promise.reject(error)
  }
)

// Helper function to implement retry logic with exponential backoff
async function withRetry<T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  retries = API_CONFIG?.RETRY?.ATTEMPTS || 3,
  initialDelay = API_CONFIG?.RETRY?.DELAY || 1000,
): Promise<AxiosResponse<T>> {
  try {
    return await apiCall()
  } catch (error) {
    if (!retries) throw error

    const axiosError = error as AxiosError
    const shouldRetry = axiosError.code === 'ECONNABORTED' ||
                       axiosError.message === 'Network Error' ||
                       (axiosError.response?.status && axiosError.response.status >= 500)

    if (!shouldRetry) throw error

    // Calculate delay with exponential backoff
    const backoffFactor = API_CONFIG?.RETRY?.BACKOFF_FACTOR || 2
    const maxAttempts = API_CONFIG?.RETRY?.ATTEMPTS || 3
    const delay = initialDelay * Math.pow(backoffFactor, maxAttempts - retries)

    console.log(`Request failed, retrying in ${delay}ms... (${retries} attempts remaining)`)
    await new Promise(resolve => setTimeout(resolve, delay))

    return withRetry(apiCall, retries - 1, initialDelay)
  }
}
