import { gabTenantRepo } from '@/lib/core';
import { Card, CardContent } from '@/components/ui/molecules';
import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { CompaniesPanel } from './_components/CompaniesPanel';
import type { GabTenant } from '@/lib/core/ports/tenant.repository';

export default async function CompaniesPage() {
  let tenants: GabTenant[] = [];
  let total = 0;
  let loadError: string | null = null;

  try {
    const res = await gabTenantRepo.listTenants();
    tenants = res.items;
    total = res.total;
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load companies';
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">
                Could not load companies
              </Text>
              <Text size="xs" color="muted">
                {loadError}
              </Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <CompaniesPanel tenants={tenants} total={total} />;
}
