import { IGabDataRepository, FetchRowsParams, GabRow, SyncAction } from '../../ports/data.repository';
import { IAuthPort } from '../../ports/auth.port';

export class GabDataV2Adapter implements IGabDataRepository {
  constructor(private authPort: IAuthPort, private apiUrl: string) {}

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await this.authPort.getToken();
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const res = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || err?.error || `GAB API Error: ${res.statusText}`);
    }
    return res.json();
  }

  async fetchRows(params: FetchRowsParams): Promise<{ data: GabRow[]; total: number }> {
    // If we have complex filters, use the advanced POST /query endpoint
    if (params.filters && Object.keys(params.filters).length > 0) {
      // Map the simple Record<string, any> to the gab-core structured filter array
      const structuredFilters = Object.entries(params.filters).map(([key, value]) => ({
        field: key,
        operator: 'eq', // Defaulting to exact match for simple key/value pairs
        value: String(value),
      }));

      const response = await this.fetchWithAuth(`/v2/apps/${params.applicationKey}/tables/${params.tableKey}/records/query`, {
        method: 'POST',
        body: JSON.stringify({
          limit: params.limit,
          offset: params.offset,
          search: params.search,
          filter: structuredFilters,
        }),
      });

      return {
        data: response.records || [],
        total: response.total || 0,
      };
    }

    // Otherwise, use the standard GET endpoint for simple pagination/search
    const searchParams = new URLSearchParams();
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
    if (params.offset !== undefined) searchParams.append('offset', String(params.offset));
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/v2/apps/${params.applicationKey}/tables/${params.tableKey}/records${queryString ? `?${queryString}` : ''}`;

    const response = await this.fetchWithAuth(endpoint, {
      method: 'GET',
    });

    return {
      data: response.records || [],
      total: response.total || 0,
    };
  }

  async createRow(tableKey: string, applicationKey: string, data: GabRow): Promise<any> {
    return this.fetchWithAuth(`/v2/apps/${applicationKey}/tables/${tableKey}/records`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRow(tableKey: string, applicationKey: string, rowId: number, data: GabRow): Promise<any> {
    return this.fetchWithAuth(`/v2/apps/${applicationKey}/tables/${tableKey}/records/${rowId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRows(tableKey: string, applicationKey: string, rowIds: number[]): Promise<any> {
    if (rowIds.length === 0) return { deleted: 0 };
    
    if (rowIds.length === 1) {
      return this.fetchWithAuth(`/v2/apps/${applicationKey}/tables/${tableKey}/records/${rowIds[0]}`, {
        method: 'DELETE',
      });
    }

    return this.fetchWithAuth(`/v2/apps/${applicationKey}/tables/${tableKey}/records/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ recordIds: rowIds }),
    });
  }

  async syncRows(_tableKey: string, _applicationKey: string, _actions: SyncAction[]): Promise<any> {
    throw new Error(
      'Not Implemented: The V2 API will not support sync. This was a legacy mobile-only feature.'
    );
  }
}
