import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InstanceTraceViewer } from '../_components/InstanceTraceViewer';
import type { WorkflowInstance } from '@/lib/core/ports/workflow.repository';

function makeInstance(overrides: Partial<WorkflowInstance> = {}): WorkflowInstance {
  return {
    id: 'inst-1',
    workflowId: 'wf-1',
    triggerRecordId: 'rec-1',
    triggerTableId: 'tbl-1',
    status: 'completed',
    currentStepId: null,
    context: {},
    startedAt: '2026-04-01T10:00:00.000Z',
    completedAt: '2026-04-01T10:00:05.000Z',
    error: null,
    steps: [],
    ...overrides,
  };
}

describe('InstanceTraceViewer', () => {
  it('renders instance summary with workflow name and badge', () => {
    render(
      <InstanceTraceViewer
        instance={makeInstance()}
        workflowName="Onboarding"
      />,
    );
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(screen.getByText('inst-1')).toBeInTheDocument();
  });

  it('renders empty state when no steps', () => {
    render(<InstanceTraceViewer instance={makeInstance()} />);
    expect(screen.getByText(/No step executions/i)).toBeInTheDocument();
  });

  it('renders timeline of steps', () => {
    const instance = makeInstance({
      steps: [
        {
          id: 'se-1',
          instanceId: 'inst-1',
          stepId: 's1',
          stepType: 'condition',
          status: 'completed',
          startedAt: '2026-04-01T10:00:00.000Z',
          completedAt: '2026-04-01T10:00:01.000Z',
          input: null,
          output: null,
          error: null,
        },
        {
          id: 'se-2',
          instanceId: 'inst-1',
          stepId: 's2',
          stepType: 'update_field',
          status: 'completed',
          startedAt: '2026-04-01T10:00:01.000Z',
          completedAt: '2026-04-01T10:00:02.000Z',
          input: null,
          output: null,
          error: null,
        },
      ],
    });
    render(<InstanceTraceViewer instance={instance} />);
    expect(screen.getByText(/condition/i)).toBeInTheDocument();
    expect(screen.getByText(/update field/i)).toBeInTheDocument();
  });

  it('surfaces error message on a failed step', () => {
    const instance = makeInstance({
      status: 'failed',
      error: 'Workflow failed at step 2',
      steps: [
        {
          id: 'se-1',
          instanceId: 'inst-1',
          stepId: 's1',
          stepType: 'call_webhook',
          status: 'failed',
          startedAt: '2026-04-01T10:00:00.000Z',
          completedAt: '2026-04-01T10:00:01.000Z',
          input: null,
          output: null,
          error: 'Connection refused',
        },
      ],
    });
    render(<InstanceTraceViewer instance={instance} />);
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
    expect(screen.getByText('Workflow failed at step 2')).toBeInTheDocument();
    const failedBadges = screen.getAllByText('Failed');
    expect(failedBadges.length).toBeGreaterThan(0);
  });

  it('expands input and output details', () => {
    const instance = makeInstance({
      steps: [
        {
          id: 'se-1',
          instanceId: 'inst-1',
          stepId: 's1',
          stepType: 'create_record',
          status: 'completed',
          startedAt: '2026-04-01T10:00:00.000Z',
          completedAt: '2026-04-01T10:00:01.000Z',
          input: { foo: 'bar' },
          output: { id: 42 },
          error: null,
        },
      ],
    });
    render(<InstanceTraceViewer instance={instance} />);
    const toggle = screen.getByLabelText('Toggle step details');
    fireEvent.click(toggle);
    expect(screen.getByText(/"foo": "bar"/)).toBeInTheDocument();
    expect(screen.getByText(/"id": 42/)).toBeInTheDocument();
  });
});
