import { CalendarDays } from 'lucide-react';
import type { Payment } from '../../types';
import { cx } from '../../utils/cx';
import { formatCurrencyINR } from '../../utils/currency';
import { addDays, buildDateRange, formatDateShort, formatDayOfMonth, formatWeekdayShort } from '../../utils/dates';
import { useTranslation } from '../../hooks/useTranslation';

export interface PaymentTimelineProps {
  payments: Payment[];
  today: string;
  days?: number;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  className?: string;
}

/**
 * Horizontal 14-day strip showing how much is scheduled on each day.
 * Selecting a day filters the list below it.
 */
export function PaymentTimeline({
  payments,
  today,
  days = 14,
  selectedDate,
  onSelectDate,
  className,
}: PaymentTimelineProps) {
  const { t } = useTranslation();
  const range = buildDateRange(today, days);

  return (
    <section className={cx('card card-pad', className)} aria-label={t('upcoming.tab.week')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
          {formatDateShort(today)} – {formatDateShort(addDays(today, days - 1))}
        </h2>
        {selectedDate ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSelectDate(null)}>
            {t('common.all')}
          </button>
        ) : null}
      </div>

      <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 no-scrollbar" role="group" aria-label={t('upcoming.title')}>
        {range.map((date) => {
          const dayPayments = payments.filter((payment) => payment.dueDate === date);
          const total = dayPayments.reduce((sum, payment) => sum + payment.amount, 0);
          const isSelected = selectedDate === date;
          const isToday = date === today;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : date)}
              aria-pressed={isSelected}
              aria-label={`${formatDateShort(date)} — ${
                dayPayments.length > 0
                  ? t('upcoming.dayTotal', { count: dayPayments.length, amount: formatCurrencyINR(total) })
                  : t('upcoming.noPaymentsOnDay')
              }`}
              className={cx(
                'flex min-w-[4.25rem] shrink-0 flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-center transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-white'
                  : dayPayments.length > 0
                    ? 'border-primary/25 bg-primary-soft text-primary-dark hover:border-primary'
                    : 'border-line bg-surface text-ink-muted hover:border-primary/40',
              )}
            >
              <span className={cx('text-[10px] font-semibold uppercase tracking-wide', isSelected ? 'text-white/80' : 'text-ink-soft')}>
                {formatWeekdayShort(date)}
              </span>
              <span className="num text-sm font-bold">{formatDayOfMonth(date)}</span>
              {dayPayments.length > 0 ? (
                <span className={cx('num text-[10px] font-semibold', isSelected ? 'text-white' : 'text-primary-dark')}>
                  {formatCurrencyINR(total)}
                </span>
              ) : (
                <span className={cx('text-[10px]', isSelected ? 'text-white/70' : 'text-ink-soft')}>—</span>
              )}
              {isToday ? (
                <span
                  className={cx(
                    'h-1 w-1 rounded-full',
                    isSelected ? 'bg-white' : 'bg-primary',
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default PaymentTimeline;
