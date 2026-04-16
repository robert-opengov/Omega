# Skill: Create a Vertical

Build a new domain-specific vertical (e.g., 311, Grants, Permitting) in the GAB Boilerplate. This skill walks through every file you need to create, in order, with concrete examples.

**Canonical reference:** The Grants vertical is the fully implemented example. Every step below mirrors what Grants already does. When in doubt, read the Grants files.

## Prerequisites

- The boilerplate is running (`npm run dev`)
- You have visited `/ui` and know which components you will use
- You have a name for your vertical (used throughout as `[vertical]`, e.g., `311`, `permitting`)

## Step 1 — Define the Port

Create `lib/core/ports/[vertical].repository.ts`.

This file defines your domain types and the repository interface. It describes **what** the frontend needs from the backend, not how to get it.

```typescript
// lib/core/ports/311.repository.ts

export interface DashboardSummary {
  openRequests: number;
  avgResolutionDays: number;
  resolvedThisMonth: number;
  overdueCount: number;
}

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  location: string;
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

export interface I311Repository {
  getDashboardSummary(): Promise<DashboardSummary>;
  listRequests(params?: PaginatedParams): Promise<PaginatedResult<ServiceRequest>>;
  getRequest(id: string): Promise<ServiceRequest>;
  createRequest(data: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceRequest>;
}
```

**Grants reference:** `lib/core/ports/grants.repository.ts` — defines `DashboardSummary`, `Award`, `AwardDetail`, `IGrantsRepository` and 20+ domain types.

## Step 2 — Create a Mock Adapter

Create `lib/core/adapters/mock/[vertical].mock.adapter.ts`.

The mock adapter implements your port interface with static data. This lets you build and iterate on all pages without a real backend.

```typescript
// lib/core/adapters/mock/311.mock.adapter.ts
import type { I311Repository, DashboardSummary, ServiceRequest, PaginatedParams, PaginatedResult } from '../../ports/311.repository';

export class Mock311Adapter implements I311Repository {
  async getDashboardSummary(): Promise<DashboardSummary> {
    return {
      openRequests: 142,
      avgResolutionDays: 3.2,
      resolvedThisMonth: 89,
      overdueCount: 7,
    };
  }

  async listRequests(params?: PaginatedParams): Promise<PaginatedResult<ServiceRequest>> {
    const allRequests: ServiceRequest[] = [
      {
        id: '1',
        title: 'Pothole on Main St',
        description: 'Large pothole near intersection of Main and 5th',
        status: 'open',
        priority: 'high',
        category: 'Roads',
        location: '123 Main St',
        createdAt: '2026-04-10T10:00:00Z',
        updatedAt: '2026-04-10T10:00:00Z',
      },
      // Add 5-10 more realistic entries
    ];

    const limit = params?.limit ?? 10;
    const offset = params?.offset ?? 0;
    return {
      data: allRequests.slice(offset, offset + limit),
      total: allRequests.length,
    };
  }

  async getRequest(id: string): Promise<ServiceRequest> {
    return {
      id,
      title: 'Pothole on Main St',
      description: 'Large pothole near intersection of Main and 5th',
      status: 'open',
      priority: 'high',
      category: 'Roads',
      location: '123 Main St',
      createdAt: '2026-04-10T10:00:00Z',
      updatedAt: '2026-04-10T10:00:00Z',
    };
  }

  async createRequest(data: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceRequest> {
    return {
      ...data,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
```

**Grants reference:** `lib/core/adapters/mock/grants.mock.adapter.ts` — 274 lines of realistic mock data for the full grants domain.

## Step 3 — Register in the Composition Root

Add your repo to `lib/core/index.ts`:

```typescript
import { Mock311Adapter } from './adapters/mock/311.mock.adapter';

export const repo311 = new Mock311Adapter();
```

Later, when the real adapter exists, swap it:

```typescript
import { Gab311V2Adapter } from './adapters/gab-v2/311.v2.adapter';

export const repo311 = new Gab311V2Adapter(authPort, gabConfig.apiUrl);
```

**Grants reference:** `lib/core/index.ts` line 46 — `export const grantsRepo = new GrantsMockAdapter();`

## Step 4 — Add Feature Flag

In `config/app.config.ts`, add to the `AppFeatures` interface and the `features` object:

```typescript
// In the AppFeatures interface:
enable311: boolean;

// In the features object:
enable311: process.env.NEXT_PUBLIC_ENABLE_311 === 'true',
```

Add to `.env.example`:

```env
NEXT_PUBLIC_ENABLE_311=true
```

## Step 5 — Add Navigation Entry

In `config/navigation.config.ts`, add to the `navigationItems` array:

```typescript
{
  href: '/311',
  label: '311 Requests',
  icon: FileText,  // from lucide-react
  featureFlag: 'enable311',
},
```

**Grants reference:** Lines 120-125 of `config/navigation.config.ts`.

## Step 6 — Create Pages

Follow this exact structure:

```
app/(dashboard)/311/
├── layout.tsx
├── page.tsx
├── home/
│   ├── page.tsx
│   └── _components/
│       └── Dashboard311.tsx
└── requests/
    ├── page.tsx
    ├── _components/
    │   └── RequestsListPage.tsx
    └── [id]/
        ├── page.tsx
        └── _components/
            └── RequestDetailView.tsx
```

### layout.tsx — Pass-through layout

```typescript
import type { ReactNode } from 'react';

export default function Layout311({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

### page.tsx — Root redirect

```typescript
import { redirect } from 'next/navigation';

export default function Page311Root() {
  redirect('/311/home');
}
```

### home/page.tsx — Server Component fetches data

```typescript
import { repo311 } from '@/lib/core';
import { Dashboard311 } from './_components/Dashboard311';

export default async function Page311Home() {
  const summary = await repo311.getDashboardSummary();
  return <Dashboard311 summary={summary} />;
}
```

### home/_components/Dashboard311.tsx — Client component renders

```typescript
'use client';

import { MetricCard } from '@/components/ui/molecules';
import { Badge } from '@/components/ui/atoms';
import type { DashboardSummary } from '@/lib/core/ports/311.repository';

interface Dashboard311Props {
  summary: DashboardSummary;
}

export function Dashboard311({ summary }: Dashboard311Props) {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-foreground">311 Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Open Requests" value={String(summary.openRequests)} />
        <MetricCard title="Avg Resolution" value={`${summary.avgResolutionDays} days`} />
        <MetricCard title="Resolved This Month" value={String(summary.resolvedThisMonth)} />
        <MetricCard title="Overdue" value={String(summary.overdueCount)}>
          <Badge variant="danger" size="sm">{summary.overdueCount} overdue</Badge>
        </MetricCard>
      </div>
    </div>
  );
}
```

### requests/page.tsx — List page

```typescript
import { repo311 } from '@/lib/core';
import { RequestsListPage } from './_components/RequestsListPage';

export default async function Page311Requests() {
  const requests = await repo311.listRequests();
  return <RequestsListPage requests={requests} />;
}
```

### requests/[id]/page.tsx — Detail page

```typescript
import { repo311 } from '@/lib/core';
import { RequestDetailView } from './_components/RequestDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page311RequestDetail({ params }: Props) {
  const { id } = await params;
  const request = await repo311.getRequest(id);
  return <RequestDetailView request={request} />;
}
```

**Grants reference:** `app/(dashboard)/grants/` — 16 files following this exact pattern across home, awards list, award detail with tabs, and sub-recipient detail.

## Step 7 — Build the Real Adapter (Later)

Once all pages work with mock data, create `lib/core/adapters/gab-v2/[vertical].v2.adapter.ts`:

```typescript
import type { IAuthPort } from '../../ports/auth.port';
import type { I311Repository, ServiceRequest, PaginatedParams, PaginatedResult } from '../../ports/311.repository';

export class Gab311V2Adapter implements I311Repository {
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

  async listRequests(params?: PaginatedParams): Promise<PaginatedResult<ServiceRequest>> {
    const res = await this.fetchWithAuth(
      `/v2/apps/${process.env.GAB_APP_KEY}/tables/${process.env.GAB_TABLE_SERVICE_REQUESTS}/records?limit=${params?.limit ?? 25}&offset=${params?.offset ?? 0}`
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
