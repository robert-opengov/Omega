'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  Upload,
  History,
  Users,
  AlertCircle,
  ArrowRight,
  PackageCheck,
} from 'lucide-react';
import { Badge, Button, Text, Textarea } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  EmptyState,
  Modal,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/molecules';
import { publishTemplateAction } from '@/app/actions/templates';
import type {
  GabTemplate,
  GabTemplateVersion,
  TemplateSubscriber,
} from '@/lib/core/ports/template.repository';

export interface TemplateDetailProps {
  template: GabTemplate;
  initialVersions: GabTemplateVersion[];
  versionsError: string | null;
  initialSubscribers: TemplateSubscriber[];
  subscribersError: string | null;
}

export function TemplateDetail({
  template,
  initialVersions,
  versionsError,
  initialSubscribers,
  subscribersError,
}: TemplateDetailProps) {
  const router = useRouter();
  const [publishOpen, setPublishOpen] = useState(false);
  const [changelog, setChangelog] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const publish = () => {
    setError(null);
    startTransition(async () => {
      const res = await publishTemplateAction(template.id, {
        ...(changelog ? { changelog } : {}),
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setPublishOpen(false);
      setChangelog('');
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => setPublishOpen(true)}>
          <PackageCheck className="h-4 w-4 mr-1.5" />
          Publish new version
        </Button>
        {template.sourceAppId && (
          <Link href={`/apps/${template.sourceAppId}`}>
            <Button variant="outline">
              Open source app
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="versions">
        <TabsList>
          <TabsTrigger value="versions">
            <History className="h-3.5 w-3.5 mr-1.5" />
            Versions
            <Badge size="sm" variant="default" className="ml-2">
              {initialVersions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="subscribers">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Subscribers
            <Badge size="sm" variant="default" className="ml-2">
              {initialSubscribers.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {versionsError ? (
                <div className="flex items-start gap-2 p-2 rounded bg-danger-light text-danger-text">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <Text size="sm">{versionsError}</Text>
                </div>
              ) : initialVersions.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No published versions yet"
                  description="Publish the template to lock in the current schema as v1."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {initialVersions.map((v) => (
                    <li key={v.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                      <Badge variant="info" size="sm">v{v.version}</Badge>
                      <div className="min-w-0 flex-1">
                        <Text size="sm" weight="medium" className="truncate">
                          {v.changelog || 'No changelog'}
                        </Text>
                        <Text size="xs" color="muted">
                          Published {new Date(v.publishedAt).toLocaleString()}
                          {v.publishedBy ? ` · by ${v.publishedBy}` : ''}
                        </Text>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {subscribersError ? (
                <div className="flex items-start gap-2 p-2 rounded bg-danger-light text-danger-text">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <Text size="sm">{subscribersError}</Text>
                </div>
              ) : initialSubscribers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No subscribers yet"
                  description="Apps stamped from this template appear here automatically."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {initialSubscribers.map((s) => {
                    const behind = template.currentVersion - s.appliedVersion;
                    return (
                      <li
                        key={s.appId}
                        className="py-3 first:pt-0 last:pb-0 flex items-center gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/apps/${s.appId}`}
                            className="text-sm font-medium hover:underline truncate block"
                          >
                            {s.appName}
                          </Link>
                          <Text size="xs" color="muted" className="font-mono truncate">
                            {s.appKey}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="default" size="sm">v{s.appliedVersion}</Badge>
                          {behind > 0 && (
                            <Badge variant="warning" size="sm">
                              {behind} behind
                            </Badge>
                          )}
                          <Badge
                            variant={s.updateStatus === 'up_to_date' ? 'success' : 'info'}
                            size="sm"
                          >
                            {s.updateStatus.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Modal
        open={publishOpen}
        onOpenChange={(open) => {
          setPublishOpen(open);
          if (!open) {
            setError(null);
            setChangelog('');
          }
        }}
        title="Publish new version"
        description={`Promotes the current schema of "${template.name}" as v${template.currentVersion + 1}.`}
        primaryAction={{
          label: pending ? 'Publishing…' : 'Publish',
          onClick: publish,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setPublishOpen(false),
        }}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Changelog (optional)</label>
            <Textarea
              rows={4}
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="What changed in this version?"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-2 rounded bg-danger-light text-danger-text">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <Text size="sm">{error}</Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
