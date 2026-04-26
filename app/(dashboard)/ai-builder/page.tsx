import { aiGatewayConfig } from '@/config/ai-gateway.config';
import { featureGuard } from '@/lib/feature-guards';
import { AIBuilderClient } from './_components/AIBuilderClient';

export default async function AIBuilderPage() {
  await featureGuard('platform.aiBuilder');
  return <AIBuilderClient defaultModelId={aiGatewayConfig.defaultModelId} />;
}
