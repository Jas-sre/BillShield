import {
  Cloud,
  GraduationCap,
  HeartPulse,
  MonitorPlay,
  Music,
  Palette,
  Smartphone,
  TrendingUp,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { IconName } from '../../types';
import { cx } from '../../utils/cx';

/**
 * Neutral, abstract merchant icons — deliberately NOT brand logos.
 */
const ICONS: Record<IconName, LucideIcon> = {
  smartphone: Smartphone,
  'monitor-play': MonitorPlay,
  zap: Zap,
  palette: Palette,
  'graduation-cap': GraduationCap,
  music: Music,
  'heart-pulse': HeartPulse,
  'trending-up': TrendingUp,
  cloud: Cloud,
  wifi: Wifi,
};

export function getIconComponent(name: IconName): LucideIcon {
  return ICONS[name] ?? Smartphone;
}

export interface MerchantIconProps {
  name: IconName;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tone?: 'tinted' | 'solid';
}

const SIZES = {
  sm: { box: 'h-8 w-8 rounded-lg', icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10 rounded-xl', icon: 'h-5 w-5' },
  lg: { box: 'h-12 w-12 rounded-2xl', icon: 'h-6 w-6' },
} as const;

export function MerchantIcon({ name, color, size = 'md', className, tone = 'tinted' }: MerchantIconProps) {
  const Icon = getIconComponent(name);
  const dimensions = SIZES[size];

  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex shrink-0 items-center justify-center',
        dimensions.box,
        tone === 'solid' ? 'text-white' : '',
        className,
      )}
      style={
        tone === 'solid'
          ? { backgroundColor: color }
          : { backgroundColor: `${color}1A`, color, border: `1px solid ${color}33` }
      }
    >
      <Icon className={dimensions.icon} />
    </span>
  );
}
