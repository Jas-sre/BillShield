import { Search, X } from 'lucide-react';
import { useId } from 'react';
import { cx } from '../../utils/cx';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function SearchInput({ value, onChange, placeholder, className, label }: SearchInputProps) {
  const id = useId();

  return (
    <div className={cx('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {label ?? placeholder ?? 'Search'}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input pl-9 pr-9"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-slate-100 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
