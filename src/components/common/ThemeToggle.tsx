import { Moon, Sun } from 'lucide-react';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import { cx } from '../../utils/cx';

/** Compact light/dark switch used in the header. The choice is persisted. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useBillShield();
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const label = isDark ? t('theme.toggleLight') : t('theme.toggleDark');

  return (
    <button
      type="button"
      className={cx('icon-btn border border-line bg-surface', className)}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export interface ThemeSegmentedProps {
  className?: string;
}

/** Two-option segmented control used on the settings page. */
export function ThemeSegmented({ className }: ThemeSegmentedProps) {
  const { theme, setTheme } = useBillShield();
  const { t } = useTranslation();

  const options = [
    { value: 'light' as const, label: t('theme.light'), icon: Sun },
    { value: 'dark' as const, label: t('theme.dark'), icon: Moon },
  ];

  return (
    <div
      className={cx('inline-flex items-center gap-1 rounded-pill border border-line bg-surface p-0.5', className)}
      role="group"
      aria-label={t('theme.appearance')}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-pressed={active}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold transition-colors',
              active ? 'bg-primary text-white' : 'text-ink-muted hover:bg-raise hover:text-ink',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
