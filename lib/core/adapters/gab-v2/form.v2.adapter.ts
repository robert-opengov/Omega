import type { IAuthPort } from '../../ports/auth.port';
import type {
  FormLayout,
  GabForm,
  IGabFormRepository,
  ListFormsQuery,
  CreateFormPayload,
  UpdateFormPayload,
  PublicFormField,
} from '../../ports/form.repository';
import { GabV2Http } from './_http';

function normalizePublicField(raw: any): PublicFormField {
  return {
    id: String(raw?.id ?? ''),
    key: String(raw?.key ?? ''),
    name: String(raw?.name ?? ''),
    type: String(raw?.type ?? ''),
    required: Boolean(raw?.required),
    config:
      raw?.config && typeof raw.config === 'object'
        ? (raw.config as Record<string, unknown>)
        : null,
    defaultValue:
      typeof raw?.defaultValue === 'string' || raw?.defaultValue == null
        ? raw?.defaultValue ?? null
        : String(raw.defaultValue),
  };
}

function normalizeForm(raw: any): GabForm {
  const rawLayout = raw?.layout && typeof raw.layout === 'object' ? raw.layout : {};
  const rawSections = Array.isArray((rawLayout as any).sections)
    ? (rawLayout as any).sections
    : [];
  const layout: FormLayout = {
    ...(rawLayout as Record<string, unknown>),
    sections: rawSections.map((section: any) => ({
      id: String(section?.id ?? ''),
      title: section?.title ?? undefined,
      description: section?.description ?? undefined,
      displayMode: section?.displayMode ?? undefined,
      columns: section?.columns,
      items: Array.isArray(section?.items) ? section.items : [],
      icon: section?.icon ?? undefined,
    })),
  };

  return {
    id: String(raw?.id ?? ''),
    key: String(raw?.key ?? ''),
    name: String(raw?.name ?? ''),
    tableId: raw?.tableId ?? null,
    description: raw?.description ?? null,
    config:
      raw?.config && typeof raw.config === 'object'
        ? (raw.config as Record<string, unknown>)
        : {},
    layout,
    isDefault: Boolean(raw?.isDefault),
    createdAt: String(raw?.createdAt ?? ''),
  };
}

export class GabFormV2Adapter implements IGabFormRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listForms(
    appId: string,
    query: ListFormsQuery = {},
  ): Promise<{ items: GabForm[]; total: number }> {
    const qs = GabV2Http.qs({ tableId: query.tableId });
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/forms${qs}`,
    );
    const items = Array.isArray(res?.items) ? res.items.map(normalizeForm) : [];
    return {
      items,
      total: Number(res?.total ?? items.length),
    };
  }

  async getForm(appId: string, formId: string): Promise<GabForm> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/forms/${formId}`);
    return normalizeForm(res);
  }

  async createForm(appId: string, payload: CreateFormPayload): Promise<GabForm> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/forms`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeForm(res);
  }

  async updateForm(appId: string, formId: string, patch: UpdateFormPayload): Promise<GabForm> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/forms/${formId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return normalizeForm(res);
  }

  async deleteForm(appId: string, formId: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/forms/${formId}`, {
      method: 'DELETE',
    });
    return { ok: true };
  }

  async setDefaultForm(appId: string, formId: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/forms/${formId}/set-default`, {
      method: 'POST',
    });
    return { ok: true };
  }

  async getDefaultForm(appId: string, tableId: string): Promise<GabForm> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/forms/default/${tableId}`);
    return normalizeForm(res);
  }
}

export { normalizeForm, normalizePublicField };
