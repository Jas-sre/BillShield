import { Languages } from 'lucide-react';
import { cx } from '../../utils/cx';
import { useTranslation } from '../../hooks/useTranslation';
import type { Language } from '../../types';

const OPTIONS: Language[] = ['en', 'ta'];

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div
      className={cx('inline-flex items-center gap-1 rounded-pill border border-line bg-surface p-0.5', className)}
      role="group"
      aria-label={t('header.languageToggle')}
    >
      <Languages className="ml-1.5 h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />
      {OPTIONS.map((option) => {
        const active = language === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setLanguage(option)}
            aria-pressed={active}
            className={cx(
              'rounded-pill px-2.5 py-1 text-xs font-semibold transition-colors',
              active ? 'bg-primary text-white' : 'text-ink-muted hover:bg-slate-100 hover:text-ink',
            )}
          >
            {option === 'en' ? 'EN' : 'தமிழ்'}
          </button>
        );
      })}
    </div>
  );
}
