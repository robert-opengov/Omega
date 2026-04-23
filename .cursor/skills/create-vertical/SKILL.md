# Skill: Create a Vertical

Build a new domain-specific vertical (e.g., permitting, inspections) in the GAB Boilerplate. This skill walks through every file you need to create, in order, with concrete examples.

## Prerequisites

- The boilerplate is running (`npm run dev`)
- You have visited `/ui` and know which components you will use
- You have a name for your vertical (used throughout as `[vertical]`, e.g., `permitting`, `inspections`)

## Step 1 — Define the Port

Create `lib/core/ports/[vertical].repository.ts`.

This file defines your domain types and the repository interface. It describes **what** the frontend needs from the backend, not how to get it.

```typescript
// lib/core/ports/permitting.repository.ts

export interface DashboardSummary {
  pendingCount: number;
  approvedThisMonth: number;
  avgReviewDays: number;
  expiringSoonCount: number;
}

export interface PermitApplication {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied';
  type: string;
  applicant: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface IPermittingRepository {
  getDashboardSummary(): Promise<DashboardSummary>;
  listApplications(params?: PaginatedParams): Promise<PaginatedResult<PermitApplication>>;
  getApplication(id: string): Promise<PermitApplication>;
  createApplication(data: Omit<PermitApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<PermitApplication>;
}
```

## Step 2 — Create a Mock Adapter

Create `lib/core/adapters/mock/[vertical].mock.adapter.ts`.

The mock adapter implements your port interface with static data. This lets you build and iterate on all pages without a real backend.

```typescript
// lib/core/adapters/mock/permitting.mock.adapter.ts
import type { IPermittingRepository, DashboardSummary, PermitApplication, PaginatedParams, PaginatedResult } from '../../ports/permitting.repository';

export class MockPermittingAdapter implements IPermittingRepository {
  async getDashboardSummary(): Promise<DashboardSummary> {
    return {
      pendingCount: 42,
      approvedThisMonth: 18,
      avgReviewDays: 5.4,
      expiringSoonCount: 3,
    };
  }

  async listApplications(params?: PaginatedParams): Promise<PaginatedResult<PermitApplication>> {
    const allApplications: PermitApplication[] = [
      {
        id: '1',
        title: 'Commercial Building Renovation',
        description: 'Interior renovation of 3rd floor office space',
        status: 'under_review',
        type: 'Building',
        applicant: 'Acme Construction',
        address: '456 Commerce Ave',
        createdAt: '2026-04-10T10:00:00Z',
        updatedAt: '2026-04-10T10:00:00Z',
      },
      // Add 5-10 more realistic entries
    ];

    const limit = params?.limit ?? 10;
    const offset = params?.offset ?? 0;
    return {
      data: allApplications.slice(offset, offset + limit),
      total: allApplications.length,
    };
  }

  async getApplication(id: string): Promise<PermitApplication> {
    return {
      id,
      title: 'Commercial Building Renovation',
      description: 'Interior renovation of 3rd floor office space',
      status: 'under_review',
      type: 'Building',
      applicant: 'Acme Construction',
      address: '456 Commerce Ave',
      createdAt: '2026-04-10T10:00:00Z',
      updatedAt: '2026-04-10T10:00:00Z',
    };
  }

  async createApplication(data: Omit<PermitApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<PermitApplication> {
    return {
      ...data,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
```

## Step 3 — Register in the Composition Root

Add your repo to `lib/core/index.ts`:

```typescript
import { MockPermittingAdapter } from './adapters/mock/permitting.mock.adapter';

export const permittingRepo = new MockPermittingAdapter();
```

Later, when the real adapter exists, swap it:

```typescript
import { PermittingV2Adapter } from './adapters/gab-v2/permitting.v2.adapter';

export const permittingRepo = new PermittingV2Adapter(authPort, gabConfig.apiUrl);
```

## Step 4 — Add Feature Flag

In `config/app.config.ts`, add to the `AppFeatures` interface and the `features` object:

```typescript
// In the AppFeatures interface:
enablePermitting: boolean;

// In the features object:
enablePermitting: process.env.NEXT_PUBLIC_ENABLE_PERMITTING === 'true',
```

Add to `.env.example`:

```env
NEXT_PUBLIC_ENABLE_PERMITTING=true
```

## Step 5 — Add Navigation Entry

In `config/navigation.config.ts`, add to the `navigationItems` array:

```typescript
{
  href: '/permitting',
  label: 'Permitting',
  icon: FileText,  // from lucide-react
  featureFlag: 'enablePermitting',
},
```

## Step 6 — Create Pages

Follow this exact structure:

```
app/(dashboard)/permitting/
├── layout.tsx
├── page.tsx
├── home/
│   ├── page.tsx
│   └── _components/
│       └── PermittingDashboard.tsx
└── applications/
    ├── page.tsx
    ├── _components/
    │   └── ApplicationsListPage.tsx
    └── [id]/
        ├── page.tsx
        └── _components/
            └── ApplicationDetailView.tsx
```

### layout.tsx — Pass-through layout

```typescript
import type { ReactNode } from 'react';

export default function PermittingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

### page.tsx — Root redirect

```typescript
import { redirect } from 'next/navigation';

export default function PermittingRootPage() {
  redirect('/permitting/home');
}
```

### home/page.tsx — Server Component fetches data

```typescript
import { permittingRepo } from '@/lib/core';
import { PermittingDashboard } from './_components/PermittingDashboard';

export default async function PermittingHomePage() {
  const summary = await permittingRepo.getDashboardSummary();
  return <PermittingDashboard summary={summary} />;
}
```

### home/_components/PermittingDashboard.tsx — Client component renders

```typescript
'use client';

import { MetricCard } from '@/components/ui/molecules';
import { Badge } from '@/components/ui/atoms';
import type { DashboardSummary } from '@/lib/core/ports/permitting.repository';

interface PermittingDashboardProps {
  summary: DashboardSummary;
}

export function PermittingDashboard({ summary }: PermittingDashboardProps) {
  return (
    <div className="bg-surface-canvas">
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-semibold text-foreground">Permitting Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Pending Applications" value={String(summary.pendingCount)} />
          <MetricCard title="Avg Review Time" value={`${summary.avgReviewDays} days`} />
          <MetricCard title="Approved This Month" value={String(summary.approvedThisMonth)} />
          <MetricCard title="Expiring Soon" value={String(summary.expiringSoonCount)}>
            <Badge variant="danger" size="sm">{summary.expiringSoonCount} expiring</Badge>
          </MetricCard>
        </div>
      </div>
    </div>
  );
}
```

### applications/page.tsx — List page

```typescript
import { permittingRepo } from '@/lib/core';
import { ApplicationsListPage } from './_components/ApplicationsListPage';

export default async function PermittingApplicationsPage() {
  const applications = await permittingRepo.listApplications();
  return <ApplicationsListPage applications={applications} />;
}
```

### applications/[id]/page.tsx — Detail page

```typescript
import { permittingRepo } from '@/lib/core';
import { ApplicationDetailView } from './_components/ApplicationDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PermittingApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  const application = await permittingRepo.getApplication(id);
  return <ApplicationDetailView application={application} />;
}
```

## Step 7 — Build the Real Adapter (Later)

Once all pages work with mock data, create `lib/core/adapters/gab-v2/[vertical].v2.adapter.ts`:

```typescript
import type { IAuthPort } from '../../ports/auth.port';
import type { IPermittingRepository, PermitApplication, PaginatedParams, PaginatedResult } from '../../ports/permitting.repository';

export class PermittingV2Adapter implements IPermittingRepository {
  constructor(private auth: IAuthPort, private apiUrl: string) {}

  private async fetchWithAuth(endpoint: string, options?: RequestInit) {
    const token = await this.auth.getToken();
    return fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });
  }

  async listApplications(params?: PaginatedParams): Promise<PaginatedResult<PermitApplication>> {
    const res = await this.fetchWithAuth(
      `/v2/apps/${process.env.GAB_APP_KEY}/tables/${process.env.GAB_TABLE_APPLICATIONS}/records?limit=${params?.limit ?? 25}&offset=${params?.offset ?? 0}`
    );
    const json = await res.json();
    return { data: json.records, total: json.total };
  }

  // Implement remaining methods...
}
```

Then swap one line in `lib/core/index.ts`. Zero page changes.

## Checklist

- [ ] Port file with domain types and repository interface
- [ ] Mock adapter with realistic static data
- [ ] Registered in `lib/core/index.ts`
- [ ] Feature flag in `config/app.config.ts`
- [ ] Nav entry in `config/navigation.config.ts`
- [ ] Root layout and redirect page
- [ ] Dashboard page (Server Component + `_components/` client component)
- [ ] List page with data table or cards
- [ ] Detail page with dynamic route `[id]`
- [ ] All client components import only from `@/components/ui/*`
- [ ] No `@/lib/core` imports in any `'use client'` file
- [ ] `npm run build` passes with no errors
