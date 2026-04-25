import { beforeEach, describe, expect, it, vi } from 'vitest';

const BASE_URL = 'https://gab.example.com';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GabWorkflowV2Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists workflows and normalises items', async () => {
    const { GabWorkflowV2Adapter } = await import('../workflow.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        items: [
          {
            id: 'wf_1',
            name: 'Approve invoice',
            appId: 'app_1',
            active: true,
            config: {
              triggerTableId: 'table_1',
              triggerOn: 'create',
              steps: [{ id: 's1', type: 'condition', config: { field: 'amount' } }],
            },
            createdAt: '2026-01-01',
          },
        ],
      }),
    );

    const adapter = new GabWorkflowV2Adapter(authPort as any, BASE_URL);
    const workflows = await adapter.listWorkflows('app_1');

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/apps/app_1/workflows`);
    expect((init.method ?? 'GET').toString().toUpperCase()).toBe('GET');
    expect(workflows).toHaveLength(1);
    expect(workflows[0]).toMatchObject({
      id: 'wf_1',
      name: 'Approve invoice',
      appId: 'app_1',
      active: true,
    });
    expect(workflows[0].config?.steps).toEqual([
      { id: 's1', type: 'condition', config: { field: 'amount' } },
    ]);
  });

  it('gets, creates, updates, deletes, and tests workflow', async () => {
    const { GabWorkflowV2Adapter } = await import('../workflow.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({ id: 'wf_1', name: 'A', appId: 'app_1', config: {} }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: 'wf_2', name: 'B', appId: 'app_1', config: {} }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: 'wf_2', name: 'B2', appId: 'app_1', config: {} }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            { stepId: 's1', stepType: 'condition', status: 'completed', message: 'ok' },
          ],
        }),
      );

    const adapter = new GabWorkflowV2Adapter(authPort as any, BASE_URL);
    const getRes = await adapter.getWorkflow('app_1', 'wf_1');
    const createRes = await adapter.createWorkflow('app_1', { name: 'B' });
    const updateRes = await adapter.updateWorkflow('app_1', 'wf_2', { name: 'B2' });
    const delRes = await adapter.deleteWorkflow('app_1', 'wf_2');
    const testRes = await adapter.testWorkflow('app_1', 'wf_1', { foo: 1 });

    const [getUrl, getInit] = spy.mock.calls[0] as [string, RequestInit];
    expect(getUrl).toBe(`${BASE_URL}/v2/apps/app_1/workflows/wf_1`);
    expect(getInit.method ?? 'GET').toBe('GET');

    const [createUrl, createInit] = spy.mock.calls[1] as [string, RequestInit];
    expect(createUrl).toBe(`${BASE_URL}/v2/apps/app_1/workflows`);
    expect(createInit.method).toBe('POST');
    expect(JSON.parse(createInit.body as string)).toEqual({ name: 'B' });

    const [updateUrl, updateInit] = spy.mock.calls[2] as [string, RequestInit];
    expect(updateUrl).toBe(`${BASE_URL}/v2/apps/app_1/workflows/wf_2`);
    expect(updateInit.method).toBe('PATCH');
    expect(JSON.parse(updateInit.body as string)).toEqual({ name: 'B2' });

    const [deleteUrl, deleteInit] = spy.mock.calls[3] as [string, RequestInit];
    expect(deleteUrl).toBe(`${BASE_URL}/v2/apps/app_1/workflows/wf_2`);
    expect(deleteInit.method).toBe('DELETE');

    const [testUrl, testInit] = spy.mock.calls[4] as [string, RequestInit];
    expect(testUrl).toBe(`${BASE_URL}/v2/apps/app_1/workflows/wf_1/test`);
    expect(testInit.method).toBe('POST');
    expect(JSON.parse(testInit.body as string)).toEqual({ recordData: { foo: 1 } });

    expect(getRes.id).toBe('wf_1');
    expect(createRes.name).toBe('B');
    expect(updateRes.name).toBe('B2');
    expect(delRes).toEqual({ ok: true });
    expect(testRes.results).toHaveLength(1);
    expect(testRes.results[0]).toMatchObject({
      stepId: 's1',
      status: 'completed',
      message: 'ok',
    });
  });

  it('lists instances filtered by workflowId and gets instance by id', async () => {
    const { GabWorkflowV2Adapter } = await import('../workflow.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              id: 'inst_1',
              workflowId: 'wf_1',
              status: 'completed',
              context: { foo: 'bar' },
              startedAt: '2026-01-01T00:00:00Z',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ items: [] }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'inst_1',
          workflowId: 'wf_1',
          status: 'failed',
          context: {},
          startedAt: '2026-01-01T00:00:00Z',
          steps: [
            {
              id: 'se_1',
              instanceId: 'inst_1',
              stepId: 's1',
              stepType: 'condition',
              status: 'failed',
              error: 'boom',
            },
          ],
        }),
      );

    const adapter = new GabWorkflowV2Adapter(authPort as any, BASE_URL);
    const filtered = await adapter.listInstances('app_1', { workflowId: 'wf_1' });
    const all = await adapter.listInstances('app_1');
    const instance = await adapter.getInstance('app_1', 'inst_1');

    const [url1] = spy.mock.calls[0] as [string, RequestInit];
    const [url2] = spy.mock.calls[1] as [string, RequestInit];
    const [url3] = spy.mock.calls[2] as [string, RequestInit];
    expect(url1).toBe(`${BASE_URL}/v2/apps/app_1/workflow-instances?workflowId=wf_1`);
    expect(url2).toBe(`${BASE_URL}/v2/apps/app_1/workflow-instances`);
    expect(url3).toBe(`${BASE_URL}/v2/apps/app_1/workflow-instances/inst_1`);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].context).toEqual({ foo: 'bar' });
    expect(all).toEqual([]);
    expect(instance.steps?.[0]).toMatchObject({ stepId: 's1', error: 'boom' });
  });

  it('lists tasks with status pending by default and forwards role + custom status', async () => {
    const { GabWorkflowV2Adapter } = await import('../workflow.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              id: 'task_1',
              instanceId: 'inst_1',
              stepId: 's2',
              roleName: 'Manager',
              status: 'pending',
              context: {},
              createdAt: '2026-01-01T00:00:00Z',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ items: [] }))
      .mockResolvedValueOnce(jsonResponse({ items: [] }));

    const adapter = new GabWorkflowV2Adapter(authPort as any, BASE_URL);
    await adapter.listTasks('app_1');
    await adapter.listTasks('app_1', { role: 'Manager' });
    await adapter.listTasks('app_1', { role: 'Approver', status: 'approved' });

    const [defaultUrl] = spy.mock.calls[0] as [string, RequestInit];
    const [withRoleUrl] = spy.mock.calls[1] as [string, RequestInit];
    const [withStatusUrl] = spy.mock.calls[2] as [string, RequestInit];

    expect(defaultUrl).toBe(`${BASE_URL}/v2/apps/app_1/workflow-tasks?status=pending`);
    expect(withRoleUrl).toBe(
      `${BASE_URL}/v2/apps/app_1/workflow-tasks?role=Manager&status=pending`,
    );
    expect(withStatusUrl).toBe(
      `${BASE_URL}/v2/apps/app_1/workflow-tasks?role=Approver&status=approved`,
    );
  });

  it('approves and rejects tasks and forwards notes', async () => {
    const { GabWorkflowV2Adapter } = await import('../workflow.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'task_1',
          instanceId: 'inst_1',
          stepId: 's2',
          roleName: 'Manager',
          status: 'approved',
          context: {},
          createdAt: '2026-01-01T00:00:00Z',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'task_1',
          instanceId: 'inst_1',
          stepId: 's2',
          roleName: 'Manager',
          status: 'rejected',
          context: {},
          createdAt: '2026-01-01T00:00:00Z',
        }),
      );

    const adapter = new GabWorkflowV2Adapter(authPort as any, BASE_URL);
    const approved = await adapter.approveTask('app_1', 'task_1', { notes: 'looks good' });
    const rejected = await adapter.rejectTask('app_1', 'task_1');

    const [approveUrl, approveInit] = spy.mock.calls[0] as [string, RequestInit];
    expect(approveUrl).toBe(`${BASE_URL}/v2/apps/app_1/workflow-tasks/task_1/approve`);
    expect(approveInit.method).toBe('POST');
    expect(JSON.parse(approveInit.body as string)).toEqual({ notes: 'looks good' });

    const [rejectUrl, rejectInit] = spy.mock.calls[1] as [string, RequestInit];
    expect(rejectUrl).toBe(`${BASE_URL}/v2/apps/app_1/workflow-tasks/task_1/reject`);
    expect(rejectInit.method).toBe('POST');
    expect(JSON.parse(rejectInit.body as string)).toEqual({ notes: null });

    expect(approved.status).toBe('approved');
    expect(rejected.status).toBe('rejected');
  });

  it('surfaces backend errors', async () => {
    const { GabWorkflowV2Adapter } = await import('../workflow.v2.adapter');
    const authPort = { getToken: vi.fn().mockResolvedValue('access-token') };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Workflow not found' }, 404),
    );
    const adapter = new GabWorkflowV2Adapter(authPort as any, BASE_URL);
    await expect(adapter.getWorkflow('app_1', 'missing')).rejects.toThrow(
      'Workflow not found',
    );
  });
});
