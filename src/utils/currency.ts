/**
 * Indian rupee formatting helpers — ₹4,820 style (Indian digit grouping).
 */

const wholeRupees = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const paise = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export interface CurrencyFormatOptions {
  /** Show paise when the amount has a fractional part. Defaults to false. */
  showPaise?: boolean;
  /** Use a leading minus sign instead of parentheses for negatives. Defaults to true. */
  signed?: boolean;
}

/**
 * formatCurrencyINR(4820) -> "₹4,820"
 * formatCurrencyINR(-473) -> "-₹473"
 */
export function formatCurrencyINR(amount: number, options: CurrencyFormatOptions = {}): string {
  const { showPaise = false, signed = true } = options;
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const isNegative = safeAmount < 0;
  const absolute = Math.abs(safeAmount);
  const hasFraction = Math.round(absolute * 100) % 100 !== 0;

  const digits = showPaise && hasFraction ? paise.format(absolute) : wholeRupees.format(Math.round(absolute));
  const value = `₹${digits}`;

  if (!isNegative) return value;
  return signed ? `-${value}` : value;
}

/** formatCompactINR(7500) -> "₹7.5K" / formatCompactINR(250000) -> "₹2.5L" */
export function formatCompactINR(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const absolute = Math.abs(safeAmount);
  const sign = safeAmount < 0 ? '-' : '';

  if (absolute < 1000) return `${sign}₹${Math.round(absolute)}`;
  if (absolute < 100000) {
    const thousands = absolute / 1000;
    return `${sign}₹${trimZero(thousands)}K`;
  }
  const lakhs = absolute / 100000;
  return `${sign}₹${trimZero(lakhs)}L`;
}

/** Plain grouped number, e.g. formatNumberIN(4347) -> "4,347" */
export function formatNumberIN(value: number): string {
  return wholeRupees.format(Number.isFinite(value) ? value : 0);
}

/** "₹473" / "₹1,000" / "₹1,199" already handled; this adds "₹0" safety. */
export function formatCurrencyOrZero(amount: number): string {
  return formatCurrencyINR(amount > 0 ? amount : 0);
}

/** Formats a percentage delta, e.g. formatPercentDelta(473, 1672) -> "+253%" */
export function formatPercentDelta(from: number, to: number): string {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return '—';
  const delta = ((to - from) / Math.abs(from)) * 100;
  const rounded = Math.round(delta);
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

function trimZero(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
