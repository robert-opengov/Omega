'use client';

import type { ReactNode } from 'react';
import {
  Button,
  Badge,
  Heading,
  Text,
  Code,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  Chip,
  UILink,
  Separator,
  Spinner,
  Progress,
  Avatar,
} from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  Hero,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Breadcrumbs,
  PageHeader,
  MetricCard,
  Banner,
  Pagination,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  LabelValuePair,
} from '@/components/ui/molecules';
import {
  ChartCard,
  Timeline,
  GanttChart,
  KanbanBoard,
  WidgetGrid,
  FilterBuilder,
  Footer,
  DetailPageHeader,
  DynamicForm,
  DataGrid,
  AIDisclaimer,
} from '@/components/ui/organisms';
import type { DataBinding } from '@/lib/core/ports/pages.repository';
import { cn } from '@/lib/utils';

export interface BlockRenderParams {
  type: string;
  props: Record<string, unknown>;
  dataBinding?: DataBinding;
  appId: string;
}

function str(v: unknown, d = ''): string {
  return typeof v === 'string' ? v : d;
}

function num(v: unknown, d = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : d;
}

/** @internal */
export function renderShowcaseBlock(p: BlockRenderParams): ReactNode {
  const { type, props, appId } = p;

  switch (type) {
    case 'atom_button':
      return <Button type="button">{str(props.children, 'Button')}</Button>;
    case 'atom_badge':
      return <Badge>{str(props.children, 'Badge')}</Badge>;
    case 'atom_heading':
      return (
        <Heading as="h3" className="text-lg">
          {str(props.children, 'Title')}
        </Heading>
      );
    case 'atom_text':
      return <Text>{str(props.children, '')}</Text>;
    case 'atom_code':
      return <Code className="text-sm">{str(props.children, '')}</Code>;
    case 'atom_input':
      return <Input readOnly placeholder={str(props.placeholder)} />;
    case 'atom_textarea':
      return <Textarea readOnly placeholder={str(props.placeholder)} />;
    case 'atom_select':
      return (
        <Select disabled defaultValue="a">
          <option value="a">A</option>
        </Select>
      );
    case 'atom_checkbox':
      return <Checkbox label={str(props.label, 'Option')} checked disabled />;
    case 'atom_switch':
      return <Switch label={str(props.label)} checked disabled />;
    case 'atom_chip':
      return <Chip label={str(props.children, 'Tag')} />;
    case 'atom_uilink':
      return (
        <UILink href={str(props.href, '#')}>{str(props.children, 'Link')}</UILink>
      );
    case 'atom_separator':
      return <Separator />;
    case 'atom_spinner':
      return <Spinner size="md" />;
    case 'atom_progress':
      return <Progress value={num(props.value, 50)} className="w-full" />;
    case 'atom_avatar':
      return <Avatar fallback={str(props.fallback, '?')} className="h-10 w-10" />;

    case 'mol_card':
      return (
        <Card>
          <CardHeader>
            <CardTitle>{str(props.title, 'Card')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Text size="sm" color="muted">
              {str(props.description, 'Content')}
            </Text>
          </CardContent>
        </Card>
      );
    case 'mol_alert':
      return (
        <Alert variant="info" title={str(props.title, 'Notice')}>
          {str(props.children, 'Message')}
        </Alert>
      );
    case 'mol_hero':
      return (
        <Hero
          title={str(props.title, 'Hero')}
          subtitle={str(props.subtitle, 'Subtitle')}
          variant="default"
        />
      );
    case 'mol_empty_state':
      return (
        <EmptyState
          title={str(props.title, 'No data')}
          description={str(props.description, '')}
        />
      );
    case 'mol_tabs': {
      const parts = str(props.tabLabels, 'One, Two').split(',').map((s) => s.trim());
      return (
        <Tabs defaultValue="t0">
          <TabsList>
            {parts.map((l, i) => (
              <TabsTrigger key={i} value={`t${i}`}>
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
          {parts.map((_, i) => (
            <TabsContent key={i} value={`t${i}`}>
              <Text size="sm" color="muted">Tab {i + 1}</Text>
            </TabsContent>
          ))}
        </Tabs>
      );
    }
    case 'mol_breadcrumbs': {
      const parts = str(props.items, 'Home, Here')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return (
        <Breadcrumbs
          items={parts.map((label, i) => ({
            label,
            href: i < parts.length - 1 ? '#' : undefined,
          }))}
        />
      );
    }
    case 'mol_page_header':
      return <PageHeader title={str(props.title, 'Page')} description={str(props.subtitle, '')} />;
    case 'mol_metric_card':
      return (
        <MetricCard
          title={str(props.label, 'KPI')}
          value={str(props.value, '0')}
        />
      );
    case 'mol_banner':
      return <Banner>{str(props.children, '')}</Banner>;
    case 'mol_pagination':
      return (
        <Pagination
          currentPage={num(props.page, 1)}
          totalPages={num(props.pageCount, 1)}
          onPageChange={() => undefined}
        />
      );
    case 'mol_accordion':
      return (
        <Accordion type="single" collapsible defaultValue="a1">
          <AccordionItem value="a1">
            <AccordionTrigger>{str(props.itemTitle, 'Section')}</AccordionTrigger>
            <AccordionContent>
              <Text size="sm">{str(props.content, 'Details')}</Text>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    case 'mol_label_value':
      return (
        <LabelValuePair label={str(props.label, 'Field')} value={str(props.value, '—')} />
      );

    case 'org_chart_card':
      return (
        <ChartCard
          title={str(props.title, 'Chart')}
          type="bar"
          data={[{ name: 'A', v: 1 }]}
          dataKey="v"
        />
      );
    case 'org_timeline':
      return (
        <Timeline
          items={[
            { id: '1', title: 'Event', date: 'Today', description: '…' },
          ]}
        />
      );
    case 'org_gantt':
      return (
        <GanttChart
          columns={['D1', 'D2', 'D3']}
          rows={[
            {
              id: 'r1',
              label: 'Row 1',
              events: [
                { id: 'e1', start: 0, end: 1, title: 'Block' },
              ],
            },
          ]}
        />
      );
    case 'org_location_map':
      return (
        <div className="h-48 rounded border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground p-3 text-center">
          Map block — set map adapter and markers at runtime (UI Showcase: LocationMap).
        </div>
      );
    case 'org_kanban':
      return <KanbanBoard columns={[{ id: 'a', title: 'Col', items: [] }]} />;
    case 'org_widget_grid': {
      const n = num(props.columns, 2);
      const c = n <= 2 ? 2 : n >= 4 ? 4 : 3;
      return (
        <WidgetGrid
          columns={{ default: c }}
          gap="md"
        >
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="p-2 border border-border rounded" data-widget-id={`w${i}`}>
              <Text size="sm">Item {i + 1}</Text>
            </div>
          ))}
        </WidgetGrid>
      );
    }
    case 'org_filter_builder':
      return (
        <FilterBuilder
          fields={[{ key: 'f1', label: 'Field', type: 'text' }]}
          filters={[]}
          onFiltersChange={() => undefined}
        />
      );
    case 'org_footer':
      return <Footer className="border-t border-border" legalText={str(props.legalText, undefined)} />;
    case 'org_detail_header':
      return (
        <DetailPageHeader
          breadcrumbs={[{ label: 'Home' }, { label: 'Here' }]}
          title={str(props.title, 'Record')}
          metadata={[]}
          tabs={[{ label: 'Overview', value: 'o' }]}
          activeTab="o"
          onTabChange={() => undefined}
        />
      );
    case 'org_dynamic_form':
      return (
        <Text size="sm" color="muted" className="p-3 border border-dashed border-border rounded">
          Form embed — set table in builder props (app: {appId}).
        </Text>
      );
    case 'org_data_grid':
      return (
        <DataGrid
          title={str(props.title, 'Records')}
          data={[]}
          columns={[{ key: 'placeholder', header: '—', render: () => '—' }]}
        />
      );
    case 'org_ai_disclaimer':
      return <AIDisclaimer className="max-w-xl" />;

    case 'pb_text_block':
      return (
        <p className={cn('whitespace-pre-wrap text-sm text-foreground')}>
          {str(props.content, 'Text')}
        </p>
      );
    case 'pb_spacer':
      return <div style={{ height: num(props.height, 24) }} aria-hidden="true" />;
    case 'pb_image':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={str(props.src, '/next.svg')}
          alt={str(props.alt, '')}
          className="max-w-full h-auto rounded border border-border"
        />
      );
    case 'app_custom': {
      const name = str(props.name, 'Component');
      return (
        <div className="rounded border border-dashed border-warning/50 bg-warning/5 p-3 text-sm">
          Custom component: <code className="font-mono">{name}</code>
        </div>
      );
    }
    default:
      return (
        <div className="text-sm text-destructive border border-dashed border-destructive/40 rounded p-2">
          Unknown block type: <code>{type}</code>
        </div>
      );
  }
}
