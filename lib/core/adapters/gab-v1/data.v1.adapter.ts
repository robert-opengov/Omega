import { IGabDataRepository, FetchRowsParams, GabRow, SyncAction } from '../../ports/data.repository';
import { IAuthPort } from '../../ports/auth.port';

export class GabDataV1Adapter implements IGabDataRepository {
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
      throw new Error(`GAB API Error: ${res.statusText}`);
    }
    return res.json();
  }

  async fetchRows(params: FetchRowsParams): Promise<{ data: GabRow[]; total: number }> {
    // V1 uses POST /api/report/getdatatabledata
    const payload = {
      TableKey: params.tableKey,
      ReportKey: params.reportKey || '',
      Start: params.offset || 0,
      Length: params.limit || 10,
      Search: { value: params.search || '', regex: false },
      // V1 requires a complex Columns array, we'd map this dynamically in a real app
      Columns: [],
    };

    const response = await this.fetchWithAuth('/api/report/getdatatabledata', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      data: response.data || [],
      total: response.recordsFiltered || 0,
    };
  }

  async createRow(tableKey: string, applicationKey: string, data: GabRow): Promise<any> {
    // V1 uses POST /api/formaction/postdata
    const fieldsList = Object.entries(data).map(([key, value]) => ({
      Name: key,
      Value: String(value),
    }));

    const payload = {
      ApplicationTableKey: tableKey,
      ApplicationKey: applicationKey,
      fieldsList,
    };

    return this.fetchWithAuth('/api/formaction/postdata', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateRow(tableKey: string, applicationKey: string, rowId: number, data: GabRow): Promise<any> {
    // V1 uses PUT /api/formaction/putdata
    const fieldsList = Object.entries(data).map(([key, value]) => ({
      Name: key,
      Value: String(value),
    }));

    const payload = {
      ApplicationTableKey: tableKey,
      ApplicationKey: applicationKey,
      fieldsList,
      Where: { Rid: rowId },
    };

    return this.fetchWithAuth('/api/formaction/putdata', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteRows(tableKey: string, _applicationKey: string, rowIds: number[]): Promise<any> {
    // V1 uses DELETE /api/formaction/deleteobject
    const isBulk = rowIds.length > 1;
    const payload = {
      ApplicationTableKey: tableKey,
      IsBulkUpdateDelete: isBulk,
      Where: isBulk ? { Rids: rowIds } : { Rid: rowIds[0] },
    };

    return this.fetchWithAuth('/api/formaction/deleteobject', {
      method: 'DELETE',
      body: JSON.stringify(payload),
    });
  }

  async syncRows(tableKey: string, applicationKey: string, actions: SyncAction[]): Promise<any> {
    // V1 uses POST /api/formaction/syncdata
    const payload = actions.map((action) => {
      const fieldsList = action.fields
        ? Object.entries(action.fields).map(([key, value]) => ({
            Name: key,
            Value: String(value),
          }))
        : undefined;

      return {
        ApplicationTableKey: tableKey,
        ActionType: action.action,
        Where: action.id ? { Rid: action.id } : undefined,
        FieldsList: fieldsList,
      };
    });

    return this.fetchWithAuth('/api/formaction/syncdata', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
