import type { Addon, Currency, Service, SiteSettings } from '@/lib/types';

export function unitPrice(item: Service | Addon, currency: Currency, rate: number): number {
  if (currency === 'USD') return item.price_usd;
  return item.price_ghs ?? Math.round(item.price_usd * rate * 100) / 100;
}

export function formatMoney(amount: number, currency: Currency): string {
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  });
  return currency === 'USD' ? `$${formatted}` : `GH₵${formatted}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

export function formatTimeOfDay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatInTimezone(
  iso: string,
  timezone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, ...options }).format(new Date(iso));
}

export function formatDateTime(iso: string, timezone: string): string {
  return formatInTimezone(iso, timezone, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function dateKeyInTimezone(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function weekdayOf(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function formatIsoDateLong(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function currencyLabel(currency: Currency, settings: Pick<SiteSettings, 'ghs_per_usd'>): string {
  return currency === 'USD' ? 'USD ($)' : `Cedis (GH₵) at ${settings.ghs_per_usd} per $1`;
}
