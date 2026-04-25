import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IAuthPort } from '../../../ports/auth.port';
import { GabCustomComponentV2Adapter } from '../custom-components.v2.adapter';

const authPort = {
  getToken: vi.fn().mockResolvedValue('test-token'),
} as unknown as IAuthPort;

describe('GabCustomComponentV2Adapter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('getComponent fetches by key', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: '1',
          key: 'MyWidget',
          name: 'My',
          description: null,
          icon: 'Code',
          code: 'export default function(){}',
          propsSchema: {},
          defaultProps: {},
          dataBindingSupported: true,
          createdBy: null,
          visibility: 'app',
          version: 1,
          codeHistory: [],
          sourcePageKey: null,
          createdAt: 'a',
          updatedAt: 'b',
        }),
    });

    const adapter = new GabCustomComponentV2Adapter(authPort, 'https://api.example.com');
    const c = await adapter.getComponent('app1', 'MyWidget');
    expect(c.key).toBe('MyWidget');
    expect(c.visibility).toBe('app');
  });
});
