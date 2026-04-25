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
 */

import {
  gabTableRepo,
  gabFieldRepo,
  gabDataRepo,
  gabFormRepo,
} from '@/lib/core';

export type SdkMethod =
  | 'getTables'
  | 'getFields'
  | 'getRecords'
  | 'createRecord'
  | 'updateRecord'
  | 'deleteRecord'
  | 'getForms';

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

export async function pageSdkInvokeAction(
  appId: string,
  request: SdkRequest,
): Promise<SdkResult> {
  try {
    const { method, params } = request;
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
      default:
        return { ok: false, error: `Unsupported SDK method: ${method as string}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SDK invocation failed.';
    return { ok: false, error: message };
  }
}
