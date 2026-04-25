import { gabTenantRepo } from '@/lib/core';
import { Card, CardContent } from '@/components/ui/molecules';
import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { CompanyDetailPanel } from '../_components/CompanyDetailPanel';
import type { GabTenant } from '@/lib/core/ports/tenant.repository';

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  let tenant: GabTenant | null = null;
  let loadError: string | null = null;

  try {
    tenant = await gabTenantRepo.getTenant(tenantId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load company';
  }

  if (loadError || !tenant) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">
                Could not load company
              </Text>
              <Text size="xs" color="muted">
                {loadError ?? 'Company not found'}
              </Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <CompanyDetailPanel tenant={tenant} />;
}
