'use client';

import { useState } from 'react';
import {
  ResponsiveGrid,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  MetricCard,
  ContentHeader,
} from '@/components/ui/molecules';
import { Button, IconButton, UILink } from '@/components/ui/atoms';
import { BarChart3, Users, DollarSign, FileText, Clock, ChevronLeft, RefreshCw } from 'lucide-react';

const stats = [
  { label: 'Total Revenue', value: '$48,290', icon: DollarSign, trend: '+12.5%' },
  { label: 'Active Users', value: '2,847', icon: Users, trend: '+8.1%' },
  { label: 'Reports Filed', value: '1,024', icon: FileText, trend: '+3.2%' },
  { label: 'Avg. Response', value: '2.4h', icon: Clock, trend: '-15%' },
];

const projects = [
  { title: 'Infrastructure Review', status: 'In Progress', description: 'Annual review of municipal infrastructure assets and maintenance schedules.' },
  { title: 'Budget Allocation Q3', status: 'Pending', description: 'Quarterly budget allocation review for public works department.' },
  { title: 'Permit Processing', status: 'Complete', description: 'Digitization of building permit application and approval workflows.' },
  { title: 'Community Survey', status: 'In Progress', description: 'Resident satisfaction survey for parks and recreation services.' },
  { title: 'Fleet Management', status: 'Pending', description: 'Vehicle fleet tracking and maintenance scheduling system rollout.' },
  { title: 'Water Quality Report', status: 'Complete', description: 'Quarterly water quality testing results and compliance documentation.' },
];

const statusColor: Record<string, string> = {
  'In Progress': 'text-blue-600 bg-blue-50',
  Pending: 'text-amber-600 bg-amber-50',
  Complete: 'text-green-600 bg-green-50',
};

export default function GridTestPage() {
  const [constrainNav, setConstrainNav] = useState(false);
  const [constrainHeader, setConstrainHeader] = useState(false);
  const [constrainContent, setConstrainContent] = useState(false);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `:root {
            --nav-max-width: ${constrainNav ? '1440px' : 'none'};
            --header-max-width: ${constrainHeader ? '1440px' : 'none'};
            --content-max-width: ${constrainContent ? '1440px' : 'none'};
          }`,
        }}
      />

      <ContentHeader
        navActions={
          <>
            <IconButton icon={ChevronLeft} label="Back" variant="outline" size="sm" />
            <IconButton icon={RefreshCw} label="Refresh" variant="outline" size="sm" />
          </>
        }
        utilityActions={<UILink href="/settings">Settings</UILink>}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Grid Test' }]}
        title="Layout Constraint Test"
        subtitle="Toggle the CSS variables to see the navbar and content area constrain independently."
      />

      <div className="bg-surface-canvas">
        <div className="p-6 space-y-8 max-w-[var(--content-max-width)] mx-auto">

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Controls</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              variant={constrainNav ? 'primary' : 'outline'}
              onClick={() => setConstrainNav(!constrainNav)}
            >
              --nav-max-width: {constrainNav ? '1440px' : 'none'}
            </Button>
            <Button
              variant={constrainHeader ? 'primary' : 'outline'}
              onClick={() => setConstrainHeader(!constrainHeader)}
            >
              --header-max-width: {constrainHeader ? '1440px' : 'none'}
            </Button>
            <Button
              variant={constrainContent ? 'primary' : 'outline'}
              onClick={() => setConstrainContent(!constrainContent)}
            >
              --content-max-width: {constrainContent ? '1440px' : 'none'}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Widen your browser past 1440px to see the effect. Backgrounds always extend full width.</p>
            <p><strong>--nav-max-width</strong> constrains the navbar inner content.</p>
            <p><strong>--header-max-width</strong> constrains the ContentHeader content. Defaults to --content-max-width if not set independently.</p>
            <p><strong>--content-max-width</strong> constrains the main page content area.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Metric Cards</h2>
          <ResponsiveGrid columns={{ default: 1, sm: 2, lg: 4 }} gap="md">
            {stats.map((stat) => (
              <MetricCard
                key={stat.label}
                title={stat.label}
                value={stat.value}
                icon={stat.icon}
                trend={
                  <span className={stat.trend.startsWith('+') ? 'text-green-600 text-xs' : 'text-red-600 text-xs'}>
                    {stat.trend}
                  </span>
                }
              />
            ))}
          </ResponsiveGrid>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Project Cards</h2>
          <ResponsiveGrid columns={{ default: 1, sm: 2, lg: 3 }} gap="lg">
            {projects.map((project) => (
              <Card key={project.title} variant="elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{project.title}</CardTitle>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    <span>Last updated 2 days ago</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="secondary" size="sm">View Details</Button>
                </CardFooter>
              </Card>
            ))}
          </ResponsiveGrid>
        </section>
        </div>
      </div>
    </>
  );
}
