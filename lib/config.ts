export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://backend-project-pemuda.onrender.com/api/v1',
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  AUTH: {
    TOKEN_KEY: 'token',
    REFRESH_TOKEN_KEY: 'refreshToken',
    REDIRECT_KEY: 'redirectAfterLogin',
  },
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/token',
      REFRESH: '/auth/refresh',
      REGISTER: '/auth/register',
      ME: '/auth/me',
    },
    NEWS: '/news',
    EVENTS: '/events',
    MEMBERS: '/members',
  },
}

export const APP_CONFIG = {
  DEFAULT_LANGUAGE: 'id',
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
  },
}