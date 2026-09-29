import { useId } from 'react';
import { cx } from '../../utils/cx';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  className?: string;
}

/** Accessible toggle used in Settings for notification and accessibility prefs. */
export function Switch({ checked, onChange, label, description, className }: SwitchProps) {
  const id = useId();

  return (
    <div className={cx('flex items-start justify-between gap-4 py-3', className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{description}</p> : null}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
          checked ? 'border-primary bg-primary' : 'border-line bg-slate-200',
        )}
      >
        <span
          className={cx(
            'inline-block transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[1.4rem]' : 'translate-x-1',
          )}
          style={{ height: '1.125rem', width: '1.125rem' }}
        />
      </button>
    </div>
  );
}

export default Switch;
