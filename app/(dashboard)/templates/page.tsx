import Link from 'next/link';
import { gabTemplateRepo, gabTenantRepo } from '@/lib/core';
import { Card, CardContent } from '@/components/ui/molecules';
import { Heading, Text } from '@/components/ui/atoms';
import { AlertCircle } from 'lucide-react';
import { TemplatesCatalog } from './_components/TemplatesCatalog';

export default async function TemplatesPage() {
  const [templatesResult, tenantsResult] = await Promise.allSettled([
    gabTemplateRepo.listTemplates(),
    gabTenantRepo.listTenants(),
  ]);

  if (templatesResult.status === 'rejected') {
    const message =
      templatesResult.reason instanceof Error
        ? templatesResult.reason.message
        : 'Failed to load templates';
    return (
      <div className="space-y-4">
        <Heading as="h1">Templates</Heading>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
              <div>
                <Text weight="medium" size="sm">Could not load templates</Text>
                <Text size="xs" color="muted">{message}</Text>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const templates = templatesResult.value.items;
  const tenants =
    tenantsResult.status === 'fulfilled' ? tenantsResult.value.items : [];

  return <TemplatesCatalog initialTemplates={templates} tenants={tenants} />;
}
