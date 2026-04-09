export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
