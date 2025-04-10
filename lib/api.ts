import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios"
import { API_CONFIG } from './config'

// Log API configuration on startup
console.log('API Configuration:', {
  API_BASE_URL: API_CONFIG?.BASE_URL || 'API_CONFIG not loaded',
  MAX_RETRIES: API_CONFIG?.RETRY?.ATTEMPTS || 3,
  RETRY_DELAY: API_CONFIG?.RETRY?.DELAY || 1000
})

// Token management
const getAuthToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem("token")
}

const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem("token", token)
}

const removeAuthToken = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem("token")
  localStorage.removeItem("refreshToken")
}

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
            removeAuthToken()
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
          setAuthToken(token)

          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return axios(originalRequest)
        } catch (refreshError) {
          removeAuthToken()
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

// API service for events
export const eventApi = {
  // Get events with pagination
  getEvents: async (page = 1, limit = 10, signal?: AbortSignal): Promise<Event[]> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<Event[]>("/events/", {
          params: { skip: (page - 1) * limit, limit },
          signal,
        })
      )
      return response.data
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('Events request was cancelled - returning empty array')
        return [] // Return empty array instead of throwing error
      }
      console.error('Error fetching events:', error)
      throw error
    }
  },

  // Search events
  searchEvents: async (
    params: {
      title?: string
      description?: string
      date?: string
      time?: string
      location?: string
    },
    signal?: AbortSignal,
  ): Promise<Event[]> => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
      )

      const response = await withRetry(() =>
        apiClient.get<Event[]>("/events/search", {
          params: cleanParams,
          signal,
        })
      )

      return response.data || []
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('Search request was cancelled - returning empty array')
        return [] // Return empty array instead of throwing error
      }

      // For other errors, log and throw
      console.error('Error searching events:', error)
      throw error
    }
  },

  // Get single event
  getEvent: async (id: number | string, signal?: AbortSignal): Promise<Event> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<Event>(`/events/${id}`, { signal })
      )
      return response.data
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('Event request was cancelled')
        throw new Error('Request was cancelled')
      }
      console.error('Error fetching event:', error)
      throw error
    }
  },

  // Create event
  createEvent: async (eventData: EventFormData): Promise<Event> => {
    try {
      const response = await withRetry(() =>
        apiClient.post<Event>("/events/", eventData)
      )
      return response.data
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  },

  // Update event
  updateEvent: async (id: number | string, eventData: EventFormData): Promise<Event> => {
    try {
      const response = await withRetry(() =>
        apiClient.put<Event>(`/events/${id}`, eventData)
      )
      return response.data
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  },

  // Delete event
  deleteEvent: async (id: number | string): Promise<void> => {
    try {
      await withRetry(() =>
        apiClient.delete(`/events/${id}`)
      )
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  },

  // Get event attendance
  getEventAttendance: async (eventId: number | string, signal?: AbortSignal): Promise<EventAttendance[]> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<EventAttendance[]>(`/events/${eventId}/attendance`, { signal })
      )
      return response.data
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('Attendance request was cancelled - returning empty array')
        return [] // Return empty array instead of throwing error
      }
      console.error('Error fetching attendance:', error)
      throw error
    }
  },

  // Create or update event attendance
  createUpdateAttendance: async (eventId: number | string, attendanceData: AttendanceFormData[]): Promise<EventAttendance[]> => {
    try {
      const response = await withRetry(() =>
        apiClient.post<EventAttendance[]>(`/events/${eventId}/attendance`, attendanceData)
      )
      return response.data
    } catch (error) {
      console.error('Error creating/updating attendance:', error)
      throw error
    }
  },

  // Upload event photo
  uploadEventPhoto: async (eventId: number | string, file: File): Promise<EventPhoto> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await withRetry(() =>
        apiClient.post<EventPhoto>(`/events/${eventId}/photos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      )
      return response.data
    } catch (error) {
      console.error('Error uploading event photo:', error)
      throw error
    }
  },

  // Delete event photo
  deleteEventPhoto: async (eventId: number | string, photoId: number | string): Promise<void> => {
    try {
      await withRetry(() =>
        apiClient.delete(`/events/${eventId}/photos/${photoId}`)
      )
    } catch (error) {
      console.error('Error deleting event photo:', error)
      throw error
    }
  },
}

// Finance API service
export const financeApi = {
  // Get finance history with pagination and filters
  getFinanceHistory: async (
    params?: {
      skip?: number
      limit?: number
      category?: string
      start_date?: string
      end_date?: string
    },
    signal?: AbortSignal
  ): Promise<FinanceHistoryResponse> => {
    try {
      console.log('Fetching finance history with params:', params)
      const response = await withRetry(() =>
        apiClient.get<FinanceHistoryResponse>("/finance/history", {
          params,
          signal,
          timeout: API_CONFIG.TIMEOUT.FINANCE,
        })
      )

      return response.data
    } catch (error) {
      console.error('Failed to fetch finance history:', error)

      if (axios.isCancel(error)) {
        console.log('Request was cancelled')
        throw new Error('Request was cancelled')
      }

      const axiosError = error as AxiosError
      if (axiosError.code === 'ECONNABORTED') {
        console.error('Request timed out')
        throw new Error('Request timed out')
      }

      throw error
    }
  },

  // Get finance summary
  getFinanceSummary: async (
    params?: {
      start_date?: string
      end_date?: string
    },
    signal?: AbortSignal
  ): Promise<any> => {
    try {
      console.log('Attempting to fetch finance summary data...');
      const response = await withRetry(() =>
        apiClient.get<any>("/finance/summary", {
          params,
          signal,
          // Increase timeout specifically for this request
          timeout: 20000, // 20 seconds
        })
      )

      console.log('Finance summary data fetched successfully');
      return response.data
    } catch (error) {
      // Ensure error is not undefined or null
      const safeError = error || { message: 'Unknown error' };

      // Handle canceled requests gracefully
      if (axios.isCancel(safeError)) {
        console.log('Finance summary request was cancelled')
        throw new Error('Request was cancelled')
      }

      console.error('Error fetching finance summary:', safeError)

      // Log detailed error information
      if (axios.isAxiosError(safeError)) {
        // For Axios errors
        console.error('Axios error details:', {
          status: safeError.response?.status,
          statusText: safeError.response?.statusText,
          data: safeError.response?.data,
          message: safeError.message,
          code: safeError.code
        });
      } else if (safeError instanceof Error) {
        // For standard Error objects
        console.error('Standard error:', safeError.message, safeError.stack);
      } else {
        // For primitive error values
        console.error('Primitive error value:', String(safeError));
      }

      throw new Error('Failed to fetch finance summary')
    }
  },

  // Get single finance record
  getFinance: async (id: number | string, signal?: AbortSignal): Promise<Finance> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<Finance>(`/finance/${id}`, { signal })
      )
      return response.data
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('Finance record request was cancelled')
        throw new Error('Request was cancelled')
      }
      console.error('Error fetching finance record:', error)
      throw error
    }
  },

  // Create finance record
  createFinance: async (financeData: FinanceFormData): Promise<Finance> => {
    try {
      const response = await withRetry(() =>
        apiClient.post<Finance>("/finance/", financeData)
      )
      return response.data
    } catch (error) {
      console.error('Error creating finance record:', error)
      throw error
    }
  },

  // Update finance record
  updateFinance: async (id: number | string, financeData: FinanceFormData): Promise<Finance> => {
    try {
      const response = await withRetry(() =>
        apiClient.put<Finance>(`/finance/${id}`, financeData)
      )
      return response.data
    } catch (error) {
      console.error('Error updating finance record:', error)
      throw error
    }
  },

  // Delete finance record
  deleteFinance: async (id: number | string): Promise<void> => {
    try {
      await withRetry(() =>
        apiClient.delete(`/finance/${id}`)
      )
    } catch (error) {
      console.error('Error deleting finance record:', error)
      throw error
    }
  },
}

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
      return {
        token: data.access_token,
        refreshToken: data.refresh_token,
      }
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
      const response = await withRetry(() =>
        apiClient.post<{ message: string }>("/auth/register", userData)
      )
      return response.data
    } catch (error) {
      console.error('Error registering user:', error)
      throw error
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<User>("/auth/me")
      )
      return response.data
    } catch (error) {
      console.error('Error fetching current user:', error)
      throw error
    }
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    try {
      const response = await withRetry(() =>
        apiClient.post<{ token: string }>("/auth/refresh", { refreshToken })
      )
      return response.data
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    }
  },

  logout: async (): Promise<void> => {
    try {
      await withRetry(() =>
        apiClient.post("/auth/logout")
      )
      removeAuthToken()
    } catch (error) {
      console.error('Error logging out:', error)
      // Still remove tokens even if the API call fails
      removeAuthToken()
      throw error
    }
  },
}

// News API service
export const newsApi = {
  // Get all news with pagination and filters
  getNews: async (
    params?: {
      skip?: number
      limit?: number
      is_published?: boolean
      search?: string
    },
    signal?: AbortSignal
  ): Promise<NewsItem[]> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<NewsItem[]>("/news/", {
          params,
          signal,
        })
      )
      return response.data || []
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('News request was cancelled - returning empty array')
        // Return a default response to prevent UI errors
        return []
      }
      console.error('Error fetching news:', error)
      throw error
    }
  },

  // Get single news item
  getNewsItem: async (id: number | string, signal?: AbortSignal): Promise<NewsItem> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<NewsItem>(`/news/${id}`, { signal })
      )
      return response.data
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('News item request was cancelled')
        throw new Error('Request was cancelled')
      }
      console.error('Error fetching news item:', error)
      throw error
    }
  },

  // Create news item
  createNewsItem: async (newsData: NewsFormData): Promise<NewsItem> => {
    try {
      const response = await withRetry(() =>
        apiClient.post<NewsItem>("/news/", newsData)
      )
      return response.data
    } catch (error) {
      console.error('Error creating news item:', error)
      throw error
    }
  },

  // Update news item
  updateNewsItem: async (id: number | string, newsData: NewsFormData): Promise<NewsItem> => {
    try {
      const response = await withRetry(() =>
        apiClient.put<NewsItem>(`/news/${id}`, newsData)
      )
      return response.data
    } catch (error) {
      console.error('Error updating news item:', error)
      throw error
    }
  },

  // Delete news item
  deleteNewsItem: async (id: number | string): Promise<void> => {
    try {
      await withRetry(() =>
        apiClient.delete(`/news/${id}`)
      )
    } catch (error) {
      console.error('Error deleting news item:', error)
      throw error
    }
  },
}

// Meeting Minutes API service
export const meetingMinutesApi = {
  // Get all meeting minutes
  getMeetingMinutes: async (signal?: AbortSignal): Promise<MeetingMinutes[]> => {
    try {
      console.log('Fetching meeting minutes from API');
      const response = await withRetry(() =>
        apiClient.get<MeetingMinutes[]>("/meeting-minutes/", { signal })
      )

      console.log('Successfully fetched meeting minutes:', response.data.length);
      return response.data
    } catch (error) {
      console.error('Error fetching meeting minutes:', error);
      throw error;
    }
  },

  // Get meeting minutes by ID
  getMeetingMinutesById: async (id: number | string, signal?: AbortSignal): Promise<MeetingMinutes> => {
    try {
      console.log(`Fetching meeting minutes with ID ${id}`);
      const response = await withRetry(() =>
        apiClient.get<MeetingMinutes>(`/meeting-minutes/${id}`, { signal })
      )

      console.log(`Successfully fetched meeting minutes with ID ${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching meeting minutes with ID ${id}:`, error);
      throw error;
    }
  },

  // Create meeting minutes
  createMeetingMinutes: async (data: MeetingMinutesFormData): Promise<MeetingMinutes> => {
    try {
      console.log('Creating meeting minutes:', data);

      // Format data as expected by the API
      const formattedData = {
        title: data.title,
        description: data.description, // Now required
        date: data.date,
        document_url: data.document_url || '',
        event_id: data.event_id
      };

      const response = await withRetry(() =>
        apiClient.post<MeetingMinutes>("/meeting-minutes/", formattedData)
      )

      console.log('Successfully created meeting minutes:', response.data);
      return response.data
    } catch (error) {
      console.error('Error creating meeting minutes:', error);
      throw error;
    }
  },

  // Update meeting minutes
  updateMeetingMinutes: async (id: number | string, data: MeetingMinutesFormData): Promise<MeetingMinutes> => {
    try {
      console.log(`Updating meeting minutes with ID ${id}:`, data);

      // Format data as expected by the API
      const formattedData = {
        title: data.title,
        description: data.description, // Now required
        date: data.date,
        document_url: data.document_url || '',
        event_id: data.event_id
      };

      const response = await withRetry(() =>
        apiClient.put<MeetingMinutes>(`/meeting-minutes/${id}`, formattedData)
      )

      console.log(`Successfully updated meeting minutes with ID ${id}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating meeting minutes with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete meeting minutes
  deleteMeetingMinutes: async (id: number | string): Promise<void> => {
    try {
      console.log(`Deleting meeting minutes with ID ${id}`);
      await withRetry(() =>
        apiClient.delete(`/meeting-minutes/${id}`)
      )
      console.log(`Successfully deleted meeting minutes with ID ${id}`);
    } catch (error) {
      console.error(`Error deleting meeting minutes with ID ${id}:`, error);
      throw error;
    }
  }
};

// Member API service
export const memberApi = {
  // Get all members grouped by division
  getMembers: async (signal?: AbortSignal): Promise<MemberResponse> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<MemberResponse>("/members/", { signal })
      )
      return response.data
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('Members request was cancelled - returning empty object')
        return {} // Return empty object instead of throwing error
      }
      console.error('Error fetching members:', error)
      throw error
    }
  },

  // Get single member
  getMember: async (id: number | string, signal?: AbortSignal): Promise<Member> => {
    try {
      const response = await withRetry(() =>
        apiClient.get<Member>(`/members/${id}`, { signal })
      )
      return response.data
    } catch (error) {
      // Handle canceled requests gracefully
      if (axios.isCancel(error)) {
        console.log('Member request was cancelled')
        throw new Error('Request was cancelled')
      }
      console.error('Error fetching member:', error)
      throw error
    }
  },

  // Create member
  createMember: async (memberData: MemberFormData): Promise<Member> => {
    try {
      const response = await withRetry(() =>
        apiClient.post<Member>("/members/", memberData)
      )
      return response.data
    } catch (error) {
      console.error('Error creating member:', error)
      throw error
    }
  },

  // Update member
  updateMember: async (id: number | string, memberData: MemberFormData): Promise<Member> => {
    try {
      const response = await withRetry(() =>
        apiClient.put<Member>(`/members/${id}`, memberData)
      )
      return response.data
    } catch (error) {
      console.error('Error updating member:', error)
      throw error
    }
  },

  // Delete member
  deleteMember: async (id: number | string): Promise<void> => {
    try {
      await withRetry(() =>
        apiClient.delete(`/members/${id}`)
      )
    } catch (error) {
      console.error('Error deleting member:', error)
      throw error
    }
  },
}

// Types
export interface Event {
  id: number
  title: string
  description: string
  date: string
  time: string
  location: string
  status: string
  created_at: string
  updated_at: string
  photos: EventPhoto[]
  attendees: number[]
}

export interface EventPhoto {
  id: number
  event_id: number
  photo_url: string
  uploaded_at: string
}

export interface EventAttendance {
  id: number
  event_id: number
  member_id: number
  status: "Hadir" | "Izin" | "Alfa"
  notes: string
  created_at: string
  updated_at: string
}

export interface EventFormData {
  title: string
  description: string
  date: string
  time: string
  location: string
  status: string
}

export interface AttendanceFormData {
  member_id: number
  status: "Hadir" | "Izin" | "Alfa"
  notes: string
}

// Finance types
export interface Finance {
  id: number
  amount: string // Backend returns this as string
  category: string
  date: string // ISO date format
  description: string
  balance_before: string
  balance_after: string
  document_url: string | null
  created_by: number
  created_at: string
  updated_at: string
}

// This matches the backend's expected request body for POST/PUT
export interface FinanceFormData {
  amount: number // Backend expects this as number
  category: string
  date: string // ISO date format
  description: string
}

export interface FinanceHistoryResponse {
  transactions: Finance[]
  current_balance: string
}

// Auth types
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

// News types
export interface NewsItem {
  id: number
  title: string
  content: string
  image_url: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  author: string
}

export interface NewsFormData {
  title: string
  content: string
  image_url?: string
  is_published: boolean
  author: string
}

// Meeting Minutes types
export interface MeetingMinutes {
  id: number
  title: string
  description: string
  date: string
  document_url: string
  event_id: number
  created_at: string
  updated_at: string
}

export interface MeetingMinutesFormData {
  title: string
  description: string // Changed from optional to required
  date: string
  document_url?: string
  event_id: number
}

// Member types
export interface Member {
  id: number
  full_name: string
  division: string
  position: string
}

export interface MemberFormData {
  full_name: string
  division: string
  position: string
}

export interface MemberResponse {
  [division: string]: Member[]
}
