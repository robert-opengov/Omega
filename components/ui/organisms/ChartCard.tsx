'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/molecules';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

/**
 * Resolves CSS custom property values from the DOM at render time.
 * Recharts renders tooltips in a portal where CSS vars may not resolve —
 * so we compute actual color values here.
 */
function useResolvedCssVars() {
  const [vars, setVars] = useState({ card: '#fafafa', foreground: '#212121', border: '#e0e0e0', muted: '#757575' });

  useEffect(() => {
    const root = document.documentElement;
    const computed = getComputedStyle(root);
    setVars({
      card: computed.getPropertyValue('--card').trim() || '#fafafa',
      foreground: computed.getPropertyValue('--foreground').trim() || '#212121',
      border: computed.getPropertyValue('--border').trim() || '#e0e0e0',
      muted: computed.getPropertyValue('--muted-foreground').trim() || '#757575',
    });
  }, []);

  return vars;
}

/**
 * Read the 20-hue CDS-37 visualization palette from CSS custom properties.
 * Falls back to a sensible subset if vars aren't available.
 */
function useVizColors(): string[] {
  const [colors, setColors] = useState([
    '#3366cc', '#dc3912', '#ff9900', '#109618', '#990099',
    '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395',
  ]);

  useEffect(() => {
    const computed = getComputedStyle(document.documentElement);
    const read = (v: string) => computed.getPropertyValue(v).trim();
    const vizColors: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const c = read(`--color-viz-${i}`);
      if (c) vizColors.push(c);
    }
    if (vizColors.length > 0) setColors(vizColors);
  }, []);

  return colors;
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie';

export interface ChartCardProps {
  title: ReactNode;
  description?: ReactNode;
  headerActions?: ReactNode;
  /** @default 'bar' */
  type: ChartType;
  data: Record<string, unknown>[];
  dataKey: string;
  /** @default 'name' */
  xAxisKey?: string;
  className?: string;
  /** @default 300 */
  height?: number;
  /** Override the primary chart colour. */
  color?: string;
}

/**
 * A composable chart card built on Recharts + the Card molecule.
 *
 * Uses the CDS-37 20-hue visualization palette for pie slices and
 * resolves CSS custom properties for dark-mode–safe tooltip styling.
 *
 * @example
 * <ChartCard title="Revenue" type="bar" data={data} dataKey="amount" />
 */
export function ChartCard({ title, description, headerActions, type, data, dataKey, xAxisKey = 'name', className, height = 300, color }: ChartCardProps) {
  const chartLabel = typeof title === 'string'
    ? `${title}${typeof description === 'string' ? `: ${description}` : ''}`
    : 'Chart';
  const vars = useResolvedCssVars();
  const vizColors = useVizColors();
  const chartColor = color || vizColors[0];

  const tooltipStyle = {
    borderRadius: '4px',
    border: `1px solid ${vars.border}`,
    background: vars.card,
    color: vars.foreground,
  };
  const tooltipItemStyle = { color: vars.foreground };
  const tooltipLabelStyle = { color: vars.foreground, fontWeight: 600 };
  const legendStyle = { color: vars.muted };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          {headerActions}
        </div>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </CardHeader>
      <CardContent>
        <div role="img" aria-label={chartLabel}>
          <ResponsiveContainer width="100%" height={height}>
            {type === 'bar' ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey={xAxisKey} className="text-xs" tick={{ fill: 'currentColor' }} />
                <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
                <Bar dataKey={dataKey} fill={chartColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : type === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey={xAxisKey} className="text-xs" tick={{ fill: 'currentColor' }} />
                <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
                <Line type="monotone" dataKey={dataKey} stroke={chartColor} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            ) : type === 'area' ? (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey={xAxisKey} className="text-xs" tick={{ fill: 'currentColor' }} />
                <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
                <Area type="monotone" dataKey={dataKey} stroke={chartColor} fill={`${chartColor}20`} strokeWidth={2} />
              </AreaChart>
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  dataKey={dataKey}
                  nameKey={xAxisKey}
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={vizColors[i % vizColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
                <Legend wrapperStyle={legendStyle} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChartCard;
