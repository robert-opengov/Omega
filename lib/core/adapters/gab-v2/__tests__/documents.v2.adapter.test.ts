import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IAuthPort } from '../../../ports/auth.port';
import { GabDocumentV2Adapter } from '../documents.v2.adapter';

const authPort = {
  getToken: vi.fn().mockResolvedValue('test-token'),
} as unknown as IAuthPort;

describe('GabDocumentV2Adapter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('createDocuments posts files array', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          attachmentId: 'att1',
          documents: [
            {
              id: 'd1',
              fileName: 'a.pdf',
              presignedUrl: 'https://s3/a',
              method: 'PUT',
              expiresIn: 300,
              headers: { 'x-amz': '1' },
            },
          ],
        }),
    });

    const adapter = new GabDocumentV2Adapter(authPort, 'https://api.example.com');
    const res = await adapter.createDocuments('app1', {
      files: [{ fileName: 'a.pdf', contentType: 'application/pdf', fileSize: 10 }],
    });
    expect(res.attachmentId).toBe('att1');
    expect(res.documents[0].method).toBe('PUT');
  });
});
