import type { IAuthPort } from '../../ports/auth.port';
import type {
  CreateDocumentsRequest,
  CreateDocumentsResult,
  DownloadUrlResult,
  DocumentMetadata,
  BulkDownloadItem,
  IGabDocumentRepository,
} from '../../ports/documents.repository';
import { GabV2Http } from './_http';

export class GabDocumentV2Adapter implements IGabDocumentRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async createDocuments(
    appId: string,
    request: CreateDocumentsRequest,
  ): Promise<CreateDocumentsResult> {
    const res = await this.http.json<{
      attachmentId: string;
      documents: Array<{
        id: string;
        fileName: string;
        presignedUrl: string;
        method: 'PUT';
        expiresIn: number;
        headers: Record<string, string>;
      }>;
    }>(`/v2/apps/${appId}/documents`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return {
      attachmentId: res.attachmentId,
      documents: (res.documents ?? []).map((d) => ({
        id: d.id,
        fileName: d.fileName,
        presignedUrl: d.presignedUrl,
        method: 'PUT' as const,
        expiresIn: d.expiresIn,
        headers: d.headers,
      })),
    };
  }

  async getDownloadUrl(
    appId: string,
    docId: string,
    fileName?: string,
  ): Promise<DownloadUrlResult> {
    const qs = GabV2Http.qs({ fileName: fileName ?? undefined });
    const res = await this.http.json<DownloadUrlResult>(
      `/v2/apps/${appId}/documents/${docId}/download-url${qs}`,
    );
    return res;
  }

  async getDocument(appId: string, docId: string): Promise<DocumentMetadata> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/documents/${docId}`);
    return {
      id: String(res?.id ?? docId),
      s3FileKey: String(res?.s3FileKey ?? ''),
      fileName: String(res?.fileName ?? ''),
      contentType: String(res?.contentType ?? ''),
      declaredSize: res?.declaredSize ?? null,
      actualSize: res?.actualSize ?? null,
      status: String(res?.status ?? ''),
      sortOrder: Number(res?.sortOrder ?? 0),
      createdAt: String(res?.createdAt ?? ''),
    };
  }

  async bulkDownloadUrls(appId: string, docIds: string[]): Promise<BulkDownloadItem[]> {
    const res = await this.http.json<{ downloads?: BulkDownloadItem[] }>(
      `/v2/apps/${appId}/documents/download-urls`,
      { method: 'POST', body: JSON.stringify({ docIds }) },
    );
    return Array.isArray(res?.downloads) ? res.downloads : [];
  }
}
