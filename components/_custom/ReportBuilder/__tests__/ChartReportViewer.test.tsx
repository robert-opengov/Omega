import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ChartReportViewer,
  aggregateRows,
} from '../_components/viewers/ChartReportViewer';

vi.mock('@/components/ui/organisms/ChartCard', () => ({
  ChartCard: ({
    title,
    type,
    data,
    dataKey,
  }: {
    title: React.ReactNode;
    type: string;
    data: Record<string, unknown>[];
    dataKey: string;
  }) => (
    <div data-testid="chart-card-stub">
      <span data-testid="chart-card-type">{type}</span>
      <span data-testid="chart-card-title">{title}</span>
      <pre data-testid="chart-card-data">{JSON.stringify({ data, dataKey })}</pre>
    </div>
  ),
}));

describe('aggregateRows', () => {
  it('counts rows when no y axis is provided', () => {
    const out = aggregateRows(
      [
        { region: 'East' },
        { region: 'East' },
        { region: 'West' },
        { region: '' },
      ],
      'region',
      undefined,
    );
    expect(out).toEqual(
      expect.arrayContaining([
        { name: 'East', __value__: 2 },
        { name: 'West', __value__: 1 },
        { name: '—', __value__: 1 },
      ]),
    );
  });

  it('sums numeric y axis values per bucket', () => {
    const out = aggregateRows(
      [
        { region: 'East', amount: 10 },
        { region: 'East', amount: '5' },
        { region: 'West', amount: null },
      ],
      'region',
      'amount',
    );
    const east = out.find((r) => r.name === 'East');
    const west = out.find((r) => r.name === 'West');
    expect(east?.__value__).toBe(15);
    expect(west?.__value__).toBe(0);
  });

  it('returns an empty array without an x key', () => {
    expect(aggregateRows([{ a: 1 }], undefined, 'a')).toEqual([]);
  });
});

describe('ChartReportViewer', () => {
  it('renders an empty state when xAxis is missing', () => {
    render(<ChartReportViewer config={{}} rows={[{ a: 1 }]} />);
    expect(screen.getByText('Pick an X axis field')).toBeInTheDocument();
  });

  it('renders an empty state when there is no data', () => {
    render(<ChartReportViewer config={{ xAxis: 'region' }} rows={[]} />);
    expect(screen.getByText('No data to chart')).toBeInTheDocument();
  });

  it('passes aggregated data and chart type to ChartCard', () => {
    render(
      <ChartReportViewer
        config={{ xAxis: 'region', yAxis: 'amount', chartType: 'line' }}
        rows={[
          { region: 'East', amount: 5 },
          { region: 'East', amount: 10 },
          { region: 'West', amount: 3 },
        ]}
      />,
    );
    expect(screen.getByTestId('chart-card-type').textContent).toBe('line');
    expect(screen.getByTestId('chart-card-title').textContent).toBe(
      'Sum of amount',
    );
    const payload = JSON.parse(
      screen.getByTestId('chart-card-data').textContent ?? '{}',
    ) as { data: Array<{ name: string; __value__: number }>; dataKey: string };
    expect(payload.dataKey).toBe('__value__');
    const east = payload.data.find((d) => d.name === 'East');
    expect(east?.__value__).toBe(15);
  });

  it('defaults to record count when yAxis is omitted', () => {
    render(
      <ChartReportViewer
        config={{ xAxis: 'region' }}
        rows={[{ region: 'East' }, { region: 'West' }]}
      />,
    );
    expect(screen.getByTestId('chart-card-title').textContent).toBe(
      'Record count',
    );
  });
});
