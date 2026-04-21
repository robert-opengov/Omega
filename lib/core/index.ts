import { gabConfig } from '@/config/gab.config';
import { aiGatewayConfig } from '@/config/ai-gateway.config';
import { ocrConfig } from '@/config/ocr.config';
import { NextAuthAdapter } from './adapters/gab-v1/auth.adapter';
import { GabAuthV2Adapter } from './adapters/gab-v2/auth.adapter';
import { GabDataV1Adapter } from './adapters/gab-v1/data.v1.adapter';
import { GabDataV2Adapter } from './adapters/gab-v2/data.v2.adapter';
import { GabSchemaV1Adapter } from './adapters/gab-v1/schema.v1.adapter';
import { GabSchemaV2Adapter } from './adapters/gab-v2/schema.v2.adapter';
import { BedrockGatewayAdapter } from './adapters/gab-ai/bedrock-gateway.adapter';
import { OCRTesseractAdapter } from './adapters/ocr-tesseract/ocr.tesseract.adapter';
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
// OCR Service — standalone microservice for PDF text extraction
// Throws OCRServiceError at construction time if OCR_SERVICE_URL is not set.
// ---------------------------------------------------------------------------

export const ocrPort = new OCRTesseractAdapter(ocrConfig.baseUrl);

