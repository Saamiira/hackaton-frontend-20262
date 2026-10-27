const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://logpose-api-jg7f.onrender.com/api/v1';

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown> | null;

  constructor(status: number, message: string, data: Record<string, unknown> | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined | null>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;

  let url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = localStorage.getItem('logpose_token');

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  if (!response.ok) {
    let errorData: Record<string, unknown> | null = null;
    let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;

    try {
      errorData = (await response.json()) as Record<string, unknown>;
      if (typeof errorData?.message === 'string') {
        errorMessage = errorData.message;
      } else if (typeof errorData?.error === 'string') {
        errorMessage = errorData.error;
      }
    } catch {
      // response is not json
    }

    if (response.status === 401) {
      localStorage.removeItem('logpose_token');
      localStorage.removeItem('logpose_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    throw new ApiError(response.status, errorMessage, errorData);
  }

  // Si no hay contenido (ej 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
