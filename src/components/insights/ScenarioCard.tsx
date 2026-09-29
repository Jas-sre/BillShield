import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ForecastResult, Scenario } from '../../types';
import { cx } from '../../utils/cx';
import { formatCurrencyINR } from '../../utils/currency';
import { formatDateShort } from '../../utils/dates';
import { useTranslation } from '../../hooks/useTranslation';
import { getIconComponent } from '../common/MerchantIcon';

export interface ScenarioCardProps {
  scenario: Scenario;
  forecast: ForecastResult;
  selected: boolean;
  onSelect: (scenarioId: Scenario['id']) => void;
}

/** One what-if scenario with its live projection summary. */
export function ScenarioCard({ scenario, forecast, selected, onSelect }: ScenarioCardProps) {
  const { t } = useTranslation();
  const Icon = getIconComponent(scenario.icon);
  const belowBuffer = forecast.daysBelowBuffer > 0;

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      onClick={() => onSelect(scenario.id)}
      aria-pressed={selected}
      className={cx(
        'card card-pad flex h-full flex-col gap-3 text-left transition-colors',
        selected ? 'border-primary ring-2 ring-primary/25' : 'hover:border-primary/30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cx(
            'flex h-9 w-9 items-center justify-center rounded-xl',
            selected ? 'bg-primary text-white' : 'bg-primary-soft text-primary-dark',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {selected ? (
          <span className="chip border border-primary/20 bg-primary-soft text-primary-dark">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {t('cashflow.scenarioActive')}
          </span>
        ) : null}
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-ink">{scenario.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{scenario.description}</p>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-ink-muted">{t('cashflow.lowestBalance')}</dt>
          <dd className={cx('num font-bold', belowBuffer ? 'text-warn' : 'text-success')}>
            {formatCurrencyINR(forecast.lowestBalance)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">{t('cashflow.endingBalance')}</dt>
          <dd className="num font-bold text-ink">{formatCurrencyINR(forecast.endingBalance)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ink-muted">{t('cashflow.daysBelowBuffer')}</dt>
          <dd className="num font-semibold text-ink">
            {forecast.daysBelowBuffer} · {formatDateShort(forecast.lowestBalanceDate)}
          </dd>
        </div>
      </dl>
    </motion.button>
  );
}

export default ScenarioCard;
