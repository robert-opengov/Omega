'use client';

import { useMemo } from 'react';
import dayjs from 'dayjs';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarReportConfig } from '@/lib/core/ports/report.repository';
import type { GabRow } from '@/lib/core/ports/data.repository';
import { ViewerEmptyState } from './EmptyState';

export interface CalendarReportViewerProps {
  config: CalendarReportConfig;
  rows: GabRow[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
}

/**
 * Best-effort coercion to an ISO 8601 string. Returns `null` when the value is
 * empty or unparseable so we can drop bad rows instead of crashing the viewer.
 */
function toIsoOrNull(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const d = dayjs(raw as string | number | Date);
  return d.isValid() ? d.toISOString() : null;
}

function buildEvents(
  rows: GabRow[],
  config: CalendarReportConfig,
): CalendarEvent[] {
  if (!config.dateField) return [];
  const events: CalendarEvent[] = [];
  rows.forEach((row, index) => {
    const start = toIsoOrNull(row?.[config.dateField as string]);
    if (!start) return;
    const end = config.endDateField
      ? toIsoOrNull(row?.[config.endDateField])
      : null;
    const titleRaw = config.titleField
      ? row?.[config.titleField]
      : (row?.id ?? row?.name);
    const title =
      titleRaw === null || titleRaw === undefined || titleRaw === ''
        ? `Record ${index + 1}`
        : String(titleRaw);
    const id = String(row?.id ?? `row-${index}`);
    events.push({
      id,
      title,
      start,
      end: end ?? undefined,
      allDay: !end,
    });
  });
  return events;
}

export function CalendarReportViewer({
  config,
  rows,
}: Readonly<CalendarReportViewerProps>) {
  const events = useMemo(() => buildEvents(rows, config), [rows, config]);

  if (!config.dateField) {
    return (
      <ViewerEmptyState
        title="Pick a date field"
        description="Choose the field that should anchor each record to a calendar day."
      />
    );
  }

  if (events.length === 0) {
    return (
      <ViewerEmptyState
        title="No events to display"
        description="No records have a value in the configured date field."
      />
    );
  }

  return (
    <div data-testid="calendar-report-viewer" className="rb-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        height="auto"
      />
    </div>
  );
}

export { buildEvents };
