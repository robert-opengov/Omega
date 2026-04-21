import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
  })),
}));

import { NextAuthAdapter } from '../auth.adapter';

describe('NextAuthAdapter — unsupported new v2-only methods', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects register when the repo is running in v1 mode', async () => {
    const adapter = new NextAuthAdapter('https://gab-v1.example.com', 'client_id') as any;

    await expect(
      adapter.register({
        email: 'ada@example.com',
        password: 'Secret123!',
        firstName: 'Ada',
        lastName: 'Lovelace',
      }),
    ).rejects.toThrow('Not supported when GAB_API_VERSION=v1');
  });
});
