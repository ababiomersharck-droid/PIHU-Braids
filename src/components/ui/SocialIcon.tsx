import { Facebook, Instagram, Link2, Youtube, type LucideIcon } from 'lucide-react';
import type { SocialPlatform } from '@/lib/types';

// Platforms without a matching icon use a neutral link icon; the name is always shown beside it.
const ICONS: Partial<Record<SocialPlatform, LucideIcon>> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
};

export function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  const Icon = ICONS[platform] ?? Link2;
  return <Icon className={className} aria-hidden="true" />;
}
