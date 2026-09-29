import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ForecastResult } from '../../types';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import { getChartColors } from '../../utils/chartTheme';
import { formatCurrencyINR, formatCompactINR } from '../../utils/currency';
import { formatDateShort, parseISODate } from '../../utils/dates';
import { cx } from '../../utils/cx';

interface ChartDatum {
  ts: number;
  date: string;
  openingBalance: number;
  inflow: number;
  outflow: number;
  closingBalance: number;
  eventLabels: string;
  belowComfortBuffer: boolean;
  negativeBalance: boolean;
}

interface TooltipLike {
  active?: boolean;
  label?: unknown;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}

export interface CashFlowChartProps {
  forecast: ForecastResult;
  height?: number;
  className?: string;
  showLegend?: boolean;
}

function toChartData(forecast: ForecastResult): ChartDatum[] {
  return forecast.forecast.map((day) => ({
    ts: parseISODate(day.date).getTime(),
    date: day.date,
    openingBalance: day.openingBalance,
    inflow: day.inflow,
    outflow: day.outflow,
    closingBalance: day.closingBalance,
    eventLabels: day.events.map((event) => event.label).join(', '),
    belowComfortBuffer: day.belowComfortBuffer,
    negativeBalance: day.negativeBalance,
  }));
}

function CashFlowTooltip({ active, payload }: TooltipLike) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as ChartDatum | undefined;
  if (!datum) return null;

  return (
    <div className="rounded-xl border border-line bg-surface/95 px-3 py-2.5 shadow-lifted backdrop-blur">
      <p className="text-xs font-bold text-ink">{formatDateShort(datum.date)}</p>
      <dl className="mt-1.5 space-y-0.5 text-[11px]">
        <Row label="Opening balance" value={formatCurrencyINR(datum.openingBalance)} />
        <Row label="Income" value={datum.inflow > 0 ? `+${formatCurrencyINR(datum.inflow)}` : '—'} tone="success" />
        <Row label="Payments" value={datum.outflow > 0 ? `-${formatCurrencyINR(datum.outflow)}` : '—'} tone="warn" />
        <div className="mt-1 border-t border-line pt-1">
          <Row label="Closing balance" value={formatCurrencyINR(datum.closingBalance)} strong />
        </div>
      </dl>
      {datum.eventLabels ? <p className="mt-1.5 max-w-[13rem] text-[11px] text-ink-muted">{datum.eventLabels}</p> : null}
      {datum.belowComfortBuffer ? (
        <p className="mt-1 text-[11px] font-semibold text-warn">Below your comfort buffer</p>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warn';
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={cx(
          'num',
          strong ? 'font-bold text-ink' : 'font-semibold',
          tone === 'success' && 'text-success',
          tone === 'warn' && 'text-warn',
          !tone && !strong && 'text-ink',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Balance projection used by the dashboard (14 days) and the cash-flow planner
 * (30 days). Never overflows its container thanks to ResponsiveContainer.
 */
export function CashFlowChart({ forecast, height = 288, className, showLegend = true }: CashFlowChartProps) {
  const { t } = useTranslation();
  const { isDark } = useBillShield();
  const colors = getChartColors(isDark);
  const data = toChartData(forecast);

  const belowDays = data.filter((day) => day.belowComfortBuffer);
  const lowest = data.reduce((min, day) => (day.closingBalance < min.closingBalance ? day : min), data[0]);
  const incomeDay = data.find((day) => day.inflow > 0);
  const halfDay = 43_200_000;

  return (
    <div className={cx('w-full', className)}>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 16, right: 12, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="billshieldBalanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.areaFillFrom} stopOpacity={0.35} />
                <stop offset="100%" stopColor={colors.areaFillTo} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value: number) => formatDateShort(new Date(value).toISOString().slice(0, 10))}
              minTickGap={28}
              tickMargin={8}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value: number) => formatCompactINR(value)}
              width={64}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />

            {belowDays.length > 0 ? (
              <ReferenceArea
                x1={parseISODate(belowDays[0].date).getTime() - halfDay}
                x2={parseISODate(belowDays[belowDays.length - 1].date).getTime() + halfDay}
                fill={colors.buffer}
                fillOpacity={0.12}
                stroke={colors.buffer}
                strokeOpacity={0.5}
              />
            ) : null}

            <ReferenceLine
              y={forecast.comfortBuffer}
              stroke={colors.buffer}
              strokeDasharray="5 4"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
              label={{
                value: `Comfort buffer ${formatCurrencyINR(forecast.comfortBuffer)}`,
                position: 'insideTopRight',
                fill: colors.bufferLabel,
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            <ReferenceLine y={0} stroke={colors.negative} strokeWidth={1} strokeOpacity={0.5} ifOverflow="extendDomain" />

            {incomeDay ? (
              <ReferenceLine
                x={incomeDay.ts}
                stroke={colors.income}
                strokeDasharray="4 4"
                label={{
                  value: `Income ${formatCurrencyINR(incomeDay.inflow)}`,
                  position: 'insideTopLeft',
                  fill: colors.income,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            ) : null}

            <Tooltip content={<CashFlowTooltip />} />

            <Area
              type="monotone"
              dataKey="closingBalance"
              name="Projected balance"
              stroke={colors.areaStroke}
              strokeWidth={2.5}
              fill="url(#billshieldBalanceFill)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: colors.surface, fill: colors.areaStroke }}
            />

            <ReferenceDot
              x={lowest.ts}
              y={lowest.closingBalance}
              r={5}
              fill={lowest.belowComfortBuffer ? colors.buffer : colors.neutralDot}
              stroke={colors.surface}
              strokeWidth={2}
              label={{
                value: formatCurrencyINR(lowest.closingBalance),
                position: 'bottom',
                fill: lowest.belowComfortBuffer ? colors.buffer : colors.areaStroke,
                fontSize: 11,
                fontWeight: 700,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {showLegend ? (
        <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-ink-muted">
          <LegendItem className="bg-primary" label={t('cashflow.chartTitle')} />
          <LegendItem className="bg-warn" label={t('cashflow.comfortBuffer')} dashed />
          <LegendItem className="bg-primary-light" label={t('cashflow.totalInflow')} />
          <LegendItem className="bg-warn/25" label={t('cashflow.daysBelowBuffer')} />
        </ul>
      ) : null}

      <p className="mt-2 text-xs text-ink-muted">{t('dash.cashflowNote')}</p>
    </div>
  );
}

function LegendItem({ label, className, dashed }: { label: string; className: string; dashed?: boolean }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span
        className={cx('h-2.5 w-4 rounded-full', className, dashed && 'opacity-90')}
        aria-hidden="true"
        style={dashed ? { backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 7px)' } : undefined}
      />
      {label}
    </li>
  );
}

export default CashFlowChart;
