'use server';

/**
 * Server-side relay for the page-builder iframe SDK.
 *
 * Custom components inside the sandboxed iframe send `gab-request` postMessage
 * events. The host page collects these on the client and dispatches each one
 * through this action. The action calls the appropriate port (table / field /
 * data) so user code never gets a direct adapter reference and never sees
 * server-only secrets like access tokens.
 *
 * The bridge contract is intentionally narrow — only safe read operations
 * and explicit mutations are allow-listed.
 *
 * Methods past `getForms` are gated by `services.pageSdkExtended` — when
 * the flag is OFF the server returns an explicit denial, the iframe
 * runtime omits the method entirely (see `iframe-sandbox.ts`), and the
 * bridge cache stays inert. Toggling the flag back to ON restores
 * everything without a redeploy.
 */

import {
  gabTableRepo,
  gabFieldRepo,
  gabDataRepo,
  gabFormRepo,
  gabRelationshipRepo,
  gabDocumentRepo,
} from '@/lib/core';
import { isModuleEnabledNow } from '@/lib/feature-overrides';

export type SdkMethod =
  | 'getTables'
  | 'getFields'
  | 'getRecords'
  | 'createRecord'
  | 'updateRecord'
  | 'deleteRecord'
  | 'getForms'
  // Extended methods — gated by `services.pageSdkExtended`.
  | 'getRelatedRecords'
  | 'getDocuments'
  | 'uploadDocument'
  | 'getFormValues'
  | 'setFormFieldValue';

export const EXTENDED_SDK_METHODS: ReadonlySet<SdkMethod> = new Set<SdkMethod>([
  'getRelatedRecords',
  'getDocuments',
  'uploadDocument',
  'getFormValues',
  'setFormFieldValue',
]);

export interface SdkRequest {
  method: SdkMethod;
  params: Record<string, unknown>;
}

export interface SdkResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

const NUMBER_LIMIT_DEFAULT = 50;
const NUMBER_LIMIT_MAX = 500;

function clampLimit(input: unknown): number {
  const n = typeof input === 'number' && Number.isFinite(input) ? input : NUMBER_LIMIT_DEFAULT;
  if (n < 1) return 1;
  if (n > NUMBER_LIMIT_MAX) return NUMBER_LIMIT_MAX;
  return Math.floor(n);
}

function asString(v: unknown, label: string): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Missing required parameter: ${label}`);
  }
  return v;
}

function asNumber(v: unknown, label: string): number {
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new Error(`Missing or invalid numeric parameter: ${label}`);
  }
  return n;
}

export async function pageSdkInvokeAction(
  appId: string,
  request: SdkRequest,
): Promise<SdkResult> {
  try {
    const { method, params } = request;

    if (EXTENDED_SDK_METHODS.has(method)) {
      const enabled = await isModuleEnabledNow('services.pageSdkExtended');
      if (!enabled) {
        return {
          ok: false,
          error: `Extended SDK is disabled (services.pageSdkExtended). Method "${method}" is unavailable.`,
        };
      }
    }

    switch (method) {
      case 'getTables': {
        const out = await gabTableRepo.listTables(appId);
        return {
          ok: true,
          data: out.items.map((t) => ({ key: t.key, name: t.name, id: t.id })),
        };
      }
      case 'getFields': {
        const tableKey = asString(params.tableKey, 'tableKey');
        const out = await gabFieldRepo.listFields(appId, tableKey);
        return {
          ok: true,
          data: out.items.map((f) => ({
            key: f.key,
            name: f.name,
            type: f.type,
            required: f.required,
          })),
        };
      }
      case 'getRecords': {
        const tableKey = asString(params.tableKey, 'tableKey');
        const limit = clampLimit(params.limit);
        const offset = typeof params.offset === 'number' ? params.offset : 0;
        const filters = (params.filters ?? undefined) as Record<string, unknown> | undefined;
        const search = typeof params.search === 'string' ? params.search : undefined;
        const out = await gabDataRepo.fetchRows({
          tableKey,
          applicationKey: appId,
          limit,
          offset,
          filters,
          search,
        });
        return { ok: true, data: { rows: out.data, total: out.total } };
      }
      case 'createRecord': {
        const tableKey = asString(params.tableKey, 'tableKey');
        const data = (params.data ?? {}) as Record<string, unknown>;
        const created = await gabDataRepo.createRow(tableKey, appId, data);
        return { ok: true, data: created };
      }
      case 'updateRecord': {
        const tableKey = asString(params.tableKey, 'tableKey');
        const recordId = Number(params.recordId);
        if (!Number.isFinite(recordId)) {
          throw new Error('updateRecord requires a numeric recordId');
        }
        const data = (params.data ?? {}) as Record<string, unknown>;
        const updated = await gabDataRepo.updateRow(tableKey, appId, recordId, data);
        return { ok: true, data: updated };
      }
      case 'deleteRecord': {
        const tableKey = asString(params.tableKey, 'tableKey');
        const recordId = Number(params.recordId);
        if (!Number.isFinite(recordId)) {
          throw new Error('deleteRecord requires a numeric recordId');
        }
        const result = await gabDataRepo.deleteRows(tableKey, appId, [recordId]);
        return { ok: true, data: result };
      }
      case 'getForms': {
        const out = await gabFormRepo.listForms(appId);
        return {
          ok: true,
          data: out.items.map((f) => ({ id: f.id, key: f.key, name: f.name })),
        };
      }

      // ── Extended methods ─────────────────────────────────────────────

      case 'getRelatedRecords': {
        // Returns child rows whose FK references the given parent record.
        // params: { parentTableKey, parentRecordId, childTableKey, limit?, offset? }
        const parentTableKey = asString(params.parentTableKey, 'parentTableKey');
        const parentRecordId = asNumber(params.parentRecordId, 'parentRecordId');
        const childTableKey = asString(params.childTableKey, 'childTableKey');
        const limit = clampLimit(params.limit);
        const offset = typeof params.offset === 'number' ? params.offset : 0;

        // Resolve the relationship to learn the FK column on the child table.
        const parentTable = (await gabTableRepo.listTables(appId)).items.find(
          (t) => t.key === parentTableKey,
        );
        if (!parentTable) {
          throw new Error(`Unknown parent table: ${parentTableKey}`);
        }
        const rels = await gabRelationshipRepo.listRelationships(appId, parentTable.id);
        const rel = rels.items.find(
          (r) => r.parentTableKey === parentTableKey && r.childTableKey === childTableKey,
        );
        if (!rel) {
          throw new Error(
            `No relationship between ${parentTableKey} and ${childTableKey}`,
          );
        }

        const out = await gabDataRepo.fetchRows({
          tableKey: childTableKey,
          applicationKey: appId,
          limit,
          offset,
          filters: { [rel.childFkField]: parentRecordId },
        });
        return { ok: true, data: { rows: out.data, total: out.total, fk: rel.childFkField } };
      }

      case 'getDocuments': {
        // Resolves presigned download URLs for a list of document ids.
        // params: { docIds: string[] }
        const ids = Array.isArray(params.docIds)
          ? (params.docIds as unknown[]).map((d) => String(d))
          : [];
        if (ids.length === 0) return { ok: true, data: [] };
        const docs = await gabDocumentRepo.bulkDownloadUrls(appId, ids);
        return { ok: true, data: docs };
      }

      case 'uploadDocument': {
        // Returns a single presigned PUT URL the iframe can fetch directly.
        // params: { fileName, contentType, fileSize, tableKey?, attachmentId? }
        const fileName = asString(params.fileName, 'fileName');
        const contentType = asString(params.contentType, 'contentType');
        const fileSize = asNumber(params.fileSize, 'fileSize');
        const tableKey = typeof params.tableKey === 'string' ? params.tableKey : undefined;
        const attachmentId =
          typeof params.attachmentId === 'string' ? params.attachmentId : undefined;
        const result = await gabDocumentRepo.createDocuments(appId, {
          files: [{ fileName, contentType, fileSize }],
          tableKey,
          attachmentId,
        });
        const upload = result.documents[0];
        if (!upload) {
          throw new Error('uploadDocument: no presigned upload returned by adapter.');
        }
        return {
          ok: true,
          data: { attachmentId: result.attachmentId, upload },
        };
      }

      case 'getFormValues':
      case 'setFormFieldValue': {
        // Form-widget channel methods are handled entirely on the host
        // (see iframe-bridge.ts). They never reach this server action;
        // when they do, it's a misconfigured runtime — fail loud.
        return {
          ok: false,
          error: `${method} is a host-side channel method, not a server SDK call.`,
        };
      }

      default:
        return { ok: false, error: `Unsupported SDK method: ${method as string}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SDK invocation failed.';
    return { ok: false, error: message };
  }
}
