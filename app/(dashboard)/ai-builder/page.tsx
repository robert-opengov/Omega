import { aiGatewayConfig } from '@/config/ai-gateway.config';
import { AIBuilderClient } from './_components/AIBuilderClient';

export default function AIBuilderPage() {
  return <AIBuilderClient defaultModelId={aiGatewayConfig.defaultModelId} />;
}
