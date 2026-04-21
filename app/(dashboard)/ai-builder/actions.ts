'use server';

import { z } from 'zod';
import { gabSchemaRepo, aiGatewayPort } from '@/lib/core';
import type { AIMessage } from '@/lib/core/ports/ai-gateway.port';

export async function buildAppAction(prompt: string) {
  try {
    // In a real scenario, the AI would parse the prompt and call the schema repo.
    // Here we simulate the AI translating the prompt into GAB API calls.
    
    console.log(`[AI Builder] Analyzing prompt: "${prompt}"`);
    
    // 1. Simulate creating an app
    const appResult = await gabSchemaRepo.createApp({
      name: 'Generated App',
      companyKey: 'demo_company',
      // 'key' is optional, backend generates it if omitted
    });
    console.log('[AI Builder] App created:', appResult);

    const appKey = appResult?.Key || 'generated_app_key';

    // 2. Simulate creating a table
    const tableResult = await gabSchemaRepo.createTable({
      name: 'Generated Table',
      applicationKey: appKey,
      createReportAndForm: true, // This automatically creates a default form and report in the backend
    });
    console.log('[AI Builder] Table created:', tableResult);

    const tableKey = tableResult?.Key || 'generated_table_key';

    // 3. Simulate creating fields
    const fieldResult1 = await gabSchemaRepo.createField({
      applicationKey: appKey,
      name: 'Title',
      fieldType: 'text',
      applicationTableKey: tableKey,
      isNullable: false,
    });
    console.log('[AI Builder] Field 1 created:', fieldResult1);

    const fieldResult2 = await gabSchemaRepo.createField({
      applicationKey: appKey,
      name: 'Description',
      fieldType: 'textarea',
      applicationTableKey: tableKey,
      isNullable: true,
    });
    console.log('[AI Builder] Field 2 created:', fieldResult2);

    // Save configuration to a local file or environment (simulated)
    const config = {
      appKey,
      tableKey,
      fields: [fieldResult1?.Key, fieldResult2?.Key],
      status: 'success',
      message: 'App, Table, and Fields successfully generated and configured via GAB API.',
    };

    return config;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to build app';
    console.error('[AI Builder] Error:', msg);
    return { status: 'error', message: msg };
  }
}

/* ------------------------------------------------------------------ */
/*  Schema extraction — AI reads the conversation and creates schema   */
/* ------------------------------------------------------------------ */

const fieldSchema = z.object({
  name: z.string(),
  fieldType: z.string(),
  isNullable: z.boolean().optional(),
});

const tableSchema = z.object({
  name: z.string(),
  fields: z.array(fieldSchema),
});

const appSpecSchema = z.object({
  appName: z.string(),
  companyKey: z.string().default('demo_company'),
  tables: z.array(tableSchema).min(1),
});

type SchemaActionResult =
  | { success: true; created: { appKey: string; tableKeys: string[]; fieldKeys: string[] } }
  | { success: false; error: string };

const EXTRACTION_SYSTEM_PROMPT =
  'You are a schema extraction engine. Given a conversation about building a government application, ' +
  'extract a JSON specification with this exact shape:\n' +
  '{\n  "appName": "string",\n  "companyKey": "string (default: demo_company)",\n' +
  '  "tables": [{ "name": "string", "fields": [{ "name": "string", "fieldType": "text|textarea|number|date|email|phone|checkbox|select", "isNullable": true|false }] }]\n}\n' +
  'Return ONLY valid JSON. No markdown, no explanation, no code fences.';

export async function generateSchemaFromConversationAction(
  messages: AIMessage[],
): Promise<SchemaActionResult> {
  try {
    const extractionResult = await aiGatewayPort.converse({
      messages: [
        ...messages,
        {
          role: 'user',
          content: [{ text: 'Based on our conversation, extract the complete app specification as JSON.' }],
        },
      ],
      system: [{ text: EXTRACTION_SYSTEM_PROMPT }],
      inferenceConfig: { temperature: 0, maxTokens: 2048 },
    });

    let jsonText = extractionResult.text.trim();
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonText = fenceMatch[1].trim();

    const parsed = appSpecSchema.safeParse(JSON.parse(jsonText));
    if (!parsed.success) {
      return {
        success: false,
        error: `Invalid schema from AI: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const spec = parsed.data;

    const appResult = await gabSchemaRepo.createApp({
      name: spec.appName,
      companyKey: spec.companyKey,
    });
    const appKey: string = appResult?.Key || spec.appName.toLowerCase().replaceAll(/\s+/g, '_');

    const tableKeys: string[] = [];
    const fieldKeys: string[] = [];

    for (const table of spec.tables) {
      const tableResult = await gabSchemaRepo.createTable({
        name: table.name,
        applicationKey: appKey,
        createReportAndForm: true,
      });
      const tableKey: string = tableResult?.Key || table.name.toLowerCase().replaceAll(/\s+/g, '_');
      tableKeys.push(tableKey);

      for (const field of table.fields) {
        const fieldResult = await gabSchemaRepo.createField({
          applicationKey: appKey,
          applicationTableKey: tableKey,
          name: field.name,
          fieldType: field.fieldType,
          isNullable: field.isNullable ?? true,
        });
        if (fieldResult?.Key) fieldKeys.push(fieldResult.Key);
      }
    }

    return { success: true, created: { appKey, tableKeys, fieldKeys } };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Schema generation failed';
    console.error('[AI Builder] Schema generation error:', msg);
    return { success: false, error: msg };
  }
}
