'use server';

/**
 * AI tool action layer.
 *
 * Surfaces a closed set of read/write operations to the AI Assistant /
 * Builder drawers. Each tool is a thin wrapper around an existing port
 * so removal is a single delete and there is no second source of truth
 * for the underlying logic.
 *
 * Every tool guards on the relevant `services.aiAssistant` /
 * `services.aiAppBuilder` flag at the top, which means a stale client
 * cannot reach them after the user toggles the flag off in
 * `/settings/modules`.
 *
 * The tool catalog is exported (`AI_TOOLS`) so the drawer UI can render
 * a deterministic palette of available tools and pass tool specs to
 * `converseAction`.
 */

import { z } from 'zod';
import {
  gabSchemaRepo,
  gabDataRepo,
  gabFormRepo,
  gabPageRepo,
  gabTableRepo,
} from '@/lib/core';
import { assertModuleEnabled } from '@/lib/feature-guards';
import type { ModulePath } from '@/config/modules.config';

/* ------------------------------------------------------------------ */
/*  Tool schemas                                                       */
/* ------------------------------------------------------------------ */

const listTablesSchema = z.object({ appId: z.string().min(1) });
const listFormsSchema = z.object({ appId: z.string().min(1) });
const listPagesSchema = z.object({ appId: z.string().min(1) });
const fetchRowsSchema = z.object({
  appId: z.string().min(1),
  tableKey: z.string().min(1),
  limit: z.number().int().positive().max(200).optional(),
  search: z.string().optional(),
});
const createRowSchema = z.object({
  appId: z.string().min(1),
  tableKey: z.string().min(1),
  data: z.record(z.unknown()),
});
const updateRowSchema = z.object({
  appId: z.string().min(1),
  tableKey: z.string().min(1),
  rowId: z.number().int().positive(),
  data: z.record(z.unknown()),
});
const getSchemaSchema = z.object({
  appId: z.string().min(1),
  tableId: z.string().min(1),
});

/* ------------------------------------------------------------------ */
/*  Result envelope                                                    */
/* ------------------------------------------------------------------ */

export type ToolResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: 'auth' | 'flag' | 'validation' };

/* ------------------------------------------------------------------ */
/*  Tool catalog (used by drawer UIs to render a palette)              */
/* ------------------------------------------------------------------ */

export type AiToolName =
  | 'listTables'
  | 'listForms'
  | 'listPages'
  | 'fetchRows'
  | 'createRow'
  | 'updateRow'
  | 'getTableSchema';

export interface AiToolDescriptor {
  name: AiToolName;
  description: string;
  /**
   * The flag that gates this tool. When the flag is OFF the action returns
   * `code: 'flag'` so callers can present a graceful "this assistant has
   * no access to that tool right now" message.
   */
  flag: ModulePath;
  /** JSON-schema-ish input shape for the model. */
  inputSchema: Record<string, unknown>;
}

export const AI_TOOLS: readonly AiToolDescriptor[] = [
  {
    name: 'listTables',
    description: 'List tables in the current app.',
    flag: 'services.aiAssistant',
    inputSchema: { type: 'object', properties: { appId: { type: 'string' } }, required: ['appId'] },
  },
  {
    name: 'listForms',
    description: 'List forms in the current app.',
    flag: 'services.aiAssistant',
    inputSchema: { type: 'object', properties: { appId: { type: 'string' } }, required: ['appId'] },
  },
  {
    name: 'listPages',
    description: 'List pages in the current app.',
    flag: 'services.aiAssistant',
    inputSchema: { type: 'object', properties: { appId: { type: 'string' } }, required: ['appId'] },
  },
  {
    name: 'fetchRows',
    description: 'Fetch rows from a table by key (read-only).',
    flag: 'services.aiAssistant',
    inputSchema: {
      type: 'object',
      properties: {
        appId: { type: 'string' },
        tableKey: { type: 'string' },
        limit: { type: 'number' },
        search: { type: 'string' },
      },
      required: ['appId', 'tableKey'],
    },
  },
  {
    name: 'createRow',
    description: 'Create a new row in a table. App Builder only.',
    flag: 'services.aiAppBuilder',
    inputSchema: {
      type: 'object',
      properties: {
        appId: { type: 'string' },
        tableKey: { type: 'string' },
        data: { type: 'object' },
      },
      required: ['appId', 'tableKey', 'data'],
    },
  },
  {
    name: 'updateRow',
    description: 'Update a row in a table. App Builder only.',
    flag: 'services.aiAppBuilder',
    inputSchema: {
      type: 'object',
      properties: {
        appId: { type: 'string' },
        tableKey: { type: 'string' },
        rowId: { type: 'number' },
        data: { type: 'object' },
      },
      required: ['appId', 'tableKey', 'rowId', 'data'],
    },
  },
  {
    name: 'getTableSchema',
    description: 'Get the schema (fields) of a table by id.',
    flag: 'services.aiAssistant',
    inputSchema: {
      type: 'object',
      properties: { appId: { type: 'string' }, tableId: { type: 'string' } },
      required: ['appId', 'tableId'],
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Dispatcher                                                         */
/* ------------------------------------------------------------------ */

/**
 * Single dispatch entry point so the drawer UI can call any tool by name.
 * Server-action friendly: returns a typed envelope rather than throwing.
 */
export async function aiToolAction(
  name: AiToolName,
  raw: unknown,
): Promise<ToolResult> {
  const descriptor = AI_TOOLS.find((t) => t.name === name);
  if (!descriptor) {
    return { success: false, error: `Unknown tool: ${name}`, code: 'validation' };
  }

  try {
    await assertModuleEnabled(descriptor.flag);
  } catch {
    return {
      success: false,
      error: `${descriptor.flag} is disabled.`,
      code: 'flag',
    };
  }

  try {
    switch (name) {
      case 'listTables': {
        const { appId } = listTablesSchema.parse(raw);
        const res = await gabTableRepo.listTables(appId);
        return { success: true, data: res };
      }
      case 'listForms': {
        const { appId } = listFormsSchema.parse(raw);
        const res = await gabFormRepo.listForms(appId);
        return { success: true, data: res };
      }
      case 'listPages': {
        const { appId } = listPagesSchema.parse(raw);
        const res = await gabPageRepo.listPages(appId);
        return { success: true, data: res };
      }
      case 'fetchRows': {
        const { appId, tableKey, limit, search } = fetchRowsSchema.parse(raw);
        const res = await gabDataRepo.fetchRows({
          applicationKey: appId,
          tableKey,
          limit: limit ?? 50,
          search,
        });
        return { success: true, data: res };
      }
      case 'createRow': {
        const { appId, tableKey, data } = createRowSchema.parse(raw);
        const res = await gabDataRepo.createRow(tableKey, appId, data);
        return { success: true, data: res };
      }
      case 'updateRow': {
        const { appId, tableKey, rowId, data } = updateRowSchema.parse(raw);
        const res = await gabDataRepo.updateRow(tableKey, appId, rowId, data);
        return { success: true, data: res };
      }
      case 'getTableSchema': {
        const { appId, tableId } = getSchemaSchema.parse(raw);
        const fields = await gabSchemaRepo.listFields(appId, tableId);
        return { success: true, data: fields };
      }
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        error: err.issues.map((i) => i.message).join('; '),
        code: 'validation',
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Tool execution failed.',
    };
  }
}
