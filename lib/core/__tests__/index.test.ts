import { describe, expect, it, vi } from 'vitest';

async function loadCore(apiVersion: 'v1' | 'v2') {
  vi.resetModules();

  vi.doMock('@/config/gab.config', () => ({
    gabConfig: {
      apiVersion,
      apiUrl: `https://${apiVersion}.example.com`,
      clientId: 'client_1',
    },
  }));

  vi.doMock('@/config/ai-gateway.config', () => ({
    aiGatewayConfig: {
      baseUrl: 'https://ai.example.com',
      token: '',
      defaultModelId: 'model_1',
    },
  }));

  const core = await import('../index');

  return {
    core,
    NextAuthAdapter: (await import('../adapters/gab-v1/auth.adapter')).NextAuthAdapter,
    GabAuthV2Adapter: (await import('../adapters/gab-v2/auth.adapter')).GabAuthV2Adapter,
    GabDataV1Adapter: (await import('../adapters/gab-v1/data.v1.adapter')).GabDataV1Adapter,
    GabDataV2Adapter: (await import('../adapters/gab-v2/data.v2.adapter')).GabDataV2Adapter,
    GabSchemaV1Adapter: (await import('../adapters/gab-v1/schema.v1.adapter')).GabSchemaV1Adapter,
    GabSchemaV2Adapter: (await import('../adapters/gab-v2/schema.v2.adapter')).GabSchemaV2Adapter,
    GabUserV1Adapter: (await import('../adapters/gab-v1/user.adapter')).GabUserV1Adapter,
    GabUserV2Adapter: (await import('../adapters/gab-v2/user.adapter')).GabUserV2Adapter,
    GabNotificationsV1Adapter: (await import('../adapters/gab-v1/notifications.adapter')).GabNotificationsV1Adapter,
    GabNotificationsV2Adapter: (await import('../adapters/gab-v2/notifications.adapter')).GabNotificationsV2Adapter,
    GabAppRoleV1Adapter: (await import('../adapters/gab-v1/app-role.adapter')).GabAppRoleV1Adapter,
    GabAppRoleV2Adapter: (await import('../adapters/gab-v2/app-role.adapter')).GabAppRoleV2Adapter,
  };
}

describe('lib/core/index wiring', () => {
  it('wires v2 repos when GAB_API_VERSION=v2', async () => {
    const {
      core,
      GabAuthV2Adapter,
      GabDataV2Adapter,
      GabSchemaV2Adapter,
      GabUserV2Adapter,
      GabNotificationsV2Adapter,
      GabAppRoleV2Adapter,
    } = await loadCore('v2');

    expect(core.authPort).toBeInstanceOf(GabAuthV2Adapter);
    expect(core.gabDataRepo).toBeInstanceOf(GabDataV2Adapter);
    expect(core.gabSchemaRepo).toBeInstanceOf(GabSchemaV2Adapter);
    expect(core.gabUserRepo).toBeInstanceOf(GabUserV2Adapter);
    expect(core.gabNotificationRepo).toBeInstanceOf(GabNotificationsV2Adapter);
    expect(core.gabAppRoleRepo).toBeInstanceOf(GabAppRoleV2Adapter);
  });

  it('wires v1 repos when GAB_API_VERSION=v1', async () => {
    const {
      core,
      NextAuthAdapter,
      GabDataV1Adapter,
      GabSchemaV1Adapter,
      GabUserV1Adapter,
      GabNotificationsV1Adapter,
      GabAppRoleV1Adapter,
    } = await loadCore('v1');

    expect(core.authPort).toBeInstanceOf(NextAuthAdapter);
    expect(core.gabDataRepo).toBeInstanceOf(GabDataV1Adapter);
    expect(core.gabSchemaRepo).toBeInstanceOf(GabSchemaV1Adapter);
    expect(core.gabUserRepo).toBeInstanceOf(GabUserV1Adapter);
    expect(core.gabNotificationRepo).toBeInstanceOf(GabNotificationsV1Adapter);
    expect(core.gabAppRoleRepo).toBeInstanceOf(GabAppRoleV1Adapter);
  });
});
