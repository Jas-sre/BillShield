import { Banknote, LineChart, ReceiptText, ShieldPlus, Tv } from 'lucide-react';
import type { Category } from '../../types';
import { cx } from '../../utils/cx';
import { useTranslation } from '../../hooks/useTranslation';

const CATEGORY_STYLES: Record<Category, { className: string; icon: typeof Banknote }> = {
  Bills: { className: 'bg-sky-50 text-sky-700 border border-sky-100', icon: ReceiptText },
  Subscriptions: { className: 'bg-indigo-50 text-indigo-700 border border-indigo-100', icon: Tv },
  EMI: { className: 'bg-blue-50 text-blue-700 border border-blue-100', icon: Banknote },
  Insurance: { className: 'bg-cyan-50 text-cyan-700 border border-cyan-100', icon: ShieldPlus },
  Investments: { className: 'bg-violet-50 text-violet-700 border border-violet-100', icon: LineChart },
};

const CATEGORY_KEYS: Record<Category, 'category.bills' | 'category.subscriptions' | 'category.emi' | 'category.insurance' | 'category.investments'> = {
  Bills: 'category.bills',
  Subscriptions: 'category.subscriptions',
  EMI: 'category.emi',
  Insurance: 'category.insurance',
  Investments: 'category.investments',
};

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  const { t } = useTranslation();
  const style = CATEGORY_STYLES[category];
  const Icon = style.icon;

  return (
    <span className={cx('chip', style.className, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t(CATEGORY_KEYS[category])}
    </span>
  );
}
