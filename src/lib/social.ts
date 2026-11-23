import type { SocialLink, SocialPlatform } from '@/lib/types';

export const SOCIAL_PLATFORMS: Array<{ id: SocialPlatform; label: string; example: string }> = [
  { id: 'instagram', label: 'Instagram', example: '@yourname' },
  { id: 'tiktok', label: 'TikTok', example: '@yourname' },
  { id: 'facebook', label: 'Facebook', example: 'yourpagename' },
  { id: 'youtube', label: 'YouTube', example: '@yourchannel' },
  { id: 'x', label: 'X (Twitter)', example: '@yourname' },
  { id: 'snapchat', label: 'Snapchat', example: 'yourname' },
  { id: 'pinterest', label: 'Pinterest', example: 'yourname' },
  { id: 'other', label: 'Other website or page', example: 'https://example.com/your-page' },
];

// Must stay in step with the check in the database (social_links.value)
const HANDLE_PATTERN = /^@?[A-Za-z0-9._-]{1,60}$/;
const URL_PATTERN = /^https?:\/\/\S+$/i;

export function platformLabel(platform: SocialPlatform): string {
  return SOCIAL_PLATFORMS.find((p) => p.id === platform)?.label ?? 'Link';
}

export function isFullLink(value: string): boolean {
  return URL_PATTERN.test(value.trim());
}

/** Returns a short message for the owner, or null when the value is fine. */
export function validateSocialValue(platform: SocialPlatform, value: string, label: string): string | null {
  const v = value.trim();
  if (!v) return 'Enter the account name or paste the full link.';
  if (v.length > 300) return 'That link is too long. Please use a shorter one.';
  if (platform === 'other') {
    if (!URL_PATTERN.test(v)) return 'For "Other", paste the full link starting with https://';
    if (!label.trim()) return 'Give this link a short name, for example "Blog" or "Shop".';
    if (label.trim().length > 60) return 'Keep the name under 60 characters.';
    return null;
  }
  if (URL_PATTERN.test(v) || HANDLE_PATTERN.test(v)) return null;
  return 'Use just the account name (like @yourname, no spaces) or paste the full link starting with https://';
}

/** What gets saved: handles lose a leading @, links are kept as typed. */
export function normalizeSocialValue(value: string): string {
  const v = value.trim();
  return URL_PATTERN.test(v) ? v : v.replace(/^@/, '');
}

/** The address a visitor is sent to, or null when the value cannot be turned into a safe web address. */
export function socialUrl(link: Pick<SocialLink, 'platform' | 'value'>): string | null {
  const v = link.value.trim();
  if (URL_PATTERN.test(v)) {
    try {
      const url = new URL(v);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
    } catch {
      return null;
    }
  }
  if (!HANDLE_PATTERN.test(v)) return null;
  const handle = v.replace(/^@/, '');
  switch (link.platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'youtube':
      return `https://www.youtube.com/@${handle}`;
    case 'x':
      return `https://x.com/${handle}`;
    case 'snapchat':
      return `https://www.snapchat.com/add/${handle}`;
    case 'pinterest':
      return `https://www.pinterest.com/${handle}`;
    default:
      return null;
  }
}

export function socialName(link: Pick<SocialLink, 'platform' | 'label'>): string {
  return link.platform === 'other' ? link.label.trim() || 'Link' : platformLabel(link.platform);
}

/** Shown next to the name, for example "@pihubraids". Empty when the owner pasted a full link. */
export function socialHandleText(link: Pick<SocialLink, 'value'>): string {
  const v = link.value.trim();
  return HANDLE_PATTERN.test(v) ? `@${v.replace(/^@/, '')}` : '';
}
