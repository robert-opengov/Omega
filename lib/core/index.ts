import { gabConfig } from '@/config/gab.config';
import { aiGatewayConfig } from '@/config/ai-gateway.config';
import { ocrConfig } from '@/config/ocr.config';
import { NextAuthAdapter } from './adapters/gab-v1/auth.adapter';
import { GabAuthV2Adapter } from './adapters/gab-v2/auth.adapter';
import { GabDataV1Adapter } from './adapters/gab-v1/data.v1.adapter';
import { GabDataV2Adapter } from './adapters/gab-v2/data.v2.adapter';
import { GabSchemaV1Adapter } from './adapters/gab-v1/schema.v1.adapter';
import { GabSchemaV2Adapter } from './adapters/gab-v2/schema.v2.adapter';
import { GabUserV1Adapter } from './adapters/gab-v1/user.adapter';
import { GabUserV2Adapter } from './adapters/gab-v2/user.adapter';
import { GabNotificationsV1Adapter } from './adapters/gab-v1/notifications.adapter';
import { GabNotificationsV2Adapter } from './adapters/gab-v2/notifications.adapter';
import { GabAppRoleV1Adapter } from './adapters/gab-v1/app-role.adapter';
import { GabAppRoleV2Adapter } from './adapters/gab-v2/app-role.adapter';
import { GabAppV2Adapter } from './adapters/gab-v2/app.v2.adapter';
import { GabTenantV2Adapter } from './adapters/gab-v2/tenant.v2.adapter';
import { GabTableV2Adapter } from './adapters/gab-v2/table.v2.adapter';
import { GabFieldV2Adapter } from './adapters/gab-v2/field.v2.adapter';
import { GabRelationshipV2Adapter } from './adapters/gab-v2/relationship.v2.adapter';
import { GabSandboxV2Adapter } from './adapters/gab-v2/sandbox.v2.adapter';
import { GabTemplateV2Adapter } from './adapters/gab-v2/template.v2.adapter';
import { GabPublicAccessV2Adapter } from './adapters/gab-v2/public-access.v2.adapter';
import { GabJobV2Adapter } from './adapters/gab-v2/job.v2.adapter';
import { GabAuditLogV2Adapter } from './adapters/gab-v2/audit-log.v2.adapter';
import { GabFormV1Adapter } from './adapters/gab-v1/form.adapter';
import { GabFormV2Adapter } from './adapters/gab-v2/form.v2.adapter';
import { GabPublicFormV2Adapter } from './adapters/gab-v2/public-form.v2.adapter';
import { GabWorkflowV1Adapter } from './adapters/gab-v1/workflow.adapter';
import { GabWorkflowV2Adapter } from './adapters/gab-v2/workflow.v2.adapter';
import { BedrockGatewayAdapter } from './adapters/gab-ai/bedrock-gateway.adapter';
import { OCRTesseractAdapter } from './adapters/ocr-tesseract/ocr.tesseract.adapter';
import { OCRMockAdapter } from './adapters/ocr-mock/ocr.mock.adapter';
// ---------------------------------------------------------------------------
// Composition Root — the single place where ports are wired to adapters.
//
// gabConfig.apiVersion ('v1' | 'v2') controls which adapters are used.
// gabConfig.apiUrl is auto-resolved per version (override with GAB_API_URL).
// ---------------------------------------------------------------------------

const { apiVersion, apiUrl } = gabConfig;

function buildAuthPort() {
  if (apiVersion === 'v2') {
    return new GabAuthV2Adapter(apiUrl);
  }
  return new NextAuthAdapter(apiUrl, gabConfig.clientId);
}

export const authPort = buildAuthPort();

export const gabDataRepo = apiVersion === 'v2'
  ? new GabDataV2Adapter(authPort, apiUrl)
  : new GabDataV1Adapter(authPort, apiUrl);

export const gabSchemaRepo = apiVersion === 'v2'
  ? new GabSchemaV2Adapter(authPort, apiUrl)
  : new GabSchemaV1Adapter(authPort, apiUrl);

export const gabUserRepo = apiVersion === 'v2'
  ? new GabUserV2Adapter(authPort, apiUrl)
  : new GabUserV1Adapter(authPort, apiUrl);

export const gabNotificationRepo = apiVersion === 'v2'
  ? new GabNotificationsV2Adapter(authPort, apiUrl)
  : new GabNotificationsV1Adapter(authPort, apiUrl);

export const gabAppRoleRepo = apiVersion === 'v2'
  ? new GabAppRoleV2Adapter(authPort, apiUrl)
  : new GabAppRoleV1Adapter(authPort, apiUrl);

// ---------------------------------------------------------------------------
// GAB Core admin/runtime ports — V2 only.
//
// These power the multi-app admin UI under app/(dashboard)/apps/[appId]/...
// V1 has no equivalent surface, so the V2 adapters are wired unconditionally.
// They will throw at call time if the configured api version is V1.
// ---------------------------------------------------------------------------

export const gabAppRepo = new GabAppV2Adapter(authPort, apiUrl);
export const gabTenantRepo = new GabTenantV2Adapter(authPort, apiUrl);
export const gabTableRepo = new GabTableV2Adapter(authPort, apiUrl);
export const gabFieldRepo = new GabFieldV2Adapter(authPort, apiUrl);
export const gabRelationshipRepo = new GabRelationshipV2Adapter(authPort, apiUrl);
export const gabSandboxRepo = new GabSandboxV2Adapter(authPort, apiUrl);
export const gabTemplateRepo = new GabTemplateV2Adapter(authPort, apiUrl);
export const gabPublicAccessRepo = new GabPublicAccessV2Adapter(authPort, apiUrl);
export const gabJobRepo = new GabJobV2Adapter(authPort, apiUrl);
export const gabAuditLogRepo = new GabAuditLogV2Adapter(authPort, apiUrl);
export const gabFormRepo = apiVersion === 'v2'
  ? new GabFormV2Adapter(authPort, apiUrl)
  : new GabFormV1Adapter(authPort, apiUrl);
export const gabPublicFormRepo = apiVersion === 'v2'
  ? new GabPublicFormV2Adapter(apiUrl)
  : new GabFormV1Adapter(authPort, apiUrl);
export const gabWorkflowRepo = apiVersion === 'v2'
  ? new GabWorkflowV2Adapter(authPort, apiUrl)
  : new GabWorkflowV1Adapter(authPort, apiUrl);

// ---------------------------------------------------------------------------
// AI Gateway — Bedrock proxy via GAB AI Gateway
// Throws AIGatewayAuthError at call time if AI_GATEWAY_TOKEN is not set.
// ---------------------------------------------------------------------------

export const aiGatewayPort = new BedrockGatewayAdapter(
  aiGatewayConfig.baseUrl,
  aiGatewayConfig.token,
  aiGatewayConfig.defaultModelId,
);

// ---------------------------------------------------------------------------
// OCR Service — standalone microservice for PDF text extraction.
//
// Set USE_MOCK_OCR=true to bypass the real OCR microservice and use an
// in-memory mock that simulates the three-call lifecycle. Useful for local
// dev without OCR_SERVICE_URL configured.
// ---------------------------------------------------------------------------

const useMockOcr = process.env.USE_MOCK_OCR === 'true';

export const ocrPort = useMockOcr
  ? new OCRMockAdapter()
  : new OCRTesseractAdapter(ocrConfig.baseUrl);

