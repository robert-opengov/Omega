import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import { Heading, Text, Badge } from '@/components/ui/atoms';
import { gabTemplateRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { TemplateDetail } from './_components/TemplateDetail';

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  await featureGuard('platform.templates');
  const { templateId } = await params;

  const [templateResult, versionsResult, subscribersResult] = await Promise.allSettled([
    gabTemplateRepo.getTemplate(templateId),
    gabTemplateRepo.listVersions(templateId),
    gabTemplateRepo.listSubscribers(templateId),
  ]);

  if (templateResult.status === 'rejected') {
    notFound();
  }
  const template = templateResult.value;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/templates"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mt-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Templates
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded bg-primary-light flex items-center justify-center shrink-0">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <Heading as="h1">{template.name}</Heading>
          {template.description && (
            <Text size="sm" color="muted">{template.description}</Text>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge size="sm" variant={template.status === 'published' ? 'success' : 'default'}>
              {template.status}
            </Badge>
            <Badge size="sm" variant="info">v{template.currentVersion}</Badge>
          </div>
        </div>
      </div>

      <TemplateDetail
        template={template}
        initialVersions={
          versionsResult.status === 'fulfilled' ? versionsResult.value.items : []
        }
        versionsError={
          versionsResult.status === 'rejected'
            ? versionsResult.reason instanceof Error
              ? versionsResult.reason.message
              : 'Failed to load versions'
            : null
        }
        initialSubscribers={
          subscribersResult.status === 'fulfilled'
            ? subscribersResult.value.items
            : []
        }
        subscribersError={
          subscribersResult.status === 'rejected'
            ? subscribersResult.reason instanceof Error
              ? subscribersResult.reason.message
              : 'Failed to load subscribers'
            : null
        }
      />
    </div>
  );
}
