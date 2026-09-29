/**
 * Date helpers.
 *
 * All dates in BillShield are plain "YYYY-MM-DD" strings handled in UTC so the
 * demo never drifts because of the viewer's timezone, DST, or locale.
 */
export const DAY_MS = 86_400_000;

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Parses "YYYY-MM-DD" into a UTC-midnight Date. */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map((part) => Number.parseInt(part, 10));
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

/** Converts a Date (or timestamp) into "YYYY-MM-DD" in UTC. */
export function toISODate(value: Date | number): string {
  const date = typeof value === 'number' ? new Date(value) : value;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
  return toISODate(parseISODate(iso).getTime() + days * DAY_MS);
}

/** Month-safe month arithmetic (31 Jan + 1 month -> 28/29 Feb). */
export function addMonths(iso: string, months: number): string {
  const date = parseISODate(iso);
  const targetMonth = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDayOfMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const day = Math.min(date.getUTCDate(), lastDayOfMonth);
  return toISODate(new Date(Date.UTC(targetYear, normalizedMonth, day)));
}

/** Whole days from `from` to `to` (to - from). */
export function diffInDays(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / DAY_MS);
}

export function isBefore(a: string, b: string): boolean {
  return parseISODate(a).getTime() < parseISODate(b).getTime();
}

export function isAfter(a: string, b: string): boolean {
  return parseISODate(a).getTime() > parseISODate(b).getTime();
}

export function isSameMonth(a: string, b: string): boolean {
  const dateA = parseISODate(a);
  const dateB = parseISODate(b);
  return dateA.getUTCFullYear() === dateB.getUTCFullYear() && dateA.getUTCMonth() === dateB.getUTCMonth();
}

export function isWithinRange(date: string, startInclusive: string, endInclusive: string): boolean {
  return !isBefore(date, startInclusive) && !isAfter(date, endInclusive);
}

/** "04 Oct" */
export function formatDateShort(iso: string): string {
  const date = parseISODate(iso);
  return `${String(date.getUTCDate()).padStart(2, '0')} ${MONTHS_SHORT[date.getUTCMonth()]}`;
}

/** "4 Oct" (no leading zero) */
export function formatDateShortLoose(iso: string): string {
  const date = parseISODate(iso);
  return `${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]}`;
}

/** "04 October 2026" */
export function formatDateLong(iso: string): string {
  const date = parseISODate(iso);
  return `${String(date.getUTCDate()).padStart(2, '0')} ${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "28 September 2026" (no leading zero) */
export function formatDateFull(iso: string): string {
  const date = parseISODate(iso);
  return `${date.getUTCDate()} ${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "Mon" */
export function formatWeekdayShort(iso: string): string {
  return WEEKDAYS_SHORT[parseISODate(iso).getUTCDay()];
}

/** "4" — day of month */
export function formatDayOfMonth(iso: string): string {
  return String(parseISODate(iso).getUTCDate());
}

/** "September 2026" */
export function formatMonthYear(iso: string): string {
  const date = parseISODate(iso);
  return `${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Milestone-style label used in copy: "28 Sep 2026" */
export function formatDateMedium(iso: string): string {
  const date = parseISODate(iso);
  return `${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Friendly relative label: "Today", "Tomorrow", "in 4 days", "12 days ago".
 */
export function formatRelativeDays(iso: string, today: string): string {
  const offset = diffInDays(today, iso);
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  if (offset === -1) return 'Yesterday';
  if (offset > 1) return `in ${offset} days`;
  return `${Math.abs(offset)} days ago`;
}

export function buildDateRange(startIso: string, days: number): string[] {
  return Array.from({ length: days }, (_, index) => addDays(startIso, index));
}

/** Milestone steps used for expected future debits of a recurring payment. */
export function buildFutureOccurrences(iso: string, count: number, frequency: string): string[] {
  const stepMonths = frequency === 'Yearly' ? 12 : frequency === 'Quarterly' ? 3 : 1;
  return Array.from({ length: count }, (_, index) => addMonths(iso, stepMonths * index));
}

