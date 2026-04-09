'use server';

import { gabSchemaRepo } from '@/lib/core';

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
      name: 'Title',
      fieldType: 'text',
      applicationTableKey: tableKey,
      isNullable: false,
    });
    console.log('[AI Builder] Field 1 created:', fieldResult1);

    const fieldResult2 = await gabSchemaRepo.createField({
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
  } catch (error: any) {
    console.error('[AI Builder] Error:', error.message);
    return {
      status: 'error',
      message: error.message || 'Failed to build app',
    };
  }
}
