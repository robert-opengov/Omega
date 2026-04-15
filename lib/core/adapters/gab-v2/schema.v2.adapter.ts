import {
  IGabSchemaRepository,
  CreateAppParams,
  CreateTableParams,
  CreateFieldParams,
  CreateRelationParams,
  CreateFormParams,
  CreateReportParams,
} from '../../ports/schema.repository';
import { IAuthPort } from '../../ports/auth.port';

export class GabSchemaV2Adapter implements IGabSchemaRepository {
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
      throw new Error(err?.message || err?.error || `GAB Schema API Error: ${res.statusText}`);
    }
    return res.json();
  }

  async createApp(params: CreateAppParams): Promise<any> {
    return this.fetchWithAuth('/v2/apps', {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        // V2 does not take companyKey or key in the payload (tenant is inferred)
      }),
    });
  }

  async createTable(params: CreateTableParams): Promise<any> {
    return this.fetchWithAuth(`/v2/apps/${params.applicationKey}/tables`, {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        // V2 does not take icon or createReportAndForm in this endpoint
      }),
    });
  }

  async createField(params: CreateFieldParams): Promise<any> {
    return this.fetchWithAuth(`/v2/apps/${params.applicationKey}/tables/${params.applicationTableKey}/fields`, {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        type: params.fieldType,
        required: params.isNullable === false, // Note: required is opposite of isNullable (true meaning optional)
        // V2 does not explicitly take isUnique in the basic payload right now
      }),
    });
  }

  async createRelation(params: CreateRelationParams): Promise<any> {
    return this.fetchWithAuth(`/v2/apps/${params.applicationKey}/relationships`, {
      method: 'POST',
      body: JSON.stringify({
        parentTableId: params.applicationTableKey,
        childTableId: params.applicationTable2Key,
        type: params.relationType,
      }),
    });
  }

  async createForm(params: CreateFormParams): Promise<any> {
    // V2 does not yet have a POST /v2/apps/:appId/forms endpoint
    console.warn('createForm is not yet implemented in GAB v2 API');
    return Promise.resolve({ success: true, message: 'Mocked: V2 forms API not available' });
  }

  async createReport(params: CreateReportParams): Promise<any> {
    // V2 does not yet have a POST /v2/apps/:appId/reports endpoint
    console.warn('createReport is not yet implemented in GAB v2 API');
    return Promise.resolve({ success: true, message: 'Mocked: V2 reports API not available' });
  }

  async createWorkflow(params: any): Promise<any> {
    // Placeholder for workflow creation
    console.warn('createWorkflow is not yet implemented in GAB v2 API');
    return Promise.resolve({ success: true, message: 'Mocked: V2 workflows API not available' });
  }
}
