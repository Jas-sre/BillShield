import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Category } from '../../types';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import { getChartColors } from '../../utils/chartTheme';
import { formatCurrencyINR } from '../../utils/currency';

interface DonutDatum {
  name: string;
  value: number;
  count: number;
  color: string;
}

interface TooltipLike {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}

const CATEGORY_COLORS: Record<Category, string> = {
  Bills: '#0EA5E9',
  Subscriptions: '#4F46E5',
  EMI: '#2563EB',
  Insurance: '#0891B2',
  Investments: '#7C3AED',
};

export interface SpendingDonutChartProps {
  totals: Array<{ category: Category; total: number; count: number }>;
  height?: number;
  className?: string;
}

function DonutTooltip({ active, payload }: TooltipLike) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as DonutDatum | undefined;
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

export function SpendingDonutChart({ totals, height = 260, className }: SpendingDonutChartProps) {
  const { t } = useTranslation();
  const { isDark } = useBillShield();
  const colors = getChartColors(isDark);
  const grandTotal = totals.reduce((sum, item) => sum + item.total, 0);

  const data: DonutDatum[] = totals.map((item) => ({
    name: t(CATEGORY_KEY[item.category]),
    value: item.total,
    count: item.count,
    color: CATEGORY_COLORS[item.category],
  }));

  if (data.length === 0) {
    return <p className="muted">{t('upcoming.noPaymentsOnDay')}</p>;
  }

  return (
    <div className={className}>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke={colors.surface}
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => <span className="text-[11px] text-ink-muted">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-1 text-center text-xs text-ink-muted">
        {t('insights.byCategory')} · {formatCurrencyINR(grandTotal)}
      </p>
    </div>
  );
}

const CATEGORY_KEY: Record<Category, 'category.bills' | 'category.subscriptions' | 'category.emi' | 'category.insurance' | 'category.investments'> = {
  Bills: 'category.bills',
  Subscriptions: 'category.subscriptions',
  EMI: 'category.emi',
  Insurance: 'category.insurance',
  Investments: 'category.investments',
};

export default SpendingDonutChart;
