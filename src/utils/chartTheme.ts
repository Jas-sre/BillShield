/**
 * Chart palette.
 *
 * Recharts needs concrete colours (it cannot read Tailwind classes), so the few
 * values that must follow the theme live here and are selected from the store's
 * theme flag.
 */
export interface ChartColors {
  grid: string;
  axis: string;
  areaStroke: string;
  areaFillFrom: string;
  areaFillTo: string;
  buffer: string;
  bufferLabel: string;
  income: string;
  negative: string;
  neutralDot: string;
  surface: string;
  ink: string;
  inkMuted: string;
  line: string;
}

export function getChartColors(isDark: boolean): ChartColors {
  if (isDark) {
    return {
      grid: '#263B37',
      axis: '#9DB0AB',
      areaStroke: '#2DD4BF',
      areaFillFrom: '#2DD4BF',
      areaFillTo: '#2DD4BF',
      buffer: '#F0B357',
      bufferLabel: '#F0B357',
      income: '#2DD4BF',
      negative: '#F87171',
      neutralDot: '#2DD4BF',
      surface: '#12201E',
      ink: '#E8F0EE',
      inkMuted: '#9DB0AB',
      line: '#263B37',
    };
  }

  return {
    grid: '#E4EAE8',
    axis: '#5C706A',
    areaStroke: '#0F766E',
    areaFillFrom: '#14B8A6',
    areaFillTo: '#14B8A6',
    buffer: '#B45309',
    bufferLabel: '#B45309',
    income: '#0F766E',
    negative: '#DC2626',
    neutralDot: '#0F766E',
    surface: '#FFFFFF',
    ink: '#0F2A26',
    inkMuted: '#5C706A',
    line: '#E4EAE8',
  };
}
