export interface ApiClientConfig {
  baseUrl: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
  onUnauthorized?: () => void;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers: extraHeaders } = options;
    const authHeaders = await this.config.getAuthHeaders();

    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...extraHeaders,
      },
    };

    if (method !== 'GET' && body) {
      requestInit.body = JSON.stringify(body);
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, requestInit);

    if (response.status === 401) {
      this.config.onUnauthorized?.();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorText = await response.text();
      let parsed: unknown;
      try { parsed = JSON.parse(errorText); } catch { parsed = errorText; }
      const err = new Error(`API error: ${response.status}`) as Error & { status: number; details: unknown };
      err.status = response.status;
      err.details = parsed;
      throw err;
    }

    return response.json() as Promise<T>;
  }

  async get<T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
