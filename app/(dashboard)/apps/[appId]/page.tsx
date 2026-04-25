import Link from 'next/link';
import {
  gabAppRepo,
  gabTableRepo,
  gabRelationshipRepo,
  gabAppRoleRepo,
} from '@/lib/core';
import { Badge, Button, Heading, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  MetricCard,
} from '@/components/ui/molecules';
import {
  Database,
  GitBranch,
  Users,
  Activity,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { AppOverviewActions } from './_components/AppOverviewActions';

export default async function AppOverviewPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  // Parallel-fetch all overview metrics. Each call is wrapped so a single
  // 5xx doesn't blank out the whole page — the component renders a
  // per-card error state instead.
  const [tablesRes, relsRes, rolesRes, complexityRes] = await Promise.allSettled([
    gabTableRepo.listTables(appId),
    gabRelationshipRepo.listRelationships(appId),
    gabAppRoleRepo.listRoles(appId),
    gabAppRepo.getComplexityScore(appId),
  ]);

  const tableCount = tablesRes.status === 'fulfilled' ? tablesRes.value.total : null;
  const relCount = relsRes.status === 'fulfilled' ? relsRes.value.total : null;
  const roleCount = rolesRes.status === 'fulfilled' ? rolesRes.value.total : null;
  const complexity = complexityRes.status === 'fulfilled' ? complexityRes.value : null;
  const complexityError =
    complexityRes.status === 'rejected'
      ? complexityRes.reason instanceof Error
        ? complexityRes.reason.message
        : 'Failed to load complexity'
      : null;

  const tables = tablesRes.status === 'fulfilled' ? tablesRes.value.items : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Heading as="h2" className="text-base">App overview</Heading>
          <Text size="sm" color="muted">
            High-level metrics and quick actions for this app.
          </Text>
        </div>
        <AppOverviewActions appId={appId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tables"
          value={tableCount === null ? '—' : String(tableCount)}
          icon={Database}
        />
        <MetricCard
          title="Relationships"
          value={relCount === null ? '—' : String(relCount)}
          icon={GitBranch}
        />
        <MetricCard
          title="Roles"
          value={roleCount === null ? '—' : String(roleCount)}
          icon={Users}
        />
        <MetricCard
          title="Complexity"
          value={complexity ? complexity.tier : '—'}
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tables</CardTitle>
            <CardDescription>
              Each table has its own schema, fields, and computed-field DAG.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {tables.length === 0 ? (
              <Text size="sm" color="muted">
                No tables yet.{' '}
                <Link href={`/apps/${appId}/tables`} className="text-primary">
                  Create the first one
                </Link>
                .
              </Text>
            ) : (
              <ul className="divide-y divide-border">
                {tables.slice(0, 8).map((table) => (
                  <li key={table.id}>
                    <Link
                      href={`/apps/${appId}/tables/${table.id}`}
                      className="flex items-center justify-between py-2 group"
                    >
                      <div className="min-w-0">
                        <Text size="sm" weight="medium" className="truncate">
                          {table.name}
                        </Text>
                        <Text size="xs" color="muted" className="font-mono truncate">
                          {table.key}
                        </Text>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {tables.length > 8 && (
              <div className="pt-3">
                <Link href={`/apps/${appId}/tables`}>
                  <Button variant="outline" size="sm">
                    View all {tables.length} tables
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compute complexity</CardTitle>
            <CardDescription>
              Estimated cost per write across the field DAG.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {complexityError ? (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-warning-text mt-0.5 shrink-0" />
                <Text size="sm" color="muted">{complexityError}</Text>
              </div>
            ) : complexity ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={tierVariant(complexity.tier)} size="md">
                    {complexity.tier}
                  </Badge>
                  <Text size="sm" weight="medium">
                    Score {complexity.overallScore}
                  </Text>
                </div>
                <Text size="xs" color="muted">
                  {complexity.tierDescription}
                </Text>
                {complexity.recommendations.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <Text size="xs" weight="medium">Top recommendation</Text>
                    <Text size="xs" color="muted">
                      {complexity.recommendations[0].title}
                    </Text>
                  </div>
                )}
              </>
            ) : (
              <Text size="sm" color="muted">
                Complexity score not available.
              </Text>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function tierVariant(tier: string) {
  switch (tier) {
    case 'Simple':
      return 'success' as const;
    case 'Moderate':
      return 'info' as const;
    case 'Complex':
      return 'warning' as const;
    case 'Extreme':
      return 'danger' as const;
    default:
      return 'default' as const;
  }
}
