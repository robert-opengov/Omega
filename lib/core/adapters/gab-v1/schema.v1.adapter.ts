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

export class GabSchemaV1Adapter implements IGabSchemaRepository {
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
      const errorText = await res.text().catch(() => 'No error body');
      throw new Error(`GAB Schema API Error (${res.status}): ${errorText}`);
    }
    return res.json();
  }

  async createApp(params: CreateAppParams): Promise<any> {
    return this.fetchWithAuth('/api/Application', {
      method: 'POST',
      body: JSON.stringify({
        Name: params.name,
        Key: params.key,
        CompanyKey: params.companyKey,
      }),
    });
  }

  async createTable(params: CreateTableParams): Promise<any> {
    return this.fetchWithAuth('/api/ApplicationTable', {
      method: 'POST',
      body: JSON.stringify({
        Name: params.name,
        ApplicationKey: params.applicationKey,
        Icon: params.icon,
        CreateReportAndForm: params.createReportAndForm ?? true,
      }),
    });
  }

  async createField(params: CreateFieldParams): Promise<any> {
    return this.fetchWithAuth('/api/Field', {
      method: 'POST',
      body: JSON.stringify({
        ApplicationTableKey: params.applicationTableKey,
        Name: params.name,
        FieldType: params.fieldType,
        IsUnique: params.isUnique || false,
        IsNullable: params.isNullable ?? true,
      }),
    });
  }

  async createRelation(params: CreateRelationParams): Promise<any> {
    return this.fetchWithAuth('/api/Relation', {
      method: 'POST',
      body: JSON.stringify({
        ApplicationTableKey: params.applicationTableKey,
        ApplicationTable2Key: params.applicationTable2Key,
        RelationType: params.relationType,
        CustomRelation: params.customRelation || '',
        // Critical: ReferenceFieldKey MUST be null/empty for creation
        ReferenceFieldKey: null,
      }),
    });
  }

  async createForm(params: CreateFormParams): Promise<any> {
    return this.fetchWithAuth('/api/Form', {
      method: 'POST',
      body: JSON.stringify({
        Name: params.name,
        ApplicationTableKey: params.applicationTableKey,
        Type: params.type,
        DefaultForm: params.defaultForm || false,
      }),
    });
  }

  async createReport(params: CreateReportParams): Promise<any> {
    return this.fetchWithAuth('/api/report/postdatatable', {
      method: 'POST',
      body: JSON.stringify({
        Name: params.name,
        ApplicationTableKey: params.applicationTableKey,
        DefaultReport: params.defaultReport || false,
        // Critical: Columns and Filters must be initialized arrays
        Columns: params.columns || [],
        Filters: params.filters || [],
      }),
    });
  }

  async createWorkflow(params: any): Promise<any> {
    // Placeholder for V1 workflow creation
    return Promise.resolve({ success: true, message: 'Workflow created' });
  }
}
