/** Tiny class-name joiner (no dependency needed). */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
