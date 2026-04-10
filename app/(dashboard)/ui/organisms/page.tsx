'use client';

import { useState } from 'react';
import { Badge, Text } from '@/components/ui/atoms';
import { ShowcaseLayout } from '../_components/ShowcaseLayout';
import { type Column } from '@/components/ui/molecules';
import { AuthForm } from '@/components/ui/organisms/AuthForm';
import { DataGrid } from '@/components/ui/organisms/DataGrid';
import { ChartCard } from '@/components/ui/organisms/ChartCard';
import { Logo, LogoMark } from '@/components/ui/organisms/Logo';
import { AIConversation, type AIMessageData } from '@/components/ui/organisms/AIConversation';
import { AIDisclaimer } from '@/components/ui/organisms/AIDisclaimer';
import { AIPromptInput } from '@/components/ui/organisms/AIPromptInput';
import { ChildTable } from '@/components/ui/organisms/ChildTable';
import type { ChildTableConfig } from '@/components/ui/organisms/ChildTable';
import { FlexibleInquiry, type FilterCondition, type InquiryField } from '@/components/ui/organisms/FlexibleInquiry';
import { Footer } from '@/components/ui/organisms/Footer';
import { ComponentDemo, Section } from '../_components/ComponentDemo';

export default function OrganismsPage() {
  return (
    <ShowcaseLayout>
      <div className="space-y-12">

      <Section title="Organisms" count={7}>
        <AuthFormDemo />
        <ChildTableDemo />
        <DataGridDemo />
        <ChartCardDemo />
        <FlexibleInquiryDemo />
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

/* ---------- ChildTable ---------- */

interface BudgetItem extends Record<string, unknown> {
  id: string;
  lineItem: string;
  department: string;
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  status: string;
  approver: string;
  dueDate: string;
  notes: string;
  priority: string;
}

const budgetData: BudgetItem[] = [
  { id: '1', lineItem: 'Office Supplies', department: 'Administration', category: 'Operations', budgeted: 15000, actual: 12450, variance: 2550, status: 'Under Budget', approver: 'Jane Smith', dueDate: '2025-03-31', notes: 'Q1 supplies purchased early', priority: 'Low' },
  { id: '2', lineItem: 'Software Licenses', department: 'IT', category: 'Technology', budgeted: 85000, actual: 87200, variance: -2200, status: 'Over Budget', approver: 'Mike Chen', dueDate: '2025-04-15', notes: 'Additional seats needed for new hires', priority: 'High' },
  { id: '3', lineItem: 'Training Programs', department: 'HR', category: 'Personnel', budgeted: 42000, actual: 38900, variance: 3100, status: 'Under Budget', approver: 'Sarah Lee', dueDate: '2025-06-30', notes: 'Virtual sessions saved travel costs', priority: 'Medium' },
  { id: '4', lineItem: 'Fleet Maintenance', department: 'Public Works', category: 'Operations', budgeted: 120000, actual: 115600, variance: 4400, status: 'Under Budget', approver: 'Tom Baker', dueDate: '2025-05-01', notes: 'Preventive maintenance on schedule', priority: 'High' },
  { id: '5', lineItem: 'Consulting Fees', department: 'Finance', category: 'Professional Services', budgeted: 60000, actual: 62500, variance: -2500, status: 'Over Budget', approver: 'Jane Smith', dueDate: '2025-03-15', notes: 'Audit required additional scope', priority: 'Medium' },
  { id: '6', lineItem: 'Utility Payments', department: 'Facilities', category: 'Operations', budgeted: 95000, actual: 91200, variance: 3800, status: 'Under Budget', approver: 'Lisa Wong', dueDate: '2025-04-30', notes: 'Energy efficiency improvements', priority: 'Low' },
  { id: '7', lineItem: 'Community Events', department: 'Parks & Rec', category: 'Programs', budgeted: 30000, actual: 28750, variance: 1250, status: 'Under Budget', approver: 'David Park', dueDate: '2025-07-15', notes: 'Summer program planning underway', priority: 'Medium' },
  { id: '8', lineItem: 'Emergency Reserves', department: 'City Manager', category: 'Contingency', budgeted: 200000, actual: 0, variance: 200000, status: 'Unspent', approver: 'Jane Smith', dueDate: '2025-12-31', notes: 'Available for unforeseen needs', priority: 'High' },
];

const childTableConfig: ChildTableConfig<BudgetItem> = {
  columns: [
    { key: 'lineItem', label: 'Line Item', type: 'text', width: 180, sortable: true, validation: [{ type: 'required', message: 'Line item is required' }] },
    { key: 'department', label: 'Department', type: 'select', width: 160, sortable: true, selectOptions: [
      { label: 'Administration', value: 'Administration' },
      { label: 'IT', value: 'IT' },
      { label: 'HR', value: 'HR' },
      { label: 'Public Works', value: 'Public Works' },
      { label: 'Finance', value: 'Finance' },
      { label: 'Facilities', value: 'Facilities' },
      { label: 'Parks & Rec', value: 'Parks & Rec' },
      { label: 'City Manager', value: 'City Manager' },
    ]},
    { key: 'category', label: 'Category', type: 'text', width: 160, sortable: true },
    { key: 'budgeted', label: 'Budgeted', type: 'currency', width: 130, sortable: true },
    { key: 'actual', label: 'Actual', type: 'currency', width: 130, sortable: true },
    { key: 'variance', label: 'Variance', type: 'currency', width: 130, sortable: true },
    { key: 'status', label: 'Status', type: 'select', width: 140, sortable: true, selectOptions: [
      { label: 'Under Budget', value: 'Under Budget' },
      { label: 'Over Budget', value: 'Over Budget' },
      { label: 'On Target', value: 'On Target' },
      { label: 'Unspent', value: 'Unspent' },
    ]},
    { key: 'approver', label: 'Approver', type: 'text', width: 140 },
    { key: 'dueDate', label: 'Due Date', type: 'date', width: 130, sortable: true },
    { key: 'priority', label: 'Priority', type: 'select', width: 120, selectOptions: [
      { label: 'Low', value: 'Low' },
      { label: 'Medium', value: 'Medium' },
      { label: 'High', value: 'High' },
    ]},
    { key: 'notes', label: 'Notes', type: 'textarea', width: 220 },
  ],
  idField: 'id',
  editable: true,
  selectable: true,
  rowReorderable: true,
  showRowActions: true,
};

const readOnlyConfig: ChildTableConfig<BudgetItem> = {
  ...childTableConfig,
  editable: false,
  selectable: false,
  rowReorderable: false,
  showRowActions: true,
};

function ChildTableDemo() {
  return (
    <ComponentDemo
      name="ChildTable"
      description="Full spreadsheet-like table with inline editing, CRUD, CSV import, keyboard navigation, clipboard, drag-and-drop row reorder, and form-rules engine. Supports 10+ cell editor types."
      props={`interface ChildTableProps<T> {
  config: ChildTableConfig<T>;
  data?: T[];
  title?: string;
  pageSizeOptions?: number[];
  className?: string;
  onCellChange?: (rowId, colKey, val, oldVal) => void;
  onRowAdd?: (row) => void;
  onRowDelete?: (rowIds) => void;
  onSave?: (rows) => Promise<void>;
  onImportComplete?: (data) => void;
  // + sort, filter, pagination, search, selection events
}`}
    >
      <div className="space-y-8">
        <div>
          <Text weight="semibold" className="mb-3">Editable Mode</Text>
          <Text size="sm" color="muted" className="mb-4">
            Click any cell to edit. Use Tab/Enter to advance. Arrow keys to navigate. Ctrl+C / Ctrl+V for clipboard. Drag rows to reorder.
          </Text>
          <ChildTable
            config={childTableConfig}
            data={budgetData}
            title="FY2025 Budget Line Items"
            pageSizeOptions={[5, 10, 25]}
            onSave={async (rows) => {
              await new Promise((r) => setTimeout(r, 800));
            }}
          />
        </div>

        <div>
          <Text weight="semibold" className="mb-3">Read-Only Mode</Text>
          <Text size="sm" color="muted" className="mb-4">
            Same component with <code className="text-primary">editable: false</code> — acts as a display-only data grid replacement.
          </Text>
          <ChildTable
            config={readOnlyConfig}
            data={budgetData.slice(0, 5)}
            title="Approved Items (Read-Only)"
            pageSizeOptions={[5, 10]}
          />
        </div>
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

/* ---------- FlexibleInquiry ---------- */

function FlexibleInquiryDemo() {
  const [filters, setFilters] = useState<FilterCondition[]>([
    { id: 'f1', field: 'name', operator: 'contains', value: '' },
  ]);
  const [logic, setLogic] = useState<'and' | 'or'>('and');

  const fields: InquiryField[] = [
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
      name="FlexibleInquiry"
      description="Dynamic filter/query builder with AND/OR logic, multiple field types, and add/remove conditions."
      props={`interface FlexibleInquiryProps {
  fields: InquiryField[]; filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  maxConditions?: number;
  logicOperator?: 'and' | 'or';
  onLogicOperatorChange?: (op: 'and' | 'or') => void;
}`}
    >
      <FlexibleInquiry
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
}`}
    >
      <div className="border border-border rounded h-[400px] flex flex-col">
        <AIConversation messages={sampleMessages} />
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
          onSubmit={(v) => { setInput(''); }}
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
