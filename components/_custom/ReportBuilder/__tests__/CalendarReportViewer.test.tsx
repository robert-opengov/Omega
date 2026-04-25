import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  CalendarReportViewer,
  buildEvents,
} from '../_components/viewers/CalendarReportViewer';

vi.mock('@fullcalendar/react', () => ({
  default: ({
    events,
  }: {
    events: Array<{ id: string; title: string; start: string; end?: string; allDay?: boolean }>;
  }) => (
    <div data-testid="fullcalendar-stub">
      {events.map((e) => (
        <div key={e.id} data-testid="fullcalendar-event">
          <span>{e.title}</span>
          <span>{e.start}</span>
          <span>{e.end ?? '∅'}</span>
          <span>{e.allDay ? 'allDay' : 'timed'}</span>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@fullcalendar/daygrid', () => ({ default: {} }));
vi.mock('@fullcalendar/timegrid', () => ({ default: {} }));
vi.mock('@fullcalendar/interaction', () => ({ default: {} }));

describe('buildEvents', () => {
  it('returns an empty list without a date field', () => {
    expect(buildEvents([{ a: 1 }], {})).toEqual([]);
  });

  it('skips rows whose date field is empty or unparseable', () => {
    const events = buildEvents(
      [
        { id: 1, name: 'Real', start_at: '2026-04-01' },
        { id: 2, name: 'Empty', start_at: '' },
        { id: 3, name: 'Bogus', start_at: 'not a date' },
      ],
      { dateField: 'start_at', titleField: 'name' },
    );
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Real');
  });

  it('marks events as all-day when no end date field is configured', () => {
    const [event] = buildEvents(
      [{ id: 1, name: 'Foo', start_at: '2026-04-01' }],
      { dateField: 'start_at', titleField: 'name' },
    );
    expect(event.allDay).toBe(true);
    expect(event.end).toBeUndefined();
  });

  it('renders timed events when an end date field is configured', () => {
    const [event] = buildEvents(
      [
        {
          id: 1,
          name: 'Window',
          start_at: '2026-04-01T09:00:00Z',
          end_at: '2026-04-01T17:00:00Z',
        },
      ],
      {
        dateField: 'start_at',
        endDateField: 'end_at',
        titleField: 'name',
      },
    );
    expect(event.allDay).toBe(false);
    expect(event.end).toBeDefined();
  });

  it('falls back to a row index when no title field is set', () => {
    const events = buildEvents(
      [{ id: 'r1', start_at: '2026-04-01' }],
      { dateField: 'start_at' },
    );
    expect(events[0].title).toBe('r1');
  });
});

describe('CalendarReportViewer', () => {
  it('renders an empty state when no date field is configured', () => {
    render(<CalendarReportViewer config={{}} rows={[{ a: 1 }]} />);
    expect(screen.getByText('Pick a date field')).toBeInTheDocument();
  });

  it('renders an empty state when no rows have a date', () => {
    render(
      <CalendarReportViewer
        config={{ dateField: 'start_at' }}
        rows={[{ start_at: '' }]}
      />,
    );
    expect(screen.getByText('No events to display')).toBeInTheDocument();
  });

  it('renders FullCalendar with events when configured', () => {
    render(
      <CalendarReportViewer
        config={{ dateField: 'start_at', titleField: 'name' }}
        rows={[
          { id: 1, name: 'Alpha', start_at: '2026-04-01' },
          { id: 2, name: 'Beta', start_at: '2026-04-02' },
        ]}
      />,
    );
    expect(screen.getByTestId('fullcalendar-stub')).toBeInTheDocument();
    expect(screen.getAllByTestId('fullcalendar-event')).toHaveLength(2);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});
