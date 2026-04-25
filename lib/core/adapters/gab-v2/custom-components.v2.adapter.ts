import type { IAuthPort } from '../../ports/auth.port';
import type {
  CreateCustomComponentPayload,
  CustomComponentUsage,
  GabCustomComponent,
  IGabCustomComponentRepository,
  UpdateCustomComponentPayload,
} from '../../ports/custom-components.repository';
import { GabV2Http } from './_http';

function normalizeComponent(raw: any): GabCustomComponent {
  return {
    id: String(raw?.id ?? ''),
    key: String(raw?.key ?? ''),
    name: String(raw?.name ?? ''),
    description: raw?.description === null || raw?.description === undefined
      ? null
      : String(raw.description),
    icon: String(raw?.icon ?? 'Code'),
    code: String(raw?.code ?? ''),
    propsSchema: raw?.propsSchema,
    defaultProps: raw?.defaultProps,
    dataBindingSupported: Boolean(raw?.dataBindingSupported),
    createdBy: raw?.createdBy == null ? null : String(raw.createdBy),
    visibility: raw?.visibility === 'app' ? 'app' : 'personal',
    version: Number(raw?.version ?? 0),
    codeHistory: raw?.codeHistory,
    sourcePageKey: raw?.sourcePageKey == null ? null : String(raw.sourcePageKey),
    createdAt: String(raw?.createdAt ?? ''),
    updatedAt: String(raw?.updatedAt ?? ''),
  };
}

export class GabCustomComponentV2Adapter implements IGabCustomComponentRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listComponents(
    appId: string,
  ): Promise<{ items: GabCustomComponent[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/components`,
    );
    const items = Array.isArray(res?.items) ? res.items.map(normalizeComponent) : [];
    return { items, total: typeof res?.total === 'number' ? res.total : items.length };
  }

  async getComponent(appId: string, key: string): Promise<GabCustomComponent> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/components/${key}`);
    return normalizeComponent(res);
  }

  async createComponent(
    appId: string,
    payload: CreateCustomComponentPayload,
  ): Promise<GabCustomComponent> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/components`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeComponent(res);
  }

  async updateComponent(
    appId: string,
    key: string,
    patch: UpdateCustomComponentPayload,
  ): Promise<GabCustomComponent> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/components/${key}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return normalizeComponent(res);
  }

  async deleteComponent(appId: string, key: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/components/${key}`, { method: 'DELETE' });
    return { ok: true };
  }

  async duplicateComponent(appId: string, key: string): Promise<GabCustomComponent> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/components/${key}/duplicate`,
      { method: 'POST' },
    );
    return normalizeComponent(res);
  }

  async getUsage(appId: string, key: string): Promise<CustomComponentUsage> {
    const res = await this.http.json<{ pages?: { key: string; name: string }[]; total?: number }>(
      `/v2/apps/${appId}/components/${key}/usage`,
    );
    return {
      pages: Array.isArray(res?.pages) ? res.pages : [],
      total: Number(res?.total ?? 0),
    };
  }

  async rollbackComponent(
    appId: string,
    key: string,
    version: number,
  ): Promise<GabCustomComponent> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/components/${key}/rollback`,
      { method: 'POST', body: JSON.stringify({ version }) },
    );
    return normalizeComponent(res);
  }

  async shareComponent(appId: string, key: string): Promise<GabCustomComponent> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/components/${key}/share`,
      { method: 'POST' },
    );
    return normalizeComponent(res);
  }
}

export { normalizeComponent };
