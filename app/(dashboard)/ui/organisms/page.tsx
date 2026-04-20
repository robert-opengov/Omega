'use client';

import { useState, useMemo, useCallback } from 'react';
import { ClipboardEdit, BarChart3, FileSearch, Shield, Download, Send, AlertTriangle, CheckCircle, Users, Plus, Circle, MapPin } from 'lucide-react';
import { Badge, Button, Text, SelectionCard } from '@/components/ui/atoms';
import { ShowcaseLayout } from '../_components/ShowcaseLayout';
import { type Column, StatusChecklist, MetricCard, MapLegend, type MapLegendItem } from '@/components/ui/molecules';
import {
  AuthForm,
  DataGrid,
  ChartCard,
  Logo,
  LogoMark,
  AIConversation,
  type AIMessageData,
  AIDisclaimer,
  AIPromptInput,
  FilterBuilder,
  type FilterBuilderField,
  type FilterCondition,
  Footer,
  FullscreenWizard,
  useWizard,
  type WizardStepConfig,
  DetailPageHeader,
  Timeline,
  type TimelineItem,
  GanttChart,
  type GanttRow,
  DynamicForm,
  LocationMap,
  KanbanBoard,
  type KanbanColumn,
  WidgetGrid,
} from '@/components/ui/organisms';
import type { FormSchema } from '@/lib/core/ports/form-schema';
import type { IMapAdapter, MapMarker, MapOptions } from '@/lib/core/ports/map.port';
import { ComponentDemo, Section } from '../_components/ComponentDemo';

export default function OrganismsPage() {
  return (
    <ShowcaseLayout>
      <div className="space-y-12">

      <Section title="Map Components" count={3} description="Provider-agnostic map compositions using the hexagonal IMapAdapter port.">
        <LocationMapDemo />
        <LocationMapCompactDemo />
        <MapLegendDemo />
      </Section>

      <Section title="Detail Page Organisms" count={3}>
        <DetailPageHeaderDemo />
        <TimelineDemo />
        <GanttChartDemo />
      </Section>

      <Section title="New Organisms" count={3} description="Dynamic forms, kanban boards, and customizable widget grids.">
        <DynamicFormDemo />
        <KanbanBoardDemo />
        <WidgetGridDemo />
      </Section>

      <Section title="Organisms" count={7}>
        <FullscreenWizardDemo />
        <AuthFormDemo />
        <DataGridDemo />
        <ChartCardDemo />
        <FilterBuilderDemo />
        <FooterDemo />
        <LogoDemo />
      </Section>

      <Section title="AI Components" count={3}>
        <AIConversationDemo />
        <AIDisclaimerDemo />
        <AIPromptInputDemo />
      </Section>
      </div>
    </ShowcaseLayout>
  );
}

/* ---------- FullscreenWizard ---------- */

function WizardStepContent() {
  const { next } = useWizard();
  const [role, setRole] = useState<string | null>(null);

  const roles = [
    { id: 'admin', icon: ClipboardEdit, title: 'Grant Administrator', description: 'I manage day-to-day compliance and reporting.' },
    { id: 'finance', icon: BarChart3, title: 'Finance Director', description: 'I oversee budgets and financial compliance.' },
    { id: 'auditor', icon: FileSearch, title: 'Auditor', description: 'I review grant activity and verify transactions.' },
    { id: 'readonly', icon: Shield, title: 'View-only', description: 'I just need read access to monitor progress.' },
  ];

  return (
    <>
      <div role="radiogroup" aria-label="Select your role" className="grid grid-cols-2 gap-3">
        {roles.map((r) => (
          <SelectionCard
            key={r.id}
            icon={r.icon}
            title={r.title}
            description={r.description}
            selected={role === r.id}
            onSelect={() => setRole(r.id)}
          />
        ))}
      </div>
      <Button className="w-full" disabled={!role} onClick={next}>
        Continue
      </Button>
    </>
  );
}

function ProcessingStepContent() {
  return (
    <StatusChecklist
      steps={[
        { label: 'Confirm award details', status: 'completed' },
        { label: 'Map budget categories', status: 'in-progress' },
        { label: 'Check compliance conditions', status: 'pending' },
        { label: 'Set reporting deadlines', status: 'pending' },
      ]}
    />
  );
}

function FullscreenWizardDemo() {
  const [open, setOpen] = useState(false);

  const steps: WizardStepConfig[] = [
    {
      cardProps: {
        title: "Hi Alex, let's get you set up",
        stepLabel: 'Step 1 of 2',
        description: 'What best describes your role in grant management?',
      },
      content: <WizardStepContent />,
    },
    {
      cardProps: {
        title: 'Setting up your workspace…',
        stepLabel: 'Step 2 of 2',
        description: 'We\'re configuring everything based on your selections.',
      },
      content: <ProcessingStepContent />,
    },
  ];

  return (
    <ComponentDemo
      name="FullscreenWizard"
      description="Full-screen multi-step wizard orchestrator with WizardLayout + WizardCard + WizardContext."
      props={`interface FullscreenWizardProps {
  steps: WizardStepConfig[];
  onComplete?: () => void;
  onClose?: () => void;
  initialStep?: number;
  productName?: string;
}`}
    >
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>Launch Wizard Demo</Button>
        {open && (
          <FullscreenWizard
            productName="Grants Management"
            steps={steps}
            onComplete={() => setOpen(false)}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    </ComponentDemo>
  );
}

/* ---------- AuthForm ---------- */

function AuthFormDemo() {
  return (
    <ComponentDemo
      name="AuthForm"
      description="Login form with Zod validation, password visibility toggle, and server error display."
      props={`interface AuthFormProps {
  onSubmit: (username: string, password: string) => Promise<boolean>;
  className?: string;
}`}
    >
      <div className="max-w-sm mx-auto">
        <AuthForm
          onSubmit={async (username, password) => {
            await new Promise((r) => setTimeout(r, 1000));
            return username === 'demo@gov.com' && password === 'password';
          }}
        />
        <Text size="xs" color="muted" className="mt-3 text-center">
          Demo credentials: demo@gov.com / password
        </Text>
      </div>
    </ComponentDemo>
  );
}

/* ---------- DataGrid ---------- */

interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  status: string;
  joined: string;
  [key: string]: unknown;
}

const employees: Employee[] = [
  { id: '1', name: 'Alice Johnson', department: 'Engineering', role: 'Senior Dev', status: 'Active', joined: '2022-03-15' },
  { id: '2', name: 'Bob Smith', department: 'Design', role: 'UI Lead', status: 'Active', joined: '2021-08-01' },
  { id: '3', name: 'Charlie Brown', department: 'Engineering', role: 'DevOps', status: 'On Leave', joined: '2023-01-10' },
  { id: '4', name: 'Diana Ross', department: 'Product', role: 'PM', status: 'Active', joined: '2022-06-22' },
  { id: '5', name: 'Eve Wilson', department: 'Engineering', role: 'Junior Dev', status: 'Active', joined: '2024-02-28' },
  { id: '6', name: 'Frank Garcia', department: 'Design', role: 'UX Researcher', status: 'Active', joined: '2023-05-14' },
  { id: '7', name: 'Grace Lee', department: 'Engineering', role: 'Tech Lead', status: 'Active', joined: '2020-11-03' },
  { id: '8', name: 'Henry Kim', department: 'Support', role: 'Lead', status: 'Inactive', joined: '2021-01-20' },
  { id: '9', name: 'Iris Chen', department: 'Marketing', role: 'Manager', status: 'Active', joined: '2022-09-11' },
  { id: '10', name: 'Jack Davis', department: 'Engineering', role: 'Mid Dev', status: 'Active', joined: '2023-07-05' },
  { id: '11', name: 'Karen White', department: 'HR', role: 'Director', status: 'Active', joined: '2019-04-18' },
  { id: '12', name: 'Leo Martin', department: 'Finance', role: 'Analyst', status: 'Active', joined: '2024-01-15' },
];

const employeeColumns: Column<Employee>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'department', header: 'Department', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  {
    key: 'status', header: 'Status', sortable: true,
    render: (row) => {
      const variant = row.status === 'Active' ? 'success' : row.status === 'On Leave' ? 'warning' : 'danger';
      return <Badge variant={variant}>{row.status}</Badge>;
    },
  },
  { key: 'joined', header: 'Joined', sortable: true },
];

function DataGridDemo() {
  return (
    <ComponentDemo
      name="DataGrid"
      description="Full-featured data grid with search, pagination, and sorting — composed from DataTable, SearchInput, and Pagination."
      props={`interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor?: (row: T) => string;
  searchable?: boolean;
  searchKeys?: string[];
  pageSize?: number;
  className?: string;
  title?: string;
}`}
    >
      <DataGrid
        data={employees}
        columns={employeeColumns}
        keyExtractor={(r) => r.id}
        title="Employees"
        pageSize={5}
      />
    </ComponentDemo>
  );
}

/* ---------- ChartCard ---------- */

const chartData = [
  { name: 'Jan', requests: 45, resolved: 40 },
  { name: 'Feb', requests: 52, resolved: 48 },
  { name: 'Mar', requests: 38, resolved: 35 },
  { name: 'Apr', requests: 65, resolved: 58 },
  { name: 'May', requests: 48, resolved: 45 },
  { name: 'Jun', requests: 71, resolved: 66 },
];

const pieData = [
  { name: 'Open', value: 42 },
  { name: 'In Progress', value: 28 },
  { name: 'Resolved', value: 85 },
  { name: 'Closed', value: 120 },
];

function ChartCardDemo() {
  return (
    <ComponentDemo
      name="ChartCard"
      description="Chart wrapped in a Card with title/description. Supports bar, line, area, and pie types via Recharts."
      props={`interface ChartCardProps {
  title: string;
  description?: string;
  type: 'bar' | 'line' | 'area' | 'pie';
  data: Record<string, unknown>[];
  dataKey: string;
  xAxisKey?: string;
  className?: string;
  height?: number;
  color?: string;
}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Service Requests" description="Monthly trend" type="bar" data={chartData} dataKey="requests" height={250} />
        <ChartCard title="Resolution Rate" description="Monthly trend" type="line" data={chartData} dataKey="resolved" color="var(--success)" height={250} />
        <ChartCard title="Requests Area" description="6-month overview" type="area" data={chartData} dataKey="requests" color="var(--warning)" height={250} />
        <ChartCard title="Request Status" description="Distribution" type="pie" data={pieData} dataKey="value" height={250} />
      </div>
    </ComponentDemo>
  );
}

/* ---------- Logo ---------- */

function LogoDemo() {
  return (
    <ComponentDemo
      name="Logo / LogoMark"
      description="Application logo — full text version and square mark for collapsed sidebar."
      props={`function Logo({ className }: { className?: string })
function LogoMark({ className }: { className?: string })`}
    >
      <div className="flex items-center gap-8 flex-wrap">
        <div className="flex flex-col items-center gap-2">
          <Logo />
          <Text size="xs" color="muted">Logo (full)</Text>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LogoMark className="h-10 w-10" />
          <Text size="xs" color="muted">LogoMark</Text>
        </div>
      </div>
    </ComponentDemo>
  );
}

/* ---------- FilterBuilder ---------- */

function FilterBuilderDemo() {
  const [filters, setFilters] = useState<FilterCondition[]>([
    { id: 'f1', field: 'name', operator: 'contains', value: '' },
  ]);
  const [logic, setLogic] = useState<'and' | 'or'>('and');

  const fields: FilterBuilderField[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'amount', label: 'Amount', type: 'number' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Pending', value: 'pending' },
    ] },
  ];

  return (
    <ComponentDemo
      name="FilterBuilder"
      description="Dynamic filter/query builder with AND/OR logic, multiple field types, add/remove conditions, i18n label overrides, and custom value editors."
      props={`interface FilterBuilderProps {
  fields: FilterBuilderField[];
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  maxConditions?: number;
  logicOperator?: 'and' | 'or';
  onLogicOperatorChange?: (op: 'and' | 'or') => void;
  labels?: FilterBuilderLabels;
  renderValueEditor?: (field, operator, value, onChange) => ReactNode;
  className?: string;
}`}
    >
      <FilterBuilder
        fields={fields}
        filters={filters}
        onFiltersChange={setFilters}
        logicOperator={logic}
        onLogicOperatorChange={setLogic}
        maxConditions={5}
      />
    </ComponentDemo>
  );
}

/* ---------- Footer ---------- */

function FooterDemo() {
  return (
    <ComponentDemo
      name="Footer"
      description="Site footer with optional link sections, logo, and legal text."
      props={`interface FooterProps {
  brandName?: string;
  sections?: { title: string; links: { label: string; href: string }[] }[];
  legalText?: string;
}`}
    >
      <Footer
        sections={[
          {
            title: 'Product',
            links: [
              { label: 'Components', href: '#' },
              { label: 'Templates', href: '#' },
            ],
          },
          {
            title: 'Resources',
            links: [
              { label: 'Documentation', href: '#' },
              { label: 'GitHub', href: '#' },
            ],
          },
        ]}
      />
    </ComponentDemo>
  );
}

/* ---------- AI Components ---------- */

const sampleMessages: AIMessageData[] = [
  { id: '1', role: 'user', content: 'Can you summarize the Q1 budget report?' },
  { id: '2', role: 'assistant', content: 'The Q1 budget report shows total expenditures of $4.2M against a projected $4.5M budget, resulting in a 6.7% underspend. Key highlights:\n\n- Personnel costs were 2% under budget\n- Capital projects came in 12% under budget due to delayed permits\n- Operating expenses were on target' },
  { id: '3', role: 'user', content: 'What about revenue?' },
  { id: '4', role: 'assistant', content: 'Revenue for Q1 totaled $5.1M, exceeding projections by 3.2%. Property tax revenue was the primary driver, followed by licensing fees which increased 8% year-over-year.' },
];

function AIConversationDemo() {
  return (
    <ComponentDemo
      name="AIConversation"
      description="Chat message display with user/assistant styling, loading state, and hover actions."
      props={`interface AIConversationProps {
  messages: AIMessageData[];
  loading?: boolean;
  emptyPlaceholder?: ReactNode;
  renderContent?: (content: string) => ReactNode;
  maxWidthClassName?: string;
}`}
    >
      <div className="border border-border rounded h-[400px] flex flex-col">
        <AIConversation messages={sampleMessages} maxWidthClassName="max-w-3xl" />
      </div>
    </ComponentDemo>
  );
}

function AIDisclaimerDemo() {
  return (
    <ComponentDemo
      name="AIDisclaimer"
      description="AI content disclaimer in inline or banner variant."
      props={`interface AIDisclaimerProps {
  message?: string;
  variant?: 'inline' | 'banner';
  dismissible?: boolean;
}`}
    >
      <div className="space-y-4">
        <AIDisclaimer />
        <AIDisclaimer variant="banner" dismissible />
        <AIDisclaimer variant="banner" message="Results are AI-generated and should be verified before use in official reports." />
      </div>
    </ComponentDemo>
  );
}

function AIPromptInputDemo() {
  const [input, setInput] = useState('');
  return (
    <ComponentDemo
      name="AIPromptInput"
      description="Text input with send button, file attach option, and character counter."
      props={`interface AIPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  loading?: boolean; disabled?: boolean;
  maxLength?: number; showAttach?: boolean;
}`}
    >
      <div className="space-y-4 max-w-lg">
        <AIPromptInput
          value={input}
          onChange={setInput}
          onSubmit={() => { setInput(''); }}
          placeholder="Ask a question about your data..."
          maxLength={500}
          showAttach
        />
        <AIPromptInput
          value=""
          onChange={() => {}}
          onSubmit={() => {}}
          loading
          placeholder="Generating response..."
        />
      </div>
    </ComponentDemo>
  );
}

/* ---------- DetailPageHeader ---------- */

function DetailPageHeaderDemo() {
  const [activeTab, setActiveTab] = useState('overview');
  return (
    <ComponentDemo
      name="DetailPageHeader"
      description="Shared page header for detail views with breadcrumbs, metadata, risk badge, tab navigation, and optional action buttons."
      props={`interface DetailPageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  metadata: Array<{ label: string; value: ReactNode }>;
  actions?: ReactNode;
  tabs: Array<{ label: string; value: string; badge?: number }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}`}
    >
      <DetailPageHeader
        breadcrumbs={[
          { label: 'Grants', href: '#' },
          { label: 'Awards', href: '#' },
          { label: 'CDBG Entitlement' },
        ]}
        title="Community Development Block Grant (CDBG)"
        description="B-21-MC-06-0001"
        badge={<Badge variant="danger" size="sm" shape="pill">High-Risk</Badge>}
        metadata={[
          { label: 'FAIN', value: 'B-21-MC-06-0001' },
          { label: 'Award', value: '$847,500' },
          { label: 'CFDA/ALN', value: '14.218' },
          { label: 'Performance', value: 'Oct 1, 2024 – Sep 30, 2026' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Download}>Export</Button>
            <Button size="sm" icon={Send}>Submit Report</Button>
          </div>
        }
        tabs={[
          { label: 'Overview', value: 'overview' },
          { label: 'Budget', value: 'budget' },
          { label: 'Compliance', value: 'compliance', badge: 2 },
          { label: 'Reports', value: 'reports' },
          { label: 'Sub-Recipients', value: 'sub-recipients' },
          { label: 'Documents', value: 'documents' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </ComponentDemo>
  );
}

/* ---------- DynamicForm ---------- */

const demoFormSchema: FormSchema = {
  version: 1,
  sections: [
    {
      key: 'contact',
      label: 'Contact Information',
      order: 1,
      description: 'Primary contact details for the request.',
      columns: 2,
      fields: [
        { key: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Jane' },
        { key: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Doe' },
        { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@example.com', validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$', patternMessage: 'Enter a valid email' } },
        { key: 'phone', label: 'Phone', type: 'phone', placeholder: '(555) 123-4567' },
      ],
    },
    {
      key: 'request',
      label: 'Request Details',
      order: 2,
      fields: [
        { key: 'category', label: 'Category', type: 'select', required: true, options: [
          { label: 'Roads & Traffic', value: 'roads' },
          { label: 'Water & Sewer', value: 'water' },
          { label: 'Parks', value: 'parks' },
          { label: 'Other', value: 'other' },
        ] },
        { key: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the issue...', validation: { minLength: 10 } },
        { key: 'urgent', label: 'Mark as urgent', type: 'checkbox' },
      ],
    },
  ],
  rules: [
    { if: { field: 'category', operator: 'equals', value: 'other' }, then: { action: 'show', target: 'otherCategory' } },
    { if: { field: 'urgent', operator: 'equals', value: true }, then: { action: 'require', target: 'phone' } },
  ],
};

function DynamicFormDemo() {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [readOnly, setReadOnly] = useState(false);

  const handleChange = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <ComponentDemo
      name="DynamicForm"
      description="Schema-driven form with field type registry, conditional rules (show/hide/require), section layouts, and read-only display mode."
      props={`interface DynamicFormProps {
  schema: FormSchema;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  sectionRenderer?: (section, children) => ReactNode;
  fieldRenderer?: (field, control) => ReactNode;
}`}
    >
      <div className="max-w-2xl space-y-4">
        <div className="flex gap-2">
          <Button variant={readOnly ? 'outline' : 'primary'} size="sm" onClick={() => setReadOnly(false)}>Edit Mode</Button>
          <Button variant={readOnly ? 'primary' : 'outline'} size="sm" onClick={() => setReadOnly(true)}>Read-Only Mode</Button>
        </div>
        <DynamicForm
          schema={demoFormSchema}
          values={values}
          onChange={handleChange}
          readOnly={readOnly}
        />
        {!readOnly && (
          <pre className="text-xs bg-muted/50 rounded p-3 font-mono overflow-auto max-h-32">
            {JSON.stringify(values, null, 2)}
          </pre>
        )}
      </div>
    </ComponentDemo>
  );
}

/* ---------- KanbanBoard ---------- */

function KanbanBoardDemo() {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: 'new', title: 'New', color: 'hsl(var(--info-h) var(--info-s) var(--info-l))',
      items: [
        { id: 'k1', title: 'Pothole on Main St', description: 'Large pothole near downtown intersection', badge: { label: 'High' }, metadata: '2 days ago' },
        { id: 'k2', title: 'Streetlight outage', description: 'Corner of Oak and 5th', metadata: '5 hours ago' },
      ],
    },
    {
      id: 'progress', title: 'In Progress', color: 'hsl(var(--warning-h) var(--warning-s) var(--warning-l))',
      items: [
        { id: 'k3', title: 'Water leak report', description: 'Slow leak on residential street', badge: { label: 'Medium' }, avatar: { fallback: 'JD' }, metadata: '1 day ago' },
      ],
    },
    {
      id: 'review', title: 'Under Review', color: 'hsl(var(--primary-h) var(--primary-s) var(--primary-l))',
      items: [
        { id: 'k4', title: 'Park bench replacement', description: 'Central Park area', metadata: '3 days ago' },
      ],
    },
    {
      id: 'done', title: 'Done', color: 'hsl(var(--success-h) var(--success-s) var(--success-l))',
      items: [
        { id: 'k5', title: 'Graffiti removal', description: 'Downtown underpass cleaned', metadata: 'Last week' },
      ],
    },
  ]);

  const handleMove = useCallback((itemId: string, fromCol: string, toCol: string, newIndex: number) => {
    setColumns((prev) => {
      const next = prev.map((col) => ({ ...col, items: [...col.items] }));
      const fromColumn = next.find((c) => c.id === fromCol);
      const toColumn = next.find((c) => c.id === toCol);
      if (!fromColumn || !toColumn) return prev;

      const itemIndex = fromColumn.items.findIndex((i) => i.id === itemId);
      if (itemIndex === -1) return prev;

      const [item] = fromColumn.items.splice(itemIndex, 1);
      toColumn.items.splice(newIndex, 0, item);
      return next;
    });
  }, []);

  return (
    <ComponentDemo
      name="KanbanBoard"
      description="Drag-and-drop kanban board with @hello-pangea/dnd. Supports custom card/column renderers."
      props={`interface KanbanBoardProps {
  columns: KanbanColumn[];
  onItemMove?: (itemId, fromColumn, toColumn, newIndex) => void;
  onItemClick?: (item, columnId) => void;
  renderItem?: (item, columnId) => ReactNode;
  renderColumnHeader?: (column) => ReactNode;
  draggable?: boolean;
}`}
    >
      <KanbanBoard
        columns={columns}
        onItemMove={handleMove}
      />
    </ComponentDemo>
  );
}

/* ---------- WidgetGrid ---------- */

function WidgetGridDemo() {
  const [config, setConfig] = useState<{ id: string; visible?: boolean; order?: number }[]>([
    { id: 'revenue', visible: true, order: 0 },
    { id: 'requests', visible: true, order: 1 },
    { id: 'users', visible: true, order: 2 },
    { id: 'satisfaction', visible: true, order: 3 },
  ]);

  return (
    <ComponentDemo
      name="WidgetGrid"
      description="Dashboard widget grid with optional drag-to-reorder customization sheet."
      props={`interface WidgetGridProps {
  children: ReactNode;
  config?: WidgetConfig[];
  columns?: ResponsiveGridColumns;
  gap?: 'sm' | 'md' | 'lg';
  onConfigChange?: (config: WidgetConfig[]) => void;
  customizable?: boolean;
}`}
    >
      <WidgetGrid
        config={config}
        onConfigChange={setConfig}
        customizable
        columns={{ default: 1, sm: 2, lg: 4 }}
      >
        <MetricCard data-widget-id="revenue" title="Revenue" value="$2.4M" description="This quarter" />
        <MetricCard data-widget-id="requests" title="Open Requests" value="42" description="Pending review" />
        <MetricCard data-widget-id="users" title="Active Users" value="1,284" description="+12% vs last month" />
        <MetricCard data-widget-id="satisfaction" title="Satisfaction" value="94%" description="Citizen rating" />
      </WidgetGrid>
    </ComponentDemo>
  );
}

/* ---------- GanttChart ---------- */

const scheduleColumns = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];

const scheduleRows: GanttRow[] = [
  {
    id: 'john',
    label: 'John Smith',
    sublabel: 'IT Department',
    avatar: { fallback: 'John Smith' },
    events: [
      { id: 'j1', start: 0, end: 1.5, title: 'Service Call', subtitle: 'Downtown Office', variant: 'success' },
      { id: 'j2', start: 3.5, end: 5.5, title: 'Equipment Maintenance', subtitle: 'Server Room A', variant: 'info', tooltip: '10:30 AM – 12:30 PM · Server Room A' },
      { id: 'j3', start: 6, end: 7.5, title: 'Client Meeting', subtitle: 'Room B', variant: 'danger' },
    ],
  },
  {
    id: 'sarah',
    label: 'Sarah Johnson',
    sublabel: 'Marketing',
    avatar: { fallback: 'Sarah Johnson' },
    events: [
      { id: 's1', start: 1, end: 3, title: 'Campaign Planning', subtitle: 'Conference Room C', variant: 'primary' },
      { id: 's2', start: 4, end: 5.5, title: 'Content Review', subtitle: 'Marketing Studio', variant: 'warning' },
      { id: 's3', start: 6, end: 8, title: 'Social Media', subtitle: 'Creative Lab', variant: 'inProgress' },
    ],
  },
  {
    id: 'mike',
    label: 'Mike Chen',
    sublabel: 'Engineering',
    avatar: { fallback: 'Mike Chen' },
    events: [
      { id: 'm1', start: 1.5, end: 4, title: 'Code Review', subtitle: 'Development Lab', variant: 'info' },
      { id: 'm2', start: 5.5, end: 7.5, title: 'Feature Development', subtitle: 'Workspace 2A', variant: 'primary' },
    ],
  },
  {
    id: 'emma',
    label: 'Emma Stone',
    sublabel: 'Design',
    avatar: { fallback: 'Emma Stone' },
    events: [
      { id: 'e1', start: 0.5, end: 2.5, title: 'UI Mockups', subtitle: 'Design Studio A', variant: 'success' },
      { id: 'e2', start: 3.5, end: 5.5, title: 'Client Presentation', subtitle: 'Meeting Room 1', variant: 'danger' },
      { id: 'e3', start: 6.5, end: 8, title: 'Design Update', subtitle: 'Design Studio B', variant: 'warning' },
    ],
  },
  {
    id: 'david',
    label: 'David Chen',
    sublabel: 'Operations',
    avatar: { fallback: 'David Chen' },
    events: [
      { id: 'd1', start: 1, end: 3.5, title: 'Inventory Check', subtitle: 'Warehouse B', variant: 'inProgress' },
      { id: 'd2', start: 5.5, end: 7.5, title: 'Vendor Meeting', subtitle: 'Conference Room D', variant: 'danger' },
    ],
  },
];

const projectColumns = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];

const projectRows: GanttRow[] = [
  {
    id: 'design',
    label: 'Design',
    events: [
      { id: 'p1', start: 0, end: 2, title: 'Wireframes', variant: 'primary' },
      { id: 'p2', start: 2, end: 3.5, title: 'Visual Design', variant: 'primary' },
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    events: [
      { id: 'p3', start: 1.5, end: 4, title: 'Component Build', variant: 'info' },
      { id: 'p4', start: 4, end: 5.5, title: 'Integration', variant: 'info' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    events: [
      { id: 'p5', start: 1, end: 3.5, title: 'API Development', variant: 'success' },
      { id: 'p6', start: 3.5, end: 5, title: 'Database Tuning', variant: 'warning' },
    ],
  },
  {
    id: 'qa',
    label: 'QA',
    events: [
      { id: 'p7', start: 3, end: 5, title: 'Testing', variant: 'danger' },
      { id: 'p8', start: 5, end: 6, title: 'UAT', variant: 'success' },
    ],
  },
];

function GanttChartDemo() {
  return (
    <ComponentDemo
      name="GanttChart"
      description="Resource-based Gantt chart with fractional event positioning, sticky resource column, now-indicator, HSL semantic colors, and custom renderers."
      props={`interface GanttChartProps {
  columns: ReactNode[];
  rows: GanttRow[];
  columnWidth?: number;       // default 120
  resourceWidth?: number;     // default 200
  size?: 'sm' | 'md' | 'lg'; // row density
  nowIndicator?: number;      // vertical "now" line at column position
  striped?: boolean;          // alternating rows (default true)
  resourceLabel?: ReactNode;  // header for resource column
  renderEvent?: (event: GanttEvent, row: GanttRow) => ReactNode;
  renderResource?: (row: GanttRow) => ReactNode;
  renderColumnHeader?: (column: ReactNode, index: number) => ReactNode;
  onEventClick?: (event: GanttEvent, row: GanttRow) => void;
  onRowClick?: (row: GanttRow) => void;
  ariaLabel?: string;
}

interface GanttRow {
  id: string;
  label: ReactNode;
  sublabel?: ReactNode;
  avatar?: { src?: string; fallback?: ReactNode };
  events: GanttEvent[];
}

interface GanttEvent {
  id: string;
  start: number;  // 0-based fractional column index
  end: number;
  title: ReactNode;
  subtitle?: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'inProgress' | 'muted';
  tooltip?: ReactNode;
}`}
    >
      <div className="space-y-8">
        <div>
          <Text weight="semibold" className="mb-2">Employee Schedule</Text>
          <Text size="sm" color="muted" className="mb-4">
            Hourly schedule with avatars, color-coded events, and a &quot;now&quot; indicator at 10:30 AM. Hover events for tooltips.
          </Text>
          <GanttChart
            columns={scheduleColumns}
            rows={scheduleRows}
            resourceLabel="Employee"
            nowIndicator={3.5}
            ariaLabel="Employee daily schedule"
          />
        </div>

        <div>
          <Text weight="semibold" className="mb-2">Compact Project Timeline</Text>
          <Text size="sm" color="muted" className="mb-4">
            Same component with <code className="text-primary">size=&quot;sm&quot;</code> and no avatars — works as a project Gantt chart.
          </Text>
          <GanttChart
            columns={projectColumns}
            rows={projectRows}
            size="sm"
            columnWidth={100}
            resourceWidth={120}
            resourceLabel="Team"
            striped={false}
            ariaLabel="Project timeline"
          />
        </div>
      </div>
    </ComponentDemo>
  );
}

/* ---------- Timeline ---------- */

const verticalTimelineItems: TimelineItem[] = [
  {
    id: '1',
    title: '3.0 update is now live!',
    description: 'It\'s finally here — comes packed with many awesome features. Be sure to download it and let us know what you think!',
    icon: CheckCircle,
    variant: 'success',
  },
  {
    id: '2',
    title: 'Maintenance notice',
    description: 'We are going to apply some security fixes next week. Please check out the schedule for more information about any downtime.',
    icon: AlertTriangle,
    variant: 'warning',
  },
  {
    id: '3',
    title: 'We reached 3,500 paying users',
    description: 'Thank you all so much for your support!',
    icon: Users,
    variant: 'info',
  },
  {
    id: '4',
    title: 'Beta registrations are now open',
    description: 'We are going to be beta testing our 3.0 release. Be sure to register for a chance to participate and check out all the new features before everyone else.',
    icon: Plus,
    variant: 'default',
  },
];

const horizontalTimelineItems: TimelineItem[] = [
  { id: 'h1', title: 'Phase 2 environmental assessment completed.', date: 'Jan 8', icon: CheckCircle, variant: 'success' },
  { id: 'h2', title: 'Hire project coordinator Carlos Mendez.', date: 'Jan 16', icon: Circle, variant: 'default', avatar: { fallback: 'Carlos Mendez', label: 'Carlos Mendez' } },
  { id: 'h3', title: 'Fair Housing Council outreach — 200 households.', date: 'Feb 2', icon: AlertTriangle, variant: 'warning' },
  { id: 'h4', title: 'Submit quarterly financial report to HUD.', date: 'Mar 15', icon: CheckCircle, variant: 'success' },
];

function TimelineDemo() {
  return (
    <ComponentDemo
      name="Timeline"
      description="Vertical or horizontal timeline with semantic icon circles, alternating cards, rich content, and responsive mobile layout."
      props={`interface TimelineProps {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  alternating?: boolean;
  size?: 'sm' | 'md' | 'lg';
  renderItem?: (item: TimelineItem, index: number) => ReactNode;
  onItemClick?: (item: TimelineItem, index: number) => void;
  lineClassName?: string;
  ariaLabel?: string;
}

interface TimelineItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  date?: ReactNode;
  icon?: ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'inProgress' | 'muted';
  avatar?: { src?: string; fallback?: ReactNode; label?: ReactNode };
  children?: ReactNode;
}`}
    >
      <div className="space-y-10">
        <div>
          <Text weight="semibold" className="mb-2">Vertical (alternating)</Text>
          <Text size="sm" color="muted" className="mb-4">
            Cards alternate left/right on desktop, collapse to a single column on mobile. Each item has a colored icon circle.
          </Text>
          <Timeline items={verticalTimelineItems} />
        </div>

        <div>
          <Text weight="semibold" className="mb-2">Vertical (left-aligned)</Text>
          <Text size="sm" color="muted" className="mb-4">
            All cards on one side with <code className="text-primary">alternating=false</code>.
          </Text>
          <Timeline items={verticalTimelineItems.slice(0, 3)} alternating={false} size="sm" />
        </div>

        <div>
          <Text weight="semibold" className="mb-2">Horizontal</Text>
          <Text size="sm" color="muted" className="mb-4">
            Scrollable horizontal mode with <code className="text-primary">orientation=&quot;horizontal&quot;</code>. Cards alternate above/below the line.
          </Text>
          <Timeline items={horizontalTimelineItems} orientation="horizontal" />
        </div>
      </div>
    </ComponentDemo>
  );
}

/* ---------- Map Components ---------- */

const noop = () => {};

function createDemoMapAdapter(): IMapAdapter {
  let container: HTMLDivElement | null = null;
  return {
    initialize(el: HTMLDivElement, options: MapOptions) {
      container = el;
      el.style.background = 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 50%, #b2dfdb 100%)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = '#666';
      el.style.fontSize = '13px';
      el.style.fontFamily = 'inherit';
      el.innerHTML = `<div style="text-align:center;opacity:0.7">
        <div style="font-size:32px;margin-bottom:8px">\u{1F5FA}\u{FE0F}</div>
        <div>Map placeholder &middot; center [${options.center[0].toFixed(2)}, ${options.center[1].toFixed(2)}] &middot; zoom ${options.zoom}</div>
        <div style="margin-top:4px;font-size:11px">Swap in a real adapter (Leaflet, Esri, Google, Mapbox) at the page level</div>
      </div>`;
    },
    setCenter: noop,
    setZoom: noop,
    addMarker: noop,
    removeMarker: noop,
    updateMarker: noop,
    clearMarkers: noop,
    setBoundary: noop,
    clearBoundary: noop,
    fitBounds: noop,
    onMapClick: noop,
    onMarkerClick: noop,
    highlightMarker: noop,
    geolocate: () => Promise.resolve({ lat: 42.3601, lng: -71.0589 }),
    destroy() { if (container) container.innerHTML = ''; },
  };
}

const demoLegendItems: MapLegendItem[] = [
  { color: 'warning', label: 'Submitted', count: 14 },
  { color: 'info', label: 'Under Review', count: 8 },
  { color: 'success', label: 'Resolved', count: 23 },
];

const demoMarkers: MapMarker[] = [
  { id: '1', lat: 33.749, lng: -84.388, label: 'Pothole on Peachtree', variant: 'warning' },
  { id: '2', lat: 33.755, lng: -84.39, label: 'Streetlight out', variant: 'success' },
  { id: '3', lat: 33.752, lng: -84.385, label: 'Graffiti removal', variant: 'primary' },
];

function LocationMapDemo() {
  const adapter = useMemo(() => createDemoMapAdapter(), []);

  return (
    <ComponentDemo
      name="LocationMap + MapLegend"
      description="Interactive map with a legend overlay. The map delegates rendering to an IMapAdapter — swap providers without changing any component code."
      props={`interface LocationMapProps {
  adapter: IMapAdapter;
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  selectedMarker?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  showGeolocation?: boolean;
  boundaryGeoJson?: string;
  height?: string;
  children?: ReactNode;   // overlay slot (MapLegend, custom controls)
  footer?: ReactNode;     // content below the map
  compact?: boolean;      // 200px, no geolocation
  className?: string;
  ariaLabel?: string;
}`}
    >
      <LocationMap
        adapter={adapter}
        center={[33.749, -84.388]}
        zoom={13}
        markers={demoMarkers}
        height="360px"
      >
        <MapLegend items={demoLegendItems} title="Legend" position="bottom-left" />
      </LocationMap>
    </ComponentDemo>
  );
}

function LocationMapCompactDemo() {
  const adapter = useMemo(() => createDemoMapAdapter(), []);

  return (
    <ComponentDemo
      name="LocationMap (compact)"
      description="Compact mode for detail pages — 200px height, no geolocation. The footer slot shows an address caption below the map."
    >
      <div className="max-w-sm">
        <LocationMap
          adapter={adapter}
          center={[42.3601, -71.0589]}
          zoom={15}
          markers={[{ id: 'loc', lat: 42.3601, lng: -71.0589, label: '101 Arch St', variant: 'primary' }]}
          compact
          footer={
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border-t border-border">
              <MapPin className="h-4 w-4 shrink-0" />
              101 Arch St, Boston, MA 02110
            </div>
          }
        />
      </div>
    </ComponentDemo>
  );
}

function MapLegendDemo() {
  return (
    <ComponentDemo
      name="MapLegend"
      description="Standalone legend molecule with themed color dots. Uses StatusDot theme colors by default, accepts custom hex for non-standard categories."
      props={`interface MapLegendItem {
  color: ThemeColor | string;  // 'warning', 'success', '#FF9800', etc.
  label: string;
  count?: number;
}

interface MapLegendProps {
  items: MapLegendItem[];
  title?: string;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'inline';
  className?: string;
}`}
    >
      <div className="flex flex-wrap gap-6">
        <div>
          <Text size="sm" weight="semibold" className="mb-2">With title &amp; counts</Text>
          <MapLegend
            items={demoLegendItems}
            title="Legend"
            position="inline"
          />
        </div>
        <div>
          <Text size="sm" weight="semibold" className="mb-2">Custom hex colors</Text>
          <MapLegend
            items={[
              { color: '#FF9800', label: 'Category A' },
              { color: '#2196F3', label: 'Category B' },
              { color: '#4CAF50', label: 'Category C' },
            ]}
            position="inline"
          />
        </div>
        <div>
          <Text size="sm" weight="semibold" className="mb-2">All positions</Text>
          <div className="relative bg-muted/30 border border-border rounded h-48 w-64">
            <MapLegend items={[{ color: 'primary', label: 'Top-left' }]} position="top-left" />
            <MapLegend items={[{ color: 'success', label: 'Top-right' }]} position="top-right" />
            <MapLegend items={[{ color: 'warning', label: 'Bottom-left' }]} position="bottom-left" />
            <MapLegend items={[{ color: 'danger', label: 'Bottom-right' }]} position="bottom-right" />
          </div>
        </div>
      </div>
    </ComponentDemo>
  );
}
