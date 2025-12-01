// API Client Configuration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        if (!response.ok) {
          // Enhanced error for 404
          if (response.status === 404) {
            throw {
              message: `API endpoint not found: ${url}. Make sure your backend API server is running on ${this.baseURL}`,
              statusCode: 404,
              url,
            };
          }
          throw {
            message: `HTTP error! status: ${response.status}`,
            statusCode: response.status,
            url,
          };
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const error: any = {
          message: data.message || 'An error occurred',
          statusCode: response.status,
          errors: data.errors,
          url,
        };
        throw error;
      }

      return data;
    } catch (error: any) {
      // If it's already our error format, re-throw it
      if (error.statusCode !== undefined) {
        throw error;
      }
      
      // Network errors (CORS, connection refused, etc.)
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        throw {
          message: `Cannot connect to API server at ${url}. Make sure your backend API server is running on ${this.baseURL}`,
          statusCode: 0,
          url,
          originalError: error.message,
        };
      }
      
      throw {
        message: error.message || 'Network error occurred',
        statusCode: 0,
        url,
        originalError: error.message,
      };
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  async head<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'HEAD',
    });
  }

  async options<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'OPTIONS',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

