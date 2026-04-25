/**
 * Workspace document uploads and presigned URLs (attachments).
 */

export interface FileDescriptor {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface PresignedDocumentUpload {
  id: string;
  fileName: string;
  presignedUrl: string;
  method: 'PUT';
  expiresIn: number;
  headers: Record<string, string>;
}

export interface CreateDocumentsRequest {
  files: FileDescriptor[];
  tableKey?: string;
  attachmentId?: string;
}

export interface CreateDocumentsResult {
  attachmentId: string;
  documents: PresignedDocumentUpload[];
}

export interface DownloadUrlResult {
  id: string;
  presignedUrl: string;
  method: 'GET';
  expiresIn: number;
  fileName: string;
  contentType: string;
  actualSize: number | null;
}

export interface DocumentMetadata {
  id: string;
  s3FileKey: string;
  fileName: string;
  contentType: string;
  declaredSize: number | null;
  actualSize: number | null;
  status: string;
  sortOrder: number;
  createdAt: string;
}

export interface BulkDownloadItem {
  id: string;
  fileName: string;
  presignedUrl: string;
  contentType: string;
  actualSize: number | null;
}

export interface IGabDocumentRepository {
  createDocuments(
    appId: string,
    request: CreateDocumentsRequest,
  ): Promise<CreateDocumentsResult>;
  getDownloadUrl(
    appId: string,
    docId: string,
    fileName?: string,
  ): Promise<DownloadUrlResult>;
  getDocument(appId: string, docId: string): Promise<DocumentMetadata>;
  bulkDownloadUrls(
    appId: string,
    docIds: string[],
  ): Promise<BulkDownloadItem[]>;
}
