import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_CONFIG } from '../config';
import { toast } from 'sonner';

interface ErrorResponse {
  message?: string;
  data?: any;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT.DEFAULT, // Using the correct timeout value
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ErrorResponse>) => {
        if (!error.response) {
          toast.error('Network error. Please check your connection.');
          return Promise.reject(new ApiError(0, 'Network Error'));
        }

        const originalRequest = error.config!;

        if (error.response.status === 401 && !originalRequest.headers['X-Retry']) {
          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            originalRequest.headers['X-Retry'] = 'true';
            return this.client(originalRequest);
          } catch (refreshError) {
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(
          new ApiError(
            error.response.status,
            error.response.data?.message || 'An error occurred',
            error.response.data
          )
        );
      }
    );
  }

  private getToken(): string | null {
    return typeof window !== 'undefined'
      ? localStorage.getItem(API_CONFIG.AUTH.TOKEN_KEY)
      : null;
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem(API_CONFIG.AUTH.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.client.post<{ token: string }>(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
        refreshToken,
      });

      const newToken = response.data.token;
      localStorage.setItem(API_CONFIG.AUTH.TOKEN_KEY, newToken);
      return newToken;
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }

  private handleAuthError() {
    localStorage.removeItem(API_CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.AUTH.REFRESH_TOKEN_KEY);

    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      localStorage.setItem(API_CONFIG.AUTH.REDIRECT_KEY, window.location.pathname);
      window.location.href = '/login';
    }
  }

  public async get<T>(url: string, config = {}): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error in GET request to ${url}:`, error);
      throw error;
    }
  }

  public async post<T>(url: string, data?: any, config = {}): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error in POST request to ${url}:`, error);
      throw error;
    }
  }

  public async put<T>(url: string, data?: any, config = {}): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error in PUT request to ${url}:`, error);
      throw error;
    }
  }

  public async delete<T>(url: string, config = {}): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error in DELETE request to ${url}:`, error);
      throw error;
    }
  }
}

export const apiClient = ApiClient.getInstance();

