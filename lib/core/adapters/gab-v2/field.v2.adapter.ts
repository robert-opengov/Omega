import type { IAuthPort } from '../../ports/auth.port';
import type {
  IGabFieldRepository,
  GabField,
  CreateFieldPayload,
  UpdateFieldPayload,
  FieldTypeChangeValidation,
  FieldDependents,
} from '../../ports/field.repository';
import { GabV2Http } from './_http';

function normalize(raw: any): GabField {
  return {
    id: String(raw.id ?? ''),
    tableId: String(raw.tableId ?? ''),
    appId: raw.appId ? String(raw.appId) : undefined,
    key: raw.key ?? '',
    name: raw.name ?? '',
    type: raw.type ?? '',
    required: Boolean(raw.required),
    sortOrder: Number(raw.sortOrder ?? 0),
    isSystem: Boolean(raw.isSystem),
    createdAt: raw.createdAt ?? '',
    formula: raw.formula ?? null,
    formulaReturnType: raw.formulaReturnType ?? null,
    config: raw.config ?? null,
    lookupConfig: raw.lookupConfig ?? null,
    summaryConfig: raw.summaryConfig ?? null,
    defaultValue: raw.defaultValue,
    typedColumn: raw.typedColumn ?? null,
  };
}

export class GabFieldV2Adapter implements IGabFieldRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listFields(
    appId: string,
    tableId: string,
    options: { includeSystem?: boolean } = {},
  ): Promise<{ items: GabField[]; total: number }> {
    const qs = options.includeSystem ? '?all=true' : '';
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/tables/${tableId}/fields${qs}`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalize) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async getField(appId: string, tableId: string, fieldId: string): Promise<GabField> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/tables/${tableId}/fields/${fieldId}`,
    );
    return normalize(res);
  }

  async createField(
    appId: string,
    tableId: string,
    payload: CreateFieldPayload,
  ): Promise<GabField> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/tables/${tableId}/fields`,
      { method: 'POST', body: JSON.stringify(payload) },
    );
    return normalize(res);
  }

  async updateField(
    appId: string,
    tableId: string,
    fieldId: string,
    payload: UpdateFieldPayload,
  ): Promise<GabField> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/tables/${tableId}/fields/${fieldId}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    );
    return normalize(res);
  }

  async deleteField(
    appId: string,
    tableId: string,
    fieldId: string,
  ): Promise<{ ok: boolean }> {
    await this.http.json(
      `/v2/apps/${appId}/tables/${tableId}/fields/${fieldId}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  }

  async validateTypeChange(
    appId: string,
    tableId: string,
    fieldId: string,
    newType: string,
  ): Promise<FieldTypeChangeValidation> {
    return this.http.json<FieldTypeChangeValidation>(
      `/v2/apps/${appId}/tables/${tableId}/fields/${fieldId}/validate-type-change`,
      { method: 'POST', body: JSON.stringify({ newType }) },
    );
  }

  async getFieldDependents(
    appId: string,
    tableId: string,
    fieldId: string,
  ): Promise<FieldDependents> {
    return this.http.json<FieldDependents>(
      `/v2/apps/${appId}/tables/${tableId}/fields/${fieldId}/dependents`,
    );
  }
}
