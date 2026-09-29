import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Priority } from '../../types';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import { getChartColors } from '../../utils/chartTheme';
import { formatCompactINR, formatCurrencyINR } from '../../utils/currency';

interface BarDatum {
  name: string;
  value: number;
  count: number;
  color: string;
}

interface TooltipLike {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  Essential: '#059669',
  Important: '#B45309',
  Optional: '#4F46E5',
};

export interface EssentialVsOptionalChartProps {
  totals: Array<{ priority: Priority; total: number; count: number }>;
  height?: number;
  className?: string;
}

function BarTooltip({ active, payload }: TooltipLike) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as BarDatum | undefined;
  if (!datum) return null;

  return (
    <div className="rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-lifted">
      <p className="text-xs font-bold text-ink">{datum.name}</p>
      <p className="num text-[11px] text-ink-muted">
        {formatCurrencyINR(datum.value)} · {datum.count} payment{datum.count === 1 ? '' : 's'}
      </p>
    </div>
  );
}

const KEYS: Record<Priority, 'priority.essential' | 'priority.important' | 'priority.optional'> = {
  Essential: 'priority.essential',
  Important: 'priority.important',
  Optional: 'priority.optional',
};

export function EssentialVsOptionalChart({ totals, height = 240, className }: EssentialVsOptionalChartProps) {
  const { t } = useTranslation();
  const { isDark } = useBillShield();
  const colors = getChartColors(isDark);

  const data: BarDatum[] = totals.map((item) => ({
    name: t(KEYS[item.priority]),
    value: item.total,
    count: item.count,
    color: PRIORITY_COLORS[item.priority],
  }));

  return (
    <div className={className}>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={8} />
            <YAxis
              tickFormatter={(value: number) => formatCompactINR(value)}
              width={56}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(45,212,191,0.10)' : 'rgba(15,118,110,0.06)' }}
              content={<BarTooltip />}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={72}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default EssentialVsOptionalChart;
