import type { IAuthPort } from '../../ports/auth.port';
import type {
  IGabTemplateRepository,
  GabTemplate,
  GabTemplateVersion,
  GabAppSubscription,
  CreateTemplatePayload,
  MaterializeTemplatePayload,
  ApplyTemplateUpdatePayload,
  ThreeWayDiff,
  TemplateSubscriber,
} from '../../ports/template.repository';
import { GabV2Http } from './_http';

function normalize(raw: any): GabTemplate {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: raw.description ?? null,
    status: String(raw.status ?? ''),
    sourceAppId: raw.sourceAppId ?? null,
    sourceAppKey: raw.sourceAppKey ?? null,
    currentVersion: Number(raw.currentVersion ?? 0),
    config: raw.config,
    createdBy: raw.createdBy ?? null,
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? '',
  };
}

export class GabTemplateV2Adapter implements IGabTemplateRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listTemplates(): Promise<{ items: GabTemplate[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      '/v2/templates',
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalize) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async getTemplate(templateId: string): Promise<GabTemplate> {
    const res = await this.http.json<any>(`/v2/templates/${templateId}`);
    return normalize(res);
  }

  async createTemplate(payload: CreateTemplatePayload): Promise<GabTemplate> {
    const res = await this.http.json<any>('/v2/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalize(res);
  }

  async deleteTemplate(templateId: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/templates/${templateId}`, { method: 'DELETE' });
    return { ok: true };
  }

  async materialize(
    templateId: string,
    payload: MaterializeTemplatePayload,
  ): Promise<{ id: string; key: string; name: string }> {
    return this.http.json(`/v2/templates/${templateId}/materialize`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async publish(
    templateId: string,
    payload: { changelog?: string },
  ): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/templates/${templateId}/publish`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ok: true };
  }

  async listVersions(
    templateId: string,
  ): Promise<{ items: GabTemplateVersion[]; total: number }> {
    const res = await this.http.json<{ items?: GabTemplateVersion[]; total?: number }>(
      `/v2/templates/${templateId}/versions`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items : [],
      total: Number(res?.total ?? 0),
    };
  }

  async listSubscribers(
    templateId: string,
  ): Promise<{ items: TemplateSubscriber[]; total: number }> {
    const res = await this.http.json<{ items?: TemplateSubscriber[]; total?: number }>(
      `/v2/templates/${templateId}/subscribers`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items : [],
      total: Number(res?.total ?? 0),
    };
  }

  async getTemplateDiff(appId: string): Promise<ThreeWayDiff> {
    return this.http.json<ThreeWayDiff>(`/v2/apps/${appId}/template-diff`);
  }

  async applyTemplateUpdate(
    appId: string,
    payload: ApplyTemplateUpdatePayload,
  ): Promise<GabAppSubscription> {
    return this.http.json<GabAppSubscription>(`/v2/apps/${appId}/apply-update`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async rollbackTemplate(
    appId: string,
    targetVersion: number,
  ): Promise<GabAppSubscription> {
    return this.http.json<GabAppSubscription>(
      `/v2/apps/${appId}/template-rollback`,
      { method: 'POST', body: JSON.stringify({ targetVersion }) },
    );
  }

  async getAppSubscription(appId: string): Promise<GabAppSubscription | null> {
    return this.http.json<GabAppSubscription | null>(
      `/v2/apps/${appId}/subscription`,
      { allow404: true },
    );
  }

  async extractFromApp(
    appId: string,
    payload: { templateName?: string },
  ): Promise<GabTemplate> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/extract-template`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalize(res);
  }
}
