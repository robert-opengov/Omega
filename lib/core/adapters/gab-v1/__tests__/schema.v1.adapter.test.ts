import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GabSchemaV1Adapter } from '../schema.v1.adapter';

describe('GabSchemaV1Adapter — unsupported new v2-only methods', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects listFields when the repo is running in v1 mode', async () => {
    const authPort = {
      getToken: vi.fn().mockResolvedValue('access-token'),
    };
    const adapter = new GabSchemaV1Adapter(authPort as any, 'https://gab-v1.example.com') as any;

    await expect(adapter.listFields('app_1', 'table_1')).rejects.toThrow(
      'Not supported when GAB_API_VERSION=v1',
    );
  });
});
