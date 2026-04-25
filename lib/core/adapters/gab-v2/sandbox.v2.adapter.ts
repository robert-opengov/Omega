import type { IAuthPort } from '../../ports/auth.port';
import type {
  IGabSandboxRepository,
  CreateSandboxPayload,
  PromoteSandboxPayload,
  SchemaDiff,
  SchemaBackup,
} from '../../ports/sandbox.repository';
import { GabV2Http } from './_http';

export class GabSandboxV2Adapter implements IGabSandboxRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async createSandbox(
    appId: string,
    payload: CreateSandboxPayload,
  ): Promise<{ appId: string; appKey: string; dbName: string }> {
    return this.http.json(`/v2/apps/${appId}/sandbox`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSandboxDiff(sandboxAppId: string): Promise<SchemaDiff> {
    return this.http.json<SchemaDiff>(`/v2/apps/${sandboxAppId}/sandbox/diff`);
  }

  async promoteSandbox(
    sandboxAppId: string,
    payload: PromoteSandboxPayload,
  ): Promise<{ promoted: boolean }> {
    return this.http.json(`/v2/apps/${sandboxAppId}/sandbox/promote`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async discardSandbox(sandboxAppId: string): Promise<{ discarded: boolean }> {
    return this.http.json(`/v2/apps/${sandboxAppId}/sandbox`, {
      method: 'DELETE',
    });
  }

  async listBackups(appId: string): Promise<{ items: SchemaBackup[] }> {
    const res = await this.http.json<{ items?: SchemaBackup[] }>(
      `/v2/apps/${appId}/backups`,
    );
    return { items: Array.isArray(res?.items) ? res.items : [] };
  }

  async restoreBackup(
    appId: string,
    backupId?: string,
  ): Promise<{ rolledBack: boolean }> {
    return this.http.json(`/v2/apps/${appId}/rollback`, {
      method: 'POST',
      body: JSON.stringify(backupId ? { backupId } : {}),
    });
  }
}
